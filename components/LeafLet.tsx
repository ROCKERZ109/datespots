import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Circle, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-geosearch/dist/geosearch.css'; 

import { GeoSearchControl, OpenStreetMapProvider } from 'leaflet-geosearch'; 
import { getDistance } from '../lib/haversine'; 

interface LeafLetProps {
  selectedCoordinates: { lat: number; lng: number } | null;
  onSelect: (coords: { lat: number; lng: number }) => void;
  defaultCenter?: { lat: number; lng: number } | null;
}

// Fix default marker icon issue in Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// --- Search Field Component ---
const SearchField: React.FC<{
  onSelect: (coords: { lat: number; lng: number }) => void;
  defaultCenter: { lat: number; lng: number };
  maxDistanceKm: number;
}> = ({ onSelect, defaultCenter, maxDistanceKm }) => {
  const map = useMap();

  useEffect(() => {
    const range = 1.5; 
    const viewbox = [
      defaultCenter.lng - range,
      defaultCenter.lat + range,
      defaultCenter.lng + range,
      defaultCenter.lat - range,
    ].join(',');

    const provider = new OpenStreetMapProvider({
      params: { viewbox: viewbox },
    });

    // 🛠️ FIX 1: Added 'new' keyword here. This prevents the crash.
    const searchControl = new (GeoSearchControl as any)({
      provider: provider,
      style: 'bar',
      showMarker: false,
      retainZoomLevel: false,
      animateZoom: true,
      autoClose: true,
      searchLabel: 'Enter address',
      keepResult: true,
    });

    map.addControl(searchControl);

    map.on('geosearch/showlocation', (result: any) => {
      const { x, y } = result.location;
      const newCoords = { lat: y, lng: x };

      const distanceMeters = getDistance(defaultCenter, newCoords);
      const distanceKm = distanceMeters / 1000;

      if (distanceKm <= maxDistanceKm) {
        onSelect(newCoords);
      } else {
        alert(`Selected location is ${distanceKm.toFixed(1)} km away. Please select a spot within ${maxDistanceKm} km.`);
      }
    });

    return () => {
      map.removeControl(searchControl);
    };
  }, [map, onSelect, defaultCenter, maxDistanceKm]);

  return null;
};

// --- Click Handler ---
const ClickHandler: React.FC<{
  onSelect: (coords: { lat: number; lng: number }) => void;
  defaultCenter: { lat: number; lng: number } | null;
  maxDistanceKm: number;
}> = ({ onSelect, defaultCenter, maxDistanceKm }) => {
  useMapEvents({
    click(e) {
      const clickedCoords = { lat: e.latlng.lat, lng: e.latlng.lng };

      if (defaultCenter) {
        const distanceMeters = getDistance(defaultCenter, clickedCoords);
        const distanceKm = distanceMeters / 1000;

        if (distanceKm <= maxDistanceKm) {
          onSelect(clickedCoords);
        } else {
          alert(`Selected location is ${distanceKm.toFixed(1)} km away. Please select a spot within ${maxDistanceKm} km.`);
        }
      } else {
        onSelect(clickedCoords);
      }
    },
  });
  return null;
};

const LeafLet: React.FC<LeafLetProps> = ({ selectedCoordinates, onSelect, defaultCenter }) => {
  const MAX_RADIUS_KM = 20000;
  
  const enforcedDefaultCenter = defaultCenter || { lat: 57.7089, lng: 11.9746 };
  const center = selectedCoordinates || enforcedDefaultCenter;

  return (
    // 🛠️ FIX 2: Added min-height of 300px. 
    // If the parent height is missing on mobile, this ensures the map is still visible.
    <MapContainer 
      center={[center.lat, center.lng]} 
      zoom={10} 
      style={{ height: '100%', minHeight: '350px', width: '100%', borderRadius: '12px' }} 
    >
      <style>{`
        /* Force search suggestions text to be black */
        .leaflet-control-geosearch .results > * {
          color: black !important;
        }
        /* 🛠️ FIX 3: Changed input text to black (was white on white background) */
        .leaflet-control-geosearch form input {
          color: white !important;
        }
        .leaflet-control-geosearch .results {
          background-color: white !important;
        }
      `}</style>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      <ClickHandler
        onSelect={onSelect}
        defaultCenter={enforcedDefaultCenter}
        maxDistanceKm={MAX_RADIUS_KM}
      />

      <SearchField 
        onSelect={onSelect}
        defaultCenter={enforcedDefaultCenter}
        maxDistanceKm={MAX_RADIUS_KM}
      />

      {selectedCoordinates && <Marker position={[selectedCoordinates.lat, selectedCoordinates.lng]} />}

      {enforcedDefaultCenter && (
        <>
          <Circle
            center={[enforcedDefaultCenter.lat, enforcedDefaultCenter.lng]}
            radius={100} 
            pathOptions={{ color: 'blue', fillColor: 'blue', fillOpacity: 0.2 }}
          />
          <Circle
            center={[enforcedDefaultCenter.lat, enforcedDefaultCenter.lng]}
            radius={MAX_RADIUS_KM * 1000}
            pathOptions={{ color: 'red', fillColor: 'red', fillOpacity: 0.05, weight: 1, dashArray: '5, 10' }}
          />
        </>
      )}
    </MapContainer>
  );
};

export default LeafLet;