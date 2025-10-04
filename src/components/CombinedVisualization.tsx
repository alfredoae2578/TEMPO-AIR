import React, { useState } from 'react';
import Earth3D from './Earth3D';
import AirQualityHeatmap from './AirQualityHeatmap';
import { motion } from 'framer-motion';

interface CombinedVisualizationProps {
  className?: string;
}

const CombinedVisualization: React.FC<CombinedVisualizationProps> = ({ className = '' }) => {
  const [showEarth, setShowEarth] = useState(true);

  return (
    <div className={`relative w-full h-full ${className}`}>
      {/* Fondo 3D de la Tierra */}
      {showEarth && (
        <div className="absolute inset-0 z-0">
          <Earth3D />
        </div>
      )}
      
      {/* Controles de visualización */}
      <div className="absolute top-4 left-4 z-20 space-y-2">
        <motion.button
          onClick={() => setShowEarth(!showEarth)}
          className="px-4 py-2 bg-black/70 backdrop-blur text-white rounded-lg border border-[#87CEEB]/30 hover:bg-[#87CEEB]/20 transition-all"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          {showEarth ? 'Ocultar Tierra 3D' : 'Mostrar Tierra 3D'}
        </motion.button>
      </div>
      
      {/* Overlay del mapa de calor */}
      <div className="absolute inset-0 z-10" style={{ backgroundColor: showEarth ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.9)' }}>
        <AirQualityHeatmap 
          className="w-full h-full"
          onLocationClick={(location) => {
            console.log('Ubicación seleccionada:', location);
          }}
        />
      </div>
    </div>
  );
};

export default CombinedVisualization;