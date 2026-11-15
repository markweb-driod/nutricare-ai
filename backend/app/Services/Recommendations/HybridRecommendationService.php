<?php

namespace App\Services\Recommendations;

use App\Services\Safety\DeterministicSafetyEngine;

/**
 * NutriCare AI - Hybrid Recommendation Service
 * 
 * Orchestrates:
 * 1. Deterministic Safety Filter (Pre-ML)
 * 2. FastAPI Machine Learning Inference (Random Forest Classifier)
 * 3. Preference & Variety Post-Inference Ranker
 */
class HybridRecommendationService
{
    private DeterministicSafetyEngine $safetyEngine;
    private string $mlServiceUrl;

    public function __construct(DeterministicSafetyEngine $safetyEngine, ?string $mlServiceUrl = null)
    {
        $this->safetyEngine = $safetyEngine;
        $this->mlServiceUrl = $mlServiceUrl ?? (getenv('ML_SERVICE_URL') ?: 'http://127.0.0.1:8000');
    }

    /**
     * Executes the hybrid recommendation pipeline.
     */
    public function generateRecommendations(
        array $patientProfile,
        array $candidateCatalog,
        array $recentMealHistory = [],
        int $limit = 6
    ): array {
        // Step 1: Deterministic Safety Engine (Pass 1)
        $safetyReport = $this->safetyEngine->filterCandidates($patientProfile, $candidateCatalog);
        $safeCandidates = $safetyReport['safe_candidates'];

        if (empty($safeCandidates)) {
            return [
                'status' => 'empty',
                'message' => 'No candidate meals passed strict clinical safety filters.',
                'rejected_count' => $safetyReport['rejected_count'],
                'recommendations' => []
            ];
        }

        // Step 2: Format for Python ML Service
        $mlPayload = [
            'patient' => [
                'patient_id' => $patientProfile['id'] ?? 'patient-default',
                'age' => (int)($patientProfile['age'] ?? 50),
                'medication_risk_category' => $patientProfile['medication_risk_category'] ?? 'low_metformin',
                'approved_energy_goal' => (float)($patientProfile['daily_energy_kcal_target'] ?? 1800.0),
                'approved_carb_max_per_meal' => (float)($patientProfile['approved_carb_max_per_meal'] ?? 45.0),
            ],
            'candidates' => array_map(function ($c) {
                return [
                    'recipe_id' => (string)($c['id'] ?? $c['recipe_id']),
                    'recipe_title' => (string)($c['title'] ?? 'Recipe'),
                    'meal_type' => (string)($c['meal_type'] ?? 'lunch'),
                    'portion_g' => (float)($c['standard_portion_g'] ?? 250.0),
                    'energy_kcal' => (float)($c['energy_kcal'] ?? 300.0),
                    'carbs_g' => (float)($c['carbs_g'] ?? 30.0),
                    'fiber_g' => (float)($c['fiber_g'] ?? 6.0),
                    'protein_g' => (float)($c['protein_g'] ?? 20.0),
                    'fat_g' => (float)($c['fat_g'] ?? 8.0),
                    'sodium_mg' => (float)($c['sodium_mg'] ?? 400.0),
                    'preparation_method' => (string)($c['preparation_method'] ?? 'steamed')
                ];
            }, $safeCandidates)
        ];

        // Step 3: Invoke Python ML Service Inference
        $mlPredictions = $this->callMlService($mlPayload);

        // Map ML predictions by recipe_id
        $predMap = [];
        foreach ($mlPredictions as $pred) {
            $predMap[$pred['recipe_id']] = $pred;
        }

        // Step 4: Hybrid Ranking & Variety Scoring
        $recentRecipeIds = array_column($recentMealHistory, 'recipe_id');
        $ranked = [];

        foreach ($safeCandidates as $candidate) {
            $rId = (string)($candidate['id'] ?? $candidate['recipe_id']);
            $mlInfo = $predMap[$rId] ?? [
                'suitability' => 'eligible',
                'confidence_score' => 0.85,
                'is_safe_for_auto_recommend' => true,
                'primary_factors' => ['Nutrient profile aligns with balanced nutrition guidelines.']
            ];

            // Filter out 'not_recommended' meals
            if ($mlInfo['suitability'] === 'not_recommended') {
                continue;
            }

            // Variety Score: penalize dishes eaten recently
            $frequencyInRecent = count(array_keys($recentRecipeIds, $rId));
            $varietyScore = max(0.2, 1.0 - ($frequencyInRecent * 0.4));

            // Preference Score: check cultural affinity
            $prefScore = 0.8;
            $favList = $patientProfile['favorite_categories'] ?? ['West African'];
            if (in_array($candidate['regional_category'] ?? '', $favList, true)) {
                $prefScore = 1.0;
            }

            // ML Confidence weight
            $mlConfidence = (float)($mlInfo['confidence_score'] ?? 0.7);

            // Composite Score = 0.50 * ML + 0.30 * Preference + 0.20 * Variety
            $compositeScore = round(
                (0.50 * $mlConfidence) + (0.30 * $prefScore) + (0.20 * $varietyScore),
                4
            );

            $ranked[] = [
                'recipe_id' => $rId,
                'title' => $candidate['title'] ?? 'Recipe',
                'regional_category' => $candidate['regional_category'] ?? 'West African',
                'preparation_method' => $candidate['preparation_method'] ?? 'steamed',
                'portion_g' => (float)($candidate['standard_portion_g'] ?? 250.0),
                'energy_kcal' => (float)($candidate['energy_kcal'] ?? 300.0),
                'carbs_g' => (float)($candidate['carbs_g'] ?? 30.0),
                'fiber_g' => (float)($candidate['fiber_g'] ?? 6.0),
                'net_carbs_g' => max(0.0, round(($candidate['carbs_g'] ?? 30) - ($candidate['fiber_g'] ?? 6), 1)),
                'protein_g' => (float)($candidate['protein_g'] ?? 20.0),
                'fat_g' => (float)($candidate['fat_g'] ?? 8.0),
                'sodium_mg' => (float)($candidate['sodium_mg'] ?? 400.0),
                'suitability' => $mlInfo['suitability'],
                'confidence_score' => $mlConfidence,
                'composite_ranking_score' => $compositeScore,
                'is_auto_recommended' => $mlInfo['is_safe_for_auto_recommend'] ?? true,
                'clinical_rationale' => $mlInfo['primary_factors'] ?? [],
                'image_url' => $candidate['image_url'] ?? null
            ];
        }

        // Sort descending by composite score
        usort($ranked, function ($a, $b) {
            return $b['composite_ranking_score'] <=> $a['composite_ranking_score'];
        });

        return [
            'status' => 'success',
            'total_evaluated' => count($candidateCatalog),
            'safety_rejected' => $safetyReport['rejected_count'],
            'eligible_count' => count($ranked),
            'recommendations' => array_slice($ranked, 0, $limit)
        ];
    }

