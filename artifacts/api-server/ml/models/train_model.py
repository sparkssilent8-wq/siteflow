import os
import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import GradientBoostingClassifier, GradientBoostingRegressor
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, mean_absolute_error

def generate_synthetic_construction_data(n_samples=2500, random_state=42):
    np.random.seed(random_state)
    
    planned_duration = np.random.uniform(10, 90, n_samples)
    elapsed_ratio = np.random.uniform(0.1, 0.9, n_samples)
    days_elapsed = planned_duration * elapsed_ratio
    
    planned_progress = np.minimum(100.0, elapsed_ratio * 100.0)
    
    # Progress variance influenced by manpower, materials, equipment, weather
    manpower_ratio = np.random.normal(0.95, 0.25, n_samples).clip(0.4, 1.8)
    equipment_avail = np.random.uniform(50, 100, n_samples)
    material_avail = np.random.uniform(45, 100, n_samples)
    velocity_early = np.random.uniform(1.0, 3.5, n_samples)
    
    # Recent velocity affected by resources
    resource_factor = (manpower_ratio * 0.4 + (equipment_avail/100.0) * 0.3 + (material_avail/100.0) * 0.3)
    velocity_recent = (velocity_early * resource_factor * np.random.normal(1.0, 0.15, n_samples)).clip(0.1, 5.0)
    velocity_ratio = velocity_recent / velocity_early
    
    contractor_delay_rate = np.random.beta(2, 8, n_samples) # 0.05 - 0.45
    contractor_projects = np.random.randint(3, 40, n_samples)
    
    progress_drag = (1.0 - resource_factor) * 25.0 + contractor_delay_rate * 20.0 + np.random.normal(0, 5, n_samples)
    current_progress = (planned_progress - progress_drag).clip(0.0, 99.0)
    progress_variance = current_progress - planned_progress
    
    planned_days_remaining = np.maximum(1.0, planned_duration - days_elapsed)
    
    # Target 1: Actual remaining days
    work_remaining_pct = 100.0 - current_progress
    effective_daily_pace = np.maximum(0.2, (current_progress / np.maximum(1.0, days_elapsed)) * resource_factor)
    true_remaining_days = (work_remaining_pct / effective_daily_pace).clip(1.0, planned_duration * 2.5)
    
    # Target 2: Binary delay flag (delay > 5 days)
    is_delayed = ((true_remaining_days - planned_days_remaining) > 5.0).astype(int)
    
    X = np.column_stack([
        planned_duration,
        days_elapsed,
        current_progress,
        planned_progress,
        progress_variance,
        manpower_ratio,
        equipment_avail,
        material_avail,
        velocity_ratio,
        contractor_delay_rate,
        contractor_projects,
        planned_days_remaining
    ])
    
    return X, is_delayed, true_remaining_days

def train_and_save():
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    models_dir = os.path.join(base_dir, "saved_models")
    os.makedirs(models_dir, exist_ok=True)
    
    print("Generating synthetic infrastructure project training dataset...")
    X, y_clf, y_reg = generate_synthetic_construction_data(n_samples=3000)
    
    X_train, X_test, y_clf_train, y_clf_test, y_reg_train, y_reg_test = train_test_split(
        X, y_clf, y_reg, test_size=0.2, random_state=42
    )
    
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)
    
    print("Training GradientBoosting Delay Classifier...")
    clf = GradientBoostingClassifier(n_estimators=120, max_depth=4, learning_rate=0.08, random_state=42)
    clf.fit(X_train_scaled, y_clf_train)
    acc = accuracy_score(y_clf_test, clf.predict(X_test_scaled))
    print(f"Classifier Test Accuracy: {acc:.3f}")
    
    print("Training GradientBoosting Remaining Duration Regressor...")
    reg = GradientBoostingRegressor(n_estimators=120, max_depth=4, learning_rate=0.08, random_state=42)
    reg.fit(X_train_scaled, y_reg_train)
    mae = mean_absolute_error(y_reg_test, reg.predict(X_test_scaled))
    print(f"Regressor Test MAE: {mae:.2f} days")
    
    joblib.dump(scaler, os.path.join(models_dir, "scaler.joblib"))
    joblib.dump(clf, os.path.join(models_dir, "delay_classifier.joblib"))
    joblib.dump(reg, os.path.join(models_dir, "duration_regressor.joblib"))
    print("All ML models successfully trained and saved to:", models_dir)

if __name__ == "__main__":
    train_and_save()
