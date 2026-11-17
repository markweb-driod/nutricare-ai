<?php

declare(strict_types=1);

/*
 * NutriCare AI - REST API front controller.
 * All responses are JSON. Errors use {status:"error", message, errors?} with a real HTTP code.
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: ' . (getenv('CORS_ORIGIN') ?: '*'));
header('Access-Control-Allow-Methods: GET, POST, PATCH, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
header('X-Content-Type-Options: nosniff');

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'OPTIONS') {
    http_response_code(204);
    exit;
}

spl_autoload_register(function ($class) {
    $prefix = 'App\\';
    if (strncmp($prefix, $class, strlen($prefix)) !== 0) {
        return;
    }
    $file = __DIR__ . '/../app/' . str_replace('\\', '/', substr($class, strlen($prefix))) . '.php';
    if (file_exists($file)) {
        require_once $file;
    }
});
require_once __DIR__ . '/../database/SeedData.php';

use App\Database\SeedData;
use App\Services\Clinical\GlucoseMonitoringService;
use App\Services\Recommendations\HybridRecommendationService;
use App\Services\Reminders\ReminderSchedulerService;
use App\Services\Safety\DeterministicSafetyEngine;
use App\Support\Auth;
use App\Support\StateStore;

date_default_timezone_set(getenv('APP_TIMEZONE') ?: 'Africa/Lagos');

final class HttpError extends Exception
{
    public array $errors;
    public function __construct(int $code, string $message, array $errors = [])
    {
        parent::__construct($message, $code);
        $this->errors = $errors;
    }
}

function respond(array $payload, int $code = 200): void
{
    http_response_code($code);
    echo json_encode($payload, JSON_UNESCAPED_SLASHES);
}

// ---------------------------------------------------------------- constants
const DIABETES_TYPES = ['type_1', 'type_2', 'gestational', 'prediabetes'];
const MEDICATION_CATEGORIES = ['low_metformin', 'moderate_sulfonylurea', 'high_insulin'];
const ALLERGENS = ['tree_nuts', 'peanuts', 'fish', 'shellfish', 'dairy', 'eggs', 'gluten', 'soy', 'sesame'];
const COMORBIDITIES = ['hypertension', 'ckd', 'dyslipidemia', 'obesity'];
const CATEGORIES = ['West African', 'Continental'];
const GENDERS = ['male', 'female', 'other'];
const GLUCOSE_CONTEXTS = ['fasting', 'pre_meal', 'post_meal_2h', 'bedtime'];
const MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'snack'];

// ---------------------------------------------------------------- validation helpers
function v_number(array $body, string $key, float $min, float $max, array &$errors, bool $required = true): ?float
{
    if (!array_key_exists($key, $body) || $body[$key] === '' || $body[$key] === null) {
        if ($required) {
            $errors[$key] = 'Required';
        }
        return null;
    }
    if (!is_numeric($body[$key])) {
        $errors[$key] = 'Must be a number';
        return null;
    }
    $n = (float)$body[$key];
    if ($n < $min || $n > $max) {
        $errors[$key] = "Must be between $min and $max";
        return null;
    }
    return $n;
}

function v_enum(array $body, string $key, array $allowed, array &$errors, bool $required = true): ?string
{
    if (!array_key_exists($key, $body) || $body[$key] === '' || $body[$key] === null) {
        if ($required) {
            $errors[$key] = 'Required';
        }
        return null;
    }
    if (!is_string($body[$key]) || !in_array($body[$key], $allowed, true)) {
        $errors[$key] = 'Must be one of: ' . implode(', ', $allowed);
        return null;
    }
    return $body[$key];
}

function v_list(array $body, string $key, array $allowed, array &$errors): ?array
{
    if (!array_key_exists($key, $body)) {
        return null;
    }
    if (!is_array($body[$key])) {
        $errors[$key] = 'Must be a list';
        return null;
    }
    $bad = array_diff($body[$key], $allowed);
    if ($bad) {
        $errors[$key] = 'Unknown values: ' . implode(', ', $bad);
        return null;
    }
    return array_values(array_unique($body[$key]));
}

function v_string(array $body, string $key, int $min, int $max, array &$errors, bool $required = true): ?string
{
    $val = isset($body[$key]) && is_string($body[$key]) ? trim($body[$key]) : '';
    if ($val === '') {
        if ($required) {
            $errors[$key] = 'Required';
        }
        return null;
    }
    if (mb_strlen($val) < $min || mb_strlen($val) > $max) {
        $errors[$key] = "Must be $min-$max characters";
        return null;
    }
    return $val;
}

function v_time(array $body, string $key, array &$errors, bool $required = true): ?string
{
    $val = $body[$key] ?? null;
    if ($val === null || $val === '') {
        if ($required) {
            $errors[$key] = 'Required';
        }
        return null;
    }
    if (!is_string($val) || !preg_match('/^([01]\d|2[0-3]):[0-5]\d$/', $val)) {
        $errors[$key] = 'Must be HH:MM (24h)';
        return null;
    }
    return $val;
}

/** Validates patient-editable profile fields; returns the sanitized subset. */
function validate_profile_fields(array $body, array &$errors, bool $requireAll = false): array
{
    $out = [];
    $r = $requireAll;
    if (($v = v_string($body, 'first_name', 1, 60, $errors, $r)) !== null) $out['first_name'] = $v;
    if (($v = v_string($body, 'last_name', 1, 60, $errors, $r)) !== null) $out['last_name'] = $v;
    if (($v = v_number($body, 'age', 18, 120, $errors, $r)) !== null) $out['age'] = (int)$v;
    if (($v = v_enum($body, 'gender', GENDERS, $errors, $r)) !== null) $out['gender'] = $v;
    if (($v = v_enum($body, 'diabetes_type', DIABETES_TYPES, $errors, $r)) !== null) $out['diabetes_type'] = $v;
    if (($v = v_number($body, 'hba1c_latest', 3, 20, $errors, $r)) !== null) $out['hba1c_latest'] = round($v, 1);
    if (($v = v_enum($body, 'medication_risk_category', MEDICATION_CATEGORIES, $errors, $r)) !== null) $out['medication_risk_category'] = $v;
    if (($v = v_list($body, 'allergens', ALLERGENS, $errors)) !== null) $out['allergens'] = $v;
    if (($v = v_list($body, 'comorbidities', COMORBIDITIES, $errors)) !== null) {
        $out['comorbidities'] = $v;
        $out['has_renal_restriction'] = in_array('ckd', $v, true);
    }
    if (($v = v_list($body, 'favorite_categories', CATEGORIES, $errors)) !== null) $out['favorite_categories'] = $v;
    if (isset($body['timezone'])) {
        if (is_string($body['timezone']) && in_array($body['timezone'], timezone_identifiers_list(), true)) {
            $out['timezone'] = $body['timezone'];
        } else {
            $errors['timezone'] = 'Unknown timezone';
        }
    }
    return $out;
}

