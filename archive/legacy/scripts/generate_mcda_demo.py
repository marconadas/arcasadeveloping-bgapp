#!/usr/bin/env python3
from __future__ import annotations

import json
from math import prod
from pathlib import Path
from typing import List, Tuple

AOI_PATH = Path('configs/aoi.geojson')
OUT_PATH = Path('infra/pygeoapi/localdata/mcda.geojson')


def read_aoi_bbox() -> Tuple[float, float, float, float]:
    data = json.loads(AOI_PATH.read_text())
    if data.get('type') == 'FeatureCollection' and data.get('features'):
        coords = data['features'][0]['geometry']['coordinates'][0]
    elif data.get('type') == 'Feature':
        coords = data['geometry']['coordinates'][0]
    else:
        coords = data['coordinates'][0]
    xs = [c[0] for c in coords]
    ys = [c[1] for c in coords]
    return min(xs), min(ys), max(xs), max(ys)


def ahp_weights(pairwise: List[List[float]]) -> List[float]:
    # método da média geométrica
    gms = [prod(row) ** (1.0 / len(row)) for row in pairwise]
    s = sum(gms)
    return [gm / s for gm in gms]


def generate_mcda():
    minx, miny, maxx, maxy = read_aoi_bbox()
    step = 0.25  # graus

    # matriz de comparação par-a-par (crit1 vs crit2)
    # exemplo: crit2 (produção) 3x mais importante que crit1 (restrições)
    pairwise = [
        [1.0, 1/3],
        [3.0, 1.0],
    ]
    w1, w2 = ahp_weights(pairwise)

    features = []
    y = miny
    while y < maxy:
        x = minx
        y2 = min(y + step, maxy)
        while x < maxx:
            x2 = min(x + step, maxx)
            # proxies determinísticos para demo (0..1)
            # crit1: distância normalizada à costa oeste (menor melhor)
            c1 = (x - minx) / max(1e-6, (maxx - minx))
            c1 = 1.0 - c1
            # crit2: gradiente latitudinal (maior melhor)
            c2 = (y - miny) / max(1e-6, (maxy - miny))
            # score MCDA
            score = w1 * c1 + w2 * c2
            klass = 'alta' if score >= 0.66 else ('média' if score >= 0.33 else 'baixa')
            poly = {
                'type': 'Feature',
                'properties': {
                    'score': round(score, 3),
                    'class': klass,
                    'w1': round(w1, 3),
                    'w2': round(w2, 3),
                },
                'geometry': {
                    'type': 'Polygon',
                    'coordinates': [[
                        [x, y], [x2, y], [x2, y2], [x, y2], [x, y]
                    ]]
                }
            }
            features.append(poly)
            x = x2
        y = y2

    fc = {'type': 'FeatureCollection', 'features': features}
    OUT_PATH.write_text(json.dumps(fc))
    print(f'Wrote {len(features)} cells to {OUT_PATH}')


if __name__ == '__main__':
    generate_mcda()
