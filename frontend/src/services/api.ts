import { PatientProfile, Recipe, RecommendationItem, GlucoseReading } from '../types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8080/api/v1';

export const apiService = {
  async getProfile(): Promise<PatientProfile> {
    try {
      const res = await fetch(`${API_BASE}/patient/profile`);
      if (res.ok) {
        const json = await res.json();
        return json.data;
      }
    } catch (e) {
      console.warn('API backend not reachable, using mock profile', e);
    }

    return {
      id: 'pat-001',
      first_name: 'Alex',
      last_name: 'Adeyemi',
      age: 52,
      diabetes_type: 'Type 2 Diabetes',
      hba1c_latest: 6.9,
      medication_risk_category: 'low_metformin',
      daily_energy_kcal_target: 1800,
      approved_carb_max_per_meal: 45,
      allergens: ['tree_nuts'],
      comorbidities: ['hypertension'],
      favorite_categories: ['West African'],
      assigned_clinician: {
        name: 'Dr. Kemi Balogun, RD, CDE',
        clinic: 'Metabolic & Endocrine Center',
        approval_status: 'APPROVED',
      },
    };
  },

  async getRecommendations(): Promise<RecommendationItem[]> {
    try {
      const res = await fetch(`${API_BASE}/recommendations/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (res.ok) {
        const json = await res.json();
        return json.recommendations || [];
      }
    } catch (e) {
      console.warn('API backend not reachable, using fallback recommendations', e);
    }

    return [
      {
        recipe_id: 'rec-001',
        title: 'Steamed Moi Moi with Fresh Spinach & Fish',
        regional_category: 'West African',
        preparation_method: 'steamed',
        portion_g: 250,
        energy_kcal: 265,
        carbs_g: 24.5,
        fiber_g: 8.2,
        net_carbs_g: 16.3,
        protein_g: 22.0,
        fat_g: 7.8,
        sodium_mg: 340,
        suitability: 'eligible',
        confidence_score: 0.96,
        composite_ranking_score: 0.94,
        is_auto_recommended: true,
        clinical_rationale: [
          'High dietary fiber (8.2g) promotes slow, steady glycemic response.',
          'Carbohydrates (24.5g) well within your 45g meal limit (20.5g buffer).',
          'Steamed preparation method minimizes unhealthy lipid peroxidation.',
        ],
        image_url: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80',
      },
      {
        recipe_id: 'rec-002',
        title: 'Brown Beans Porridge with Steamed Pumpkin Greens',
        regional_category: 'West African',
        preparation_method: 'boiled',
        portion_g: 280,
        energy_kcal: 290,
        carbs_g: 37.0,
        fiber_g: 9.8,
        net_carbs_g: 27.2,
        protein_g: 17.5,
        fat_g: 5.5,
        sodium_mg: 380,
        suitability: 'eligible',
        confidence_score: 0.91,
        composite_ranking_score: 0.89,
        is_auto_recommended: true,
        clinical_rationale: [
          'Exceptional soluble fiber content (9.8g) blunts postprandial glucose spike.',
          'Ugwu pumpkin greens supply potassium and antioxidants.',
          'Cardiovascular-friendly low sodium (380mg).',
        ],
        image_url: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=600&q=80',
      },
      {
        recipe_id: 'rec-004',
        title: 'Edikang Ikong (Waterleaf & Fluted Pumpkin) with Tender Beef',
        regional_category: 'West African',
        preparation_method: 'boiled',
        portion_g: 260,
        energy_kcal: 280,
        carbs_g: 12.0,
        fiber_g: 6.5,
        net_carbs_g: 5.5,
        protein_g: 31.0,
        fat_g: 11.0,
        sodium_mg: 420,
        suitability: 'eligible',
        confidence_score: 0.95,
        composite_ranking_score: 0.92,
        is_auto_recommended: true,
        clinical_rationale: [
          'Very low net carbs (5.5g); virtually zero glycemic surge risk.',
          'High quality lean protein (31g) supports satiety and muscle retention.',
        ],
        image_url: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=600&q=80',
      },
    ];
  },

  async logGlucose(readingMgDl: number, context: string): Promise<GlucoseReading> {
    try {
      const res = await fetch(`${API_BASE}/glucose-readings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reading_mg_dl: readingMgDl, context }),
      });
      if (res.ok) {
        const json = await res.json();
        return json.data;
      }
    } catch (e) {
      console.warn('API error, using local evaluation', e);
    }

    const isHypo = readingMgDl < 70;
    const isCriticalHypo = readingMgDl < 54;
    const isHyper = readingMgDl > 300;

    return {
      id: `gluc-${Date.now()}`,
      reading_mg_dl: readingMgDl,
      reading_mmol_l: parseFloat((readingMgDl / 18.0182).toFixed(2)),
      context: context as any,
      status: isCriticalHypo ? 'CRITICAL_HYPOGLYCEMIA' : isHypo ? 'HYPOGLYCEMIA' : isHyper ? 'SEVERE_HYPERGLYCEMIA' : 'IN_TARGET',
      is_emergency_escalation: isHypo || isHyper,
      recorded_at: new Date().toISOString().replace('T', ' ').substring(0, 19),
      evaluation: (isHypo || isHyper) ? {
        alert_title: isCriticalHypo ? 'Emergency: Severe Low Blood Sugar (<54 mg/dL)' : isHypo ? 'Low Blood Sugar Alert (Rule of 15)' : 'High Blood Sugar Warning (>300 mg/dL)',
        action_instructions: isHypo
          ? 'Rule of 15: Take 15g fast-acting carbohydrates (1/2 cup fruit juice or 3-4 glucose tablets). Rest and retest in 15 minutes.'
          : 'Drink plenty of water and contact your diabetic care team.',
        severity: isCriticalHypo ? 'CRITICAL' : 'URGENT',
      } : undefined,
    };
  },
};