function public_user(array $u): array
{
    return [
        'id' => $u['id'],
        'email' => $u['email'],
        'name' => $u['name'],
        'role' => $u['role'],
        'title' => $u['title'] ?? null,
        'patient_id' => $u['patient_id'] ?? null,
    ];
}

function find_user(array $state, string $field, string $value): ?array
{
    foreach ($state['users'] as $u) {
        if (strcasecmp((string)($u[$field] ?? ''), $value) === 0) {
            return $u;
        }
    }
    return null;
}

function sort_desc_by(array $rows, string $field): array
{
    usort($rows, fn($a, $b) => strcmp((string)$b[$field], (string)$a[$field]));
    return $rows;
}

function reminders_with_next(array $reminders, string $tz): array
{
    $svc = new ReminderSchedulerService();
    $now = new DateTime('now', new DateTimeZone($tz));
    foreach ($reminders as &$r) {
        $next = $svc->calculateNextTargetTime($r['time'] . ':00', $tz);
        if (!empty($r['snoozed_until']) && new DateTime($r['snoozed_until'], new DateTimeZone($tz)) > $now) {
            $next = new DateTime($r['snoozed_until'], new DateTimeZone($tz));
        }
        $r['next_trigger_at'] = $r['is_enabled'] ? $next->format('Y-m-d H:i:s') : null;
    }
    unset($r);
    return $reminders;
}

function ml_get(string $path): ?array
{
    $base = rtrim(getenv('ML_SERVICE_URL') ?: 'http://127.0.0.1:8000', '/');
    $ch = curl_init($base . $path);
    curl_setopt_array($ch, [CURLOPT_RETURNTRANSFER => true, CURLOPT_TIMEOUT => 3, CURLOPT_CONNECTTIMEOUT => 2]);
    $res = curl_exec($ch);
    $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    return ($code === 200 && $res) ? json_decode($res, true) : null;
}

