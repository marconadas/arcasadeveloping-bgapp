from __future__ import annotations

from pathlib import Path
from typing import Optional, Tuple

import xarray as xr
import rioxarray  # noqa


def load_netcdf_cube(path: Path, chunks: Optional[dict] = None) -> xr.Dataset:
    """Load NetCDF as xarray Dataset with optional chunking."""
    return xr.open_dataset(path, chunks=chunks or {"time": 10})


def clip_cube_to_bbox(ds: xr.Dataset, bbox: Tuple[float, float, float, float]) -> xr.Dataset:
    """Clip cube to bounding box (minx, miny, maxx, maxy)."""
    minx, miny, maxx, maxy = bbox
    return ds.sel(
        longitude=slice(minx, maxx),
        latitude=slice(miny, maxy)
    )


def compute_temporal_mean(ds: xr.Dataset, variable: str) -> xr.DataArray:
    """Compute temporal mean of variable."""
    return ds[variable].mean(dim="time")


def compute_anomalies(ds: xr.Dataset, variable: str, climatology: Optional[xr.DataArray] = None) -> xr.DataArray:
    """Compute anomalies relative to climatology or long-term mean."""
    data = ds[variable]
    if climatology is None:
        climatology = data.mean(dim="time")
    return data - climatology


def export_to_cog(da: xr.DataArray, output_path: Path) -> Path:
    """Export DataArray to Cloud Optimized GeoTIFF."""
    da.rio.to_raster(
        output_path,
        driver="COG",
        compress="LZW",
        blocksize=512,
    )
    return output_path
