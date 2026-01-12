// components/MapComponent.tsx - OpenLayers with Autocomplete
import React, { useEffect, useRef, useState, useCallback } from 'react';
import 'ol/ol.css';
import { Map, View } from 'ol';
import TileLayer from 'ol/layer/Tile';
import OSM from 'ol/source/OSM';
import { fromLonLat, toLonLat } from 'ol/proj';
import { Vector as VectorLayer } from 'ol/layer';
import { Vector as VectorSource } from 'ol/source';
import { Feature } from 'ol';
import { Point, Circle as CircleGeom } from 'ol/geom';
import { Style, Icon, Fill, Stroke, Circle as CircleStyle } from 'ol/style';
import { defaults as defaultControls } from 'ol/control';
import { getDistance } from '../lib/haversine';

// Toast Notification Component
const ErrorToast: React.FC<{ message: string; onClose: () => void }> = ({ message, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-[1000] animate-slideDown">
      <div className="bg-red-500 text-white px-6 py-3 rounded-xl shadow-2xl flex items-center space-x-3 max-w-sm">
        <span className="text-xl">⚠️</span>
        <p className="text-sm font-medium">{message}</p>
        <button 
          onClick={onClose}
          className="ml-2 text-white/80 hover:text-white transition-colors"
        >
          ✕
        </button>
      </div>
    </div>
  );
};

interface SearchResult {
  display_name: string;
  lat: string;
  lon: string;
  place_id: string;
}