function patient_summary(array $record): array
{
    $p = $record['profile'];
    $readings = sort_desc_by($record['glucose_readings'], 'recorded_at');
    $weekAgo = date('Y-m-d H:i:s', strtotime('-7 days'));
    $recentLogs = array_filter($record['meal_logs'], fn($l) => $l['logged_at'] >= $weekAgo && $l['meal_type'] !== 'snack');
    $recentEsc = array_filter($readings, fn($g) => $g['is_emergency_escalation'] && $g['recorded_at'] >= $weekAgo);
    return [
        'id' => $p['id'],
        'name' => $p['first_name'] . ' ' . $p['last_name'],
        'age' => $p['age'],
        'diabetes_type' => $p['diabetes_type'],
        'hba1c_latest' => $p['hba1c_latest'],
        'medication_risk_category' => $p['medication_risk_category'],
        'latest_glucose' => $readings[0] ?? null,
        'escalations_7d' => count($recentEsc),
        'meals_logged_7d' => count($recentLogs),
        'adherence_pct' => (int)min(100, round(count($recentLogs) / 21 * 100)),
        'approval_status' => $record['plan_approval']['status'],
        'needs_review' => $record['plan_approval']['status'] !== 'APPROVED' || count($recentEsc) > 0,
    ];
}

// ---------------------------------------------------------------- request context
$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
$path = rtrim(parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?: '/', '/') ?: '/';
$storageDir = __DIR__ . '/../storage';
$store = new StateStore($storageDir . '/app_state.json');

set_exception_handler(function (Throwable $e) use ($store) {
    $store->close();
    if ($e instanceof HttpError) {
        $payload = ['status' => 'error', 'message' => $e->getMessage()];
        if ($e->errors) {
            $payload['errors'] = $e->errors;
        }
        respond($payload, $e->getCode());
        return;
    }
    error_log('[NutriCare API] ' . $e);
    respond(['status' => 'error', 'message' => 'Internal server error'], 500);
});

if (in_array($path, ['/', '/health', '/api/v1/health'], true)) {
    respond([
        'status' => 'healthy',
        'app' => 'NutriCare AI Backend REST API Engine',
        'version' => '2.0.0',
        'timestamp' => date('c'),
    ]);
    exit;
}

$rawBody = file_get_contents('php://input');
$body = [];
if (in_array($method, ['POST', 'PATCH', 'PUT'], true) && $rawBody !== '') {
    $body = json_decode($rawBody, true);
    if (!is_array($body)) {
        throw new HttpError(400, 'Request body must be valid JSON');
    }
}

$store->open();
$state = &$store->state;
$secret = Auth::secret($storageDir);

/** Resolves the authenticated user or throws 401. */
$requireUser = function (array $roles = []) use (&$state, $secret): array {
    $token = Auth::bearerToken();
    $claims = $token ? Auth::verify($token, $secret) : null;
    if (!$claims) {
        throw new HttpError(401, 'Authentication required');
    }
    $user = find_user($state, 'id', $claims['sub']);
    if (!$user) {
        throw new HttpError(401, 'Account no longer exists');
    }
    if ($roles && !in_array($user['role'], $roles, true)) {
        throw new HttpError(403, 'You do not have permission for this action');
    }
    return $user;
};

/** Patient scope: patients act on themselves; clinicians/admins pass ?patient_id=. */
$resolvePatientId = function (array $user) use (&$state): string {
    if ($user['role'] === 'patient') {
        $pid = $user['patient_id'];
    } else {
        $pid = $_GET['patient_id'] ?? '';
        if ($pid === '') {
            throw new HttpError(400, 'patient_id query parameter is required for staff accounts');
        }
    }
    if (!isset($state['patients'][$pid])) {
        throw new HttpError(404, 'Patient not found');
    }
    return $pid;
};

// ---------------------------------------------------------------- router
$routes = [];
$route = function (string $m, string $pattern, callable $handler) use (&$routes) {
    $routes[] = [$m, '#^' . $pattern . '$#', $handler];
};

// ---- Auth
$route('POST', '/api/v1/auth/login', function () use (&$state, $body, $secret, $store) {
    $errors = [];
    $email = v_string($body, 'email', 3, 190, $errors);
    $password = isset($body['password']) && is_string($body['password']) ? $body['password'] : '';
    if ($password === '') $errors['password'] = 'Required';
    if ($errors) throw new HttpError(422, 'Please fill in all fields', $errors);

    $user = find_user($state, 'email', $email);
    if (!$user || !password_verify($password, $user['password_hash'])) {
        $store->audit($email, 'LOGIN_FAILED');
        $store->save();
        throw new HttpError(401, 'Incorrect email or password');
    }
    $store->audit($user['email'], 'LOGIN');
    $store->save();
    respond(['status' => 'success', 'token' => Auth::issue($user, $secret), 'user' => public_user($user)]);
});

