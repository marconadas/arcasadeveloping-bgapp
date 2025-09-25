#!/usr/bin/env python3
"""
Exemplo: Criar mapa interativo de Angola
"""

import folium
from folium import plugins

def create_angola_map():
    # Criar mapa centrado em Angola
    m = folium.Map(
        location=[-12.0, 18.0],
        zoom_start=6,
        tiles='OpenStreetMap'
    )
    
    # Adicionar limites de Angola
    folium.Rectangle(
        bounds=[[-18.5, 11.4], [-4.4, 24.1]],
        color='blue',
        fill=False,
        weight=2,
        popup='Zona Marítima de Angola'
    ).add_to(m)
    
    # Adicionar portos principais
    ports = [
        {"name": "Luanda", "coords": [-8.8368, 13.2343]},
        {"name": "Lobito", "coords": [-12.3644, 13.5456]},
        {"name": "Namibe", "coords": [-15.1961, 12.1522]}
    ]
    
    for port in ports:
        folium.Marker(
            location=port["coords"],
            popup=f"Porto de {port['name']}",
            icon=folium.Icon(color='red', icon='anchor', prefix='fa')
        ).add_to(m)
    
    # Adicionar controles
    plugins.Fullscreen().add_to(m)
    plugins.MeasureControl().add_to(m)
    
    # Salvar mapa
    m.save("angola_map.html")
    print("Mapa salvo em angola_map.html")
    
    return m

if __name__ == "__main__":
    create_angola_map()
