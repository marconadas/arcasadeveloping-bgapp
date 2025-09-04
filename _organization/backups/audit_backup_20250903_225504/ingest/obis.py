import argparse
import json
import sys
from datetime import datetime
from typing import Any, Dict, List, Optional

import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

OBIS_BASE_URL = "https://api.obis.org/v3"


def _get_session() -> requests.Session:
    session = requests.Session()
    retries = Retry(
        total=3,
        backoff_factor=0.5,
        status_forcelist=[429, 500, 502, 503, 504],
        allowed_methods=["GET"],
        raise_on_status=False,
    )
    adapter = HTTPAdapter(max_retries=retries)
    session.mount("http://", adapter)
    session.mount("https://", adapter)
    session.headers.update({"User-Agent": "BGAPP/0.1 obis-ingest"})
    return session


def fetch_obis_occurrences(
    taxonid: Optional[int] = None,
    scientificname: Optional[str] = None,
    start: Optional[str] = None,
    end: Optional[str] = None,
    limit: int = 5000,
    geometry: Optional[Dict[str, Any]] = None,
) -> List[Dict[str, Any]]:
    """Fetch occurrences from OBIS API with optional filters.

    Args:
        taxonid: OBIS taxon id
        scientificname: scientific name to filter
        start: ISO date string
        end: ISO date string
        limit: page size (OBIS max 5000)
        geometry: GeoJSON geometry to clip results (server-side bbox not supported for all endpoints)
    """
    params: Dict[str, Any] = {"size": limit}
    if taxonid is not None:
        params["taxonid"] = taxonid
    if scientificname is not None:
        params["scientificname"] = scientificname
    if start is not None:
        params["startdate"] = start
    if end is not None:
        params["enddate"] = end

    url = f"{OBIS_BASE_URL}/occurrence"
    session = _get_session()
    try:
        resp = session.get(url, params=params, timeout=30)
        resp.raise_for_status()
        data = resp.json()
    except requests.RequestException:
        return []
    except ValueError:
        return []

    results: List[Dict[str, Any]] = data.get("results", []) if isinstance(data, dict) else data

    if geometry is not None:
        try:
            from shapely.geometry import shape, Point  # type: ignore
        except Exception:
            return results
        geom = shape(geometry)
        filtered: List[Dict[str, Any]] = []
        for rec in results:
            lon = rec.get("decimalLongitude")
            lat = rec.get("decimalLatitude")
            if lon is None or lat is None:
                continue
            if geom.contains(Point(float(lon), float(lat))):
                filtered.append(rec)
        return filtered

    return results


def main(argv: Optional[List[str]] = None) -> None:
    parser = argparse.ArgumentParser(description="OBIS occurrences downloader")
    parser.add_argument("--taxonid", type=int, default=None)
    parser.add_argument("--scientificname", type=str, default=None)
    parser.add_argument("--start", type=str, default=None)
    parser.add_argument("--end", type=str, default=None)
    parser.add_argument("--aoi", type=str, default=None, help="Path to AOI GeoJSON to filter locally")
    parser.add_argument("--out", type=str, default=f"obis_{datetime.utcnow().strftime('%Y%m%dT%H%M%SZ')}.json")

    args = parser.parse_args(argv)

    geometry = None
    if args.aoi:
        with open(args.aoi, "r", encoding="utf-8") as f:
            aoi = json.load(f)
        if aoi.get("type") == "FeatureCollection":
            features = aoi.get("features", [])
            if features:
                geometry = features[0].get("geometry")
        elif aoi.get("type") == "Feature":
            geometry = aoi.get("geometry")
        else:
            geometry = aoi

    records = fetch_obis_occurrences(
        taxonid=args.taxonid,
        scientificname=args.scientificname,
        start=args.start,
        end=args.end,
        geometry=geometry,
    )

    with open(args.out, "w", encoding="utf-8") as f:
        json.dump(records, f, ensure_ascii=False)

    print(f"Saved {len(records)} records to {args.out}")


if __name__ == "__main__":
    main(sys.argv[1:])