$route('POST', '/api/v1/auth/register', function () use (&$state, $body, $secret, $store) {
    $errors = [];
    $email = v_string($body, 'email', 3, 190, $errors);
    if ($email && !filter_var($email, FILTER_VALIDATE_EMAIL)) $errors['email'] = 'Invalid email address';
    $password = is_string($body['password'] ?? null) ? $body['password'] : '';
    if (strlen($password) < 8) $errors['password'] = 'Must be at least 8 characters';
    $profileIn = is_array($body['profile'] ?? null) ? $body['profile'] : [];
    // Browser-detected timezone is best-effort: fall back to the default instead of failing sign-up.
    if (isset($profileIn['timezone']) && !in_array($profileIn['timezone'], timezone_identifiers_list(), true)) {
        unset($profileIn['timezone']);
    }
    $profile = validate_profile_fields($profileIn, $errors, true);
    $remIn = is_array($body['reminders'] ?? null) ? $body['reminders'] : [];
    $times = [];
    foreach (['breakfast', 'lunch', 'dinner'] as $meal) {
        if (($t = v_time($remIn, $meal, $errors, false)) !== null) $times[$meal] = $t;
    }
    if ($errors) throw new HttpError(422, 'Please correct the highlighted fields', $errors);
    if (find_user($state, 'email', $email)) throw new HttpError(409, 'An account with this email already exists');

    $pid = StateStore::newId('pat');
    $uid = StateStore::newId('usr');
    $fullProfile = array_merge(SeedData::getDefaultPatientProfile(), [
        'allergens' => [], 'comorbidities' => [], 'favorite_categories' => [], 'has_renal_restriction' => false,
    ], $profile, [
        'id' => $pid,
        'user_id' => $uid,
        'assigned_clinician' => ['name' => 'Dr. Kemi Balogun, RD, CDE', 'clinic' => 'Metabolic Health & Endocrine Clinic', 'approval_status' => 'PENDING_REVIEW'],
    ]);
    $user = [
        'id' => $uid,
        'email' => strtolower($email),
        'name' => $profile['first_name'] . ' ' . $profile['last_name'],
        'role' => 'patient',
        'patient_id' => $pid,
        'password_hash' => password_hash($password, PASSWORD_DEFAULT),
        'created_at' => date('Y-m-d H:i:s'),
    ];
    $state['users'][] = $user;
    $state['patients'][$pid] = [
        'profile' => $fullProfile,
        'glucose_readings' => [],
        'meal_logs' => [],
        'reminders' => SeedData::defaultReminders($times),
        'plan_approval' => ['status' => 'PENDING_REVIEW', 'by' => null, 'at' => null, 'note' => ''],
    ];
    $store->audit($user['email'], 'REGISTER', "Patient $pid created");
    $store->save();
    respond(['status' => 'success', 'token' => Auth::issue($user, $secret), 'user' => public_user($user)], 201);
});

$route('GET', '/api/v1/auth/me', function () use ($requireUser) {
    respond(['status' => 'success', 'user' => public_user($requireUser())]);
});

// ---- Recipes
$route('GET', '/api/v1/recipes', function () use (&$state, $requireUser) {
    $requireUser();
    respond(['status' => 'success', 'count' => count($state['recipes']), 'data' => $state['recipes']]);
});

$route('GET', '/api/v1/recipes/([a-zA-Z0-9_-]+)', function ($id) use (&$state, $requireUser) {
    $requireUser();
    foreach ($state['recipes'] as $r) {
        if ($r['id'] === $id) {
            respond(['status' => 'success', 'data' => $r]);
            return;
        }
    }
    throw new HttpError(404, 'Recipe not found');
});

// ---- Patient profile
$route('GET', '/api/v1/patient/profile', function () use (&$state, $requireUser, $resolvePatientId) {
    $pid = $resolvePatientId($requireUser());
    $rec = $state['patients'][$pid];
    respond(['status' => 'success', 'data' => $rec['profile'] + ['plan_approval' => $rec['plan_approval']]]);
});

$route('PATCH', '/api/v1/patient/profile', function () use (&$state, $body, $requireUser, $resolvePatientId, $store) {
    $user = $requireUser(['patient']);
    $pid = $resolvePatientId($user);
    $errors = [];
    $changes = validate_profile_fields($body, $errors);
    if ($errors) throw new HttpError(422, 'Please correct the highlighted fields', $errors);
    if (!$changes) throw new HttpError(422, 'No editable fields supplied');

    $before = $state['patients'][$pid]['profile'];
    $state['patients'][$pid]['profile'] = array_merge($before, $changes);
    // Clinically relevant edits invalidate the approved plan until a clinician reviews it.
    $clinical = ['diabetes_type', 'medication_risk_category', 'allergens', 'comorbidities', 'hba1c_latest'];
    foreach ($clinical as $f) {
        if (array_key_exists($f, $changes) && $changes[$f] != ($before[$f] ?? null)) {
            $state['patients'][$pid]['plan_approval'] = ['status' => 'PENDING_REVIEW', 'by' => null, 'at' => null, 'note' => 'Patient updated clinical profile'];
            $state['patients'][$pid]['profile']['assigned_clinician']['approval_status'] = 'PENDING_REVIEW';
            break;
        }
    }
    $store->audit($user['email'], 'PROFILE_UPDATED', implode(', ', array_keys($changes)));
    $store->save();
    $rec = $state['patients'][$pid];
    respond(['status' => 'success', 'data' => $rec['profile'] + ['plan_approval' => $rec['plan_approval']]]);
});

