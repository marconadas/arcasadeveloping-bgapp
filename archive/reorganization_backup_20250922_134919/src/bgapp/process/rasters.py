from __future__ import annotations

from pathlib import Path
from typing import Optional

import rasterio
from rasterio.mask import mask
from rasterio.enums import Resampling
from rasterio.shutil import copy as rio_copy
import json


def clip_raster_to_aoi(input_path: Path, aoi_geojson: Path, output_path: Path) -> Path:
    with rasterio.open(input_path) as src:
        aoi = json.loads(aoi_geojson.read_text())
        if aoi.get("type") == "FeatureCollection":
            geoms = [f["geometry"] for f in aoi.get("features", [])]
        elif aoi.get("type") == "Feature":
            geoms = [aoi["geometry"]]
        else:
            geoms = [aoi]
        data, transform = mask(src, geoms, crop=True)
        meta = src.meta.copy()
        meta.update({
            "height": data.shape[1],
            "width": data.shape[2],
            "transform": transform,
        })
        with rasterio.open(output_path, "w", **meta) as dst:
            dst.write(data)
    return output_path


def reproject_raster(input_path: Path, output_path: Path, dst_crs: str = "EPSG:4326") -> Path:
    with rasterio.open(input_path) as src:
        transform, width, height = rasterio.warp.calculate_default_transform(
            src.crs, dst_crs, src.width, src.height, *src.bounds
        )
        kwargs = src.meta.copy()
        kwargs.update({
            "crs": dst_crs,
            "transform": transform,
            "width": width,
            "height": height,
        })
        with rasterio.open(output_path, "w", **kwargs) as dst:
            for i in range(1, src.count + 1):
                rasterio.warp.reproject(
                    source=rasterio.band(src, i),
                    destination=rasterio.band(dst, i),
                    src_transform=src.transform,
                    src_crs=src.crs,
                    dst_transform=transform,
                    dst_crs=dst_crs,
                    resampling=Resampling.nearest,
                )
    return output_path


def to_cog(input_path: Path, output_path: Path) -> Path:
    profile = {
        "driver": "COG",
        "compress": "LZW",
        "blocksize": 512,
        "overview_levels": [2, 4, 8, 16],
    }
    rio_copy(
        src=input_path,
        dst=output_path,
        driver="COG",
        copy_src_overviews=True,
        **profile,
    )
    return output_path
