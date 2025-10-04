import React, { useState, useRef, useEffect, useCallback } from 'react';
import GoogleMapReact from 'google-map-react';
import { motion } from 'framer-motion';

// Tipos para los datos de calidad del aire
interface AQIDataPoint {
  lat: number;
  lng: number;
  aqi: number;
  location: string;
  level: 'good' | 'moderate' | 'unhealthy-sensitive' | 'unhealthy' | 'very-unhealthy' | 'hazardous';
  weight: number; // Peso para el heatmap (0-1)
}

interface AirQualityHeatmapProps {
  className?: string;
  style?: React.CSSProperties;
  googleMapsApiKey?: string;
  onLocationClick?: (data: AQIDataPoint) => void;
}

// Datos de muestra para diferentes ciudades del mundo con AQI realista
const aqiData: AQIDataPoint[] = [
  // Ciudades con buena calidad del aire (Azul)
  { lat: 64.1466, lng: -21.9426, aqi: 25, location: 'Reykjavik, Islandia', level: 'good', weight: 0.2 },
  { lat: 60.1695, lng: 24.9354, aqi: 30, location: 'Helsinki, Finlandia', level: 'good', weight: 0.25 },
  { lat: -33.8688, lng: 151.2093, aqi: 35, location: 'Sídney, Australia', level: 'good', weight: 0.3 },
  { lat: 46.2044, lng: 6.1432, aqi: 28, location: 'Ginebra, Suiza', level: 'good', weight: 0.23 },
  { lat: 59.9139, lng: 10.7522, aqi: 32, location: 'Oslo, Noruega', level: 'good', weight: 0.26 },
  
  // Ciudades con calidad moderada (Verde-Amarillo)
  { lat: 40.7128, lng: -74.0060, aqi: 65, location: 'Nueva York, USA', level: 'moderate', weight: 0.45 },
  { lat: 51.5074, lng: -0.1278, aqi: 58, location: 'Londres, Reino Unido', level: 'moderate', weight: 0.4 },
  { lat: 48.8566, lng: 2.3522, aqi: 72, location: 'París, Francia', level: 'moderate', weight: 0.5 },
  { lat: 35.6762, lng: 139.6503, aqi: 68, location: 'Tokio, Japón', level: 'moderate', weight: 0.47 },
  { lat: 55.7558, lng: 37.6173, aqi: 75, location: 'Moscú, Rusia', level: 'moderate', weight: 0.52 },
  
  // Ciudades con calidad poco saludable para sensibles (Naranja)
  { lat: 34.0522, lng: -118.2437, aqi: 125, location: 'Los Ángeles, USA', level: 'unhealthy-sensitive', weight: 0.68 },
  { lat: 41.9028, lng: 12.4964, aqi: 110, location: 'Roma, Italia', level: 'unhealthy-sensitive', weight: 0.62 },
  { lat: 19.4326, lng: -99.1332, aqi: 135, location: 'Ciudad de México, México', level: 'unhealthy-sensitive', weight: 0.72 },
  { lat: 31.2304, lng: 121.4737, aqi: 128, location: 'Shanghái, China', level: 'unhealthy-sensitive', weight: 0.7 },
  
  // Ciudades con calidad poco saludable (Rojo)
  { lat: 39.9042, lng: 116.4074, aqi: 165, location: 'Beijing, China', level: 'unhealthy', weight: 0.82 },
  { lat: 28.7041, lng: 77.1025, aqi: 195, location: 'Nueva Delhi, India', level: 'unhealthy', weight: 0.9 },
  { lat: 19.0760, lng: 72.8777, aqi: 152, location: 'Mumbai, India', level: 'unhealthy', weight: 0.78 },
  { lat: 24.7136, lng: 46.6753, aqi: 148, location: 'Riad, Arabia Saudita', level: 'unhealthy', weight: 0.76 },
  
  // Ciudades con calidad muy poco saludable (Púrpura)
  { lat: 33.3152, lng: 44.3661, aqi: 225, location: 'Bagdad, Irak', level: 'very-unhealthy', weight: 0.95 },
  { lat: 25.2048, lng: 55.2708, aqi: 210, location: 'Dubái, EAU', level: 'very-unhealthy', weight: 0.92 },
  { lat: 26.8467, lng: 80.9462, aqi: 240, location: 'Lucknow, India', level: 'very-unhealthy', weight: 0.98 },
  
  // Ciudades con calidad peligrosa (Marrón)
  { lat: 29.3117, lng: 47.4818, aqi: 305, location: 'Kuwait City, Kuwait', level: 'hazardous', weight: 1.0 },
  { lat: 31.5804, lng: 65.2372, aqi: 315, location: 'Kandahar, Afganistán', level: 'hazardous', weight: 1.0 },
];

