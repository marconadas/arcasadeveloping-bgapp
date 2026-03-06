'use client';

import React, { useEffect, useState } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import { nasaDataService } from '@/services/nasaDataService';

interface NASAVesselLightsLayerProps {
  visible: boolean;
  opacity?: number;
  minRadiance?: number;
  showClusters?: boolean;
  showRiskZones?: boolean;
  date?: string;
  onDataLoad?: (data: any) => void;
  onAlertDetected?: (alerts: any[]) => void;
}

export function NASAVesselLightsLayer({
  visible,
  opacity = 0.9,
  minRadiance = 0.5,
  showClusters = true,
  showRiskZones = false,
  date,
  onDataLoad,
  onAlertDetected
}: NASAVesselLightsLayerProps) {
  const map = useMap();
  const [vesselMarkers, setVesselMarkers] = useState<L.LayerGroup | null>(null);

  useEffect(() => {
    if (!visible || !map) return;

    // Create layer group for vessel markers
    const markersGroup = L.layerGroup();
    markersGroup.addTo(map);
    setVesselMarkers(markersGroup);

    const loadVesselLights = async () => {
      try {
        console.log('[NASAVesselLightsLayer] Fetching vessel lights data directly from D1...');

        // Fetch vessel lights data directly from our D1 endpoint
        const angolaEEZ = '-18.02,8.9,-5.55,13.35';
        const apiResponse = await fetch(
          `/api/realtime/vessel-lights?limit=500&bbox=${angolaEEZ}`,
          {
            cache: 'no-store',
            headers: { 'Accept': 'application/json' }
          }
        );

        if (!apiResponse.ok) {
          throw new Error(`Failed to fetch vessel lights data: ${apiResponse.status} ${apiResponse.statusText}`);
        }

        const response = await apiResponse.json();
        console.log('[NASAVesselLightsLayer] Received vessel lights:', response.count, 'points');

        const vessels = response.vessel_lights || [];

        if (vessels.length > 0) {
          const alerts: any[] = [];

          console.log('[NASAVesselLightsLayer] Processing', vessels.length, 'vessel lights...');

          // Process each vessel
          vessels.forEach((vessel: any) => {
            // Add vessel type and risk classification
            const vesselType = classifyVesselType(vessel);
            const riskLevel = assessRiskLevel(vessel);
            const enhancedVessel = { ...vessel, vesselType, riskLevel };

            // Determine icon based on vessel type and risk
            const icon = createVesselIcon(enhancedVessel);

            // Create marker for vessel
            const marker = L.marker([enhancedVessel.lat, enhancedVessel.lon], { icon });

            // Create detailed popup
            const popupContent = `
              <div class="vessel-popup">
                <h4>Detecção de Luz (VIIRS)</h4>
                <p><strong>Tipo:</strong> ${formatVesselType(enhancedVessel.vesselType)}</p>
                <p><strong>Nível de Risco:</strong> <span class="risk-${enhancedVessel.riskLevel}">${enhancedVessel.riskLevel?.toUpperCase()}</span></p>
                <p><strong>Radiância:</strong> ${enhancedVessel.radiance.toFixed(1)} nW·cm⁻²·sr⁻¹</p>
                <p><strong>Localização:</strong> ${enhancedVessel.lat.toFixed(3)}°, ${enhancedVessel.lon.toFixed(3)}°</p>
                <p><strong>Timestamp:</strong> ${new Date(enhancedVessel.timestamp || '').toLocaleString()}</p>
                <p><strong>Fonte:</strong> ${enhancedVessel.source || 'NASA VIIRS'}</p>
              </div>
            `;

            marker.bindPopup(popupContent);

            // Add tooltip for quick info
            marker.bindTooltip(
              `${formatVesselType(enhancedVessel.vesselType)} - ${enhancedVessel.radiance.toFixed(1)}`,
              { permanent: false, direction: 'top' }
            );

            // Add to markers group
            markersGroup.addLayer(marker);

            // Check for high-risk vessels
            if (vessel.riskLevel === 'high') {
              alerts.push({
                type: 'high_risk_vessel',
                vessel,
                message: `High-risk ${formatVesselType(vessel.vesselType)} detected at ${vessel.lat.toFixed(2)}°, ${vessel.lon.toFixed(2)}°`
              });

              // Add warning circle around high-risk vessels
              const warningCircle = L.circle([vessel.lat, vessel.lon], {
                radius: 10000, // 10km radius
                color: '#ff0000',
                fillColor: '#ff0000',
                fillOpacity: 0.1,
                weight: 2,
                dashArray: '5, 10'
              });

              markersGroup.addLayer(warningCircle);
            }
          });

          // Add cluster zones if enabled
          if (showClusters && response.clusters && response.clusters.length > 0) {
            response.clusters.forEach((cluster: any) => {
              const polygon = L.circle(cluster.center, {
                radius: 30000, // 30km radius for cluster zone
                color: cluster.risk === 'high' ? '#ff6600' : '#ffcc00',
                fillColor: cluster.risk === 'high' ? '#ff9900' : '#ffee00',
                fillOpacity: 0.2,
                weight: 2
              });

              polygon.bindPopup(`
                <b>Fishing Fleet Cluster</b><br>
                Vessels: ${cluster.vesselCount}<br>
                Total Radiance: ${cluster.totalRadiance.toFixed(1)}<br>
                Type: ${cluster.type}<br>
                Risk: ${cluster.risk}
              `);

              markersGroup.addLayer(polygon);

              if (cluster.risk === 'high') {
                alerts.push({
                  type: 'fleet_concentration',
                  cluster,
                  message: `High concentration of ${cluster.vesselCount} vessels detected`
                });
              }
            });
          }

          // Add risk zones if enabled
          if (showRiskZones) {
            // Protected area boundaries (example)
            const protectedAreas = [
              { name: 'Southern Protected Zone', bounds: [[-18, 11], [-15, 11], [-15, 9], [-18, 9], [-18, 11]] },
              { name: 'Marine Reserve', bounds: [[-12, 12.5], [-10, 12.5], [-10, 11.5], [-12, 11.5], [-12, 12.5]] }
            ];

            protectedAreas.forEach(area => {
              const boundary = L.polygon(area.bounds as L.LatLngExpression[], {
                color: '#ff0000',
                fillColor: '#ff0000',
                fillOpacity: 0.05,
                weight: 2,
                dashArray: '10, 10'
              });

              boundary.bindPopup(`<b>${area.name}</b><br>Protected Area`);
              markersGroup.addLayer(boundary);
            });
          }

          // Add statistics overlay
          if (response.statistics) {
            const stats = response.statistics;
            const control = new L.Control({ position: 'topright' });

            control.onAdd = function () {
              const div = L.DomUtil.create('div', 'vessel-stats-panel');
              div.innerHTML = `
                <h4>Vessel Activity</h4>
                <div class="stats-content">
                  <p>Total Detections: <strong>${stats.total}</strong></p>
                  <p>Industrial: <strong>${stats.byType.industrial_fishing || 0}</strong></p>
                  <p>Commercial: <strong>${stats.byType.commercial_fishing || 0}</strong></p>
                  <p>Small/Artisanal: <strong>${(stats.byType.small_commercial || 0) + (stats.byType.artisanal || 0)}</strong></p>
                  <hr>
                  <p class="risk-high">High Risk: <strong>${stats.byRisk.high || 0}</strong></p>
                  <p class="risk-medium">Medium Risk: <strong>${stats.byRisk.medium || 0}</strong></p>
                  <p class="risk-low">Low Risk: <strong>${stats.byRisk.low || 0}</strong></p>
                  ${stats.hotspots && stats.hotspots.length > 0 ? `
                    <hr>
                    <p><strong>Hotspots:</strong></p>
                    <ul class="hotspot-list">
                      ${stats.hotspots.map((h: any) =>
                `<li>${h.count} vessels at ${h.lat.toFixed(1)}°, ${h.lon.toFixed(1)}°</li>`
              ).join('')}
                    </ul>
                  ` : ''}
                </div>
              `;
              return div;
            };

            control.addTo(map);
            markersGroup.addLayer(control as any);
          }

          // Trigger alert callback if alerts detected
          if (alerts.length > 0 && onAlertDetected) {
            onAlertDetected(alerts);
          }

          // Callback with loaded data
          if (onDataLoad) {
            onDataLoad({
              data: response.vessels,
              metadata: response.metadata,
              statistics: response.statistics,
              clusters: response.clusters,
              alerts
            });
          }
        }
      } catch (error) {
        console.error('Error loading NASA vessel lights data:', error);
      }
    };

    loadVesselLights();

    return () => {
      // Clean up markers group
      if (markersGroup) {
        map.removeLayer(markersGroup);
      }
    };
  }, [visible, map, opacity, minRadiance, showClusters, showRiskZones, date, onDataLoad, onAlertDetected]);

  return null;
}

