"""
Modelo de exemplo para demonstração de previsão de pesca
Este arquivo mostra como criar e treinar um modelo simples
"""

import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
import joblib
import os

def create_sample_model():
    """Criar um modelo de exemplo para demonstração"""

    # Dados de exemplo para treinamento
    # Em produção, usar dados reais históricos
    np.random.seed(42)
    n_samples = 1000

    data = {
        'lat': np.random.uniform(-18, -4, n_samples),  # Angola latitudes
        'lon': np.random.uniform(11, 24, n_samples),  # Angola longitudes
        'sst': np.random.uniform(15, 28, n_samples),  # Sea Surface Temperature
        'chlorophyll': np.random.uniform(0.1, 15, n_samples),  # Chlorophyll concentration
        'salinity': np.random.uniform(34, 36, n_samples),  # Salinity
        'hour': np.random.randint(0, 24, n_samples),
        'month': np.random.randint(1, 13, n_samples),
        'fishing_activity': np.random.randint(0, 2, n_samples)  # Target variable
    }

    df = pd.DataFrame(data)

    # Features e target
    X = df[['lat', 'lon', 'sst', 'chlorophyll', 'salinity', 'hour', 'month']]
    y = df['fishing_activity']

    # Dividir dados
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    # Treinar modelo
    model = RandomForestClassifier(n_estimators=100, random_state=42)
    model.fit(X_train, y_train)

    # Salvar modelo
    model_path = 'data/models/fishing_prediction_model.pkl'
    os.makedirs(os.path.dirname(model_path), exist_ok=True)
    joblib.dump(model, model_path)

    # Salvar scaler
    scaler = StandardScaler()
    scaler.fit(X_train)
    joblib.dump(scaler, 'data/models/feature_scaler.pkl')

    print(f"✅ Modelo de exemplo criado em {model_path}")
    print(f"✅ Acurácia no conjunto de teste: {model.score(X_test, y_test):.2f}")

    return model, scaler

if __name__ == '__main__':
    create_sample_model()