// Componente para marcadores personalizados
const AQIMarker = ({ lat, lng, aqi, location, level, onClick }: AQIDataPoint & { onClick: () => void }) => {
  const getMarkerColor = (level: string) => {
    switch (level) {
      case 'good': return '#2563eb'; // Azul
      case 'moderate': return '#eab308'; // Amarillo
      case 'unhealthy-sensitive': return '#f97316'; // Naranja
      case 'unhealthy': return '#dc2626'; // Rojo
      case 'very-unhealthy': return '#7c3aed'; // Púrpura
      case 'hazardous': return '#92400e'; // Marrón
      default: return '#6b7280';
    }
  };

  return (
    <motion.div
      className="cursor-pointer flex flex-col items-center"
      onClick={onClick}
      whileHover={{ scale: 1.2 }}
      whileTap={{ scale: 0.9 }}
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ type: "spring", stiffness: 300 }}
    >
      {/* Marcador circular */}
      <div
        className="w-6 h-6 rounded-full border-2 border-white shadow-lg flex items-center justify-center"
        style={{ backgroundColor: getMarkerColor(level) }}
      >
        <span className="text-white text-xs fira-bold">{aqi}</span>
      </div>
      {/* Tooltip */}
      <div className="mt-1 px-2 py-1 bg-black bg-opacity-80 rounded text-white text-xs fira-regular whitespace-nowrap">
        {location}
      </div>
    </motion.div>
  );
};

