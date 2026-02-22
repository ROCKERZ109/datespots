// components/GeosearchControl.tsx
import { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet-geosearch/dist/geosearch.css';
import { GeoSearchControl as LeafletGeoSearchControl, OpenStreetMapProvider } from 'leaflet-geosearch';
import { getDistance } from '@/lib/haversine';

interface GeosearchControlProps {
  onSelect: (coords: { lat: number; lng: number }) => void;
  defaultCenter: { lat: number; lng: number };
  maxDistanceKm: number;
}

const GeosearchControl: React.FC<GeosearchControlProps> = ({ 
  onSelect, 
  defaultCenter, 
  maxDistanceKm 
}) => {
  const map = useMap();
  const controlRef = useRef<L.Control | null>(null);

  useEffect(() => {
    const provider = new OpenStreetMapProvider();
    
    // Create the GeoSearch control instance
    const searchControl = new (LeafletGeoSearchControl as any)({
      provider,
      style: 'bar',
      showMarker: false,
      retainZoomLevel: false,
      animateZoom: true,
      autoClose: true,
      searchLabel: 'Enter address',
      keepResult: true,
    });

    // Store reference for cleanup
    controlRef.current = searchControl;

    // Add the control to the map
    map.addControl(searchControl);

    // Define the event handler
    const handleLocationFound = (result: any) => {
      if (result && result.location) {
        const { y: lat, x: lng } = result.location;
        const newCoords = { lat, lng };
        
        // Optional: Check distance constraint
        if (defaultCenter) {
          const distanceMeters = getDistance(defaultCenter, newCoords);
          const distanceKm = distanceMeters / 1000;
          
          if (distanceKm <= maxDistanceKm) {
            onSelect(newCoords);
          } else {
            alert(`Location is ${distanceKm.toFixed(1)} km away. Max allowed: ${maxDistanceKm} km.`);
          }
        } else {
          onSelect(newCoords);
        }
      }
    };

    // Add the event listener
    map.on('geosearch/showlocation', handleLocationFound);

    // Cleanup function
    return () => {
      // Remove the event listener
      map.off('geosearch/showlocation', handleLocationFound);
      
      // Remove the control from the map
      if (controlRef.current) {
        map.removeControl(controlRef.current);
        controlRef.current = null;
      }
    };
  }, [map, onSelect, defaultCenter, maxDistanceKm]);

  return null; // This component doesn't render anything itself
};

export default GeosearchControl;