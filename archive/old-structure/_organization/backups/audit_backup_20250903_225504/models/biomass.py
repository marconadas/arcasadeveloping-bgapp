from __future__ import annotations

import numpy as np
import xarray as xr
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_squared_error, r2_score
from sklearn.model_selection import train_test_split
from typing import Tuple, Dict, Any


def chl_to_npp_empirical(chl_a: xr.DataArray, model: str = "behrenfeld") -> xr.DataArray:
    """Convert chlorophyll-a to Net Primary Production using empirical models."""
    if model == "behrenfeld":
        # Behrenfeld & Falkowski (1997) simplified
        # NPP = f(Chl-a, PAR, SST) - here simplified to Chl-a only
        npp = 1.13 * (chl_a ** 0.803)  # mg C m-2 d-1 (very simplified)
        npp.attrs.update({"units": "mg C m-2 d-1", "model": "behrenfeld_simplified"})
        return npp
    else:
        raise ValueError(f"Unknown model: {model}")


def ndvi_to_biomass_regression(ndvi: xr.DataArray, training_data: Dict[str, np.ndarray]) -> xr.DataArray:
    """Convert NDVI to biomass using trained regression model."""
    # Placeholder implementation
    X_train = training_data["ndvi"].reshape(-1, 1)
    y_train = training_data["biomass"]
    
    model = RandomForestRegressor(n_estimators=50, random_state=42)
    model.fit(X_train, y_train)
    
    # Apply to NDVI cube
    ndvi_flat = ndvi.values.flatten()
    valid_mask = ~np.isnan(ndvi_flat)
    biomass_flat = np.full_like(ndvi_flat, np.nan)
    
    if valid_mask.any():
        biomass_flat[valid_mask] = model.predict(ndvi_flat[valid_mask].reshape(-1, 1))
    
    biomass = xr.DataArray(
        biomass_flat.reshape(ndvi.shape),
        coords=ndvi.coords,
        dims=ndvi.dims,
        attrs={"units": "kg/ha", "model": "random_forest"}
    )
    return biomass


def validate_biomass_model(y_true: np.ndarray, y_pred: np.ndarray) -> Dict[str, float]:
    """Compute validation metrics for biomass models."""
    mask = ~(np.isnan(y_true) | np.isnan(y_pred))
    if not mask.any():
        return {"rmse": np.nan, "r2": np.nan, "n_samples": 0}
    
    y_t = y_true[mask]
    y_p = y_pred[mask]
    
    return {
        "rmse": np.sqrt(mean_squared_error(y_t, y_p)),
        "r2": r2_score(y_t, y_p),
        "n_samples": len(y_t)
    }


def detect_upwelling_fronts(sst: xr.DataArray, threshold: float = 0.5) -> xr.DataArray:
    """Detect upwelling fronts using SST gradients."""
    # Simple gradient magnitude
    grad_x = sst.differentiate("longitude")
    grad_y = sst.differentiate("latitude") 
    grad_mag = np.sqrt(grad_x**2 + grad_y**2)
    
    fronts = grad_mag > threshold
    fronts.attrs.update({"units": "boolean", "threshold_C_per_degree": threshold})
    return fronts
