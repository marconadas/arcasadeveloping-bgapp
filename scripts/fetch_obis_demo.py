#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
import ssl
from pathlib import Path
from urllib.parse import urlencode
from urllib.request import Request, urlopen


def fetch_obis_scientificname(scientificname: str, start: str, end: str, size: int = 1000):
    base = "https://api.obis.org/v3/occurrence"
    params = {"scientificname": scientificname, "startdate": start, "enddate": end, "size": size}
    url = base + "?" + urlencode(params)
    ctx = ssl.create_default_context()
    req = Request(url, headers={"User-Agent": "BGAPP/0.1"})
    with urlopen(req, context=ctx, timeout=90) as resp:
        data = json.loads(resp.read().decode("utf-8"))
    return data.get("results", data)


def to_geojson(records):
    features = []
    for r in records:
        lon = r.get("decimalLongitude"); lat = r.get("decimalLatitude")
        if lon is None or lat is None:
            continue
        try:
            lon = float(lon); lat = float(lat)
        except Exception:
            continue
        props = {
            "scientificName": r.get("scientificName"),
            "eventDate": r.get("eventDate") or r.get("date_start") or r.get("date_end"),
            "basisOfRecord": r.get("basisOfRecord"),
            "taxonRank": r.get("taxonRank"),
            "datasetID": r.get("datasetID"),
        }
        features.append({
            "type": "Feature",
            "properties": props,
            "geometry": {"type": "Point", "coordinates": [lon, lat]},
        })
    return {"type": "FeatureCollection", "features": features}


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--scientificname", default="Delphinus delphis")
    parser.add_argument("--start", default="2023-01-01")
    parser.add_argument("--end", default="2025-12-31")
    parser.add_argument("--size", type=int, default=1000)
    parser.add_argument("--out", default="infra/pygeoapi/localdata/occurrences.geojson")
    args = parser.parse_args()

    recs = fetch_obis_scientificname(args.scientificname, args.start, args.end, args.size)
    fc = to_geojson(recs)
    Path(args.out).write_text(json.dumps(fc))
    print(f"Saved {len(fc['features'])} features to {args.out}")


if __name__ == "__main__":
    main()
