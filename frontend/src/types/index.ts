export type UserRole = 'patient' | 'clinician' | 'admin';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  title: string | null;
  patient_id: string | null;
}

export interface Recipe {
  id: string;
  title: string;
  regional_category: string;
  preparation_method: string;
  standard_portion_g: number;
  energy_kcal: number;
  carbs_g: number;
  fiber_g: number;
  protein_g: number;
  fat_g: number;
  sodium_mg: number;
  allergens: string[];
  ingredients: string[];
  image_url: string;
  instructions: string;
  is_verified: boolean;
  data_source: string;
}

export interface RecommendationItem {
  recipe_id: string;
  title: string;
  regional_category: string;
  preparation_method: string;
  portion_g: number;
  energy_kcal: number;
  carbs_g: number;
  fiber_g: number;
  net_carbs_g: number;
  protein_g: number;
  fat_g: number;
  sodium_mg: number;
  suitability: 'eligible' | 'review_required' | 'not_recommended';
  confidence_score: number;
  composite_ranking_score: number;
  is_auto_recommended: boolean;
  clinical_rationale: string[];
  image_url: string | null;
}

export interface RecommendationReport {
  status: 'success' | 'empty';
  message?: string;
  total_evaluated?: number;
  safety_rejected?: number;
  rejected_count?: number;
  eligible_count?: number;
  recommendations: RecommendationItem[];
}

export type GlucoseContext = 'fasting' | 'pre_meal' | 'post_meal_2h' | 'bedtime';
export type GlucoseStatus = 'IN_TARGET' | 'HYPOGLYCEMIA' | 'CRITICAL_HYPOGLYCEMIA' | 'ELEVATED' | 'SEVERE_HYPERGLYCEMIA';

export interface GlucoseReading {
  id: string;
  reading_mg_dl: number;
  reading_mmol_l: number;
  context: GlucoseContext;
  status: GlucoseStatus;
  is_emergency_escalation: boolean;
  recorded_at: string;
  evaluation?: {
    alert_title: string;
    action_instructions: string;
    severity: string;
  };
}

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export interface MealLog {
  id: string;
  recipe_id: string;
  title: string;
  meal_type: MealType;
  portion_g: number;
  energy_kcal: number;
  carbs_g: number;
  fiber_g: number;
  net_carbs_g: number;
  protein_g: number;
  fat_g: number;
  sodium_mg: number;
  image_url: string | null;
  data_source: string;
  logged_at: string;
}

export interface Reminder {
  id: string;
  meal_type: MealType;
  time: string;
  is_enabled: boolean;
  snoozed_until: string | null;
  next_trigger_at: string | null;
}

export interface PlanApproval {
  status: 'APPROVED' | 'PENDING_REVIEW' | 'CHANGES_REQUESTED';
  by: string | null;
  at: string | null;
  note: string;
}

export interface PatientProfile {
  id: string;
  first_name: string;
  last_name: string;
  age: number;
  gender: 'male' | 'female' | 'other';
  timezone: string;
  diabetes_type: string;
  hba1c_latest: number;
  medication_risk_category: string;
  daily_energy_kcal_target: number;
  approved_carb_max_per_meal: number;
  allergens: string[];
  comorbidities: string[];
  has_renal_restriction: boolean;
  favorite_categories: string[];
  assigned_clinician: {
    name: string;
    clinic: string;
    approval_status: string;
  };
  plan_approval?: PlanApproval;
}

export interface NotificationItem {
  type: 'alert' | 'reminder' | 'info';
  title: string;
  body: string;
  at: string | null;
}

export interface PatientSummary {
  id: string;
  name: string;
  age: number;
  diabetes_type: string;
  hba1c_latest: number;
  medication_risk_category: string;
  latest_glucose: GlucoseReading | null;
  escalations_7d: number;
  meals_logged_7d: number;
  adherence_pct: number;
  approval_status: PlanApproval['status'];
  needs_review: boolean;
}

export interface ClinicianPatientDetail {
  summary: PatientSummary;
  profile: PatientProfile;
  plan_approval: PlanApproval;
  glucose_readings: GlucoseReading[];
  meal_logs: MealLog[];
}

export interface AdminOverview {
  users_by_role: Record<string, number>;
  patients: number;
  recipes: number;
  glucose_readings: number;
  glucose_escalations: number;
  meal_logs: number;
  services: { api: string; ml: 'healthy' | 'degraded' | 'offline' };
}

export interface MlMetrics {
  accuracy: number;
  macro_f1: number;
  train_samples: number;
  test_samples: number;
  validation: string;
  classes: string[];
  per_class: Record<string, { precision: number; recall: number; 'f1-score': number; support: number }>;
  confusion_matrix: number[][];
  trained_at: string;
}

export interface MlStatus {
  online: boolean;
  health: { status: string; model_loaded: boolean; model_version: string; supported_classes: string[] } | null;
  model: {
    model_name: string;
    version: string;
    is_active: boolean;
    input_features: string[];
    target_classes: string[];
    clinical_guideline: string;
    metrics: MlMetrics | null;
  } | null;
}

export interface SafetyReport {
  rules: { code: string; description: string }[];
  matrix: {
    patient_id: string;
    name: string;
    results: { recipe_id: string; title: string; is_safe: boolean; violations: { code: string; message: string; severity: string }[] }[];
  }[];
}

export interface AuditEntry {
  id: string;
  at: string;
  actor: string;
  action: string;
  detail: string;
}
