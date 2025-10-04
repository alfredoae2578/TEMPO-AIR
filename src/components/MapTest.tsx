import React from 'react';
import AirQualityHeatmap from './AirQualityHeatmap';

const MapTest: React.FC = () => {
  return (
    <div className="w-full h-screen bg-black">
      <div className="p-4">
        <h1 className="text-white text-2xl font-bold mb-4">
          Mapa de Calor de Calidad del Aire - Prueba
        </h1>
        <div className="h-[calc(100vh-100px)] w-full">
          <AirQualityHeatmap 
            onLocationClick={(location) => {
              console.log('Ubicación seleccionada:', location);
              alert(`AQI en ${location.location}: ${location.aqi} (${location.level})`);
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default MapTest;