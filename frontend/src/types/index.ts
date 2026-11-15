export type UserRole = 'patient' | 'clinician' | 'admin';

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
  image_url: string;
}

export interface GlucoseReading {
  id: string;
  reading_mg_dl: number;
  reading_mmol_l: number;
  context: 'fasting' | 'pre_meal' | 'post_meal_2h' | 'bedtime';
  status: 'IN_TARGET' | 'HYPOGLYCEMIA' | 'CRITICAL_HYPOGLYCEMIA' | 'ELEVATED' | 'SEVERE_HYPERGLYCEMIA';
  is_emergency_escalation: boolean;
  recorded_at: string;
  evaluation?: {
    alert_title: string;
    action_instructions: string;
    severity: string;
  };
}

export interface PatientProfile {
  id: string;
  first_name: string;
  last_name: string;
  age: number;
  diabetes_type: string;
  hba1c_latest: number;
  medication_risk_category: string;
  daily_energy_kcal_target: number;
  approved_carb_max_per_meal: number;
  allergens: string[];
  comorbidities: string[];
  favorite_categories: string[];
  assigned_clinician: {
    name: string;
    clinic: string;
    approval_status: string;
  };
}