// Helper function to create vessel icon based on type and risk
function createVesselIcon(vessel: any): L.DivIcon {
  const vesselType = vessel.vesselType || 'unknown';
  const riskLevel = vessel.riskLevel || 'low';
  const clustered = vessel.clustered || false;

  let iconHtml = '';
  let iconSize: [number, number] = [24, 24];
  let iconAnchor: [number, number] = [12, 12];

  if (clustered) {
    // Cluster icon
    const size = Math.min(40, 20 + vessel.vesselCount * 2);
    iconSize = [size, size];
    iconAnchor = [size / 2, size / 2];

    iconHtml = `
      <div style="
        width: ${size}px;
        height: ${size}px;
        border-radius: 50%;
        background: ${riskLevel === 'high' ? '#ff0000' : riskLevel === 'medium' ? '#ff9900' : '#00cc00'};
        opacity: 0.8;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-weight: bold;
        font-size: ${Math.max(10, size / 3)}px;
        border: 2px solid white;
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
      ">
        ${vessel.vesselCount}
      </div>
    `;
  } else {
    // Individual vessel icon
    const color = riskLevel === 'high' ? '#ff0000' : riskLevel === 'medium' ? '#ff9900' : '#00cc00';
    const symbol = vesselType === 'industrial_fishing' ? '⚓' :
      vesselType === 'commercial_fishing' ? '🚢' :
        vesselType === 'small_commercial' ? '⛵' : '🔸';

    iconHtml = `
      <div style="
        width: 24px;
        height: 24px;
        border-radius: 50%;
        background: ${color};
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 14px;
        border: 2px solid white;
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
      ">
        ${symbol}
      </div>
    `;
  }

  return L.divIcon({
    className: 'vessel-marker',
    html: iconHtml,
    iconSize,
    iconAnchor
  });
}

