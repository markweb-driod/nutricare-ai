"""
NutriCare AI - Training Dataset Preparation
Generates clinically grounded, patient-grouped training datasets
incorporating West African (FAO/INFOODS) & USDA nutritional profiles.
"""

import os
import numpy as np
import pandas as pd
from typing import Tuple

np.random.seed(42)

RECIPES_CATALOG = [
    # Nigerian / West African items (FAO/INFOODS 2019 calibrated)
    {"name": "Moi Moi (Steamed Bean Pudding with Spinach)", "method": "steamed", "base_carbs": 26, "base_fiber": 8.0, "base_prot": 21, "base_fat": 8, "base_na": 350, "base_kcal": 260},
    {"name": "Brown Beans Porridge with Vegetables", "method": "boiled", "base_carbs": 38, "base_fiber": 9.5, "base_prot": 18, "base_fat": 6, "base_na": 420, "base_kcal": 280},
    {"name": "Okra Soup with Grilled Fish & Small Eba (Cassava)", "method": "boiled", "base_carbs": 32, "base_fiber": 6.8, "base_prot": 26, "base_fat": 10, "base_na": 480, "base_kcal": 320},
    {"name": "Vegetable Soup (Edikang Ikong) with Chicken", "method": "boiled", "base_carbs": 14, "base_fiber": 6.2, "base_prot": 30, "base_fat": 12, "base_na": 450, "base_kcal": 290},
    {"name": "Amala (Yam flour) with Ewedu & Stew", "method": "boiled", "base_carbs": 44, "base_fiber": 5.5, "base_prot": 16, "base_fat": 11, "base_na": 520, "base_kcal": 340},
    {"name": "Fried Plantain (Dodo) with Fried Eggs", "method": "fried", "base_carbs": 62, "base_fiber": 2.8, "base_prot": 12, "base_fat": 24, "base_na": 750, "base_kcal": 510},
    {"name": "Large White Rice with High-Oil Beef Stew", "method": "boiled", "base_carbs": 78, "base_fiber": 1.4, "base_prot": 14, "base_fat": 22, "base_na": 890, "base_kcal": 580},
    {"name": "Akara (Deep-fried Bean Cakes)", "method": "fried", "base_carbs": 34, "base_fiber": 4.5, "base_prot": 14, "base_fat": 19, "base_na": 620, "base_kcal": 360},
    {"name": "Tuwo Shinkafa with Gbegiri & Stew", "method": "boiled", "base_carbs": 48, "base_fiber": 4.8, "base_prot": 17, "base_fat": 12, "base_na": 510, "base_kcal": 370},
    {"name": "Roasted Plantain (Boli) with Grilled Fish", "method": "grilled", "base_carbs": 42, "base_fiber": 4.2, "base_prot": 24, "base_fat": 8, "base_na": 390, "base_kcal": 330},
    
    # Global / USDA items
    {"name": "Steel Cut Rolled Oats with Chia & Walnuts", "method": "boiled", "base_carbs": 29, "base_fiber": 7.5, "base_prot": 11, "base_fat": 8, "base_na": 120, "base_kcal": 230},
    {"name": "Grilled Lemon Herb Chicken with Broccoli", "method": "grilled", "base_carbs": 9, "base_fiber": 4.5, "base_prot": 38, "base_fat": 7, "base_na": 310, "base_kcal": 250},
    {"name": "Lentil Vegetable Stew with Olive Oil", "method": "boiled", "base_carbs": 33, "base_fiber": 9.0, "base_prot": 16, "base_fat": 6, "base_na": 380, "base_kcal": 250},
    {"name": "Sweetened Breakfast Cereal with Whole Milk", "method": "boiled", "base_carbs": 58, "base_fiber": 1.2, "base_prot": 8, "base_fat": 9, "base_na": 420, "base_kcal": 350},
    {"name": "Double Cheeseburger with Large Fries", "method": "fried", "base_carbs": 88, "base_fiber": 3.0, "base_prot": 28, "base_fat": 42, "base_na": 1450, "base_kcal": 840}
]

MEAL_TYPES = ["breakfast", "lunch", "dinner", "snack"]
MEDICATION_RISKS = ["low_metformin", "moderate_sulfonylurea", "high_insulin"]


