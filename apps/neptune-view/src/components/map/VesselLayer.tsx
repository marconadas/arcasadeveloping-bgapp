'use client';

import { useEffect, useState } from 'react';
import L from 'leaflet';
import { Marker, Tooltip, Popup, useMap } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import { VesselData } from '@/lib/types';
import { Ship, Navigation, MapPin, Clock, Anchor, AlertTriangle } from 'lucide-react';
import { formatVesselSpeed, formatTimestamp } from '@/lib/utils';

interface VesselLayerProps {
  vessels: VesselData[];
  onVesselSelect?: (vessel: VesselData) => void;
  showTooltips?: boolean;
}

export function VesselLayer({ vessels, onVesselSelect, showTooltips = true }: VesselLayerProps) {
  const map = useMap();
  const [hoveredVessel, setHoveredVessel] = useState<string | null>(null);
  const [selectedVessel, setSelectedVessel] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile device and optimize clustering
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Optimize clustering parameters based on device
  const clusteringConfig = {
    maxClusterRadius: isMobile ? 60 : 50,
    disableClusteringAtZoom: isMobile ? 13 : 15,
    showCoverageOnHover: !isMobile,
    spiderfyOnMaxZoom: !isMobile
  };

  // Create vessel icon based on type and status
  const createVesselIcon = (vessel: VesselData, isHovered: boolean = false) => {
    const colors = {
      Fishing: '#10B981',
      Cargo: '#3B82F6',
      Tanker: '#F59E0B',
      Supply: '#8B5CF6',
      Container: '#06B6D4',
      Research: '#EC4899',
      default: '#6B7280'
    };

    const color = colors[vessel.type as keyof typeof colors] || colors.default;
    const size = isHovered ? 28 : (vessel.length ? Math.min(Math.max(vessel.length / 10, 16), 24) : 20);
    const isAnchored = vessel.speed < 0.5;
    const isHighSpeed = vessel.speed > 20;

    return L.divIcon({
      className: 'vessel-marker-enhanced',
      html: `
        <div style="
          position: relative;
          width: ${size}px;
          height: ${size}px;
          transition: all 0.2s ease;
        ">
          <!-- Vessel body -->
          <div style="
            position: absolute;
            width: 100%;
            height: 100%;
            background: ${color};
            border: 2px solid ${isHovered ? '#fff' : 'rgba(255,255,255,0.9)'};
            border-radius: 50% 50% 50% 0;
            box-shadow: 0 2px 8px rgba(0,0,0,${isHovered ? 0.6 : 0.4});
            transform: rotate(-45deg);
            animation: ${isHovered ? 'pulse 1.5s infinite' : 'none'};
          "></div>
          
          <!-- Direction indicator -->
          ${vessel.course !== undefined ? `
            <div style="
              position: absolute;
              width: 2px;
              height: ${size * 2}px;
              background: linear-gradient(to bottom, ${color}80, transparent);
              left: 50%;
              top: ${size/2}px;
              transform: translateX(-50%) rotate(${vessel.course}deg);
              transform-origin: top center;
              opacity: 0.7;
            "></div>
          ` : ''}
          
          <!-- Status indicator -->
          ${isAnchored ? `
            <div style="
              position: absolute;
              top: -4px;
              right: -4px;
              width: 8px;
              height: 8px;
              background: #FEF3C7;
              border: 1px solid #F59E0B;
              border-radius: 50%;
            "></div>
          ` : ''}
          
          ${isHighSpeed ? `
            <div style="
              position: absolute;
              top: -4px;
              right: -4px;
              width: 8px;
              height: 8px;
              background: #FEE2E2;
              border: 1px solid #EF4444;
              border-radius: 50%;
              animation: blink 1s infinite;
            "></div>
          ` : ''}
        </div>
        
        <style>
          @keyframes pulse {
            0% { transform: rotate(-45deg) scale(1); }
            50% { transform: rotate(-45deg) scale(1.1); }
            100% { transform: rotate(-45deg) scale(1); }
          }
          @keyframes blink {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
          }
        </style>
      `,
      iconSize: [size, size],
      iconAnchor: [size/2, size]
    });
  };

  // Create custom cluster icon
  const createClusterCustomIcon = (cluster: L.MarkerCluster) => {
    const childCount = cluster.getChildCount();
    let className = 'marker-cluster-';
    let size = 40;

    if (childCount < 10) {
      className += 'small';
      size = 40;
    } else if (childCount < 50) {
      className += 'medium';
      size = 50;
    } else {
      className += 'large';
      size = 60;
    }

    return L.divIcon({
      html: `
        <div style="
          background: linear-gradient(135deg, #667EEA 0%, #764BA2 100%);
          color: white;
          border-radius: 50%;
          width: ${size}px;
          height: ${size}px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
          font-size: ${size/3}px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
          border: 3px solid white;
        ">
          ${childCount}
        </div>
      `,
      className: className,
      iconSize: [size, size]
    });
  };

  return (
    <MarkerClusterGroup
      chunkedLoading
      iconCreateFunction={createClusterCustomIcon}
      maxClusterRadius={clusteringConfig.maxClusterRadius}
      spiderfyOnMaxZoom={clusteringConfig.spiderfyOnMaxZoom}
      showCoverageOnHover={clusteringConfig.showCoverageOnHover}
      zoomToBoundsOnClick={false}
      disableClusteringAtZoom={clusteringConfig.disableClusteringAtZoom}
    >
      {vessels.map((vessel) => {
        const isHovered = hoveredVessel === vessel.id;
        const isSelected = selectedVessel === vessel.id;
        const isAnchored = vessel.speed < 0.5;

        return (
          <Marker
            key={vessel.id}
            position={[vessel.latitude, vessel.longitude]}
            icon={createVesselIcon(vessel, isHovered || isSelected)}
            eventHandlers={{
              mouseover: isMobile ? undefined : () => setHoveredVessel(vessel.id),
              mouseout: isMobile ? undefined : () => setHoveredVessel(null),
              click: (e) => {
                // Prevent default map centering behavior
                L.DomEvent.stopPropagation(e);
                setSelectedVessel(selectedVessel === vessel.id ? null : vessel.id);
                onVesselSelect?.(vessel);
              }
            }}
          >
            {showTooltips && (isHovered || isSelected) && !isMobile && (
              <Tooltip
                permanent={isSelected}
                direction="top"
                offset={[0, -25]}
                className="vessel-tooltip-enhanced"
                sticky={true}
              >
                <div className="bg-white/95 backdrop-blur-xl rounded-lg p-3 text-gray-900 min-w-[240px] border border-gray-200/50 shadow-2xl">
                  {/* Header */}
                  <div className="flex items-center gap-2 mb-2 pb-2 border-b border-gray-200/50">
                    <Ship className="w-4 h-4 text-blue-600" />
                    <div className="font-bold text-sm">{vessel.name}</div>
                    {isAnchored && <Anchor className="w-3 h-3 text-yellow-600" />}
                  </div>

                  {/* Quick Info */}
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                    <div className="flex items-center gap-1">
                      <Navigation className="w-3 h-3 text-green-600" />
                      <span>{formatVesselSpeed(vessel.speed)}</span>
                    </div>
                    <div className="text-gray-600">
                      {vessel.course}°
                    </div>
                    {vessel.destination && (
                      <div className="col-span-2 flex items-center gap-1 mt-1">
                        <MapPin className="w-3 h-3 text-orange-600" />
                        <span className="truncate">{vessel.destination}</span>
                      </div>
                    )}
                    {vessel.eta && (
                      <div className="col-span-2 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-yellow-600" />
                        <span className="text-gray-700">
                          {new Date(vessel.eta).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Status Badge */}
                  <div className="mt-2 flex items-center gap-2">
                    <div className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                      vessel.type === 'Fishing' ? 'bg-green-100 text-green-700' :
                      vessel.type === 'Cargo' ? 'bg-blue-100 text-blue-700' :
                      vessel.type === 'Tanker' ? 'bg-amber-100 text-amber-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {vessel.type}
                    </div>
                    <div className="text-[10px] text-gray-500">
                      {vessel.flag}
                    </div>
                  </div>
                </div>
              </Tooltip>
            )}

            {/* Mobile Simple Tooltip - Only on selection */}
            {showTooltips && isSelected && isMobile && (
              <Tooltip
                permanent={true}
                direction="top"
                offset={[0, -15]}
                className="vessel-tooltip-mobile"
              >
                <div className="bg-white/95 backdrop-blur-lg rounded-md p-2 text-gray-900 min-w-[140px] border border-gray-200/50 shadow-lg">
                  <div className="flex items-center gap-1 mb-1">
                    <Ship className="w-3 h-3 text-blue-600" />
                    <div className="font-semibold text-xs truncate">{vessel.name}</div>
                  </div>
                  <div className="text-[10px] text-gray-600">
                    {formatVesselSpeed(vessel.speed)} • {vessel.type}
                  </div>
                </div>
              </Tooltip>
            )}

            <Popup>
              <VesselPopup vessel={vessel} />
            </Popup>
          </Marker>
        );
      })}
    </MarkerClusterGroup>
  );
}

function VesselPopup({ vessel }: { vessel: VesselData }) {
  const isAnchored = vessel.speed < 0.5;
  
  return (
    <div className="p-4 min-w-[300px] max-w-[400px]">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-bold text-lg">{vessel.name}</h3>
          <p className="text-sm text-gray-500">{vessel.type} Vessel</p>
        </div>
        <div className="flex items-center gap-2">
          {isAnchored && (
            <div className="px-2 py-1 bg-yellow-100 rounded-full">
              <Anchor className="w-4 h-4 text-yellow-600" />
            </div>
          )}
          {vessel.speed > 20 && (
            <div className="px-2 py-1 bg-red-100 rounded-full">
              <AlertTriangle className="w-4 h-4 text-red-600" />
            </div>
          )}
        </div>
      </div>

      {/* Vessel Details */}
      <div className="space-y-3">
        {/* Identification */}
        <div className="grid grid-cols-2 gap-3 p-3 bg-gray-50 rounded-lg">
          <div>
            <span className="text-xs text-gray-500 block">MMSI</span>
            <span className="font-mono font-medium">{vessel.mmsi}</span>
          </div>
          {vessel.imo && (
            <div>
              <span className="text-xs text-gray-500 block">IMO</span>
              <span className="font-mono font-medium">{vessel.imo}</span>
            </div>
          )}
          {vessel.callsign && (
            <div>
              <span className="text-xs text-gray-500 block">Call Sign</span>
              <span className="font-mono font-medium">{vessel.callsign}</span>
            </div>
          )}
          <div>
            <span className="text-xs text-gray-500 block">Flag</span>
            <span className="font-medium">{vessel.flag}</span>
          </div>
        </div>

        {/* Navigation */}
        <div className="p-3 bg-blue-50 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Navigation className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-900">Navigation</span>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-xs text-gray-500 block">Speed</span>
              <span className="font-medium">{formatVesselSpeed(vessel.speed)}</span>
            </div>
            <div>
              <span className="text-xs text-gray-500 block">Course</span>
              <span className="font-medium">{vessel.course}°</span>
            </div>
            {vessel.heading !== undefined && (
              <div>
                <span className="text-xs text-gray-500 block">Heading</span>
                <span className="font-medium">{vessel.heading}°</span>
              </div>
            )}
            <div>
              <span className="text-xs text-gray-500 block">Position</span>
              <span className="font-mono text-xs">
                {vessel.latitude.toFixed(4)}°, {vessel.longitude.toFixed(4)}°
              </span>
            </div>
          </div>
        </div>

        {/* Destination */}
        {vessel.destination && (
          <div className="p-3 bg-orange-50 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <MapPin className="w-4 h-4 text-orange-600" />
              <span className="text-sm font-medium text-orange-900">Destination</span>
            </div>
            <p className="font-medium">{vessel.destination}</p>
            {vessel.eta && (
              <p className="text-sm text-gray-600 mt-1">
                ETA: {new Date(vessel.eta).toLocaleString()}
              </p>
            )}
          </div>
        )}

        {/* Dimensions */}
        {vessel.length && (
          <div className="p-3 bg-gray-50 rounded-lg">
            <span className="text-xs text-gray-500 block mb-1">Dimensions</span>
            <div className="text-sm font-medium">
              Length: {vessel.length}m | Width: {vessel.width}m | Draught: {vessel.draught}m
            </div>
          </div>
        )}

        {/* Last Update */}
        <div className="text-xs text-gray-400 text-right">
          Last update: {formatTimestamp(vessel.timestamp)}
        </div>
      </div>
    </div>
  );
}