"""
NutriCare AI - Machine Learning Inference Engine
Calibrated Random Forest Predictor & Feature Explainer
"""

import os
import joblib
import numpy as np
import pandas as pd
from typing import List, Dict, Tuple
from app.schemas import PatientContext, CandidateMealFeatures, PredictionResult

DEFAULT_MODEL_PATH = os.path.join(
    os.path.dirname(os.path.dirname(__file__)),
    "models",
    "meal_suitability_rf.joblib"
)

class MealSuitabilityPredictor:
    def __init__(self, model_path: str = DEFAULT_MODEL_PATH):
        self.model_path = model_path
        self.pipeline = None
        self.model_version = "rf-v1.0.0-fao-ada2026"
        self.classes_ = ["eligible", "not_recommended", "review_required"]
        self.load_model()

    def load_model(self):
        if os.path.exists(self.model_path):
            try:
                self.pipeline = joblib.load(self.model_path)
                if hasattr(self.pipeline, "classes_"):
                    self.classes_ = list(self.pipeline.classes_)
                print(f"[ML Service] Successfully loaded model from {self.model_path}")
            except Exception as e:
                print(f"[ML Service] Warning: Failed to load model ({e}). Using heuristic fallback.")
                self.pipeline = None
        else:
            print(f"[ML Service] Model file not found at {self.model_path}. Running with heuristic engine.")
            self.pipeline = None

    def is_loaded(self) -> bool:
        return self.pipeline is not None

    def explain_candidate(self, patient: PatientContext, cand: CandidateMealFeatures, pred_label: str) -> List[str]:
        """
        Derives concrete, clinical plain-language rationale for patient & clinician understanding.
        """
        explanations = []
        net_carbs = max(0.0, cand.carbs_g - cand.fiber_g)

        # Fiber & Glycemic modulation
        if cand.fiber_g >= 6.0:
            explanations.append(f"High dietary fiber ({cand.fiber_g:.1f}g) promotes slow, steady glycemic response.")
        elif cand.fiber_g < 2.0:
            explanations.append(f"Low fiber ({cand.fiber_g:.1f}g) may accelerate glucose spike.")

        # Carbohydrate load vs patient threshold
        carb_limit = patient.approved_carb_max_per_meal
        if cand.carbs_g <= carb_limit:
            diff = carb_limit - cand.carbs_g
            explanations.append(f"Carbs ({cand.carbs_g:.1f}g) within your prescribed meal limit of {carb_limit:.0f}g ({diff:.1f}g buffer).")
        else:
            excess = cand.carbs_g - carb_limit
            explanations.append(f"Carbohydrates ({cand.carbs_g:.1f}g) exceed prescribed {carb_limit:.0f}g limit by {excess:.1f}g.")

        # Sodium considerations
        if cand.sodium_mg > 800:
            explanations.append(f"Elevated sodium ({cand.sodium_mg:.0f}mg); requires moderation.")
        elif cand.sodium_mg <= 450:
            explanations.append(f"Heart-healthy low sodium profile ({cand.sodium_mg:.0f}mg).")

        # Cooking method
        if cand.preparation_method in ["steamed", "boiled", "grilled"]:
            explanations.append(f"Low-oil preparation method ({cand.preparation_method}).")
        elif cand.preparation_method == "fried":
            explanations.append("Fried preparation increases lipid content and caloric density.")

        # Medication interaction
        if patient.medication_risk_category == "high_insulin" and net_carbs > 35:
            explanations.append("Requires careful insulin bolus timing due to net carbohydrate density.")

        return explanations[:3]

    def predict_batch(self, patient: PatientContext, candidates: List[CandidateMealFeatures]) -> List[PredictionResult]:
        records = []
        for cand in candidates:
            net_carbs = max(0.0, cand.carbs_g - cand.fiber_g)
            records.append({
                "age": patient.age,
                "approved_energy_goal": patient.approved_energy_goal,
                "approved_carb_max_per_meal": patient.approved_carb_max_per_meal,
                "portion_g": cand.portion_g,
                "energy_kcal": cand.energy_kcal,
                "carbs_g": cand.carbs_g,
                "fiber_g": cand.fiber_g,
                "net_carbs_g": net_carbs,
                "protein_g": cand.protein_g,
                "fat_g": cand.fat_g,
                "sodium_mg": cand.sodium_mg,
                "meal_type": cand.meal_type,
                "preparation_method": cand.preparation_method,
                "medication_risk_category": patient.medication_risk_category
            })

        df_input = pd.DataFrame(records)

        # Inference branch
        if self.pipeline is not None:
            raw_probs = self.pipeline.predict_proba(df_input)
            classes = list(self.pipeline.classes_)
        else:
            # Deterministic heuristic fallback if model weights not yet trained
            classes = ["eligible", "not_recommended", "review_required"]
            raw_probs = []
            for _, row in df_input.iterrows():
                if row["carbs_g"] > row["approved_carb_max_per_meal"] * 1.2 or row["sodium_mg"] > 950:
                    raw_probs.append([0.05, 0.85, 0.10])
                elif row["carbs_g"] > row["approved_carb_max_per_meal"] * 0.95 or row["sodium_mg"] > 650:
                    raw_probs.append([0.20, 0.15, 0.65])
                else:
                    raw_probs.append([0.85, 0.05, 0.10])
            raw_probs = np.array(raw_probs)

        results = []
        for idx, cand in enumerate(candidates):
            prob_dict = {
                classes[c]: round(float(raw_probs[idx][c]), 4)
                for c in range(len(classes))
            }
            pred_class = classes[int(np.argmax(raw_probs[idx]))]
            confidence = round(float(np.max(raw_probs[idx])), 4)

            # Auto-recommend safety criteria:
            # 1. Prediction must be 'eligible'
            # 2. Probability of 'not_recommended' must be <= 0.15
            # 3. Model confidence >= 0.60
            not_rec_p = prob_dict.get("not_recommended", 0.0)
            is_auto_safe = (pred_class == "eligible") and (not_rec_p <= 0.15) and (confidence >= 0.60)

            factors = self.explain_candidate(patient, cand, pred_class)

            results.append(PredictionResult(
                recipe_id=cand.recipe_id,
                recipe_title=cand.recipe_title,
                suitability=pred_class,
                probabilities=prob_dict,
                primary_factors=factors,
                confidence_score=confidence,
                is_safe_for_auto_recommend=is_auto_safe
            ))

        return results
