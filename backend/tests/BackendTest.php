<?php

require_once __DIR__ . '/../app/Services/Safety/DeterministicSafetyEngine.php';
require_once __DIR__ . '/../app/Services/Nutrition/NutrientCalculatorService.php';
require_once __DIR__ . '/../app/Services/Recommendations/HybridRecommendationService.php';
require_once __DIR__ . '/../app/Services/Clinical/GlucoseMonitoringService.php';
require_once __DIR__ . '/../app/Services/Reminders/ReminderSchedulerService.php';
require_once __DIR__ . '/../database/SeedData.php';

use App\Database\SeedData;
use App\Services\Safety\DeterministicSafetyEngine;
use App\Services\Nutrition\NutrientCalculatorService;
use App\Services\Recommendations\HybridRecommendationService;
use App\Services\Clinical\GlucoseMonitoringService;
use App\Services\Reminders\ReminderSchedulerService;

echo "--- RUNNING NUTRICARE AI BACKEND TESTS ---\n\n";

// TEST 1: Safety Engine Allergen Enforcement
$safety = new DeterministicSafetyEngine();
$patient = SeedData::getDefaultPatientProfile(); // Has allergy to 'tree_nuts'
$catalog = SeedData::getVerifiedRecipes();

// Find recipe with walnuts/tree nuts (Rolled oats rec-005)
$filtered = $safety->filterCandidates($patient, $catalog);
echo "1. Safety Engine Allergen Test: ";
$hasNutRecipe = false;
foreach ($filtered['safe_candidates'] as $sc) {
    if (in_array('tree_nuts', $sc['allergens'] ?? [])) {
        $hasNutRecipe = true;
    }
}
if (!$hasNutRecipe && $filtered['rejected_count'] >= 1) {
    echo "PASSED (Tree nut allergen recipe safely eliminated)\n";
} else {
    echo "FAILED: Allergen not eliminated\n";
    exit(1);
}

// TEST 2: Nutrient Calculator Math
$nutCalc = new NutrientCalculatorService();
$ingredients = [
    [
        'weight_g' => 200,
        'yield_factor' => 1.0,
        'nutrients_per_100g' => ['energy_kcal' => 100, 'carbs_g' => 15, 'fiber_g' => 5, 'protein_g' => 10, 'fat_g' => 2, 'sodium_mg' => 100]
    ]
];
$recipeNut = $nutCalc->calculateRecipeNutrients($ingredients, 200);
$serving = $nutCalc->calculateServingNutrients($recipeNut, 100);
echo "2. Nutrient Calculator Test: ";
if ($serving['carbs_g'] == 15.0 && $serving['fiber_g'] == 5.0 && $serving['net_carbs_g'] == 10.0) {
    echo "PASSED (Portion scaling and Net Carbs calculation verified)\n";
} else {
    echo "FAILED: Calculated values mismatch\n";
    exit(1);
}

// TEST 3: Glucose Monitoring ADA 2026 Emergency Escalation
$glucose = new GlucoseMonitoringService();
$hypoReading = $glucose->evaluateReading(52.0, 'fasting');
$normalReading = $glucose->evaluateReading(110.0, 'fasting');

echo "3. Glucose Monitoring Escalation Test: ";
if ($hypoReading['is_escalated'] === true && $hypoReading['severity'] === 'EMERGENCY' && strpos($hypoReading['action_instructions'], 'fast-acting sugar') !== false && $normalReading['is_escalated'] === false) {
    echo "PASSED (ADA 2026 Rule of 15 and Emergency Alert correctly triggered)\n";
} else {
    echo "FAILED: Escalation logic failed\n";
    exit(1);
}

// TEST 4: Reminder Scheduler
$reminder = new ReminderSchedulerService();
$nextTarget = $reminder->calculateNextTargetTime("12:30:00", "UTC");
echo "4. Reminder Scheduler Test: ";
if ($nextTarget instanceof DateTime) {
    echo "PASSED (Next target successfully calculated)\n";
} else {
    echo "FAILED: Target time calculation failed\n";
    exit(1);
}

// TEST 5: Hybrid Recommendation Service
$recService = new HybridRecommendationService($safety);
$recs = $recService->generateRecommendations($patient, $catalog, [], 3);
echo "5. Hybrid Recommendation Pipeline Test: ";
if ($recs['status'] === 'success' && count($recs['recommendations']) > 0) {
    echo "PASSED (" . count($recs['recommendations']) . " recommendations generated with clinical rationale)\n";
} else {
    echo "FAILED: Recommendation pipeline failed\n";
    exit(1);
}

echo "\nALL 5 BACKEND INTEGRATION & CLINICAL SAFETY TESTS PASSED SUCCESSFULLY!\n";
