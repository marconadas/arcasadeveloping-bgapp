from __future__ import annotations

import json
import os
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Dict, Optional

import yaml


ROOT = Path(__file__).resolve().parents[3]
CONFIGS = ROOT / "configs"


@dataclass
class AppConfig:
    postgres_host: str = "localhost"
    postgres_port: int = 5432
    postgres_db: str = "geo"
    postgres_user: str = "postgres"
    postgres_password: str = "postgres"

    minio_endpoint: str = "http://localhost:9000"
    minio_access_key: str = "minio"
    minio_secret_key: str = "minio123"
    minio_bucket: str = "biomassa"
    minio_stac_bucket: str = "stac-assets"

    stac_api_url: str = "http://localhost:8081"
    pygeoapi_url: str = "http://localhost:5000"


def load_env() -> AppConfig:
    return AppConfig(
        postgres_host=os.getenv("POSTGRES_HOST", "localhost"),
        postgres_port=int(os.getenv("POSTGRES_PORT", "5432")),
        postgres_db=os.getenv("POSTGRES_DB", "geo"),
        postgres_user=os.getenv("POSTGRES_USER", "postgres"),
        postgres_password=os.getenv("POSTGRES_PASSWORD", "postgres"),
        minio_endpoint=os.getenv("MINIO_ENDPOINT", "http://localhost:9000"),
        minio_access_key=os.getenv("MINIO_ACCESS_KEY", "minio"),
        minio_secret_key=os.getenv("MINIO_SECRET_KEY", "minio123"),
        minio_bucket=os.getenv("MINIO_BUCKET", "biomassa"),
        minio_stac_bucket=os.getenv("MINIO_STAC_BUCKET", "stac-assets"),
        stac_api_url=os.getenv("STAC_API_URL", "http://localhost:8081"),
        pygeoapi_url=os.getenv("PYGEOAPI_URL", "http://localhost:5000"),
    )


def load_variables() -> Dict[str, Any]:
    with open(CONFIGS / "variables.yaml", "r", encoding="utf-8") as f:
        return yaml.safe_load(f)


def load_aoi_geometry(path: Optional[Path] = None) -> Dict[str, Any]:
    aoi_path = path or (CONFIGS / "aoi.geojson")
    with open(aoi_path, "r", encoding="utf-8") as f:
        aoi = json.load(f)
    if aoi.get("type") == "FeatureCollection":
        features = aoi.get("features", [])
        if features:
            return features[0].get("geometry")
    if aoi.get("type") == "Feature":
        return aoi.get("geometry")
    return aoi