// ---- Recommendations
$route('POST', '/api/v1/recommendations/generate', function () use (&$state, $requireUser, $resolvePatientId) {
    $pid = $resolvePatientId($requireUser());
    $rec = $state['patients'][$pid];
    $svc = new HybridRecommendationService(new DeterministicSafetyEngine());
    respond($svc->generateRecommendations($rec['profile'], $state['recipes'], $rec['meal_logs'], 6));
});

// ---- Glucose
$route('GET', '/api/v1/glucose-readings', function () use (&$state, $requireUser, $resolvePatientId) {
    $pid = $resolvePatientId($requireUser());
    respond(['status' => 'success', 'data' => sort_desc_by($state['patients'][$pid]['glucose_readings'], 'recorded_at')]);
});

$route('POST', '/api/v1/glucose-readings', function () use (&$state, $body, $requireUser, $resolvePatientId, $store) {
    $user = $requireUser(['patient']);
    $pid = $resolvePatientId($user);
    $errors = [];
    $mg = v_number($body, 'reading_mg_dl', 10, 1000, $errors);
    $ctx = v_enum($body, 'context', GLUCOSE_CONTEXTS, $errors);
    if ($errors) throw new HttpError(422, 'Please enter a valid reading', $errors);

    $eval = (new GlucoseMonitoringService())->evaluateReading($mg, $ctx);
    $reading = [
        'id' => StateStore::newId('gluc'),
        'reading_mg_dl' => $mg,
        'reading_mmol_l' => $eval['value_mmol_l'],
        'context' => $ctx,
        'status' => $eval['status'],
        'is_emergency_escalation' => $eval['is_escalated'],
        'recorded_at' => date('Y-m-d H:i:s'),
        'evaluation' => $eval,
    ];
    $state['patients'][$pid]['glucose_readings'][] = $reading;
    if ($eval['is_escalated']) {
        $store->audit($user['email'], 'GLUCOSE_ESCALATION', "{$eval['status']} {$mg} mg/dL ($pid) - clinician notified");
    }
    $store->save();
    respond(['status' => 'success', 'data' => $reading, 'escalation_alert' => $eval['is_escalated'] ? $eval : null], 201);
});

// ---- Meal logs
$route('GET', '/api/v1/meal-logs', function () use (&$state, $requireUser, $resolvePatientId) {
    $pid = $resolvePatientId($requireUser());
    $logs = $state['patients'][$pid]['meal_logs'];
    $date = $_GET['date'] ?? null;
    if ($date !== null) {
        if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $date)) throw new HttpError(422, 'date must be YYYY-MM-DD');
        $logs = array_values(array_filter($logs, fn($l) => strncmp($l['logged_at'], $date, 10) === 0));
    }
    respond(['status' => 'success', 'data' => sort_desc_by($logs, 'logged_at')]);
});

