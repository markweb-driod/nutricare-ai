<?php

namespace App\Services\Safety;

/**
 * NutriCare AI - Deterministic Clinical Safety Engine
 * 
 * CRITICAL ARCHITECTURAL RULE:
 * The ML service recommends candidate meals; it must NEVER override
 * allergy restrictions, medical exclusions, or approved clinical meal plans.
 */
class DeterministicSafetyEngine
{
    /**
     * Evaluates a candidate recipe against a patient's clinical safety profile.
     * 
     * @param array $patientProfile
     * @param array $candidateRecipe
     * @return array [bool 'is_safe', array 'violations', string 'action']
     */
    public function evaluateCandidate(array $patientProfile, array $candidateRecipe): array
    {
        $violations = [];

        // 1. ALLERGEN ENFORCEMENT (Zero-Tolerance Hard Drop)
        $patientAllergens = array_map('strtolower', $patientProfile['allergens'] ?? []);
        $recipeAllergens = array_map('strtolower', $candidateRecipe['allergens'] ?? []);
        $recipeIngredients = array_map('strtolower', $candidateRecipe['ingredients'] ?? []);

        foreach ($patientAllergens as $allergen) {
            if (in_array($allergen, $recipeAllergens, true)) {
                $violations[] = [
                    'code' => 'ALLERGEN_TAG_COLLISION',
                    'message' => "Recipe contains declared allergen: {$allergen}",
                    'severity' => 'FATAL'
                ];
            }

            // Substring search in ingredients list (e.g. groundnut oil, peanut butter)
            foreach ($recipeIngredients as $ing) {
                if (stripos($ing, $allergen) !== false) {
                    $violations[] = [
                        'code' => 'ALLERGEN_INGREDIENT_DETECTED',
                        'message' => "Ingredient '{$ing}' contains allergen pattern: {$allergen}",
                        'severity' => 'FATAL'
                    ];
                }
            }
        }

        // 2. CARBOHYDRATE CLINICAL CEILING (ADA 2026 Standards)
        $carbLimit = $patientProfile['approved_carb_max_per_meal'] ?? 45.0;
        $mealCarbs = (float)($candidateRecipe['carbs_g'] ?? 0.0);
        $hardSafetyMargin = 1.25; // Exceeding 125% of prescribed carb limit is unsafe

        if ($mealCarbs > ($carbLimit * $hardSafetyMargin)) {
            $excess = round($mealCarbs - $carbLimit, 1);
            $violations[] = [
                'code' => 'CARB_LIMIT_EXCEEDED',
                'message' => "Meal carbohydrate content ({$mealCarbs}g) exceeds safety threshold of {$carbLimit}g by {$excess}g",
                'severity' => 'FATAL'
            ];
        }

        // 3. SODIUM & RENAL CONTRAINDICATION
        $isRenalOrHypertensive = in_array(
            'hypertension',
            $patientProfile['comorbidities'] ?? [],
            true
        ) || ($patientProfile['has_renal_restriction'] ?? false);

        $sodiumMg = (float)($candidateRecipe['sodium_mg'] ?? 0.0);
        $sodiumCeiling = $isRenalOrHypertensive ? 650.0 : 950.0;

        if ($sodiumMg > $sodiumCeiling) {
            $violations[] = [
                'code' => 'SODIUM_CONTRAINDICATION',
                'message' => "Sodium level ({$sodiumMg}mg) exceeds patient clinical ceiling ({$sodiumCeiling}mg)",
                'severity' => 'FATAL'
            ];
        }

        // 4. PREPARATION METHOD CONTRAINDICATION
        $prepMethod = strtolower($candidateRecipe['preparation_method'] ?? 'boiled');
        if ($prepMethod === 'deep_fried' && ($patientProfile['medication_risk_category'] ?? '') === 'high_insulin') {
            $violations[] = [
                'code' => 'PREP_METHOD_HIGH_LIPID_RISK',
                'message' => 'Deep fried foods pose delayed glycemic surge risks for patients on insulin protocols.',
                'severity' => 'FATAL'
            ];
        }

        $isSafe = count($violations) === 0;

        return [
            'is_safe' => $isSafe,
            'violations' => $violations,
            'action' => $isSafe ? 'PROCEED_TO_ML_EVALUATION' : 'REJECT_HARD_SAFETY_DROP'
        ];
    }

    /**
     * Batch filters a collection of candidate recipes.
     * Drops all unsafe recipes before dispatching to the Python ML inference service.
     */
    public function filterCandidates(array $patientProfile, array $candidateRecipes): array
    {
        $safeCandidates = [];
        $rejectedCandidates = [];

        foreach ($candidateRecipes as $candidate) {
            $eval = $this->evaluateCandidate($patientProfile, $candidate);
            if ($eval['is_safe']) {
                $safeCandidates[] = $candidate;
            } else {
                $rejectedCandidates[] = [
                    'recipe_id' => $candidate['id'] ?? $candidate['recipe_id'] ?? 'unknown',
                    'title' => $candidate['title'] ?? 'Unknown Recipe',
                    'reasons' => $eval['violations']
                ];
            }
        }

        return [
            'safe_candidates' => $safeCandidates,
            'rejected_count' => count($rejectedCandidates),
            'rejections' => $rejectedCandidates
        ];
    }
}
