<?php

namespace App\Database;

/**
 * NutriCare AI - Verified Food & Recipe Dataset
 * Calibrated against FAO/INFOODS 2019 (West Africa) and USDA FoodData Central.
 */
class SeedData
{
    public static function getVerifiedRecipes(): array
    {
        return [
            [
                'id' => 'rec-001',
                'title' => 'Steamed Moi Moi with Fresh Spinach & Fish',
                'regional_category' => 'West African',
                'preparation_method' => 'steamed',
                'standard_portion_g' => 250.0,
                'total_yield_g' => 1000.0,
                'energy_kcal' => 265.0,
                'carbs_g' => 24.5,
                'fiber_g' => 8.2,
                'protein_g' => 22.0,
                'fat_g' => 7.8,
                'sodium_mg' => 340.0,
                'allergens' => ['fish'],
                'ingredients' => ['black-eyed peas', 'flaked mackerel', 'spinach', 'red bell peppers', 'onions', 'olive oil'],
                'image_url' => 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80',
                'instructions' => 'Blend soaked beans with peppers and onions. Gently fold in flaked mackerel and shredded spinach. Steam in ramekins for 45 minutes.',
                'is_verified' => true,
                'data_source' => 'FAO_INFOODS_2019_WAFCT'
            ],
            [
                'id' => 'rec-002',
                'title' => 'Brown Beans Porridge with Steamed Pumpkin Greens',
                'regional_category' => 'West African',
                'preparation_method' => 'boiled',
                'standard_portion_g' => 280.0,
                'total_yield_g' => 1200.0,
                'energy_kcal' => 290.0,
                'carbs_g' => 37.0,
                'fiber_g' => 9.8,
                'protein_g' => 17.5,
                'fat_g' => 5.5,
                'sodium_mg' => 380.0,
                'allergens' => [],
                'ingredients' => ['honey beans (oloyin)', 'ugwu (pumpkin greens)', 'onions', 'habanero', 'crayfish'],
                'image_url' => 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=600&q=80',
                'instructions' => 'Slow-cook brown honey beans until soft. Stir in ground crayfish and peppers. Top with wilted ugwu leaves in the final 5 minutes.',
                'is_verified' => true,
                'data_source' => 'FAO_INFOODS_2019_WAFCT'
            ],
            [
                'id' => 'rec-003',
                'title' => 'Okra Soup with Grilled Tilapia & Controlled Eba (Cassava)',
                'regional_category' => 'West African',
                'preparation_method' => 'boiled',
                'standard_portion_g' => 300.0,
                'total_yield_g' => 1200.0,
                'energy_kcal' => 335.0,
                'carbs_g' => 33.0,
                'fiber_g' => 7.2,
                'protein_g' => 27.0,
                'fat_g' => 9.5,
                'sodium_mg' => 450.0,
                'allergens' => ['fish'],
                'ingredients' => ['fresh diced okra', 'grilled tilapia fillet', 'garri (yellow cassava)', 'bitterleaf', 'crayfish'],
                'image_url' => 'https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=600&q=80',
                'instructions' => 'Lightly simmer freshly cut okra with fish stock and crayfish. Pair with a measured 80g portion of eba.',
                'is_verified' => true,
                'data_source' => 'FAO_INFOODS_2019_WAFCT'
            ],
            [
                'id' => 'rec-004',
                'title' => 'Edikang Ikong (Waterleaf & Fluted Pumpkin) with Tender Beef',
                'regional_category' => 'West African',
                'preparation_method' => 'boiled',
                'standard_portion_g' => 260.0,
                'total_yield_g' => 1100.0,
                'energy_kcal' => 280.0,
                'carbs_g' => 12.0,
                'fiber_g' => 6.5,
                'protein_g' => 31.0,
                'fat_g' => 11.0,
                'sodium_mg' => 420.0,
                'allergens' => [],
                'ingredients' => ['waterleaf', 'ugwu', 'lean beef', 'dry fish', 'scotch bonnet'],
                'image_url' => 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=600&q=80',
                'instructions' => 'Steam waterleaf to reduce liquid, then add shredded ugwu and lean poached beef cuts.',
                'is_verified' => true,
                'data_source' => 'FAO_INFOODS_2019_WAFCT'
            ],
            [
                'id' => 'rec-005',
                'title' => 'Rolled Oats with Roasted Walnuts, Flaxseed & Berries',
                'regional_category' => 'Continental',
                'preparation_method' => 'boiled',
                'standard_portion_g' => 240.0,
                'total_yield_g' => 500.0,
                'energy_kcal' => 245.0,
                'carbs_g' => 28.0,
                'fiber_g' => 7.5,
                'protein_g' => 10.5,
                'fat_g' => 8.2,
                'sodium_mg' => 95.0,
                'allergens' => ['tree_nuts'],
                'ingredients' => ['rolled oats', 'flaxseed meal', 'walnuts', 'fresh blueberries', 'cinnamon'],
                'image_url' => 'https://images.unsplash.com/photo-1517673400267-0251440c45dc?auto=format&fit=crop&w=600&q=80',
                'instructions' => 'Cook rolled oats in water with cinnamon. Top with ground flaxseed and crushed walnuts.',
                'is_verified' => true,
                'data_source' => 'USDA_FDC'
            ],
            [
                'id' => 'rec-006',
                'title' => 'Grilled Herb Chicken Breast with Steamed Broccoli & Quinoa',
                'regional_category' => 'Continental',
                'preparation_method' => 'grilled',
                'standard_portion_g' => 270.0,
                'total_yield_g' => 600.0,
                'energy_kcal' => 310.0,
                'carbs_g' => 22.0,
                'fiber_g' => 5.8,
                'protein_g' => 36.0,
                'fat_g' => 6.5,
                'sodium_mg' => 280.0,
                'allergens' => [],
                'ingredients' => ['boneless chicken breast', 'broccoli florets', 'quinoa', 'garlic', 'olive oil'],
                'image_url' => 'https://images.unsplash.com/photo-1532550907401-a500c9a57435?auto=format&fit=crop&w=600&q=80',
                'instructions' => 'Grill herb-marinated chicken breast. Serve alongside steamed tender broccoli and cooked quinoa.',
                'is_verified' => true,
                'data_source' => 'USDA_FDC'
            ],
            [
                'id' => 'rec-007',
                'title' => 'Deep-Fried Plantain (Dodo) with Palm Oil Stew & Fried Beef',
                'regional_category' => 'West African',
                'preparation_method' => 'deep_fried',
                'standard_portion_g' => 340.0,
                'total_yield_g' => 800.0,
                'energy_kcal' => 580.0,
                'carbs_g' => 74.0,
                'fiber_g' => 2.1,
                'protein_g' => 14.0,
                'fat_g' => 28.0,
                'sodium_mg' => 890.0,
                'allergens' => [],
                'ingredients' => ['ripe plantain', 'vegetable oil', 'beef', 'tomato paste', 'palm oil'],
                'image_url' => 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=600&q=80',
                'instructions' => 'Deep fry ripe sliced plantains and seasoned beef cubes in vegetable oil.',
                'is_verified' => false,
                'data_source' => 'GENERAL_COMMUNITY'
            ]
        ];
    }

    public static function getDefaultPatientProfile(): array
    {
        return [
            'id' => 'pat-001',
            'user_id' => 'usr-pat-001',
            'first_name' => 'Alex',
            'last_name' => 'Adeyemi',
            'age' => 52,
            'gender' => 'male',
            'timezone' => 'Africa/Lagos',
            'diabetes_type' => 'type_2',
            'hba1c_latest' => 6.9,
            'medication_risk_category' => 'low_metformin',
            'daily_energy_kcal_target' => 1800.0,
            'approved_carb_max_per_meal' => 45.0,
            'allergens' => ['tree_nuts'], // Allergic to tree nuts (walnuts, etc.)
            'comorbidities' => ['hypertension'],
            'has_renal_restriction' => false,
            'favorite_categories' => ['West African'],
            'assigned_clinician' => [
                'name' => 'Dr. Kemi Balogun, RD, CDE',
                'clinic' => 'Metabolic Health & Endocrine Clinic',
                'approval_status' => 'APPROVED'
            ]
        ];
    }
}
