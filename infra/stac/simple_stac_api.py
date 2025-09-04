#!/usr/bin/env python3
"""
STAC API Simples para BGAPP
Implementação básica que não requer PostgreSQL com extensões específicas
"""

from fastapi import FastAPI
from datetime import datetime
import uvicorn
import json

app = FastAPI(
    title='BGAPP STAC API', 
    version='1.0.0',
    description='Simple STAC API for BGAPP geospatial data'
)

@app.get('/')
async def root():
    """STAC Catalog root"""
    return {
        'stac_version': '1.0.0',
        'type': 'Catalog',
        'id': 'bgapp-catalog',
        'title': 'BGAPP Data Catalog',
        'description': 'STAC API for BGAPP - Marine and terrestrial data for Angola',
        'links': [
            {
                'rel': 'self', 
                'href': 'http://localhost:8081/',
                'type': 'application/json'
            },
            {
                'rel': 'collections', 
                'href': 'http://localhost:8081/collections',
                'type': 'application/json'
            },
            {
                'rel': 'search',
                'href': 'http://localhost:8081/search',
                'type': 'application/geo+json',
                'method': 'GET'
            }
        ]
    }

@app.get('/collections')
async def collections():
    """STAC Collections"""
    return {
        'collections': [
            {
                'id': 'angola-marine-data',
                'title': 'Angola Marine Data',
                'description': 'Oceanographic and marine biodiversity data for Angola EEZ',
                'stac_version': '1.0.0',
                'license': 'CC-BY-4.0',
                'extent': {
                    'spatial': {
                        'bbox': [[-18.2, 8.5, -4.2, 17.5]]
                    },
                    'temporal': {
                        'interval': [['2024-01-01T00:00:00Z', None]]
                    }
                },
                'links': [
                    {
                        'rel': 'self',
                        'href': 'http://localhost:8081/collections/angola-marine-data'
                    },
                    {
                        'rel': 'items',
                        'href': 'http://localhost:8081/collections/angola-marine-data/items'
                    }
                ]
            },
            {
                'id': 'angola-terrestrial-data',
                'title': 'Angola Terrestrial Data',
                'description': 'Satellite and terrestrial data for Angola',
                'stac_version': '1.0.0',
                'license': 'CC-BY-4.0',
                'extent': {
                    'spatial': {
                        'bbox': [[-18.0, 11.4, -4.4, 24.0]]
                    },
                    'temporal': {
                        'interval': [['2024-01-01T00:00:00Z', None]]
                    }
                },
                'links': [
                    {
                        'rel': 'self',
                        'href': 'http://localhost:8081/collections/angola-terrestrial-data'
                    },
                    {
                        'rel': 'items',
                        'href': 'http://localhost:8081/collections/angola-terrestrial-data/items'
                    }
                ]
            }
        ]
    }

@app.get('/collections/{collection_id}')
async def get_collection(collection_id: str):
    """Get specific collection"""
    collections_data = await collections()
    
    for collection in collections_data['collections']:
        if collection['id'] == collection_id:
            return collection
    
    return {"error": "Collection not found"}, 404

@app.get('/collections/{collection_id}/items')
async def get_items(collection_id: str, limit: int = 10):
    """Get items from collection"""
    return {
        'type': 'FeatureCollection',
        'features': [
            {
                'type': 'Feature',
                'stac_version': '1.0.0',
                'id': f'sample-item-{i}',
                'collection': collection_id,
                'geometry': {
                    'type': 'Polygon',
                    'coordinates': [[
                        [-15.0, 10.0],
                        [-14.0, 10.0],
                        [-14.0, 11.0],
                        [-15.0, 11.0],
                        [-15.0, 10.0]
                    ]]
                },
                'properties': {
                    'datetime': f'2024-01-{i+1:02d}T12:00:00Z',
                    'title': f'Sample Data Item {i+1}',
                    'description': f'Sample geospatial data for {collection_id}'
                },
                'links': [],
                'assets': {}
            }
            for i in range(min(limit, 5))
        ],
        'links': [
            {
                'rel': 'self',
                'href': f'http://localhost:8081/collections/{collection_id}/items'
            }
        ]
    }

@app.get('/health')
async def health():
    """Health check endpoint"""
    return {
        'status': 'healthy', 
        'timestamp': datetime.now().isoformat(),
        'service': 'BGAPP STAC API',
        'version': '1.0.0'
    }

@app.get('/search')
async def search(limit: int = 10):
    """Simple search endpoint"""
    return {
        'type': 'FeatureCollection',
        'features': [],
        'context': {
            'returned': 0,
            'limit': limit,
            'matched': 0
        }
    }

if __name__ == '__main__':
    print("🚀 Starting BGAPP Simple STAC API...")
    uvicorn.run(app, host='0.0.0.0', port=8081)
