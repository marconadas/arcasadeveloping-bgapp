from __future__ import annotations

import numpy as np
import xarray as xr


def compute_zscore_anomaly(data: xr.DataArray, climatology: xr.DataArray) -> xr.DataArray:
    # Assumir dimensões compatíveis: (time, y, x) ou (y, x)
    std = climatology.std(dim="time") if "time" in climatology.dims else climatology.std()
    mean = climatology.mean(dim="time") if "time" in climatology.dims else climatology.mean()
    return (data - mean) / (std + 1e-6)


def minmax_normalize(data: xr.DataArray, vmin: float, vmax: float) -> xr.DataArray:
    return ((data - vmin) / max(vmax - vmin, 1e-6)).clip(0, 1)
