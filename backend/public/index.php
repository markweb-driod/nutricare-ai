<?php

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PATCH, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Simple PSR-4 Autoloader
spl_autoload_register(function ($class) {
    $prefix = 'App\\';
    $base_dir = __DIR__ . '/../app/';
    $len = strlen($prefix);
    if (strncmp($prefix, $class, $len) !== 0) {
        return;
    }
    $relative_class = substr($class, $len);
    $file = $base_dir . str_replace('\\', '/', $relative_class) . '.php';
    if (file_exists($file)) {
        require_once $file;
    }
});

// Load SeedData
require_once __DIR__ . '/../database/SeedData.php';

use App\Database\SeedData;
use App\Services\Safety\DeterministicSafetyEngine;
use App\Services\Recommendations\HybridRecommendationService;
use App\Services\Clinical\GlucoseMonitoringService;
use App\Services\Reminders\ReminderSchedulerService;

$safetyEngine = new DeterministicSafetyEngine();
$recService = new HybridRecommendationService($safetyEngine);
$glucoseService = new GlucoseMonitoringService();
$reminderService = new ReminderSchedulerService();

$requestUri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$method = $_SERVER['REQUEST_METHOD'];
$body = json_decode(file_get_contents('php://input'), true) ?? [];

// In-Memory/State Store
$storageFile = __DIR__ . '/../storage/app_state.json';
if (!file_exists(dirname($storageFile))) {
    mkdir(dirname($storageFile), 0777, true);
}

if (!file_exists($storageFile)) {
    $initialState = [
        'patient_profile' => SeedData::getDefaultPatientProfile(),
        'recipes' => SeedData::getVerifiedRecipes(),
        'glucose_readings' => [
            [
                'id' => 'gluc-01',
                'reading_mg_dl' => 118.0,
                'reading_mmol_l' => 6.55,
                'context' => 'fasting',
                'status' => 'IN_TARGET',
                'recorded_at' => '2026-09-24 07:45:00',
                'is_emergency_escalation' => false
            ],
            [
                'id' => 'gluc-02',
                'reading_mg_dl' => 142.0,
                'reading_mmol_l' => 7.88,
                'context' => 'post_meal_2h',
                'status' => 'IN_TARGET',
                'recorded_at' => '2026-09-24 14:10:00',
                'is_emergency_escalation' => false
            ]
        ],
        'reminders' => [
            ['id' => 'rem-01', 'meal_type' => 'breakfast', 'time' => '07:30', 'is_enabled' => true],
            ['id' => 'rem-02', 'meal_type' => 'lunch', 'time' => '12:30', 'is_enabled' => true],
            ['id' => 'rem-03', 'meal_type' => 'dinner', 'time' => '19:00', 'is_enabled' => true],
        ],
        'meal_logs' => [
            [
                'id' => 'log-01',
                'recipe_id' => 'rec-001',
                'title' => 'Steamed Moi Moi with Fresh Spinach & Fish',
                'meal_type' => 'breakfast',
                'portion_g' => 250,
                'carbs_g' => 24.5,
                'calories' => 265,
                'logged_at' => '2026-09-24 08:00:00'
            ]
        ]
    ];
    file_put_contents($storageFile, json_encode($initialState, JSON_PRETTY_PRINT));
}

$state = json_decode(file_get_contents($storageFile), true);

function saveState($state, $file) {
    file_put_contents($file, json_encode($state, JSON_PRETTY_PRINT));
}

// Global Root & Health Endpoints
if ($requestUri === '/' || $requestUri === '/health' || $requestUri === '/api/v1/health') {
    echo json_encode([
        'status' => 'healthy',
        'app' => 'NutriCare AI Backend REST API Engine',
        'version' => '1.0.0',
        'endpoints' => [
            '/api/v1/health',
            '/api/v1/patient/profile',
            '/api/v1/recipes',
            '/api/v1/recommendations/generate',
            '/api/v1/glucose-readings',
            '/api/v1/meal-logs',
            '/api/v1/reminders'
        ],
        'timestamp' => date('c')
    ]);
    exit;
}

