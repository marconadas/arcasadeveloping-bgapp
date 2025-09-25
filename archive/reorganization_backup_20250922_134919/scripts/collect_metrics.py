#!/usr/bin/env python3
from __future__ import annotations

import json
import os
from datetime import datetime
from pathlib import Path

import urllib.request

API = os.getenv("PYGEOAPI_URL", "http://localhost:5080")
OUTDIR = Path("logs")
OUTDIR.mkdir(parents=True, exist_ok=True)
OUT = OUTDIR / "metrics.jsonl"


def fetch(url: str):
    t0 = datetime.utcnow().timestamp()
    with urllib.request.urlopen(url, timeout=30) as r:
        data = json.loads(r.read().decode("utf-8"))
    t1 = datetime.utcnow().timestamp()
    return data, int((t1 - t0) * 1000)


def main():
    ts = datetime.utcnow().isoformat() + "Z"
    metrics = {"ts": ts}

    # collections
    data, lat = fetch(f"{API}/collections?f=json")
    metrics["collections_latency_ms"] = lat
    metrics["collections_count"] = len(data.get("collections", []))

    # occurrences items
    data, lat = fetch(f"{API}/collections/occurrences/items?limit=10000&f=json")
    metrics["occurrences_latency_ms"] = lat
    metrics["occurrences_count"] = len(data.get("features", []))

    # aoi items
    data, lat = fetch(f"{API}/collections/aoi/items?f=json")
    metrics["aoi_latency_ms"] = lat
    metrics["aoi_features"] = len(data.get("features", []))

    OUT.write_text(OUT.read_text() + json.dumps(metrics) + "\n" if OUT.exists() else json.dumps(metrics) + "\n")
    print(json.dumps(metrics))


if __name__ == "__main__":
    main()