export const AirQualityHeatmap: React.FC<AirQualityHeatmapProps> = ({ 
  className = '', 
  style = {}, 
  googleMapsApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || 'YOUR_GOOGLE_MAPS_API_KEY',
  onLocationClick 
}) => {
  const [selectedLocation, setSelectedLocation] = useState<AQIDataPoint | null>(null);
  const [showHeatmap, setShowHeatmap] = useState(true);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [map, setMap] = useState<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [maps, setMaps] = useState<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const heatmapRef = useRef<any>(null);

  // Configuración del mapa
  const defaultCenter = { lat: 20, lng: 0 };
  const defaultZoom = 2;

  // Configuración de Google Maps (necesitarás una API key)


  // Función para crear el heatmap
  const createHeatmap = useCallback(() => {
    if (!map || !maps || !maps.visualization) return;

    // Eliminar heatmap existente
    if (heatmapRef.current) {
      heatmapRef.current.setMap(null);
    }

    // Convertir datos a formato de Google Maps heatmap
    const heatmapData = aqiData.map(point => ({
      location: new maps.LatLng(point.lat, point.lng),
      weight: point.weight
    }));

    // Crear nuevo heatmap
    heatmapRef.current = new maps.visualization.HeatmapLayer({
      data: heatmapData,
      map: showHeatmap ? map : null,
      radius: 50,
      opacity: 0.7,
      gradient: [
        'rgba(37, 99, 235, 0)',      // Azul transparente (bueno)
        'rgba(37, 99, 235, 1)',      // Azul sólido (bueno)
        'rgba(34, 197, 94, 1)',      // Verde (moderado)
        'rgba(234, 179, 8, 1)',      // Amarillo (moderado)
        'rgba(249, 115, 22, 1)',     // Naranja (poco saludable sensibles)
        'rgba(220, 38, 38, 1)',      // Rojo (poco saludable)
        'rgba(124, 58, 237, 1)',     // Púrpura (muy poco saludable)
        'rgba(146, 64, 14, 1)'       // Marrón (peligroso)
      ]
    });
  }, [map, maps, showHeatmap]);

  // Inicializar mapa
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleApiLoaded = ({ map, maps }: any) => {
    setMap(map);
    setMaps(maps);
  };

  // Efecto para crear heatmap cuando el mapa esté listo
  useEffect(() => {
    if (map && maps) {
      // Cargar biblioteca de visualización
      maps.importLibrary('visualization').then(() => {
        createHeatmap();
      });
    }
  }, [map, maps, showHeatmap, createHeatmap]);

  // Manejar clic en marcador
  const handleMarkerClick = (data: AQIDataPoint) => {
    setSelectedLocation(data);
    if (onLocationClick) {
      onLocationClick(data);
    }
  };

  // Obtener color del nivel AQI
  const getLevelColor = (level: string) => {
    switch (level) {
      case 'good': return '#2563eb';
      case 'moderate': return '#eab308';
      case 'unhealthy-sensitive': return '#f97316';
      case 'unhealthy': return '#dc2626';
      case 'very-unhealthy': return '#7c3aed';
      case 'hazardous': return '#92400e';
      default: return '#6b7280';
    }
  };

  // Obtener etiqueta del nivel
  const getLevelLabel = (level: string) => {
    switch (level) {
      case 'good': return 'Bueno';
      case 'moderate': return 'Moderado';
      case 'unhealthy-sensitive': return 'Poco saludable para sensibles';
      case 'unhealthy': return 'Poco saludable';
      case 'very-unhealthy': return 'Muy poco saludable';
      case 'hazardous': return 'Peligroso';
      default: return 'Desconocido';
    }
  };

  return (
    <div className={`relative ${className}`} style={{ height: '600px', width: '100%', ...style }}>
      {/* Controles del mapa */}
      <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
        <motion.button
          onClick={() => setShowHeatmap(!showHeatmap)}
          className="btn-modern fira-semibold"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          {showHeatmap ? 'Ocultar Heatmap' : 'Mostrar Heatmap'}
        </motion.button>
        
        {/* Leyenda */}
        <div className="bg-layer-2 border-white rounded-lg p-3 shadow-depth-m">
          <h4 className="fira-bold text-sm mb-2" style={{ color: 'var(--text)' }}>
            Índice de Calidad del Aire
          </h4>
          <div className="space-y-1">
            {[
              { level: 'good', label: 'Bueno (0-50)' },
              { level: 'moderate', label: 'Moderado (51-100)' },
              { level: 'unhealthy-sensitive', label: 'Poco saludable para sensibles (101-150)' },
              { level: 'unhealthy', label: 'Poco saludable (151-200)' },
              { level: 'very-unhealthy', label: 'Muy poco saludable (201-300)' },
              { level: 'hazardous', label: 'Peligroso (300+)' }
            ].map(({ level, label }) => (
              <div key={level} className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: getLevelColor(level) }}
                />
                <span className="text-xs fira-regular" style={{ color: 'var(--text-muted)' }}>
                  {label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Panel de información seleccionada */}
      {selectedLocation && (
        <motion.div
          className="absolute top-4 right-4 z-10 bg-layer-2 border-white rounded-lg p-4 shadow-depth-l max-w-xs"
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 50 }}
        >
          <div className="flex justify-between items-start mb-2">
            <h4 className="fira-bold text-sm" style={{ color: 'var(--text)' }}>
              {selectedLocation.location}
            </h4>
            <button
              onClick={() => setSelectedLocation(null)}
              className="text-gray-400 hover:text-white"
            >
              ✕
            </button>
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: getLevelColor(selectedLocation.level) }}
              />
              <span className="fira-extrabold text-lg" style={{ color: getLevelColor(selectedLocation.level) }}>
                {selectedLocation.aqi}
              </span>
            </div>
            <p className="text-xs fira-regular" style={{ color: 'var(--text-muted)' }}>
              {getLevelLabel(selectedLocation.level)}
            </p>
          </div>
        </motion.div>
      )}

      {/* Mapa de Google */}
      <GoogleMapReact
        bootstrapURLKeys={{ 
          key: googleMapsApiKey,
          libraries: ['visualization']
        }}
        defaultCenter={defaultCenter}
        defaultZoom={defaultZoom}
        onGoogleApiLoaded={handleApiLoaded}
        yesIWantToUseGoogleMapApiInternals
        options={{
          styles: [
            {
              featureType: "all",
              elementType: "geometry",
              stylers: [{ color: "#1a1a1a" }]
            },
            {
              featureType: "all",
              elementType: "labels.text.stroke",
              stylers: [{ color: "#1a1a1a" }]
            },
            {
              featureType: "all",
              elementType: "labels.text.fill",
              stylers: [{ color: "#ffffff" }]
            },
            {
              featureType: "water",
              elementType: "geometry",
              stylers: [{ color: "#0f172a" }]
            },
            {
              featureType: "landscape",
              elementType: "geometry",
              stylers: [{ color: "#2d2d2d" }]
            }
          ],
          disableDefaultUI: false,
          zoomControl: true,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: true
        }}
      >
        {/* Renderizar marcadores */}
        {aqiData.map((point, index) => (
          <AQIMarker
            key={index}
            {...point}
            onClick={() => handleMarkerClick(point)}
          />
        ))}
      </GoogleMapReact>
    </div>
  );
};

export default AirQualityHeatmap;