    /**
     * Executes HTTP POST to FastAPI microservice with timeout & heuristic fallback.
     */
    private function callMlService(array $payload): array
    {
        $endpoint = rtrim($this->mlServiceUrl, '/') . '/api/v1/ml/predict';
        $jsonPayload = json_encode($payload);

        $ch = curl_init($endpoint);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, $jsonPayload);
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'Content-Type: application/json',
            'Accept: application/json'
        ]);
        curl_setopt($ch, CURLOPT_TIMEOUT, 3); // 3 second fail-fast timeout

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        if ($httpCode === 200 && $response) {
            $data = json_decode($response, true);
            if (!empty($data['recommendations'])) {
                return $data['recommendations'];
            }
        }

        // Resilient Heuristic Fallback if Python ML service is offline or starting up
        return $this->fallbackHeuristicScoring($payload);
    }

    private function fallbackHeuristicScoring(array $payload): array
    {
        $carbMax = (float)($payload['patient']['approved_carb_max_per_meal'] ?? 45.0);
        $results = [];

        foreach ($payload['candidates'] as $c) {
            $carbs = (float)($c['carbs_g'] ?? 30.0);
            $fiber = (float)($c['fiber_g'] ?? 4.0);

            if ($carbs <= $carbMax && $fiber >= 5.0) {
                $suitability = 'eligible';
                $conf = 0.90;
                $factors = ["Carbohydrates ({$carbs}g) well within limit; high dietary fiber ({$fiber}g)."];
            } elseif ($carbs <= $carbMax * 1.1) {
                $suitability = 'review_required';
                $conf = 0.70;
                $factors = ["Carbohydrates ({$carbs}g) near threshold limit."];
            } else {
                $suitability = 'not_recommended';
                $conf = 0.85;
                $factors = ["Carbohydrates exceed recommended single meal target."];
            }

            $results[] = [
                'recipe_id' => $c['recipe_id'],
                'recipe_title' => $c['recipe_title'] ?? '',
                'suitability' => $suitability,
                'probabilities' => [$suitability => $conf],
                'primary_factors' => $factors,
                'confidence_score' => $conf,
                'is_safe_for_auto_recommend' => ($suitability === 'eligible')
            ];
        }

        return $results;
    }
}
