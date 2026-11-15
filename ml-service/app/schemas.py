"""
NutriCare AI - Pydantic Data Contracts for ML Service
"""

from typing import List, Dict, Optional
from pydantic import BaseModel, Field


class CandidateMealFeatures(BaseModel):
    recipe_id: str
    recipe_title: Optional[str] = "Candidate Recipe"
    meal_type: str = Field(..., description="breakfast, lunch, dinner, snack", example="lunch")
    portion_g: float = Field(..., gt=0, description="Serving weight in grams", example=250.0)
    energy_kcal: float = Field(..., ge=0, description="Calories in serving", example=295.0)
    carbs_g: float = Field(..., ge=0, description="Total carbohydrates in grams", example=28.0)
    fiber_g: float = Field(..., ge=0, description="Dietary fiber in grams", example=7.5)
    protein_g: float = Field(..., ge=0, description="Protein in grams", example=21.0)
    fat_g: float = Field(..., ge=0, description="Total fat in grams", example=9.0)
    sodium_mg: float = Field(..., ge=0, description="Sodium in milligrams", example=380.0)
    preparation_method: str = Field(..., description="steamed, boiled, grilled, baked, fried", example="steamed")


class PatientContext(BaseModel):
    patient_id: str
    age: int = Field(..., ge=18, le=120, example=52)
    gender: Optional[str] = Field("other", example="female")
    diabetes_type: Optional[str] = Field("type_2", example="type_2")
    medication_risk_category: str = Field(
        ...,
        description="low_metformin, moderate_sulfonylurea, high_insulin",
        example="low_metformin"
    )
    approved_energy_goal: float = Field(..., ge=1000, le=4000, example=1800.0)
    approved_carb_max_per_meal: float = Field(..., ge=10, le=150, example=45.0)


class PredictionRequest(BaseModel):
    patient: PatientContext
    candidates: List[CandidateMealFeatures]


class PredictionResult(BaseModel):
    recipe_id: str
    recipe_title: Optional[str] = None
    suitability: str = Field(..., description="eligible, review_required, not_recommended")
    probabilities: Dict[str, float]
    primary_factors: List[str]
    confidence_score: float
    is_safe_for_auto_recommend: bool


class BatchPredictionResponse(BaseModel):
    status: str = "success"
    model_version: str
    evaluated_count: int
    recommendations: List[PredictionResult]


class HealthCheckResponse(BaseModel):
    status: str
    model_loaded: bool
    model_version: str
    supported_classes: List[str]