// Helper function to format vessel type for display
function formatVesselType(type: string): string {
  const typeMap: Record<string, string> = {
    industrial_fishing: 'Industrial Fishing Vessel',
    commercial_fishing: 'Commercial Fishing Vessel',
    small_commercial: 'Small Commercial Vessel',
    artisanal: 'Artisanal Fishing Boat',
    unknown: 'Unidentified Vessel'
  };

  return typeMap[type] || type;
}

// Classify vessel type based on radiance signature
function classifyVesselType(vessel: any) {
  const { radiance } = vessel;

  // Simple classification based on radiance levels
  if (radiance > 100) {
    return 'industrial_fishing';
  } else if (radiance > 50) {
    return 'commercial_fishing';
  } else if (radiance > 20) {
    return 'small_commercial';
  } else if (radiance > 5) {
    return 'artisanal';
  }
  return 'unknown';
}

// Assess risk level based on various factors
function assessRiskLevel(vessel: any) {
  let riskScore = 0;

  // High radiance at night
  if (vessel.radiance > 100) riskScore += 3;
  else if (vessel.radiance > 50) riskScore += 2;
  else if (vessel.radiance > 20) riskScore += 1;

  // Location-based risk (near protected areas, etc.)
  if (vessel.lat < -15 && vessel.lon < 11) {
    riskScore += 1; // Southern protected zone
  }

  // Time-based risk (illegal fishing hours)
  const hour = new Date(vessel.detectionTime || vessel.timestamp || '').getHours();
  if (hour >= 22 || hour <= 4) {
    riskScore += 1;
  }

  if (riskScore >= 4) return 'high';
  if (riskScore >= 2) return 'medium';
  return 'low';
}