// Search Component with Autocomplete
const SearchBar: React.FC<{
  onSearch: (lat: number, lng: number) => void;
  isSearching: boolean;
  defaultCenter: { lat: number; lng: number };
  maxDistanceKm: number;
  onError: (message: string) => void;
}> = ({ onSearch, isSearching, defaultCenter, maxDistanceKm, onError }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<SearchResult[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Fetch suggestions from Nominatim
  const fetchSuggestions = useCallback(async (query: string) => {
    if (query.length < 3) {
      setSuggestions([]);
      return;
    }

    setIsLoadingSuggestions(true);

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&addressdetails=1`,
        { signal: AbortSignal.timeout(5000) }
      );

      if (!response.ok) throw new Error('Search failed');

      const data: SearchResult[] = await response.json();
      setSuggestions(data);
      setShowSuggestions(data.length > 0);
    } catch (error) {
      console.error('Autocomplete error:', error);
      setSuggestions([]);
    } finally {
      setIsLoadingSuggestions(false);
    }
  }, []);

  // Debounced search
  const handleInputChange = (value: string) => {
    setSearchQuery(value);

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      fetchSuggestions(value);
    }, 300);
  };

  // Select a suggestion
  const selectSuggestion = (suggestion: SearchResult) => {
    const lat = parseFloat(suggestion.lat);
    const lng = parseFloat(suggestion.lon);
    const coords = { lat, lng };

    // Check if within range
    const dist = getDistance(defaultCenter, coords) / 1000;

    if (dist <= 20000) {
      onSearch(lat, lng);
      setSearchQuery(suggestion.display_name);
      setShowSuggestions(false);
      setSuggestions([]);
    } else {
      onError('Location is too far away. Please search within the red circle area.');
      setShowSuggestions(false);
    }
  };

  const handleClear = () => {
    setSearchQuery('');
    setSuggestions([]);
    setShowSuggestions(false);
  };

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="absolute top-4 left-4 right-16 z-[500] max-w-md" ref={suggestionsRef}>
      <div className="relative">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => handleInputChange(e.target.value)}
          onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
          placeholder="Search for a location..."
          className="w-full px-4 py-3 pr-12 border-2 border-pink-500 rounded-xl bg-white shadow-lg focus:outline-none focus:ring-2 focus:ring-pink-500/50 text-black touch-manipulation"
          style={{ fontSize: '16px' }}
        />
        
        {searchQuery && (
          <button
            onClick={handleClear}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 text-xl font-bold px-2 touch-manipulation"
          >
            ✕
          </button>
        )}

        {isLoadingSuggestions && (
          <div className="absolute right-12 top-1/2 transform -translate-y-1/2">
            <div className="animate-spin rounded-full h-5 w-5 border-2 border-pink-500 border-t-transparent"></div>
          </div>
        )}
      </div>

      {/* Suggestions Dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-2xl border-2 border-pink-200 max-h-64 overflow-y-auto">
          {suggestions.map((suggestion) => (
            <button
              key={suggestion.place_id}
              onClick={() => selectSuggestion(suggestion)}
              className="w-full text-left px-4 py-3 hover:bg-pink-50 transition-colors border-b border-gray-100 last:border-b-0 touch-manipulation"
            >
              <p className="text-sm text-gray-800 font-medium truncate">
                {suggestion.display_name}
              </p>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

interface MapComponentProps {
  selectedCoordinates: { lat: number; lng: number } | null;
  onSelect: (coords: { lat: number; lng: number }) => void;
  defaultCenter?: { lat: number; lng: number } | null;
}

const MapComponent: React.FC<MapComponentProps> = ({ 
  selectedCoordinates, 
  onSelect, 
  defaultCenter 
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<Map | null>(null);
  const markerLayerRef = useRef<VectorLayer<VectorSource> | null>(null);
  const centerLayerRef = useRef<VectorLayer<VectorSource> | null>(null);
  
  const [mounted, setMounted] = useState(false);
  const [isMapReady, setIsMapReady] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [currentCenter, setCurrentCenter] = useState<{ lat: number; lng: number } | null>(null);

  const MAX_RADIUS_KM = 200;
  const fallbackCenter = { lat: 57.7089, lng: 11.9746 }; // Göteborg
  const enforcedCenter = defaultCenter || currentCenter || fallbackCenter;

  // Get user's current location on mount
  useEffect(() => {
    setMounted(true);
    
    if (defaultCenter) {
      setCurrentCenter(defaultCenter);
      return;
    }

    // Try to get user's location with optimized settings
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCurrentCenter({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => {
          console.warn('Geolocation error:', error);
          // Fallback to Göteborg if location access denied
          setCurrentCenter(fallbackCenter);
        },
        { 
          timeout: 5000, 
          enableHighAccuracy: false,  // Low accuracy = faster, less battery
          maximumAge: 300000  // Cache position for 5 minutes
        }
      );
    } else {
      setCurrentCenter(fallbackCenter);
    }
  }, [defaultCenter]);

  // Initialize map - only once, don't re-initialize on coordinate changes
  useEffect(() => {
    if (!mapRef.current || !currentCenter || mapInstanceRef.current) return;

    // Prevent re-initialization
    if (isMapReady) return;

    try {
      // Create marker layer
      const markerSource = new VectorSource();
      const markerLayer = new VectorLayer({
        source: markerSource,
        style: new Style({
          image: new Icon({
            anchor: [0.5, 1],
            src: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
            scale: 1,
          }),
        }),
      });
      markerLayerRef.current = markerLayer;

      // Create center marker and radius circles
      const centerSource = new VectorSource();
      
      // Small blue circle at center
      const centerPoint = new Feature({
        geometry: new Point(fromLonLat([enforcedCenter.lng, enforcedCenter.lat])),
      });
      centerPoint.setStyle(new Style({
        image: new CircleStyle({
          radius: 6,
          fill: new Fill({ color: 'rgba(0, 0, 255, 0.6)' }),
          stroke: new Stroke({ color: 'blue', width: 2 }),
        }),
      }));
      centerSource.addFeature(centerPoint);

      // Large red radius circle (200km)
      const radiusCircle = new Feature({
        geometry: new CircleGeom(
          fromLonLat([enforcedCenter.lng, enforcedCenter.lat]),
          MAX_RADIUS_KM * 1000 // meters
        ),
      });
      radiusCircle.setStyle(new Style({
        stroke: new Stroke({
          color: 'rgba(255, 0, 0, 0.5)',
          width: 2,
          lineDash: [5, 10],
        }),
        fill: new Fill({ color: 'rgba(255, 0, 0, 0.05)' }),
      }));
      centerSource.addFeature(radiusCircle);

      const centerLayer = new VectorLayer({
        source: centerSource,
      });
      centerLayerRef.current = centerLayer;

      // Create map
      const map = new Map({
        target: mapRef.current,
        layers: [
          new TileLayer({
            source: new OSM({
              cacheSize: 1024,  // Reduced cache to save memory
              maxZoom: 15,
              transition: 0,  // Disable fade-in animation for instant rendering
            }),
            preload: 0,
            useInterimTilesOnError: false,
          }),
          centerLayer,
          markerLayer,
        ],
        view: new View({
          center: fromLonLat([enforcedCenter.lng, enforcedCenter.lat]),
          zoom: 10,
          maxZoom: 15,  // Further reduced to 15 for better performance
          minZoom: 3,
          constrainResolution: true,
          smoothResolutionConstraint: false,
        }),
        controls: defaultControls({
          attribution: true,
          zoom: true,
          rotate: false,  // Disable rotation control
        }),
        interactions: undefined,  // Use default interactions but we'll optimize rendering
        pixelRatio: 1,  // Force 1:1 pixel ratio for better performance on high-DPI screens
      });

      mapInstanceRef.current = map;

      // Throttle rendering to prevent overwhelming the browser
      let isRendering = false;
      const throttleRender = () => {
        if (!isRendering) {
          isRendering = true;
          requestAnimationFrame(() => {
            isRendering = false;
          });
        }
      };

      // Handle click events
      map.on('click', (event) => {
        const coords = toLonLat(event.coordinate);
        const clicked = { lat: coords[1], lng: coords[0] };
        
        const dist = getDistance(enforcedCenter, clicked) / 1000;
        
        if (dist <= 20000) {
          onSelect(clicked);
        } else {
          setErrorMessage('Location is too far away. Please select within the red circle.');
        }
      });

      // Throttle moveend events to reduce processing
      map.on('moveend', throttleRender);
      map.on('pointermove', throttleRender);

      // Listen to map render to know when it's actually ready
      map.once('rendercomplete', () => {
        setIsMapReady(true);
      });

      // Fallback timer in case rendercomplete doesn't fire
      const fallbackTimer = setTimeout(() => {
        if (!isMapReady) {
          setIsMapReady(true);
        }
      }, 1500);

      return () => {
        clearTimeout(fallbackTimer);
        // Don't destroy the map, just clean up the timer
      };
    } catch (error) {
      console.error('Map initialization error:', error);
      setErrorMessage('Failed to initialize map');
      setIsMapReady(true);
    }
  }, [currentCenter, onSelect]);  // Removed enforcedCenter from dependencies

  // Update marker when coordinates change (without animation or blinking)
  useEffect(() => {
    if (!markerLayerRef.current) return;

    const source = markerLayerRef.current.getSource();
    if (!source) return;

    // If no coordinates, clear the marker
    if (!selectedCoordinates) {
      source.clear();
      return;
    }

    // Check if marker already exists at this location to prevent blink
    const features = source.getFeatures();
    if (features.length > 0) {
      const existingMarker = features[0];
      const existingGeom = existingMarker.getGeometry() as Point;
      const existingCoords = toLonLat(existingGeom.getCoordinates());
      
      // If same location, don't update
      if (
        Math.abs(existingCoords[1] - selectedCoordinates.lat) < 0.00001 &&
        Math.abs(existingCoords[0] - selectedCoordinates.lng) < 0.00001
      ) {
        return;
      }
      
      // Update existing marker position instead of clearing and re-adding
      existingGeom.setCoordinates(fromLonLat([selectedCoordinates.lng, selectedCoordinates.lat]));
    } else {
      // No marker exists, add a new one
      const marker = new Feature({
        geometry: new Point(fromLonLat([selectedCoordinates.lng, selectedCoordinates.lat])),
      });
      source.addFeature(marker);
    }
  }, [selectedCoordinates]);

  // Handle search selection with animation
  const handleSearchSelect = useCallback((lat: number, lng: number) => {
    onSelect({ lat, lng });
    
    // Animate only for search selections
    if (mapInstanceRef.current) {
      const view = mapInstanceRef.current.getView();
      const currentZoom = view.getZoom() || 10;
      
      view.animate({
        center: fromLonLat([lng, lat]),
        zoom: Math.max(currentZoom, 12),
        duration: 800,
      });
    }
  }, [onSelect]);

  // Prevent iOS zoom issues
  useEffect(() => {
    if (!mounted) return;

    const preventMultiTouch = (e: TouchEvent) => {
      if (e.touches.length > 1) {
        e.preventDefault();
      }
    };
    
    const mapElement = mapRef.current;
    if (mapElement) {
      mapElement.addEventListener('touchmove', preventMultiTouch, { passive: false });
      return () => mapElement.removeEventListener('touchmove', preventMultiTouch);
    }
  }, [mounted]);

  if (!mounted) {
    return (
      <div className="h-[350px] w-full bg-gray-100 dark:bg-gray-800 animate-pulse rounded-xl flex items-center justify-center">
        <span className="text-gray-500">Initializing Map...</span>
      </div>
    );
  }

  return (
    <div className="relative w-full h-[350px] rounded-xl overflow-hidden shadow-inner border border-gray-200 dark:border-gray-700">
      <style>{`
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translate(-50%, -20px);
          }
          to {
            opacity: 1;
            transform: translate(-50%, 0);
          }
        }
        
        .animate-slideDown {
          animation: slideDown 0.3s ease-out;
        }

        /* OpenLayers optimizations */
        .ol-viewport {
          -webkit-transform: translate3d(0, 0, 0);
          transform: translate3d(0, 0, 0);
          touch-action: pan-x pan-y;
        }

        /* Better touch targets for zoom buttons */
        .ol-zoom {
          top: 4px;
          right: 8px;
          left: auto !important;
        }
        
        .ol-zoom button {
          width: 36px !important;
          height: 36px !important;
          font-size: 20px !important;
          -webkit-tap-highlight-color: rgba(236, 72, 153, 0.1);
        }

        /* Optimize rendering performance */
        .ol-viewport canvas {
          -webkit-transform: translateZ(0);
          transform: translateZ(0);
          image-rendering: -webkit-optimize-contrast;
          image-rendering: crisp-edges;
          /* Force GPU acceleration but prevent excessive repaints */
          backface-visibility: hidden;
          -webkit-backface-visibility: hidden;
        }
        
        /* Disable animations during zoom for better performance */
        .ol-viewport {
          -webkit-transform: translate3d(0, 0, 0);
          transform: translate3d(0, 0, 0);
          touch-action: pan-x pan-y;
          will-change: auto;  /* Changed from transform - only use when needed */
          contain: layout style paint;  /* Contain repaints to this element */
        }
        
        /* Reduce map layer complexity */
        .ol-layer {
          will-change: auto;
        }

        /* Attribution styling */
        .ol-attribution {
          background: rgba(255, 255, 255, 0.8) !important;
          border-radius: 8px;
          font-size: 11px;
        }

        .ol-attribution ul {
          color: #333;
        }

        /* Custom scrollbar for suggestions */
        .overflow-y-auto::-webkit-scrollbar {
          width: 6px;
        }

        .overflow-y-auto::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 10px;
        }

        .overflow-y-auto::-webkit-scrollbar-thumb {
          background: #ec4899;
          border-radius: 10px;
        }

        .overflow-y-auto::-webkit-scrollbar-thumb:hover {
          background: #db2777;
        }
      `}</style>

      {/* Error Toast */}
      {errorMessage && (
        <ErrorToast 
          message={errorMessage} 
          onClose={() => setErrorMessage(null)} 
        />
      )}

      {/* Search Bar with Autocomplete */}
      <SearchBar 
        onSearch={handleSearchSelect}
        isSearching={isSearching}
        defaultCenter={enforcedCenter}
        maxDistanceKm={MAX_RADIUS_KM}
        onError={setErrorMessage}
      />

      {/* Loading Overlay */}
      {!isMapReady && (
        <div className="absolute inset-0 z-[1000] bg-white dark:bg-gray-800 flex flex-col items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-pink-500 mb-2"></div>
          <span className="text-xs text-gray-500">Loading Map...</span>
        </div>
      )}

      {/* Map Container */}
      <div 
        ref={mapRef} 
        className="w-full h-full"
        style={{ touchAction: 'pan-x pan-y' }}
      />

      {/* Instructions */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-[500] pointer-events-none">
        <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm px-4 py-2 rounded-lg shadow-lg">
          <p className="text-xs text-gray-600 dark:text-gray-300 text-center">
            Click on map or search to select location
          </p>
        </div>
      </div>
    </div>
  );
};

export default MapComponent;