// 1. Auth routes
if ($requestUri === '/api/v1/auth/login' && $method === 'POST') {
    $email = $body['email'] ?? 'alex@example.com';
    $role = (strpos($email, 'clinician') !== false || strpos($email, 'dr.') !== false) ? 'clinician' : ((strpos($email, 'admin') !== false) ? 'admin' : 'patient');
    echo json_encode([
        'status' => 'success',
        'token' => 'jwt_token_' . md5($email),
        'user' => [
            'id' => 'usr-' . substr(md5($email), 0, 8),
            'email' => $email,
            'name' => $role === 'clinician' ? 'Dr. Kemi Balogun' : ($role === 'admin' ? 'System Administrator' : 'Alex Adeyemi'),
            'role' => $role
        ]
    ]);
    exit;
}

// 2. Patient Profile
if ($requestUri === '/api/v1/patient/profile') {
    if ($method === 'GET') {
        echo json_encode(['status' => 'success', 'data' => $state['patient_profile']]);
        exit;
    }
    if ($method === 'PATCH') {
        $state['patient_profile'] = array_merge($state['patient_profile'], $body);
        saveState($state, $storageFile);
        echo json_encode(['status' => 'success', 'data' => $state['patient_profile']]);
        exit;
    }
}

// 3. Recipes Catalog
if (preg_match('#^/api/v1/recipes/([a-zA-Z0-9\-_]+)$#', $requestUri, $matches)) {
    $recipeId = $matches[1];
    $found = null;
    foreach ($state['recipes'] as $r) {
        if ($r['id'] === $recipeId) { $found = $r; break; }
    }
    if ($found) {
        echo json_encode(['status' => 'success', 'data' => $found]);
    } else {
        http_response_code(404);
        echo json_encode(['status' => 'error', 'message' => 'Recipe not found']);
    }
    exit;
}

if ($requestUri === '/api/v1/recipes' && $method === 'GET') {
    echo json_encode(['status' => 'success', 'count' => count($state['recipes']), 'data' => $state['recipes']]);
    exit;
}

// 4. ML Recommendations Endpoint
if ($requestUri === '/api/v1/recommendations/generate' && $method === 'POST') {
    $patient = $state['patient_profile'];
    $catalog = $state['recipes'];
    $mealHistory = $state['meal_logs'];
    
    $report = $recService->generateRecommendations($patient, $catalog, $mealHistory, 6);
    echo json_encode($report);
    exit;
}

// 5. Glucose Readings & ADA 2026 Emergency Escalation
if ($requestUri === '/api/v1/glucose-readings') {
    if ($method === 'GET') {
        echo json_encode(['status' => 'success', 'data' => $state['glucose_readings']]);
        exit;
    }
    if ($method === 'POST') {
        $valMgDl = (float)($body['reading_mg_dl'] ?? 100.0);
        $context = $body['context'] ?? 'pre_meal';

        $evaluation = $glucoseService->evaluateReading($valMgDl, $context);

        $newReading = [
            'id' => 'gluc-' . time(),
            'reading_mg_dl' => $valMgDl,
            'reading_mmol_l' => $evaluation['value_mmol_l'],
            'context' => $context,
            'status' => $evaluation['status'],
            'is_emergency_escalation' => $evaluation['is_escalated'],
            'recorded_at' => date('Y-m-d H:i:s'),
            'evaluation' => $evaluation
        ];

        array_unshift($state['glucose_readings'], $newReading);
        saveState($state, $storageFile);

        echo json_encode([
            'status' => 'success',
            'data' => $newReading,
            'escalation_alert' => $evaluation['is_escalated'] ? $evaluation : null
        ]);
        exit;
    }
}

// 6. Reminders
if ($requestUri === '/api/v1/reminders' && $method === 'GET') {
    echo json_encode(['status' => 'success', 'data' => $state['reminders']]);
    exit;
}

// 200 Fallback for any standard web request
echo json_encode([
    'status' => 'success',
    'service' => 'NutriCare AI Backend REST API Engine',
    'requested_route' => $requestUri,
    'timestamp' => date('c')
]);
