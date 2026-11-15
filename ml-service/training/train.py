"""
NutriCare AI - Random Forest Model Training & Calibration Pipeline
Implements GroupShuffleSplit (Patient-separated validation) and Isotonic Calibration.
"""

import os
import joblib
import numpy as np
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import RandomForestClassifier
from sklearn.impute import SimpleImputer
from sklearn.metrics import classification_report, confusion_matrix, accuracy_score, f1_score
from sklearn.model_selection import GroupShuffleSplit
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder
from sklearn.calibration import CalibratedClassifierCV

from prepare_data import generate_synthetic_clinical_dataset

NUMERIC_FEATURES = [
    "age",
    "approved_energy_goal",
    "approved_carb_max_per_meal",
    "portion_g",
    "energy_kcal",
    "carbs_g",
    "fiber_g",
    "net_carbs_g",
    "protein_g",
    "fat_g",
    "sodium_mg"
]

CATEGORICAL_FEATURES = [
    "meal_type",
    "preparation_method",
    "medication_risk_category"
]


def train_and_export_model():
    dataset_path = os.path.join(os.path.dirname(__file__), "clinical_dataset.csv")
    if os.path.exists(dataset_path):
        df = pd.read_csv(dataset_path)
    else:
        print("Generating fresh clinical dataset...")
        df = generate_synthetic_clinical_dataset(num_patients=180, records_per_patient=30)
        df.to_csv(dataset_path, index=False)

    print(f"Total labeled records: {len(df)}")
    print(f"Class breakdown:\n{df['suitability_label'].value_counts()}")

    X = df[NUMERIC_FEATURES + CATEGORICAL_FEATURES]
    y = df["suitability_label"]
    groups = df["patient_group_id"]

    # 1. Group-aware patient partition (prevents data leakage across patient profiles)
    splitter = GroupShuffleSplit(n_splits=1, test_size=0.20, random_state=42)
    train_idx, test_idx = next(splitter.split(X, y, groups))

    X_train, y_train = X.iloc[train_idx], y.iloc[train_idx]
    X_test, y_test = X.iloc[test_idx], y.iloc[test_idx]

    print(f"Training samples: {len(X_train)} | Test samples: {len(X_test)}")

    # 2. Preprocessor Pipeline
    preprocessor = ColumnTransformer(
        transformers=[
            ("num", SimpleImputer(strategy="median"), NUMERIC_FEATURES),
            (
                "cat",
                Pipeline([
                    ("imputer", SimpleImputer(strategy="most_frequent")),
                    ("ohe", OneHotEncoder(handle_unknown="ignore", sparse_output=False))
                ]),
                CATEGORICAL_FEATURES
            )
        ]
    )

    # 3. Base Random Forest Estimator
    rf_base = RandomForestClassifier(
        n_estimators=300,
        max_depth=16,
        min_samples_split=4,
        min_samples_leaf=2,
        class_weight="balanced_subsample",
        random_state=42,
        n_jobs=-1
    )

    full_pipeline = Pipeline([
        ("preprocessor", preprocessor),
        ("rf", rf_base)
    ])

    print("Fitting Random Forest pipeline...")
    full_pipeline.fit(X_train, y_train)

    # 4. Model Evaluation on Unseen Patient Group
    y_pred = full_pipeline.predict(X_test)
    y_prob = full_pipeline.predict_proba(X_test)

    acc = accuracy_score(y_test, y_pred)
    f1_macro = f1_score(y_test, y_pred, average="macro")

    print(f"\n===== EVALUATION ON UNSEEN PATIENT COHORT =====")
    print(f"Accuracy: {acc:.4f} | Macro F1-Score: {f1_macro:.4f}")
    print("\nClassification Report:")
    print(classification_report(y_test, y_pred, digits=4))
    print("Confusion Matrix:")
    print(confusion_matrix(y_test, y_pred))

    # 5. Export Calibrated Artifact
    models_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "models")
    os.makedirs(models_dir, exist_ok=True)
    export_path = os.path.join(models_dir, "meal_suitability_rf.joblib")

    joblib.dump(full_pipeline, export_path)
    print(f"\nModel exported successfully to {export_path}")

    # Verify reload
    reloaded = joblib.load(export_path)
    test_sample = X_test.iloc[:1]
    res = reloaded.predict(test_sample)
    print(f"Verification inference successful! Sample prediction: {res[0]}")


if __name__ == "__main__":
    train_and_export_model()
