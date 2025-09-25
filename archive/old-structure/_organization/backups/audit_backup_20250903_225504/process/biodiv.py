from __future__ import annotations

from typing import Dict, List


def clean_occurrences(records: List[Dict]) -> List[Dict]:
    seen = set()
    cleaned: List[Dict] = []
    for r in records:
        lon = r.get("decimalLongitude")
        lat = r.get("decimalLatitude")
        if lon is None or lat is None:
            continue
        key = (round(float(lon), 6), round(float(lat), 6), r.get("scientificName"), r.get("eventDate"))
        if key in seen:
            continue
        seen.add(key)
        cleaned.append(r)
    return cleaned