$route('POST', '/api/v1/meal-logs', function () use (&$state, $body, $requireUser, $resolvePatientId, $store) {
    $user = $requireUser(['patient']);
    $pid = $resolvePatientId($user);
    $errors = [];
    $recipeId = v_string($body, 'recipe_id', 1, 64, $errors);
    $mealType = v_enum($body, 'meal_type', MEAL_TYPES, $errors);
    $portion = v_number($body, 'portion_g', 20, 1500, $errors, false);
    if ($errors) throw new HttpError(422, 'Please correct the highlighted fields', $errors);

    $recipe = null;
    foreach ($state['recipes'] as $r) {
        if ($r['id'] === $recipeId) $recipe = $r;
    }
    if (!$recipe) throw new HttpError(404, 'Recipe not found');

    $profile = $state['patients'][$pid]['profile'];
    foreach ((new DeterministicSafetyEngine())->evaluateCandidate($profile, $recipe)['violations'] as $v) {
        if (str_starts_with($v['code'], 'ALLERGEN')) {
            throw new HttpError(409, 'Blocked: ' . $v['message']);
        }
    }

    $portion = $portion ?? (float)$recipe['standard_portion_g'];
    $ratio = $portion / (float)$recipe['standard_portion_g'];
    $scale = fn($k) => round((float)$recipe[$k] * $ratio, 1);
    $log = [
        'id' => StateStore::newId('log'),
        'recipe_id' => $recipe['id'],
        'title' => $recipe['title'],
        'meal_type' => $mealType,
        'portion_g' => round($portion, 1),
        'energy_kcal' => $scale('energy_kcal'),
        'carbs_g' => $scale('carbs_g'),
        'fiber_g' => $scale('fiber_g'),
        'net_carbs_g' => max(0, round($scale('carbs_g') - $scale('fiber_g'), 1)),
        'protein_g' => $scale('protein_g'),
        'fat_g' => $scale('fat_g'),
        'sodium_mg' => $scale('sodium_mg'),
        'image_url' => $recipe['image_url'],
        'data_source' => $recipe['data_source'],
        'logged_at' => date('Y-m-d H:i:s'),
    ];
    $state['patients'][$pid]['meal_logs'][] = $log;
    $store->save();
    respond(['status' => 'success', 'data' => $log], 201);
});

$route('DELETE', '/api/v1/meal-logs/([a-zA-Z0-9_-]+)', function ($id) use (&$state, $requireUser, $resolvePatientId, $store) {
    $pid = $resolvePatientId($requireUser(['patient']));
    $logs = &$state['patients'][$pid]['meal_logs'];
    foreach ($logs as $i => $l) {
        if ($l['id'] === $id) {
            array_splice($logs, $i, 1);
            $store->save();
            respond(['status' => 'success']);
            return;
        }
    }
    throw new HttpError(404, 'Meal log not found');
});

// ---- Reminders
$route('GET', '/api/v1/reminders', function () use (&$state, $requireUser, $resolvePatientId) {
    $pid = $resolvePatientId($requireUser());
    $rec = $state['patients'][$pid];
    respond(['status' => 'success', 'data' => reminders_with_next($rec['reminders'], $rec['profile']['timezone'])]);
});

$route('PATCH', '/api/v1/reminders/([a-zA-Z0-9_-]+)', function ($id) use (&$state, $body, $requireUser, $resolvePatientId, $store) {
    $pid = $resolvePatientId($requireUser(['patient']));
    $errors = [];
    $time = v_time($body, 'time', $errors, false);
    if (array_key_exists('is_enabled', $body) && !is_bool($body['is_enabled'])) $errors['is_enabled'] = 'Must be true or false';
    if ($errors) throw new HttpError(422, 'Please correct the highlighted fields', $errors);
    foreach ($state['patients'][$pid]['reminders'] as &$r) {
        if ($r['id'] === $id) {
            if ($time !== null) { $r['time'] = $time; $r['snoozed_until'] = null; }
            if (array_key_exists('is_enabled', $body)) $r['is_enabled'] = $body['is_enabled'];
            $store->save();
            $tz = $state['patients'][$pid]['profile']['timezone'];
            respond(['status' => 'success', 'data' => reminders_with_next([$r], $tz)[0]]);
            return;
        }
    }
    throw new HttpError(404, 'Reminder not found');
});

$route('POST', '/api/v1/reminders/([a-zA-Z0-9_-]+)/snooze', function ($id) use (&$state, $body, $requireUser, $resolvePatientId, $store) {
    $pid = $resolvePatientId($requireUser(['patient']));
    $errors = [];
    $minutes = (int)(v_number($body + ['minutes' => 15], 'minutes', 5, 120, $errors) ?? 15);
    if ($errors) throw new HttpError(422, 'Invalid snooze duration', $errors);
    $tz = $state['patients'][$pid]['profile']['timezone'];
    foreach ($state['patients'][$pid]['reminders'] as &$r) {
        if ($r['id'] === $id) {
            if (!$r['is_enabled']) throw new HttpError(409, 'Enable this reminder before snoozing it');
            $svc = new ReminderSchedulerService();
            $base = $svc->calculateNextTargetTime($r['time'] . ':00', $tz);
            $r['snoozed_until'] = $svc->calculateSnoozeTime($base, $minutes)->format('Y-m-d H:i:s');
            $store->save();
            respond(['status' => 'success', 'data' => reminders_with_next([$r], $tz)[0]]);
            return;
        }
    }
    throw new HttpError(404, 'Reminder not found');
});

