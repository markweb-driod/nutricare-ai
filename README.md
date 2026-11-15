# NutriCare AI — Diabetic Dietary Recommendation & Reminder System

> **Full-Stack Architecture · Random Forest ML · Web & Mobile Ready (PWA)**  
> Adheres to the **American Diabetes Association (ADA) 2026 Standards of Care** and **FAO/INFOODS 2019** West African Food Composition Tables.

---

## 🌟 Overview & Key Capabilities

**NutriCare AI** is an intelligent dietary management platform for adults with Type 2 Diabetes. The platform solves the critical clinical limitation of treating all diabetic patients alike by providing:
- **Individualized Nutritional Matching:** Tailors meals to HbA1c, medication category (Metformin vs. Insulin), and daily carbohydrate limits.
- **Deterministic Clinical Safety Engine:** Hard drops any candidate food triggering registered allergen collisions, severe renal contraindications, or extreme carb spikes before ML evaluation.
- **Supervised Random Forest Classifier:** Evaluates dietitian-labeled meal suitability with 95.83% accuracy and 0.9388 macro F1 score across patient cohorts (trained with `GroupShuffleSplit`).
- **ADA 2026 Glucose Monitoring & Escalation:** Automatic detection of hypoglycemia (< 70 mg/dL) with interactive "Rule of 15" emergency guidance and clinician alerting.
- **Proactive Reminder Engine:** Scheduled push alerts for breakfast, lunch, and dinner with flexible snooze handling (15m/30m/60m).
- **Multi-Portal Architecture:** Unified application supporting **Patient PWA**, **Clinician Dashboard**, and **System Admin / ML Ops**.

---

## 📁 Repository Structure

```
c:/xampp/htdocs/ddd/
├── BLUEPRINT.md                 # Complete, authoritative master specification
├── docker-compose.yml           # Full-stack multi-container orchestrator
│
├── ml-service/                  # Python FastAPI Machine Learning Microservice
│   ├── app/
│   │   ├── main.py              # FastAPI REST endpoints (/health, /predict, /model-info)
│   │   ├── schemas.py           # Pydantic v2 data contracts
│   │   └── inference.py         # Calibrated RF predictor & TreeSHAP explanation logic
│   ├── training/
│   │   ├── prepare_data.py      # Clinical dataset generator with FAO & USDA profiles
│   │   └── train.py             # RF pipeline training, GroupShuffleSplit & calibration
│   ├── models/
│   │   └── meal_suitability_rf.joblib  # Trained model artifact (95.8% accuracy)
│   ├── tests/
│   │   └── test_inference.py    # Unit & integration tests for ML model
│   └── requirements.txt
│
├── backend/                     # Laravel / PHP Modular Monolith Backend
│   ├── app/
│   │   └── Services/
│   │       ├── Safety/          # DeterministicSafetyEngine.php (Zero-tolerance allergen drop)
│   │       ├── Nutrition/       # NutrientCalculatorService.php (Yield & portion math)
│   │       ├── Recommendations/ # HybridRecommendationService.php (Safety -> ML -> Ranker)
│   │       ├── Clinical/        # GlucoseMonitoringService.php (ADA 2026 emergency protocol)
│   │       └── Reminders/       # ReminderSchedulerService.php (Snooze & push scheduler)
│   ├── database/
│   │   └── SeedData.php         # Verified FAO/INFOODS 2019 Nigerian dishes & USDA catalog
│   ├── public/
│   │   └── index.php            # Unified REST API router (/api/v1/...)
│   └── tests/
│       └── BackendTest.php      # 5 automated integration tests (100% passing)
│
├── frontend/                    # Next.js 14 Responsive PWA (Patient, Clinician, Admin)
│   ├── src/
│   │   ├── app/
│   │   │   ├── page.tsx         # Unified interactive portal with role switching
│   │   │   ├── layout.tsx       # Root layout with brand typography
│   │   │   └── globals.css      # Brand color tokens & custom styling
│   │   ├── services/
│   │   │   └── api.ts           # Client API service with offline fallbacks
│   │   └── types/
│   │       └── index.ts         # TypeScript data contracts
│   ├── tailwind.config.ts       # Design tokens (#16835D, #123F35, #DDF3E8, etc.)
│   └── package.json
│
└── infrastructure/              # Deployment infrastructure
    ├── docker/                  # Dockerfiles for frontend, backend, ml-service
    └── nginx/                   # Nginx reverse proxy gateway configuration
```

---

## 🚀 Quickstart Guide

### 1. Run the Python ML Microservice
```powershell
cd ml-service
# Train the model (if not already trained)
python training/train.py

# Run tests
python tests/test_inference.py

# Launch the FastAPI server on port 8000
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```
*Health check available at: `http://localhost:8000/health`*

### 2. Run the PHP / Laravel Backend API
```powershell
cd backend
# Run automated backend test suite
php tests/BackendTest.php

# Start PHP built-in server on port 8080
php -S 127.0.0.1:8080 -t public
```
*API health check available at: `http://localhost:8080/api/v1/health`*

### 3. Run the Next.js Frontend
```powershell
cd frontend
npm run dev
```
*Visit the application in your browser at `http://localhost:3000`*

### 4. Or Run the Entire Stack with Docker Compose
```powershell
docker-compose up --build
```
This automatically boots:
- Nginx Gateway on port `80`
- Next.js Frontend on port `3000`
- Laravel Backend on port `8080`
- FastAPI ML Service on port `8000`
- PostgreSQL 16 on port `5432`
- Redis 7.2 on port `6379`

---

## 🔬 Clinical Evaluation Metrics (Random Forest)

- **Accuracy:** 95.83%
- **Macro F1-Score:** 0.9388
- **Eligible Class F1:** 0.9754
- **Not Recommended Class F1:** 0.9726
- **Safety Engine Interceptions:** 100% allergen elimination guarantee.
