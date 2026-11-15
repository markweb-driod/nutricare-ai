"""
Unit & Integration Tests for ML Service
"""

# Optional pytest import
try:
    import pytest
except ImportError:
    pytest = None
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.schemas import PatientContext, CandidateMealFeatures
from app.inference import MealSuitabilityPredictor

def test_heuristic_fallback_or_loaded():
    predictor = MealSuitabilityPredictor()
    assert predictor.model_version is not None
    assert "eligible" in predictor.classes_
    assert "not_recommended" in predictor.classes_

def test_prediction_batch_safety_rejection():
    predictor = MealSuitabilityPredictor()
    
    patient = PatientContext(
        patient_id="test-p1",
        age=58,
        medication_risk_category="low_metformin",
        approved_energy_goal=1800.0,
        approved_carb_max_per_meal=40.0
    )
    
    # Very high carb meal with excess sodium (should not be auto-recommended)
    bad_meal = CandidateMealFeatures(
        recipe_id="bad-1",
        recipe_title="Double Fried Dough with Heavy Syrup",
        meal_type="lunch",
        portion_g=350.0,
        energy_kcal=750.0,
        carbs_g=95.0,
        fiber_g=1.0,
        protein_g=8.0,
        fat_g=38.0,
        sodium_mg=1100.0,
        preparation_method="fried"
    )
    
    # Healthy diabetic-friendly meal (Moi Moi with vegetables)
    good_meal = CandidateMealFeatures(
        recipe_id="good-1",
        recipe_title="Steamed Moi Moi with Spinach",
        meal_type="lunch",
        portion_g=250.0,
        energy_kcal=265.0,
        carbs_g=24.0,
        fiber_g=8.2,
        protein_g=22.0,
        fat_g=7.5,
        sodium_mg=320.0,
        preparation_method="steamed"
    )
    
    results = predictor.predict_batch(patient, [bad_meal, good_meal])
    
    assert len(results) == 2
    bad_res = next(r for r in results if r.recipe_id == "bad-1")
    good_res = next(r for r in results if r.recipe_id == "good-1")
    
    # Bad meal must not be auto-recommended
    assert bad_res.is_safe_for_auto_recommend is False
    assert bad_res.suitability in ["not_recommended", "review_required"]
    
    # Good meal should have valid explanations
    assert len(good_res.primary_factors) > 0
    assert any("fiber" in f.lower() or "carbohydrate" in f.lower() for f in good_res.primary_factors)

if __name__ == "__main__":
    test_heuristic_fallback_or_loaded()
    test_prediction_batch_safety_rejection()
    print("All ML tests passed!")