// ---- Notifications (derived from live data)
$route('GET', '/api/v1/notifications', function () use (&$state, $requireUser) {
    $user = $requireUser();
    $items = [];
    $dayAgo = date('Y-m-d H:i:s', strtotime('-24 hours'));
    if ($user['role'] === 'patient') {
        $rec = $state['patients'][$user['patient_id']];
        foreach ($rec['glucose_readings'] as $g) {
            if ($g['is_emergency_escalation'] && $g['recorded_at'] >= $dayAgo) {
                $items[] = ['type' => 'alert', 'title' => 'Glucose alert: ' . str_replace('_', ' ', $g['status']), 'body' => "{$g['reading_mg_dl']} mg/dL at {$g['recorded_at']}. Your care team was notified.", 'at' => $g['recorded_at']];
            }
        }
        $next = array_filter(reminders_with_next($rec['reminders'], $rec['profile']['timezone']), fn($r) => $r['next_trigger_at']);
        usort($next, fn($a, $b) => strcmp($a['next_trigger_at'], $b['next_trigger_at']));
        if ($next) {
            $n = $next[0];
            $items[] = ['type' => 'reminder', 'title' => ucfirst($n['meal_type']) . ' reminder', 'body' => 'Scheduled for ' . substr($n['next_trigger_at'], 11, 5) . '.', 'at' => $n['next_trigger_at']];
        }
        $ap = $rec['plan_approval'];
        $items[] = $ap['status'] === 'APPROVED'
            ? ['type' => 'info', 'title' => 'Plan approved', 'body' => "{$ap['by']} approved your meal plan.", 'at' => $ap['at']]
            : ['type' => 'info', 'title' => 'Plan awaiting review', 'body' => 'Your clinician has not yet approved your current plan.', 'at' => null];
    } else {
        foreach ($state['patients'] as $rec) {
            $s = patient_summary($rec);
            if ($s['escalations_7d'] > 0) {
                $items[] = ['type' => 'alert', 'title' => "{$s['name']}: {$s['escalations_7d']} glucose escalation(s)", 'body' => 'Within the last 7 days.', 'at' => $s['latest_glucose']['recorded_at'] ?? null];
            }
            if ($s['approval_status'] !== 'APPROVED') {
                $items[] = ['type' => 'info', 'title' => "{$s['name']}: plan pending review", 'body' => 'Awaiting clinician approval.', 'at' => null];
            }
        }
    }
    respond(['status' => 'success', 'data' => $items]);
});

// ---- Clinician
$route('GET', '/api/v1/clinician/patients', function () use (&$state, $requireUser) {
    $requireUser(['clinician', 'admin']);
    respond(['status' => 'success', 'data' => array_values(array_map('patient_summary', $state['patients']))]);
});

$route('GET', '/api/v1/clinician/patients/([a-zA-Z0-9_-]+)', function ($pid) use (&$state, $requireUser) {
    $requireUser(['clinician', 'admin']);
    if (!isset($state['patients'][$pid])) throw new HttpError(404, 'Patient not found');
    $rec = $state['patients'][$pid];
    respond(['status' => 'success', 'data' => [
        'summary' => patient_summary($rec),
        'profile' => $rec['profile'],
        'plan_approval' => $rec['plan_approval'],
        'glucose_readings' => array_slice(sort_desc_by($rec['glucose_readings'], 'recorded_at'), 0, 20),
        'meal_logs' => array_slice(sort_desc_by($rec['meal_logs'], 'logged_at'), 0, 20),
    ]]);
});

$route('PATCH', '/api/v1/clinician/patients/([a-zA-Z0-9_-]+)/targets', function ($pid) use (&$state, $body, $requireUser, $store) {
    $user = $requireUser(['clinician']);
    if (!isset($state['patients'][$pid])) throw new HttpError(404, 'Patient not found');
    $errors = [];
    $changes = [];
    if (($v = v_number($body, 'daily_energy_kcal_target', 1000, 4000, $errors, false)) !== null) $changes['daily_energy_kcal_target'] = $v;
    if (($v = v_number($body, 'approved_carb_max_per_meal', 10, 150, $errors, false)) !== null) $changes['approved_carb_max_per_meal'] = $v;
    if ($errors) throw new HttpError(422, 'Please correct the highlighted fields', $errors);
    if (!$changes) throw new HttpError(422, 'No target fields supplied');
    $state['patients'][$pid]['profile'] = array_merge($state['patients'][$pid]['profile'], $changes);
    $store->audit($user['email'], 'TARGETS_UPDATED', "$pid: " . json_encode($changes));
    $store->save();
    respond(['status' => 'success', 'data' => $state['patients'][$pid]['profile']]);
});

