<?php

namespace App\Services\Nutrition;

/**
 * NutriCare AI - Recipe & Serving Nutrient Calculation Service
 * Standards: FAO/INFOODS 2019 / USDA FoodData Central
 */
class NutrientCalculatorService
{
    /**
     * Calculates the composite nutrient profile for a cooked recipe from raw ingredients.
     * 
     * @param array $ingredients Array of ['weight_g', 'yield_factor', 'nutrients_per_100g' => [...]]
     * @param float $finalCookedWeightG Total measured weight of prepared dish
     * @return array Total recipe nutrients
     */
    public function calculateRecipeNutrients(array $ingredients, float $finalCookedWeightG): array
    {
        $totals = [
            'energy_kcal' => 0.0,
            'carbs_g' => 0.0,
            'fiber_g' => 0.0,
            'protein_g' => 0.0,
            'fat_g' => 0.0,
            'sodium_mg' => 0.0,
        ];

        foreach ($ingredients as $ing) {
            $w = (float)($ing['weight_g'] ?? 0.0);
            $yieldFactor = (float)($ing['yield_factor'] ?? 1.0); // Retention/yield factor
            $edibleWeightRatio = ($w * $yieldFactor) / 100.0;
            $nutrients = $ing['nutrients_per_100g'] ?? [];

            $totals['energy_kcal'] += $edibleWeightRatio * (float)($nutrients['energy_kcal'] ?? 0.0);
            $totals['carbs_g'] += $edibleWeightRatio * (float)($nutrients['carbs_g'] ?? 0.0);
            $totals['fiber_g'] += $edibleWeightRatio * (float)($nutrients['fiber_g'] ?? 0.0);
            $totals['protein_g'] += $edibleWeightRatio * (float)($nutrients['protein_g'] ?? 0.0);
            $totals['fat_g'] += $edibleWeightRatio * (float)($nutrients['fat_g'] ?? 0.0);
            $totals['sodium_mg'] += $edibleWeightRatio * (float)($nutrients['sodium_mg'] ?? 0.0);
        }

        // Round results
        foreach ($totals as $key => $val) {
            $totals[$key] = round($val, 2);
        }

        $totals['final_cooked_weight_g'] = $finalCookedWeightG;
        $totals['net_carbs_g'] = max(0.0, round($totals['carbs_g'] - $totals['fiber_g'], 2));

        return $totals;
    }

    /**
     * Calculates nutrients for a specific serving portion size.
     * 
     * @param array $recipeNutrients
     * @param float $servingWeightG
     * @return array Nutrients for the single serving
     */
    public function calculateServingNutrients(array $recipeNutrients, float $servingWeightG): array
    {
        $finalCookedWeight = (float)($recipeNutrients['final_cooked_weight_g'] ?? 0.0);
        if ($finalCookedWeight <= 0) {
            $finalCookedWeight = max(1.0, $servingWeightG);
        }

        $ratio = $servingWeightG / $finalCookedWeight;

        $serving = [
            'portion_g' => round($servingWeightG, 1),
            'energy_kcal' => round(($recipeNutrients['energy_kcal'] ?? 0.0) * $ratio, 1),
            'carbs_g' => round(($recipeNutrients['carbs_g'] ?? 0.0) * $ratio, 1),
            'fiber_g' => round(($recipeNutrients['fiber_g'] ?? 0.0) * $ratio, 1),
            'protein_g' => round(($recipeNutrients['protein_g'] ?? 0.0) * $ratio, 1),
            'fat_g' => round(($recipeNutrients['fat_g'] ?? 0.0) * $ratio, 1),
            'sodium_mg' => round(($recipeNutrients['sodium_mg'] ?? 0.0) * $ratio, 1),
        ];

        $serving['net_carbs_g'] = max(0.0, round($serving['carbs_g'] - $serving['fiber_g'], 1));

        return $serving;
    }
}
