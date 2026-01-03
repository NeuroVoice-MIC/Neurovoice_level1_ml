# inference.py
import warnings
warnings.filterwarnings(
    "ignore",
    category=UserWarning,
    module="sklearn"
)
import sys
import json
import joblib
import pandas as pd
from audio_preprocess import load_audio
from praat_features import extract_praat_features
from feature_engineering import build_feature_vector

import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_DIR = os.path.join(BASE_DIR, "model")

model = joblib.load(os.path.join(MODEL_DIR, "logreg_model.joblib"))



with open(os.path.join(MODEL_DIR, "feature_columns.json")) as f:
    feature_cols = json.load(f)

def predict(audio_path):

    praat_feats = extract_praat_features(audio_path)
    X = build_feature_vector(praat_feats, feature_cols)
    
    prob = model.predict_proba(X)[0][1]
    prob = max(0.01, min(0.99, prob))


    risk_score = float(prob)
    return {
    "risk_score": round(risk_score, 3),
    "risk_level": (
        "Low" if risk_score < 0.33 else
        "Medium" if risk_score < 0.66 else
        "High"
    )
    }

if __name__ == "__main__":
    audio_path = sys.argv[1]
    result = predict(audio_path)
    print(json.dumps(result))