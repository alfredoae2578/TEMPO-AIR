/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MapPin, Search, Navigation, Target, Loader, Activity } from 'lucide-react';
import { motion } from 'framer-motion';
import 'leaflet/dist/leaflet.css';

// Types for the TEMPO map interface
interface Coordinates {
  lat: number;
  lon: number;
}

interface TempoResult {
  lat: number;
  lon: number;
  aqi_satelital: number;
  categoria: string;
  color: string;
  tiene_datos: boolean;
  contaminantes: {
    NO2?: { troposphere: number };
    O3?: { troposphere: number };
    HCHO?: { troposphere: number };
  };
}

interface TempoResponse {
  resultados: TempoResult[];
}

interface LocationSuggestion {
  lat: string;
  lon: string;
  display_name: string;
}

// Map click event type
interface MapClickEvent {
  latlng: {
    lat: number;
    lng: number;
  };
}

interface TempoMapInlineProps {
  isOpen?: boolean;
  onClose?: () => void;
  onLocationChange?: (location: { lat: number; lng: number; name: string }) => void;
}

const TempoMapInline: React.FC<TempoMapInlineProps> = ({ onLocationChange }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [clickModeActive, setClickModeActive] = useState(false);
  const [temporaryPin, setTemporaryPin] = useState<any>(null);
  const [temporaryCoords, setTemporaryCoords] = useState<Coordinates | null>(null);
  const [results, setResults] = useState<TempoResult[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<string>('');
  const [radius, setRadius] = useState(50);
  const [heatLayers, setHeatLayers] = useState<any[]>([]);
  const searchTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

  const handleMapClick = useCallback((e: MapClickEvent) => {
    if (!clickModeActive || !map) return;

    const lat = e.latlng.lat;
    const lon = e.latlng.lng;

    setTemporaryCoords({ lat, lon });

    // Remove existing temporary pin
    if (temporaryPin) {
      map.removeLayer(temporaryPin);
    }

    import('leaflet').then((L) => {
      const temporaryIcon = L.divIcon({
        html: '<div style="background:#FF9800;width:24px;height:24px;border-radius:50%;border:3px solid white;box-shadow:0 3px 8px rgba(0,0,0,0.4);"></div>',
        className: '',
        iconSize: [24, 24],
        iconAnchor: [12, 12]
      });

      const newPin = L.marker([lat, lon], { icon: temporaryIcon })
        .addTo(map)
        .bindPopup(`<b>📍 Pin temporal</b><br>${lat.toFixed(6)}, ${lon.toFixed(6)}<br><small>Haz clic en otro lugar para moverlo</small>`);

      setTemporaryPin(newPin);
    });
  }, [clickModeActive, map, temporaryPin]);

  // Initialize Leaflet map
  useEffect(() => {
    if (mapRef.current && !map) {
      import('leaflet').then((L) => {
        const newMap = L.map(mapRef.current!).setView([20, 0], 2);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap contributors',
          maxZoom: 19
        }).addTo(newMap);

        newMap.on('click', handleMapClick);
        setMap(newMap);
      });
    }

    return () => {
      if (map) {
        map.remove();
        setMap(null);
      }
    };
  }, []);

  // Handle map click events
  useEffect(() => {
    if (map) {
      map.off('click');
      map.on('click', handleMapClick);
    }
  }, [map, handleMapClick]);

  const searchLocations = async (query: string) => {
    if (query.length < 3) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5`
      );
      const locations = await response.json();
      setSuggestions(locations);
      setShowSuggestions(true);
    } catch (error) {
      console.error('Error searching locations:', error);
    }
  };

  const handleSearchInput = (value: string) => {
    setSearchQuery(value);
    
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      searchLocations(value);
    }, 300);
  };

  const selectLocation = async (lat: number, lon: number, name: string) => {
    setClickModeActive(false);
    setSearchQuery(name);
    setShowSuggestions(false);
    setSelectedLocation(name);
    
    if (map) {
      map.setView([lat, lon], 13);
    }
    
    // Notificar al componente padre del cambio de ubicación
    if (onLocationChange) {
      onLocationChange({ lat, lng: lon, name });
    }
    
    await consultTEMPO(lat, lon, name);
  };

  const useCurrentLocation = async () => {
    setClickModeActive(false);
    setIsLoading(true);

    if (!navigator.geolocation) {
      alert('Tu navegador no soporta geolocalización');
      setIsLoading(false);
      return;
    }

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        });
      });

      const lat = position.coords.latitude;
      const lon = position.coords.longitude;

      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&accept-language=es`
      );
      const data = await response.json();
      const name = data.display_name;

      if (map) {
        map.setView([lat, lon], 13);
      }
      
      setSelectedLocation(name);
      
      // Notificar al componente padre del cambio de ubicación
      if (onLocationChange) {
        onLocationChange({ lat, lng: lon, name });
      }
      
      await consultTEMPO(lat, lon, name);
    } catch (error) {
      let message = 'Error al obtener ubicación';
      if (error instanceof GeolocationPositionError) {
        if (error.code === 1) message = 'Permiso denegado';
        else if (error.code === 2) message = 'Ubicación no disponible';
        else if (error.code === 3) message = 'Tiempo agotado';
      }

      alert(message);
    } finally {
      setIsLoading(false);
    }
  };

  const activateClickMode = () => {
    setClickModeActive(true);
    setSelectedLocation('');
    setResults([]);
    clearHeatLayers();
  };

  const confirmTemporaryLocation = async () => {
    if (!temporaryCoords) return;

    setClickModeActive(false);
    
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${temporaryCoords.lat}&lon=${temporaryCoords.lon}&accept-language=es`
    );
    const data = await response.json();
    const name = data.display_name;

    if (temporaryPin && map) {
      map.removeLayer(temporaryPin);
      setTemporaryPin(null);
    }

    setSelectedLocation(name);
    
    // Notificar al componente padre del cambio de ubicación
    if (onLocationChange) {
      onLocationChange({
        lat: temporaryCoords.lat,
        lng: temporaryCoords.lon,
        name: name
      });
    }
    
    await consultTEMPO(temporaryCoords.lat, temporaryCoords.lon, name);
  };

  const cancelClickMode = () => {
    setClickModeActive(false);
    
    if (temporaryPin && map) {
      map.removeLayer(temporaryPin);
      setTemporaryPin(null);
    }
    
    setTemporaryCoords(null);
  };

  const clearHeatLayers = () => {
    if (map) {
      heatLayers.forEach(layer => map.removeLayer(layer));
      setHeatLayers([]);
    }
  };

  const consultTEMPO = async (lat: number, lon: number, name: string) => {
    setIsLoading(true);
    clearHeatLayers();

    try {
      const response = await fetch('http://localhost:5000/api/tempo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          lat, 
          lon, 
          num_coordenadas: 9, 
          radio: radius * 1000
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Error al consultar TEMPO' }));
        throw new Error(errorData.error || 'Error al consultar TEMPO');
      }

      const data: TempoResponse = await response.json();
      setResults(data.resultados);

      if (map) {
        await import('leaflet').then((L) => {
          const newLayers: any[] = [];

          // Central marker
          const centralIcon = L.divIcon({
            html: '<div style="background:#2196F3;width:20px;height:20px;border-radius:50%;border:3px solid white;box-shadow:0 2px 5px rgba(0,0,0,0.3);"></div>',
            className: '',
            iconSize: [20, 20],
            iconAnchor: [10, 10]
          });
          
          const centralMarker = L.marker([lat, lon], { icon: centralIcon })
            .addTo(map)
            .bindPopup(`<b>📍 Ubicación consulta</b><br>${name}<br>${lat.toFixed(6)}, ${lon.toFixed(6)}`);
          newLayers.push(centralMarker);

          const pointsWithData = data.resultados.filter(r => r.tiene_datos);
          
          // Heat zones
          pointsWithData.forEach((item, index) => {
            const zoneRadius = 3000;
            
            const circle = L.circle([item.lat, item.lon], {
              color: item.color,
              fillColor: item.color,
              fillOpacity: 0.4,
              opacity: 0.8,
              radius: zoneRadius,
              weight: 2
            }).addTo(map);

            let detailsHTML = `<b>🌡️ Zona ${index + 1}</b><br>`;
            detailsHTML += `<div style="background:${item.color};color:white;padding:2px 8px;border-radius:3px;display:inline-block;font-weight:bold;">${item.aqi_satelital}</div><br>`;
            detailsHTML += `<b>${item.categoria}</b><br><br>`;
            
            if (item.contaminantes.NO2) {
              detailsHTML += `<b>NO₂:</b> ${item.contaminantes.NO2.troposphere.toExponential(2)} molec/cm²<br>`;
            }
            if (item.contaminantes.O3) {
              detailsHTML += `<b>O₃:</b> ${item.contaminantes.O3.troposphere.toExponential(2)} molec/cm²<br>`;
            }
            if (item.contaminantes.HCHO) {
              detailsHTML += `<b>HCHO:</b> ${item.contaminantes.HCHO.troposphere.toExponential(2)} molec/cm²<br>`;
            }
            
            detailsHTML += `<br><small>${item.lat.toFixed(6)}, ${item.lon.toFixed(6)}</small>`;
            
            circle.bindPopup(detailsHTML);
            newLayers.push(circle);
          });

          // Adjust view
          if (pointsWithData.length > 0) {
            const bounds = L.latLngBounds([
              [lat, lon],
              ...pointsWithData.map(p => [p.lat, p.lon] as [number, number])
            ]);
            map.fitBounds(bounds, { padding: [80, 80] });
          }

          setHeatLayers(newLayers);
        });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      alert(`Error: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="p-4 lg:p-6 h-full flex flex-col"
    >
      <div className="flex flex-col lg:flex-row gap-6 h-full">
        {/* Controls Panel */}
        <div className="w-full lg:w-80 space-y-6">
          {/* Location Selection */}
          <div className="bg-gradient-to-br from-[#2d5a7b]/50 to-[#1a3a52]/50 backdrop-blur-xs rounded-2xl shadow-2xl p-6 border border-[#87CEEB]/30">
            <h3 className="text-white font-semibold text-lg flex items-center gap-2 mb-4">
              <Navigation className="w-5 h-5 text-[#98D8C8]" />
              Ubicación
            </h3>
            <div className="space-y-4">
              <div className="flex gap-3">
                <button
                  onClick={useCurrentLocation}
                  disabled={isLoading}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-[#98D8C8] to-[#98D8C8]/80 hover:from-[#98D8C8]/90 hover:to-[#98D8C8]/70 disabled:opacity-50 text-[#1a3a52] rounded-xl font-semibold transition-all duration-200 shadow-lg shadow-[#98D8C8]/30 border border-[#98D8C8]/20"
                >
                  <Navigation className="w-4 h-4" />
                  Mi Ubicación
                </button>
                <button
                  onClick={activateClickMode}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-semibold transition-all duration-200 shadow-lg border ${
                    clickModeActive 
                      ? 'bg-gradient-to-r from-[#FF9800] to-[#E67E22] text-white shadow-[#FF9800]/40 border-[#FF9800]/30' 
                      : 'bg-gradient-to-r from-[#87CEEB] to-[#5DADE2] hover:from-[#87CEEB]/90 hover:to-[#5DADE2]/90 text-white shadow-[#87CEEB]/30 border-[#87CEEB]/20'
                  }`}
                >
                  <Target className="w-4 h-4" />
                  Clic en Mapa
                </button>
              </div>

              {/* Search */}
              <div className="relative">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#B0E0E6]" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => handleSearchInput(e.target.value)}
                    onFocus={() => setShowSuggestions(suggestions.length > 0)}
                    placeholder="Buscar ciudad o lugar..."
                    className="w-full pl-12 pr-4 py-3 bg-[#87CEEB]/10 backdrop-blur border-2 border-[#87CEEB]/30 rounded-xl text-white placeholder-[#B0E0E6] focus:outline-none focus:border-[#87CEEB] focus:bg-[#87CEEB]/15 transition-all duration-200 shadow-inner"
                  />
                </div>
                
                {showSuggestions && suggestions.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-gradient-to-b from-[#2d5a7b]/95 to-[#1a3a52]/95 backdrop-blur-md border-2 border-[#87CEEB]/30 rounded-xl shadow-2xl z-10 max-h-48 overflow-y-auto">
                    {suggestions.map((suggestion, index) => (
                      <button
                        key={index}
                        onClick={() => selectLocation(parseFloat(suggestion.lat), parseFloat(suggestion.lon), suggestion.display_name)}
                        className="w-full text-left px-5 py-4 text-white hover:bg-gradient-to-r hover:from-[#87CEEB]/20 hover:to-[#5DADE2]/20 border-b border-[#87CEEB]/20 last:border-b-0 transition-all duration-200"
                      >
                        <div className="text-sm font-medium">{suggestion.display_name}</div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Parameters */}
          <div className="bg-gradient-to-br from-[#2d5a7b]/50 to-[#1a3a52]/50 backdrop-blur-xs rounded-2xl shadow-2xl p-6 border border-[#87CEEB]/30">
            <h3 className="text-white font-semibold text-lg flex items-center gap-2 mb-4">
              <Activity className="w-5 h-5 text-[#98D8C8]" />
              Parámetros
            </h3>
            <div className="bg-[#87CEEB]/10 backdrop-blur rounded-xl p-4 border border-[#87CEEB]/30">
              <label className="block text-sm font-medium text-[#B0E0E6] mb-2">Radio de análisis (km)</label>
              <input
                type="number"
                value={radius}
                onChange={(e) => setRadius(parseInt(e.target.value))}
                min="1"
                max="200"
                className="w-full px-4 py-3 bg-[#87CEEB]/15 backdrop-blur border-2 border-[#87CEEB]/30 rounded-xl text-white focus:outline-none focus:border-[#87CEEB] focus:bg-[#87CEEB]/20 transition-all duration-200 shadow-inner"
              />
            </div>
          </div>

          {/* Temporary Pin Actions */}
          {temporaryCoords && (
            <div className="bg-gradient-to-br from-[#2d5a7b]/50 to-[#1a3a52]/50 backdrop-blur-xs rounded-2xl shadow-2xl p-6 border border-[#87CEEB]/30">
              <div className="text-sm text-white font-medium mb-3">
                📍 Pin colocado en:<br/>
                <span className="text-[#98D8C8] font-mono">
                  {temporaryCoords.lat.toFixed(6)}, {temporaryCoords.lon.toFixed(6)}
                </span>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={confirmTemporaryLocation}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-[#98D8C8] to-[#98D8C8]/80 hover:from-[#98D8C8]/90 hover:to-[#98D8C8]/70 text-[#1a3a52] rounded-xl font-semibold transition-all duration-200 shadow-lg shadow-[#98D8C8]/30 border border-[#98D8C8]/20"
                >
                  ✓ Confirmar
                </button>
                <button
                  onClick={cancelClickMode}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-[#E67E22] to-[#D35400] hover:from-[#E67E22]/90 hover:to-[#D35400]/90 text-white rounded-xl font-semibold transition-all duration-200 shadow-lg shadow-[#E67E22]/30 border border-[#E67E22]/20"
                >
                  ✗ Cancelar
                </button>
              </div>
            </div>
          )}

          {/* Results */}
          {results.length > 0 && (
            <div className="bg-gradient-to-br from-[#2d5a7b]/50 to-[#1a3a52]/50 backdrop-blur-xs rounded-2xl shadow-2xl p-6 border border-[#87CEEB]/30">
              <h3 className="text-white font-semibold text-lg flex items-center gap-2 mb-4">
                <Activity className="w-5 h-5 text-[#98D8C8]" />
                Resultados
              </h3>
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {selectedLocation && (
                  <div className="text-sm text-[#98D8C8] font-medium bg-[#87CEEB]/10 backdrop-blur rounded-lg p-3 border border-[#87CEEB]/30">
                    📍 {selectedLocation}
                  </div>
                )}
                <div className="text-sm text-[#B0E0E6] bg-[#87CEEB]/10 backdrop-blur rounded-lg p-3 border border-[#87CEEB]/30">
                  📊 Zonas analizadas: <span className="text-[#98D8C8] font-semibold">{results.filter(r => r.tiene_datos).length} con datos</span> / <span className="text-[#E67E22] font-semibold">{results.filter(r => !r.tiene_datos).length} sin datos</span>
                </div>
                {results.filter(r => r.tiene_datos).map((result, index) => (
                  <div
                    key={index}
                    className="p-4 rounded-xl border-l-4 backdrop-blur shadow-lg transition-all duration-200 hover:shadow-xl"
                    style={{
                      borderLeftColor: result.color,
                      backgroundColor: `${result.color}20`,
                      border: `1px solid ${result.color}60`
                    }}
                  >
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-white font-semibold">Zona {index + 1}</span>
                      <span
                        className="px-3 py-1 rounded-lg text-white text-sm font-bold shadow-lg"
                        style={{ backgroundColor: result.color }}
                      >
                        AQI: {result.aqi_satelital}
                      </span>
                    </div>
                    <div className="text-sm text-[#B0E0E6] font-medium">{result.categoria}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {isLoading && (
            <div className="bg-gradient-to-br from-[#2d5a7b]/50 to-[#1a3a52]/50 backdrop-blur-xs rounded-2xl shadow-2xl p-6 border border-[#87CEEB]/30">
              <div className="flex items-center justify-center py-4">
                <Loader className="w-6 h-6 text-[#98D8C8] animate-spin" />
                <span className="ml-3 text-white font-medium">Consultando datos TEMPO...</span>
              </div>
            </div>
          )}
        </div>

        {/* Map Container */}
        <div className="flex-1 bg-gradient-to-br from-[#2d5a7b]/50 to-[#1a3a52]/50 backdrop-blur-xs rounded-2xl shadow-2xl border border-[#87CEEB]/30 relative overflow-hidden">
          <div className="absolute inset-0 p-4">
            <div
              ref={mapRef}
              className="w-full h-full rounded-xl overflow-hidden"
              style={{ minHeight: '400px' }}
            />
            {clickModeActive && (
              <div className="absolute top-8 left-8 right-8 bg-gradient-to-r from-[#FF9800]/95 to-[#E67E22]/95 backdrop-blur text-white px-6 py-4 rounded-xl text-center font-semibold shadow-2xl border border-[#FF9800]/30 animate-pulse">
                🗺️ Haz clic en el mapa para seleccionar ubicación...
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default TempoMapInline;