def generate_synthetic_clinical_dataset(num_patients: int = 150, records_per_patient: int = 25) -> pd.DataFrame:
    """
    Creates a grouped clinical dataset where each record represents a candidate meal
    evaluated for a specific patient under the clinical dietitian rubric.
    """
    rows = []
    
    for p_id in range(num_patients):
        patient_group_id = f"PAT-{p_id:04d}"
        age = int(np.random.randint(28, 82))
        med_risk = np.random.choice(MEDICATION_RISKS, p=[0.55, 0.30, 0.15])
        energy_goal = float(np.random.choice([1600.0, 1800.0, 2000.0, 2200.0]))
        
        # Clinician-prescribed carb maximum per meal (ADA standard range: 30g to 60g)
        if med_risk == "high_insulin":
            carb_max = float(np.random.choice([35.0, 40.0, 45.0]))
        elif age > 65:
            carb_max = float(np.random.choice([35.0, 40.0, 45.0, 50.0]))
        else:
            carb_max = float(np.random.choice([40.0, 45.0, 50.0, 60.0]))

        for _ in range(records_per_patient):
            recipe = np.random.choice(RECIPES_CATALOG)
            meal_type = np.random.choice(MEAL_TYPES, p=[0.25, 0.35, 0.30, 0.10])
            
            # Portion variation
            portion_factor = np.random.uniform(0.75, 1.45)
            portion_g = round(250.0 * portion_factor, 1)
            
            carbs_g = round(recipe["base_carbs"] * portion_factor + np.random.normal(0, 2), 1)
            fiber_g = max(0.5, round(recipe["base_fiber"] * portion_factor + np.random.normal(0, 0.5), 1))
            net_carbs_g = max(0.0, carbs_g - fiber_g)
            protein_g = max(2.0, round(recipe["base_prot"] * portion_factor + np.random.normal(0, 1.5), 1))
            fat_g = max(1.0, round(recipe["base_fat"] * portion_factor + np.random.normal(0, 1.5), 1))
            sodium_mg = max(50.0, round(recipe["base_na"] * portion_factor + np.random.normal(0, 30), 1))
            energy_kcal = round(recipe["base_kcal"] * portion_factor + np.random.normal(0, 20), 1)
            
            prep_method = recipe["method"]
            
            # Clinical Labeling Rubric (Dietitian Ground Truth)
            # 1. NOT RECOMMENDED:
            # - Carbs exceed prescribed max by > 20%
            # - OR Fried with net_carbs > 40g
            # - OR Sodium > 900mg in a single meal
            # - OR Fiber < 2.0g and Carbs > 50g
            if (carbs_g > carb_max * 1.25) or (prep_method == "fried" and net_carbs_g > 35) or (sodium_mg > 950) or (fiber_g < 2.0 and carbs_g > 45):
                label = "not_recommended"
            # 2. REVIEW REQUIRED:
            # - Carbs within 95% to 125% of prescribed max
            # - OR Sodium 650mg - 950mg
            # - OR High Insulin risk with meal carbs > 38g
            elif (carbs_g > carb_max * 0.95 and carbs_g <= carb_max * 1.25) or (sodium_mg >= 650 and sodium_mg <= 950) or (med_risk == "high_insulin" and carbs_g > 38):
                label = "review_required"
            # 3. ELIGIBLE:
            # - Conforms strictly to macro targets, good fiber ratio
            else:
                label = "eligible"

            rows.append({
                "patient_group_id": patient_group_id,
                "age": age,
                "medication_risk_category": med_risk,
                "approved_energy_goal": energy_goal,
                "approved_carb_max_per_meal": carb_max,
                "meal_type": meal_type,
                "portion_g": portion_g,
                "energy_kcal": energy_kcal,
                "carbs_g": carbs_g,
                "fiber_g": fiber_g,
                "net_carbs_g": net_carbs_g,
                "protein_g": protein_g,
                "fat_g": fat_g,
                "sodium_mg": sodium_mg,
                "preparation_method": prep_method,
                "suitability_label": label
            })
            
    df = pd.DataFrame(rows)
    return df


if __name__ == "__main__":
    df = generate_synthetic_clinical_dataset(num_patients=160, records_per_patient=30)
    print(f"Generated dataset shape: {df.shape}")
    print("Class distribution:")
    print(df["suitability_label"].value_counts(normalize=True))
    out_csv = os.path.join(os.path.dirname(os.path.abspath(__file__)), "clinical_dataset.csv")
    df.to_csv(out_csv, index=False)
    print(f"Saved to {out_csv}")
