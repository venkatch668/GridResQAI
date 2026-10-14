import React, { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { GridAsset, ThemeMode, EndUserPremises } from '../types';
import {
  MAP_CENTER,
  MAP_DEFAULT_ZOOM,
  getSubstationsGeoJSON,
  getFeederLinesGeoJSON,
  getTransformersGeoJSON,
  getEndUsersGeoJSON,
  getServiceDropsGeoJSON,
} from '../mock/gridTopology';
import {
  Layers,
  Compass,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  AlertTriangle,
  CheckCircle2,
  Share2,
  Building,
  Cpu,
  User,
} from 'lucide-react';

interface GridMapLibreProps {
  theme: ThemeMode;
  assets: GridAsset[];
  endUsers: EndUserPremises[];
  selectedAsset: GridAsset | null;
  selectedEndUser: EndUserPremises | null;
  focusedCoordinates: [number, number] | null;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  onSelectAsset: (asset: GridAsset | null) => void;
  onSelectEndUser: (user: EndUserPremises | null) => void;
}

export const GridMapLibre: React.FC<GridMapLibreProps> = ({
  theme,
  assets,
  endUsers,
  selectedAsset,
  selectedEndUser,
  focusedCoordinates,
  isFullscreen,
  onToggleFullscreen,
  onSelectAsset,
  onSelectEndUser,
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    const mapInstance = new maplibregl.Map({
      container: mapContainer.current,
      style: {
        version: 8,
        sources: {
          'osm-dark': {
            type: 'raster',
            tiles: [
              'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
            ],
            tileSize: 256,
            attribution: '© OpenStreetMap contributors (TSSPDCL Hyderabad)',
          },
          'osm-light': {
            type: 'raster',
            tiles: [
              'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
            ],
            tileSize: 256,
            attribution: '© OpenStreetMap contributors (TSSPDCL Hyderabad)',
          },
        },
        layers: [
          {
            id: 'osm-dark-layer',
            type: 'raster',
            source: 'osm-dark',
            layout: { visibility: theme === 'dark' ? 'visible' : 'none' },
          },
          {
            id: 'osm-light-layer',
            type: 'raster',
            source: 'osm-light',
            layout: { visibility: theme === 'light' ? 'visible' : 'none' },
          },
        ],
      },
      center: MAP_CENTER,
      zoom: MAP_DEFAULT_ZOOM,
    });

    mapInstance.on('load', () => {
      // 1. Feeder Lines Layer
      mapInstance.addSource('feeder-lines', {
        type: 'geojson',
        data: getFeederLinesGeoJSON(),
      });
      mapInstance.addLayer({
        id: 'feeder-lines-layer',
        type: 'line',
        source: 'feeder-lines',
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: {
          'line-color': ['get', 'color'],
          'line-width': 4.5,
          'line-opacity': 0.85,
        },
      });

      // 2. Service Drop Lines (DTR to Consumer)
      mapInstance.addSource('service-drops', {
        type: 'geojson',
        data: getServiceDropsGeoJSON(),
      });
      mapInstance.addLayer({
        id: 'service-drops-layer',
        type: 'line',
        source: 'service-drops',
        paint: {
          'line-color': '#a855f7',
          'line-width': 2,
          'line-dasharray': [2, 2],
          'line-opacity': 0.8,
        },
      });

      // 3. Substations Layer (33/11kV)
      mapInstance.addSource('substations', {
        type: 'geojson',
        data: getSubstationsGeoJSON(),
      });
      mapInstance.addLayer({
        id: 'substations-point',
        type: 'circle',
        source: 'substations',
        paint: {
          'circle-radius': 11,
          'circle-color': '#0284c7',
          'circle-stroke-width': 3,
          'circle-stroke-color': '#ffffff',
        },
      });

      // 4. Transformers Layer (DTR / 11kV to 415V)
      mapInstance.addSource('transformers', {
        type: 'geojson',
        data: getTransformersGeoJSON(assets),
      });
      mapInstance.addLayer({
        id: 'transformers-glow',
        type: 'circle',
        source: 'transformers',
        paint: {
          'circle-radius': 15,
          'circle-color': ['get', 'color'],
          'circle-opacity': 0.25,
        },
      });
      mapInstance.addLayer({
        id: 'transformers-point',
        type: 'circle',
        source: 'transformers',
        paint: {
          'circle-radius': 7.5,
          'circle-color': ['get', 'color'],
          'circle-stroke-width': 2.5,
          'circle-stroke-color': '#ffffff',
        },
      });

      // 5. End Users Layer (USC Consumers)
      mapInstance.addSource('end-users', {
        type: 'geojson',
        data: getEndUsersGeoJSON(endUsers),
      });
      mapInstance.addLayer({
        id: 'end-users-point',
        type: 'circle',
        source: 'end-users',
        paint: {
          'circle-radius': 4.5,
          'circle-color': '#c084fc',
          'circle-stroke-width': 1.5,
          'circle-stroke-color': '#ffffff',
        },
      });

      // Click Events
      mapInstance.on('click', 'transformers-point', (e) => {
        if (!e.features || e.features.length === 0) return;
        const id = e.features[0].properties?.id;
        const matched = assets.find((a) => a.id === id);
        if (matched) onSelectAsset(matched);
      });

      mapInstance.on('click', 'end-users-point', (e) => {
        if (!e.features || e.features.length === 0) return;
        const id = e.features[0].properties?.id;
        const matched = endUsers.find((u) => u.id === id);
        if (matched) onSelectEndUser(matched);
      });

      mapInstance.on('mouseenter', 'transformers-point', () => {
        mapInstance.getCanvas().style.cursor = 'pointer';
      });
      mapInstance.on('mouseleave', 'transformers-point', () => {
        mapInstance.getCanvas().style.cursor = '';
      });

      map.current = mapInstance;
      setMapLoaded(true);
    });

    return () => {
      mapInstance.remove();
      map.current = null;
    };
  }, []);

  // Update Tile Layer Visibility on Theme Change (Dark vs Light)
  useEffect(() => {
    if (!map.current || !mapLoaded) return;
    map.current.setLayoutProperty(
      'osm-dark-layer',
      'visibility',
      theme === 'dark' ? 'visible' : 'none'
    );
    map.current.setLayoutProperty(
      'osm-light-layer',
      'visibility',
      theme === 'light' ? 'visible' : 'none'
    );
  }, [theme, mapLoaded]);

  // Update Transformers GeoJSON
  useEffect(() => {
    if (!map.current || !mapLoaded) return;
    const trSource = map.current.getSource('transformers') as maplibregl.GeoJSONSource;
    if (trSource) trSource.setData(getTransformersGeoJSON(assets));
  }, [assets, mapLoaded]);

  // Fly to Coordinates
  useEffect(() => {
    if (!map.current || !mapLoaded || !focusedCoordinates) return;
    map.current.flyTo({
      center: focusedCoordinates,
      zoom: 16.2,
      duration: 1200,
    });
  }, [focusedCoordinates, mapLoaded]);

  // Trigger map resize on fullscreen toggle or container size change
  useEffect(() => {
    if (map.current) {
      setTimeout(() => map.current?.resize(), 200);
    }
  }, [isFullscreen]);

  useEffect(() => {
    if (!map.current || !mapContainer.current) return;
    const resizeObserver = new ResizeObserver(() => {
      map.current?.resize();
    });
    resizeObserver.observe(mapContainer.current);
    return () => resizeObserver.disconnect();
  }, [mapLoaded]);

  return (
    <div
      className={`relative w-full rounded-2xl overflow-hidden border shadow-2xl transition-all duration-300 ${
        isFullscreen
          ? 'fixed inset-0 z-50 h-screen w-screen rounded-none border-0'
          : 'h-full min-h-[580px] lg:min-h-[calc(100vh-215px)]'
      } ${theme === 'dark' ? 'border-slate-800 bg-slate-950' : 'border-slate-200 bg-white'}`}
    >
      {/* Map Container */}
      <div ref={mapContainer} className="w-full h-full" />

      {/* Top Breadcrumb: Electrical Grid Hierarchy Representation */}
      <div className="absolute top-3 left-3 right-16 z-10 pointer-events-none">
        <div
          className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border backdrop-blur-md shadow-xl text-xs pointer-events-auto ${
            theme === 'dark'
              ? 'bg-slate-900/90 border-slate-700/80 text-white'
              : 'bg-white/95 border-slate-300 text-slate-800'
          }`}
        >
          <div className="flex items-center gap-1 text-sky-400 font-semibold">
            <Building className="w-3.5 h-3.5" />
            <span>33/11kV Substation</span>
          </div>
          <span className="text-slate-400">➔</span>
          <div className="flex items-center gap-1 text-cyan-400 font-semibold">
            <Share2 className="w-3.5 h-3.5" />
            <span>11kV Feeder Line</span>
          </div>
          <span className="text-slate-400">➔</span>
          <div className="flex items-center gap-1 text-amber-400 font-semibold">
            <Cpu className="w-3.5 h-3.5" />
            <span>DTR Transformer</span>
          </div>
          <span className="text-slate-400">➔</span>
          <div className="flex items-center gap-1 text-purple-400 font-semibold">
            <User className="w-3.5 h-3.5" />
            <span>End User (USC)</span>
          </div>
        </div>
      </div>

      {/* Map Controls: Fullscreen, Zoom, Compass */}
      <div className="absolute top-3 right-3 flex flex-col gap-2 z-10">
        <div
          className={`backdrop-blur-md border rounded-xl p-1.5 shadow-xl flex flex-col gap-1 ${
            theme === 'dark' ? 'bg-slate-900/90 border-slate-700/80 text-white' : 'bg-white/95 border-slate-300 text-slate-700'
          }`}
        >
          {/* Fullscreen Button */}
          <button
            onClick={onToggleFullscreen}
            className="p-1.5 hover:bg-slate-700/30 rounded-lg transition-colors cursor-pointer"
            title={isFullscreen ? 'Exit Fullscreen' : 'Full Screen Map'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4 text-cyan-400" /> : <Maximize2 className="w-4 h-4 text-cyan-400" />}
          </button>
          <button
            onClick={() => map.current?.zoomIn()}
            className="p-1.5 hover:bg-slate-700/30 rounded-lg transition-colors cursor-pointer"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={() => map.current?.zoomOut()}
            className="p-1.5 hover:bg-slate-700/30 rounded-lg transition-colors cursor-pointer"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            onClick={() => map.current?.flyTo({ center: MAP_CENTER, zoom: MAP_DEFAULT_ZOOM })}
            className="p-1.5 hover:bg-slate-700/30 rounded-lg transition-colors cursor-pointer text-cyan-400"
            title="Reset Hyderabad Center View"
          >
            <Compass className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* TSSPDCL Grid Layers Legend Overlay */}
      <div
        className={`absolute bottom-3 left-3 backdrop-blur-md border rounded-xl p-3 text-xs shadow-xl max-w-xs z-10 ${
          theme === 'dark' ? 'bg-slate-900/90 border-slate-800 text-slate-200' : 'bg-white/95 border-slate-300 text-slate-800'
        }`}
      >
        <div className="flex items-center gap-1.5 font-bold mb-2">
          <Layers className="w-3.5 h-3.5 text-cyan-500" />
          <span>TSSPDCL Hyderabad Hierarchy</span>
        </div>
        <div className="grid grid-cols-2 gap-2 text-[11px]">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-sky-500 border border-white" />
            <span>33/11kV Substation</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span>DTR Healthy</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
            <span>DTR Outage / Fault</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-purple-500" />
            <span>End User Meter (USC)</span>
          </div>
        </div>
      </div>

      {/* Selected Asset / Consumer Inspector */}
      {selectedAsset && (
        <div
          className={`absolute bottom-3 right-3 backdrop-blur-md border rounded-xl p-3.5 text-xs shadow-2xl max-w-sm z-10 animate-fade-in ${
            theme === 'dark' ? 'bg-slate-900/95 border-slate-700 text-white' : 'bg-white/95 border-slate-300 text-slate-900'
          }`}
        >
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-mono text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
              {selectedAsset.code}
            </span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                selectedAsset.state === 'HEALTHY'
                  ? 'bg-emerald-500/20 text-emerald-400'
                  : 'bg-red-500/20 text-red-400 animate-pulse'
              }`}
            >
              {selectedAsset.state}
            </span>
          </div>
          <h4 className="text-xs font-bold mb-1">{selectedAsset.name}</h4>
          <p className="text-[11px] opacity-75 mb-2">
            Voltage: {selectedAsset.voltage} | Capacity: {selectedAsset.capacityKva || 250} kVA
          </p>
          <div className="p-2 rounded-lg bg-black/20 text-[11px] flex items-center justify-between">
            <span className="opacity-75">Consumers Affected:</span>
            <span className="font-bold font-mono">{selectedAsset.consumersAffected || 0} meters</span>
          </div>
        </div>
      )}
    </div>
  );
};
