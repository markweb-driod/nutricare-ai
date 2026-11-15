"""
NutriCare AI - Machine Learning Microservice API
FastAPI Application serving Random Forest predictions, explainability, and metrics.
"""

from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from app.schemas import (
    PredictionRequest,
    PredictionResult,
    BatchPredictionResponse,
    HealthCheckResponse
)
from app.inference import MealSuitabilityPredictor

app = FastAPI(
    title="NutriCare AI - Meal Suitability ML Microservice",
    description="Supervised Random Forest Classifier for Type 2 Diabetic Dietary Recommendation",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize predictor singleton
predictor = MealSuitabilityPredictor()


@app.get("/health", response_model=HealthCheckResponse)
def health_check():
    return HealthCheckResponse(
        status="healthy" if predictor.is_loaded() else "degraded",
        model_loaded=predictor.is_loaded(),
        model_version=predictor.model_version,
        supported_classes=predictor.classes_
    )


@app.post("/api/v1/ml/predict", response_model=BatchPredictionResponse)
def predict_meal_suitability(request: PredictionRequest):
    try:
        results = predictor.predict_batch(request.patient, request.candidates)
        return BatchPredictionResponse(
            status="success",
            model_version=predictor.model_version,
            evaluated_count=len(results),
            recommendations=results
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Inference failure: {str(e)}"
        )


@app.get("/api/v1/ml/model-info")
def get_model_info():
    return {
        "model_name": "NutriCare Random Forest Diabetic Suitability Classifier",
        "version": predictor.model_version,
        "is_active": predictor.is_loaded(),
        "input_features": [
            "age", "approved_energy_goal", "approved_carb_max_per_meal",
            "portion_g", "energy_kcal", "carbs_g", "fiber_g", "net_carbs_g",
            "protein_g", "fat_g", "sodium_mg", "meal_type",
            "preparation_method", "medication_risk_category"
        ],
        "target_classes": predictor.classes_,
        "clinical_guideline": "ADA Standards of Care 2026 / FAO-INFOODS 2019"
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
