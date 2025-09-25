// components/LeafLet.tsx
import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface LeafLetProps {
  selectedCoordinates: { lat: number; lng: number } | null;
  onSelect: (coords: { lat: number; lng: number }) => void;
}

// Fix default marker icon issue in Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const ClickHandler: React.FC<{ onSelect: (coords: { lat: number; lng: number }) => void }> = ({ onSelect }) => {
  useMapEvents({
    click(e) {
      onSelect({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });
  return null;
};

const LeafLet: React.FC<LeafLetProps> = ({ selectedCoordinates, onSelect }) => {
  const center = selectedCoordinates || { lat: 57.7089, lng: 11.9746 }; // Default: Gothenburg

  return (
    <MapContainer center={[center.lat, center.lng]} zoom={13} style={{ height: '100%', width: '100%' }}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <ClickHandler onSelect={onSelect} />
      {selectedCoordinates && <Marker position={[selectedCoordinates.lat, selectedCoordinates.lng]} />}
    </MapContainer>
  );
};

export default LeafLet;
