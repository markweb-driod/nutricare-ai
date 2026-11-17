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

    /**
     * Demo login accounts. Passwords are hashed at seed time; plain values are
     * documented in README/start scripts for demo use only.
     */
    public static function getDemoUsers(): array
    {
        return [
            ['id' => 'usr-pat-001', 'email' => 'alex.adeyemi@example.com', 'name' => 'Alex Adeyemi', 'role' => 'patient', 'patient_id' => 'pat-001', 'password' => 'patient123'],
            ['id' => 'usr-pat-002', 'email' => 'grace.okafor@example.com', 'name' => 'Grace Okafor', 'role' => 'patient', 'patient_id' => 'pat-002', 'password' => 'patient123'],
            ['id' => 'usr-cln-001', 'email' => 'dr.balogun@nutricare.clinic', 'name' => 'Dr. Kemi Balogun', 'role' => 'clinician', 'title' => 'RD, CDE', 'password' => 'clinician123'],
            ['id' => 'usr-adm-001', 'email' => 'admin@nutricare.ai', 'name' => 'System Administrator', 'role' => 'admin', 'password' => 'admin123'],
        ];
    }

    public static function defaultReminders(array $times = []): array
    {
        $times = array_merge(['breakfast' => '07:30', 'lunch' => '12:30', 'dinner' => '19:00'], $times);
        $out = [];
        foreach ($times as $meal => $time) {
            $out[] = ['id' => 'rem-' . bin2hex(random_bytes(4)), 'meal_type' => $meal, 'time' => $time, 'is_enabled' => true, 'snoozed_until' => null];
        }
        return $out;
    }

    /** Builds a complete v2 state document with timestamps relative to today. */
    public static function buildInitialState(): array
    {
        $today = date('Y-m-d');
        $yesterday = date('Y-m-d', strtotime('-1 day'));
        $recipes = self::getVerifiedRecipes();
        $byId = [];
        foreach ($recipes as $r) {
            $byId[$r['id']] = $r;
        }
        $log = function (string $recipeId, string $mealType, string $at) use ($byId) {
            $r = $byId[$recipeId];
            return [
                'id' => 'log-' . bin2hex(random_bytes(4)),
                'recipe_id' => $recipeId,
                'title' => $r['title'],
                'meal_type' => $mealType,
                'portion_g' => $r['standard_portion_g'],
                'energy_kcal' => $r['energy_kcal'],
                'carbs_g' => $r['carbs_g'],
                'fiber_g' => $r['fiber_g'],
                'net_carbs_g' => round(max(0, $r['carbs_g'] - $r['fiber_g']), 1),
                'protein_g' => $r['protein_g'],
                'fat_g' => $r['fat_g'],
                'sodium_mg' => $r['sodium_mg'],
                'image_url' => $r['image_url'],
                'data_source' => $r['data_source'],
                'logged_at' => $at,
            ];
        };
        $reading = function (float $mg, string $ctx, string $status, string $at, bool $esc = false) {
            return [
                'id' => 'gluc-' . bin2hex(random_bytes(4)),
                'reading_mg_dl' => $mg,
                'reading_mmol_l' => round($mg / 18.0182, 2),
                'context' => $ctx,
                'status' => $status,
                'is_emergency_escalation' => $esc,
                'recorded_at' => $at,
            ];
        };

        $alex = self::getDefaultPatientProfile();
        $grace = array_merge(self::getDefaultPatientProfile(), [
            'id' => 'pat-002',
            'user_id' => 'usr-pat-002',
            'first_name' => 'Grace',
            'last_name' => 'Okafor',
            'age' => 61,
            'gender' => 'female',
            'hba1c_latest' => 8.2,
            'medication_risk_category' => 'high_insulin',
            'daily_energy_kcal_target' => 1600.0,
            'approved_carb_max_per_meal' => 40.0,
            'allergens' => ['fish'],
            'comorbidities' => ['hypertension', 'ckd'],
            'has_renal_restriction' => true,
        ]);
        $grace['assigned_clinician']['approval_status'] = 'PENDING_REVIEW';

        $users = [];
        foreach (self::getDemoUsers() as $u) {
            $u['password_hash'] = password_hash($u['password'], PASSWORD_DEFAULT);
            unset($u['password']);
            $u['created_at'] = date('Y-m-d H:i:s');
            $users[] = $u;
        }

        return [
            'schema_version' => 2,
            'users' => $users,
            'recipes' => $recipes,
            'patients' => [
                'pat-001' => [
                    'profile' => $alex,
                    'glucose_readings' => [
                        $reading(142.0, 'post_meal_2h', 'IN_TARGET', "$yesterday 14:10:00"),
                        $reading(118.0, 'fasting', 'IN_TARGET', "$today 07:45:00"),
                    ],
                    'meal_logs' => [
                        $log('rec-002', 'lunch', "$yesterday 12:40:00"),
                        $log('rec-001', 'breakfast', "$today 08:00:00"),
                    ],
                    'reminders' => self::defaultReminders(),
                    'plan_approval' => ['status' => 'APPROVED', 'by' => 'Dr. Kemi Balogun', 'at' => "$yesterday 16:00:00", 'note' => ''],
                ],
                'pat-002' => [
                    'profile' => $grace,
                    'glucose_readings' => [
                        $reading(212.0, 'post_meal_2h', 'ELEVATED', "$yesterday 15:00:00"),
                        $reading(64.0, 'fasting', 'HYPOGLYCEMIA', "$today 06:50:00", true),
                    ],
                    'meal_logs' => [
                        $log('rec-004', 'dinner', "$yesterday 19:15:00"),
                    ],
                    'reminders' => self::defaultReminders(['breakfast' => '07:00', 'lunch' => '13:00', 'dinner' => '18:30']),
                    'plan_approval' => ['status' => 'PENDING_REVIEW', 'by' => null, 'at' => null, 'note' => ''],
                ],
            ],
            'audit_log' => [[
                'id' => 'aud-seed',
                'at' => date('Y-m-d H:i:s'),
                'actor' => 'system',
                'action' => 'STATE_SEEDED',
                'detail' => 'Initial demo dataset created',
            ]],
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