$route('POST', '/api/v1/clinician/patients/([a-zA-Z0-9_-]+)/approve', function ($pid) use (&$state, $body, $requireUser, $store) {
    $user = $requireUser(['clinician']);
    if (!isset($state['patients'][$pid])) throw new HttpError(404, 'Patient not found');
    $errors = [];
    $status = v_enum($body, 'status', ['APPROVED', 'CHANGES_REQUESTED'], $errors);
    $note = v_string($body, 'note', 0, 500, $errors, false) ?? '';
    if ($status === 'CHANGES_REQUESTED' && $note === '') $errors['note'] = 'Please explain the requested changes';
    if ($errors) throw new HttpError(422, 'Please correct the highlighted fields', $errors);
    $approval = ['status' => $status, 'by' => $user['name'], 'at' => date('Y-m-d H:i:s'), 'note' => $note];
    $state['patients'][$pid]['plan_approval'] = $approval;
    $state['patients'][$pid]['profile']['assigned_clinician']['approval_status'] = $status;
    $store->audit($user['email'], 'PLAN_' . $status, $pid . ($note ? ": $note" : ''));
    $store->save();
    respond(['status' => 'success', 'data' => $approval]);
});

// ---- Admin
$route('GET', '/api/v1/admin/overview', function () use (&$state, $requireUser) {
    $requireUser(['admin']);
    $roles = array_count_values(array_column($state['users'], 'role'));
    $readings = $logs = $esc = 0;
    foreach ($state['patients'] as $rec) {
        $readings += count($rec['glucose_readings']);
        $logs += count($rec['meal_logs']);
        $esc += count(array_filter($rec['glucose_readings'], fn($g) => $g['is_emergency_escalation']));
    }
    $ml = ml_get('/health');
    respond(['status' => 'success', 'data' => [
        'users_by_role' => $roles,
        'patients' => count($state['patients']),
        'recipes' => count($state['recipes']),
        'glucose_readings' => $readings,
        'glucose_escalations' => $esc,
        'meal_logs' => $logs,
        'services' => [
            'api' => 'healthy',
            'ml' => $ml ? ($ml['model_loaded'] ? 'healthy' : 'degraded') : 'offline',
        ],
    ]]);
});

$route('GET', '/api/v1/admin/ml', function () use ($requireUser) {
    $requireUser(['admin']);
    $info = ml_get('/api/v1/ml/model-info');
    $health = ml_get('/health');
    respond(['status' => 'success', 'data' => [
        'online' => $info !== null,
        'health' => $health,
        'model' => $info,
    ]]);
});

$route('GET', '/api/v1/admin/safety', function () use (&$state, $requireUser) {
    $requireUser(['admin', 'clinician']);
    $engine = new DeterministicSafetyEngine();
    $matrix = [];
    foreach ($state['patients'] as $pid => $rec) {
        $p = $rec['profile'];
        $row = ['patient_id' => $pid, 'name' => $p['first_name'] . ' ' . $p['last_name'], 'results' => []];
        foreach ($state['recipes'] as $r) {
            $e = $engine->evaluateCandidate($p, $r);
            $row['results'][] = ['recipe_id' => $r['id'], 'title' => $r['title'], 'is_safe' => $e['is_safe'], 'violations' => $e['violations']];
        }
        $matrix[] = $row;
    }
    respond(['status' => 'success', 'data' => [
        'rules' => [
            ['code' => 'ALLERGEN_TAG_COLLISION / ALLERGEN_INGREDIENT_DETECTED', 'description' => 'Zero-tolerance drop when a recipe tag or ingredient matches a declared allergen.'],
            ['code' => 'CARB_LIMIT_EXCEEDED', 'description' => 'Drop meals above 125% of the clinician-approved per-meal carbohydrate cap.'],
            ['code' => 'SODIUM_CONTRAINDICATION', 'description' => 'Sodium ceiling 650 mg (hypertension/renal) or 950 mg otherwise.'],
            ['code' => 'PREP_METHOD_HIGH_LIPID_RISK', 'description' => 'Deep-fried meals blocked for patients on insulin protocols.'],
        ],
        'matrix' => $matrix,
    ]]);
});

$route('GET', '/api/v1/admin/audit', function () use (&$state, $requireUser) {
    $requireUser(['admin']);
    respond(['status' => 'success', 'data' => array_slice($state['audit_log'], 0, 200)]);
});

// ---- dispatch
$matchedPath = false;
foreach ($routes as [$m, $regex, $handler]) {
    if (preg_match($regex, $path, $params)) {
        $matchedPath = true;
        if ($m === $method) {
            array_shift($params);
            $handler(...$params);
            $store->close();
            exit;
        }
    }
}
$store->close();
if ($matchedPath) {
    throw new HttpError(405, "Method $method not allowed on $path");
}
throw new HttpError(404, "Route not found: $path");
