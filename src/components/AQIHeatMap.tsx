import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, MapPin, Satellite, Activity, Wind, Info, Loader2 } from 'lucide-react';

// Tipos para los datos TEMPO
interface ContaminantData {
  troposphere: number;
  uncertainty: number;
  stratosphere: number;
  quality_flag: number;
}

interface TempoData {
  lat: number;
  lon: number;
  tiene_datos: boolean;
  contaminantes: {
    NO2?: ContaminantData;
    O3?: ContaminantData;
    HCHO?: ContaminantData;
  };
  aqi_satelital: number | null;
  categoria: string;
  color: string;
}

interface TempoResponse {
  coordenada_central: { lat: number; lon: number };
  radio_metros: number;
  total_puntos: number;
  puntos_con_datos: number;
  resultados: TempoData[];
}

// Colores adaptados al tema oscuro del proyecto
const getAQIColorWithOpacity = (aqi: number | null, opacity: number = 0.6): string => {
  if (aqi === null) return `rgba(107, 114, 128, ${opacity})`; // gray-500
  
  if (aqi <= 50) return `rgba(16, 185, 129, ${opacity})`; // emerald-500
  if (aqi <= 100) return `rgba(245, 158, 11, ${opacity})`; // amber-500
  if (aqi <= 150) return `rgba(249, 115, 22, ${opacity})`; // orange-500
  if (aqi <= 200) return `rgba(239, 68, 68, ${opacity})`; // red-500
  if (aqi <= 300) return `rgba(139, 92, 246, ${opacity})`; // violet-500
  return `rgba(124, 45, 18, ${opacity})`; // red-900
};

