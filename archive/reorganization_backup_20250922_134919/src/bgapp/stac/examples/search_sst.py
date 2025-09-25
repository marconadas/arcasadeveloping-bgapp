#!/usr/bin/env python3
"""
Exemplo: Buscar dados de temperatura da superfície do mar
"""

from pystac_client import Client
import planetary_computer as pc
from datetime import datetime, timedelta

def search_sst_data():
    # Conectar ao Planetary Computer
    client = Client.open(
        "https://planetarycomputer.microsoft.com/api/stac/v1",
        modifier=pc.sign_inplace
    )
    
    # Buscar dados SST para Angola
    search = client.search(
        collections=["noaa-cdr-sea-surface-temperature-whoi"],
        bbox=[11.4, -18.5, 24.1, -4.4],  # Angola
        datetime=f"{datetime.now() - timedelta(days=30)}/{datetime.now()}",
        max_items=10
    )
    
    items = list(search.items())
    print(f"Encontrados {len(items)} items de SST")
    
    for item in items[:3]:
        print(f"  - {item.id}: {item.datetime}")
    
    return items

if __name__ == "__main__":
    search_sst_data()