const AQIHeatMap: React.FC = () => {
  const [tempoData, setTempoData] = useState<TempoData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedZone, setSelectedZone] = useState<TempoData | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lon: number } | null>(null);
  const mapRef = useRef<HTMLDivElement>(null);

  // Obtener ubicación del usuario
  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          lat: position.coords.latitude,
          lon: position.coords.longitude
        });
      },
      (error) => {
        console.log('Error getting location:', error);
        // Ubicación por defecto (San Diego area para mantener compatibilidad con datos sept 2025)
        setUserLocation({ lat: 32.7157, lon: -117.1611 });
      }
    );
  }, []);

  // Consultar datos TEMPO
  const fetchTempoData = async (lat: number, lon: number) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/tempo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          lat,
          lon,
          num_coordenadas: 5,
          radio: 5000
        })
      });

      if (!response.ok) {
        throw new Error('Error consultando datos TEMPO');
      }

      const data: TempoResponse = await response.json();
      setTempoData(data.resultados);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setIsLoading(false);
    }
  };

  // Cargar datos cuando se obtiene la ubicación
  useEffect(() => {
    if (userLocation) {
      fetchTempoData(userLocation.lat, userLocation.lon);
    }
  }, [userLocation]);

  // Manejar click en zona de calor
  const handleZoneClick = (zone: TempoData) => {
    setSelectedZone(zone);
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="relative w-full h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 overflow-hidden"
    >
      {/* Fondo con efecto espacial */}
      <div className="absolute inset-0 bg-black/20" />
      
      {/* Header */}
      <motion.div 
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="relative z-20 flex items-center justify-between p-6 backdrop-blur-md bg-white/5 border-b border-white/10"
      >
        <div className="flex items-center gap-3">
          <Satellite className="w-8 h-8 text-blue-400" />
          <div>
            <h1 className="text-2xl font-bold text-white">Mapa de Calidad del Aire TEMPO</h1>
            <p className="text-slate-400 text-sm">Datos satelitales en tiempo real - NASA TEMPO</p>
          </div>
        </div>
        
        {userLocation && (
          <div className="flex items-center gap-2 text-slate-300 text-sm">
            <MapPin className="w-4 h-4" />
            {userLocation.lat.toFixed(4)}, {userLocation.lon.toFixed(4)}
          </div>
        )}
      </motion.div>

      {/* Mapa de calor */}
      <div ref={mapRef} className="relative w-full h-full">
        {isLoading && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 z-30 flex items-center justify-center backdrop-blur-sm bg-black/30"
          >
            <div className="flex items-center gap-3 text-white">
              <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
              <span className="text-lg">Consultando datos satelitales TEMPO...</span>
            </div>
          </motion.div>
        )}

        {error && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute top-24 left-1/2 transform -translate-x-1/2 z-30 
                     bg-red-500/20 backdrop-blur-md border border-red-500/30 
                     rounded-xl p-4 text-white max-w-md text-center"
          >
            <AlertCircle className="w-6 h-6 mx-auto mb-2 text-red-400" />
            <p>Error: {error}</p>
          </motion.div>
        )}

        {/* Zonas de calor */}
        <AnimatePresence>
          {tempoData.map((zone, index) => (
            <motion.div
              key={`zone-${index}`}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ delay: index * 0.1, type: "spring", stiffness: 200 }}
              className="absolute cursor-pointer group"
              style={{
                left: `${20 + (index % 3) * 25}%`,
                top: `${30 + Math.floor(index / 3) * 25}%`,
                width: '200px',
                height: '200px',
                transform: 'translate(-50%, -50%)'
              }}
              onClick={() => handleZoneClick(zone)}
            >
              {/* Área de calor principal */}
              <div
                className="w-full h-full rounded-full blur-xl transition-all duration-300 
                         group-hover:scale-110 group-hover:blur-lg"
                style={{
                  backgroundColor: getAQIColorWithOpacity(zone.aqi_satelital, 0.4),
                  boxShadow: `0 0 60px ${getAQIColorWithOpacity(zone.aqi_satelital, 0.6)}`
                }}
              />
              
              {/* Núcleo central */}
              <div
                className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2
                         w-16 h-16 rounded-full border-2 border-white/30 
                         flex items-center justify-center backdrop-blur-sm
                         transition-all duration-300 group-hover:scale-125"
                style={{
                  backgroundColor: getAQIColorWithOpacity(zone.aqi_satelital, 0.8),
                }}
              >
                {zone.tiene_datos ? (
                  <span className="text-white font-bold text-sm">
                    {zone.aqi_satelital}
                  </span>
                ) : (
                  <AlertCircle className="w-6 h-6 text-white/60" />
                )}
              </div>

              {/* Tooltip hover */}
              <div className="absolute -top-20 left-1/2 transform -translate-x-1/2
                            opacity-0 group-hover:opacity-100 transition-opacity duration-300
                            bg-black/90 backdrop-blur-md rounded-lg px-4 py-3 text-white text-xs
                            border border-white/20 pointer-events-none z-10 max-w-xs text-center">
                {zone.tiene_datos ? (
                  <>
                    <p className="font-bold text-sm mb-1">AQI: {zone.aqi_satelital}</p>
                    <p className="text-slate-300">{zone.categoria}</p>
                  </>
                ) : (
                  <>
                    <p className="font-semibold mb-1">❌ Sin datos disponibles</p>
                    <p className="text-slate-300">
                      Esta zona está fuera del rango de cobertura de TEMPO o no tiene datos válidos.
                      TEMPO cubre principalmente Norteamérica (20°N-50°N).
                    </p>
                  </>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Panel de información detallada */}
      <AnimatePresence>
        {selectedZone && (
          <motion.div
            initial={{ x: 400, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 400, opacity: 0 }}
            transition={{ type: "spring", stiffness: 200, damping: 25 }}
            className="absolute top-24 right-6 w-96 max-h-[calc(100vh-200px)] overflow-y-auto
                     bg-black/80 backdrop-blur-md border border-white/20 rounded-2xl p-6 z-30"
          >
            {/* Header del panel */}
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <Activity className="w-5 h-5 text-blue-400" />
                Análisis Detallado
              </h3>
              <button
                onClick={() => setSelectedZone(null)}
                className="text-slate-400 hover:text-white transition-colors p-2"
              >
                ×
              </button>
            </div>

            {selectedZone.tiene_datos ? (
              <>
                {/* AQI Principal */}
                <div className="mb-6 text-center">
                  <div 
                    className="w-24 h-24 rounded-full mx-auto mb-3 flex items-center justify-center text-white font-bold text-2xl"
                    style={{ backgroundColor: selectedZone.color }}
                  >
                    {selectedZone.aqi_satelital}
                  </div>
                  <h4 className="text-lg font-semibold text-white">{selectedZone.categoria}</h4>
                  <p className="text-slate-400 text-sm">Índice de Calidad del Aire Satelital</p>
                </div>

                {/* Coordenadas */}
                <div className="mb-4 p-3 bg-white/5 rounded-lg">
                  <div className="flex items-center gap-2 text-slate-300 text-sm">
                    <MapPin className="w-4 h-4" />
                    <span>
                      {selectedZone.lat.toFixed(4)}, {selectedZone.lon.toFixed(4)}
                    </span>
                  </div>
                </div>

                {/* Datos de contaminantes */}
                <div className="space-y-4">
                  <h5 className="text-white font-semibold flex items-center gap-2">
                    <Wind className="w-4 h-4 text-green-400" />
                    Contaminantes Detectados
                  </h5>
                  
                  {Object.entries(selectedZone.contaminantes).map(([contaminante, data]) => (
                    <div key={contaminante} className="bg-white/5 rounded-lg p-4">
                      <h6 className="text-blue-400 font-medium mb-3">{contaminante}</h6>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <span className="text-slate-400">Troposfera:</span>
                          <div className="text-white font-mono text-xs">
                            {data.troposphere.toExponential(2)} molec/cm²
                          </div>
                        </div>
                        <div>
                          <span className="text-slate-400">Incertidumbre:</span>
                          <div className="text-white font-mono text-xs">
                            {data.uncertainty.toExponential(2)} molec/cm²
                          </div>
                        </div>
                        <div>
                          <span className="text-slate-400">Estratosfera:</span>
                          <div className="text-white font-mono text-xs">
                            {data.stratosphere.toExponential(2)} molec/cm²
                          </div>
                        </div>
                        <div>
                          <span className="text-slate-400">Calidad:</span>
                          <div className={`text-xs font-semibold ${
                            data.quality_flag === 0 ? 'text-green-400' : 'text-red-400'
                          }`}>
                            {data.quality_flag === 0 ? 'Buena' : 'Degradada'}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Disclaimer */}
                <div className="mt-6 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                  <div className="flex items-start gap-2">
                    <Info className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
                    <div className="text-xs text-slate-300">
                      <strong className="text-blue-400">Nota:</strong> Índice experimental basado en datos satelitales TEMPO. 
                      No sustituye mediciones oficiales terrestres. Solo para propósitos educativos/demostrativos.
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center text-slate-400">
                <AlertCircle className="w-16 h-16 mx-auto mb-4 text-orange-400" />
                <h4 className="text-white font-semibold text-lg mb-3">Sin datos disponibles</h4>
                <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-4 mb-4">
                  <p className="text-sm text-slate-300 leading-relaxed">
                    Esta zona está <span className="text-white font-semibold">fuera del rango de cobertura</span> del satélite TEMPO
                    o no tiene mediciones válidas para el período seleccionado.
                  </p>
                </div>
                <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                  <p className="text-xs text-slate-300 mb-2">
                    <strong className="text-blue-400">Cobertura TEMPO:</strong>
                  </p>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    El satélite TEMPO cubre principalmente <span className="text-white font-medium">América del Norte</span> entre
                    las latitudes <span className="text-white font-medium">20°N y 50°N</span>,
                    incluyendo la mayor parte de Estados Unidos, México y el sur de Canadá.
                  </p>
                </div>
                <p className="text-xs text-slate-500 mt-4">
                  <strong>Coordenadas:</strong> {selectedZone.lat.toFixed(4)}°, {selectedZone.lon.toFixed(4)}°
                </p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Leyenda */}
      <motion.div
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="absolute bottom-6 left-6 bg-black/80 backdrop-blur-md border border-white/20 
                 rounded-xl p-4 z-20"
      >
        <h4 className="text-white font-semibold mb-3 text-sm">Escala AQI Satelital</h4>
        <div className="space-y-2">
          {[
            { range: '0-50', label: 'Bueno', color: getAQIColorWithOpacity(25, 1) },
            { range: '51-100', label: 'Moderado', color: getAQIColorWithOpacity(75, 1) },
            { range: '101-150', label: 'Poco saludable (sensibles)', color: getAQIColorWithOpacity(125, 1) },
            { range: '151-200', label: 'Poco saludable', color: getAQIColorWithOpacity(175, 1) },
            { range: '201-300', label: 'Muy poco saludable', color: getAQIColorWithOpacity(250, 1) },
            { range: '301+', label: 'Peligroso', color: getAQIColorWithOpacity(400, 1) }
          ].map(({ range, label, color }) => (
            <div key={range} className="flex items-center gap-3 text-xs">
              <div 
                className="w-4 h-4 rounded"
                style={{ backgroundColor: color }}
              />
              <span className="text-white font-mono">{range}</span>
              <span className="text-slate-400">{label}</span>
            </div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default AQIHeatMap;