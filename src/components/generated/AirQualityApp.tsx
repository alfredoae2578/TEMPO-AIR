import React, { useState, useEffect } from 'react';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { AlertCircle, Wind, Droplets, Sun, Cloud, Activity, MapPin, Bell, TrendingUp, TrendingDown, Calendar, Info, AlertTriangle, CheckCircle, Navigation, Satellite, Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import EarthBackground from '../earth3d/EarthBackground';
import TempoMapInline from '../TempoMapInline';

type AirQualityLevel = 'good' | 'moderate' | 'unhealthy-sensitive' | 'unhealthy' | 'very-unhealthy' | 'hazardous';
type PollutantData = {
  name: string;
  value: number;
  unit: string;
  level: AirQualityLevel;
  trend: 'up' | 'down' | 'stable';
};
type WeatherData = {
  temp: number;
  humidity: number;
  windSpeed: number;
  windDirection: string;
  pressure: number;
  aerosolIndex: number;
  uvIndex: number;
};
type ForecastData = {
  time: string;
  aqi: number;
  no2: number;
  pm25: number;
  o3: number;
};
type HistoricalData = {
  date: string;
  aqi: number;
};
type AlertData = {
  id: string;
  severity: 'info' | 'warning' | 'critical';
  message: string;
  timestamp: string;
  createdAt: Date;
};
type AirQualityLocation = {
  id: string;
  name: string;
  lat: number;
  lng: number;
  aqi: number;
  level: AirQualityLevel;
};

type NotificationSettings = {
  airQualityAlerts: boolean;
  dailySummary: boolean;
  forecastUpdates: boolean;
};

// Colores actualizados - Azul celeste y verde pastel
const SKY_BLUE = '#87CEEB';
const PASTEL_GREEN = '#98D8C8';
const LIGHT_SKY_BLUE = '#B0E0E6';
const DARK_SKY_BLUE = '#4A90A4';
const ACCENT_BLUE = '#5DADE2';
const getAQIColor = (level: AirQualityLevel): string => {
  const colors = {
    'good': '#98D8C8',
    'moderate': '#F7DC6F',
    'unhealthy-sensitive': '#F8B739',
    'unhealthy': '#E67E22',
    'very-unhealthy': '#A569BD',
    'hazardous': '#943126'
  };
  return colors[level];
};
const getAQILabel = (level: AirQualityLevel): string => {
  const labels = {
    'good': 'Bueno',
    'moderate': 'Moderado',
    'unhealthy-sensitive': 'Poco saludable para grupos sensibles',
    'unhealthy': 'Poco saludable',
    'very-unhealthy': 'Muy poco saludable',
    'hazardous': 'Peligroso'
  };
  return labels[level];
};
const calculateAQILevel = (aqi: number): AirQualityLevel => {
  if (aqi <= 50) return 'good';
  if (aqi <= 100) return 'moderate';
  if (aqi <= 150) return 'unhealthy-sensitive';
  if (aqi <= 200) return 'unhealthy';
  if (aqi <= 300) return 'very-unhealthy';
  return 'hazardous';
};

// Datos de calidad del aire global (datos de muestra)
const globalAirQualityData: AirQualityLocation[] = [{
  id: '1',
  name: 'Nueva York',
  lat: 40.7128,
  lng: -74.0060,
  aqi: 85,
  level: 'moderate'
}, {
  id: '2',
  name: 'Los Ángeles',
  lat: 34.0522,
  lng: -118.2437,
  aqi: 125,
  level: 'unhealthy-sensitive'
}, {
  id: '3',
  name: 'Londres',
  lat: 51.5074,
  lng: -0.1278,
  aqi: 65,
  level: 'moderate'
}, {
  id: '4',
  name: 'París',
  lat: 48.8566,
  lng: 2.3522,
  aqi: 55,
  level: 'moderate'
}, {
  id: '5',
  name: 'Tokio',
  lat: 35.6762,
  lng: 139.6503,
  aqi: 45,
  level: 'good'
}, {
  id: '6',
  name: 'Beijing',
  lat: 39.9042,
  lng: 116.4074,
  aqi: 165,
  level: 'unhealthy'
}, {
  id: '7',
  name: 'Delhi',
  lat: 28.7041,
  lng: 77.1025,
  aqi: 195,
  level: 'unhealthy'
}, {
  id: '8',
  name: 'Mumbai',
  lat: 19.0760,
  lng: 72.8777,
  aqi: 152,
  level: 'unhealthy-sensitive'
}, {
  id: '9',
  name: 'Sídney',
  lat: -33.8688,
  lng: 151.2093,
  aqi: 35,
  level: 'good'
}, {
  id: '10',
  name: 'São Paulo',
  lat: -23.5505,
  lng: -46.6333,
  aqi: 72,
  level: 'moderate'
}, {
  id: '11',
  name: 'Ciudad de México',
  lat: 19.4326,
  lng: -99.1332,
  aqi: 98,
  level: 'moderate'
}, {
  id: '12',
  name: 'El Cairo',
  lat: 30.0444,
  lng: 31.2357,
  aqi: 178,
  level: 'unhealthy'
}, {
  id: '13',
  name: 'Moscú',
  lat: 55.7558,
  lng: 37.6173,
  aqi: 68,
  level: 'moderate'
}, {
  id: '14',
  name: 'Singapur',
  lat: 1.3521,
  lng: 103.8198,
  aqi: 52,
  level: 'moderate'
}, {
  id: '15',
  name: 'Dubái',
  lat: 25.2048,
  lng: 55.2708,
  aqi: 88,
  level: 'moderate'
}, {
  id: '16',
  name: 'Toronto',
  lat: 43.6532,
  lng: -79.3832,
  aqi: 42,
  level: 'good'
}, {
  id: '17',
  name: 'Berlín',
  lat: 52.5200,
  lng: 13.4050,
  aqi: 48,
  level: 'good'
}, {
  id: '18',
  name: 'Roma',
  lat: 41.9028,
  lng: 12.4964,
  aqi: 62,
  level: 'moderate'
}, {
  id: '19',
  name: 'Seúl',
  lat: 37.5665,
  lng: 126.9780,
  aqi: 78,
  level: 'moderate'
}, {
  id: '20',
  name: 'Bangkok',
  lat: 13.7563,
  lng: 100.5018,
  aqi: 115,
  level: 'unhealthy-sensitive'
}];

// Función para formatear la hora en formato de 12 horas con AM/PM
const formatTime = (hour: number): string => {
  if (hour === 0) return '12 AM';
  if (hour === 12) return '12 PM';
  if (hour < 12) return `${hour} AM`;
  return `${hour - 12} PM`;
};

// Función para calcular el tiempo transcurrido desde una fecha
const getTimeAgo = (date: Date): string => {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);
  
  if (diffMinutes < 1) return 'Ahora mismo';
  if (diffMinutes < 60) return `Hace ${diffMinutes} minuto${diffMinutes !== 1 ? 's' : ''}`;
  if (diffHours < 24) return `Hace ${diffHours} hora${diffHours !== 1 ? 's' : ''}`;
  return `Hace ${diffDays} día${diffDays !== 1 ? 's' : ''}`;
};

// Función para generar datos dinámicos basados en la ciudad
const generateCityData = (aqi: number) => {
  const level = calculateAQILevel(aqi);
  const baseMultiplier = aqi / 85; // 85 es el AQI de Nueva York (base)
  
  const pollutants: PollutantData[] = [{
    name: 'PM2.5',
    value: Math.round(35.2 * baseMultiplier * 10) / 10,
    unit: 'μg/m³',
    level: level,
    trend: Math.random() > 0.5 ? 'down' : 'up'
  }, {
    name: 'NO2',
    value: Math.round(42.8 * baseMultiplier * 10) / 10,
    unit: 'ppb',
    level: calculateAQILevel(Math.min(aqi + 10, 200)),
    trend: Math.random() > 0.3 ? 'stable' : 'up'
  }, {
    name: 'O3',
    value: Math.round(65.4 * baseMultiplier * 10) / 10,
    unit: 'ppb',
    level: level,
    trend: Math.random() > 0.5 ? 'up' : 'down'
  }, {
    name: 'PM10',
    value: Math.round(58.1 * baseMultiplier * 10) / 10,
    unit: 'μg/m³',
    level: level,
    trend: 'down'
  }];

  const weather: WeatherData = {
    temp: Math.round(15 + Math.random() * 20),
    humidity: Math.round(50 + Math.random() * 30),
    windSpeed: Math.round((10 + Math.random() * 15) * 10) / 10,
    windDirection: ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'][Math.floor(Math.random() * 8)],
    pressure: 1013,
    // Aerosol Index correlacionado con AQI (más contaminación = más aerosoles)
    aerosolIndex: Math.round((aqi / 50) * 10) / 10, // Rango típico 0-5
    // UV Index simulado (rango 0-11+)
    uvIndex: Math.round(2 + Math.random() * 8) // Rango 2-10
  };

  // Obtener la hora actual del sistema y generar pronóstico desde la próxima hora
  const now = new Date();
  const currentHour = now.getHours();
  const startHour = (currentHour + 1) % 24; // Comenzar desde la próxima hora
  
  // Generar 8 puntos de tiempo (cada 3 horas para completar 24 horas)
  const forecastData: ForecastData[] = [];
  const aqiMultipliers = [1.0, 1.08, 1.04, 0.88, 0.80, 0.73, 0.82, 0.94];
  
  for (let i = 0; i < 8; i++) {
    const forecastHour = (startHour + (i * 3)) % 24;
    const multiplier = aqiMultipliers[i];
    
    forecastData.push({
      time: formatTime(forecastHour),
      aqi: Math.round(aqi * multiplier),
      no2: Math.round(pollutants[1].value * (multiplier * 0.98)),
      pm25: Math.round(pollutants[0].value * multiplier),
      o3: Math.round(pollutants[2].value * (multiplier * 1.02))
    });
  }

  const historicalData: HistoricalData[] = [
    { date: 'Lun', aqi: Math.round(aqi * 0.76) },
    { date: 'Mar', aqi: Math.round(aqi * 0.92) },
    { date: 'Mié', aqi: Math.round(aqi * 0.96) },
    { date: 'Jue', aqi: Math.round(aqi * 0.88) },
    { date: 'Vie', aqi: Math.round(aqi * 1.04) },
    { date: 'Sáb', aqi: Math.round(aqi * 1.00) },
    { date: 'Dom', aqi: aqi }
  ];

  return { pollutants, weather, forecastData, historicalData };
};

// Función para generar alertas dinámicas basadas en el AQI y hora actual
const generateDynamicAlerts = (aqi: number, locationName: string): AlertData[] => {
  const alerts: AlertData[] = [];
  const level = calculateAQILevel(aqi);
  const now = new Date();
  const currentHour = now.getHours();
  
  // Alerta 1: Basada en el nivel de AQI (siempre se genera)
  const hoursAgo1 = Math.floor(Math.random() * 3) + 1; // 1-3 horas atrás
  const alertTime1 = new Date(now.getTime() - hoursAgo1 * 60 * 60 * 1000);
  
  if (level === 'hazardous' || level === 'very-unhealthy') {
    alerts.push({
      id: '1',
      severity: 'critical',
      message: `Alerta crítica: La calidad del aire en ${locationName} ha alcanzado niveles peligrosos. Se recomienda permanecer en interiores.`,
      timestamp: getTimeAgo(alertTime1),
      createdAt: alertTime1
    });
  } else if (level === 'unhealthy' || level === 'unhealthy-sensitive') {
    alerts.push({
      id: '1',
      severity: 'warning',
      message: `La calidad del aire en ${locationName} puede afectar a grupos sensibles. Considere reducir actividades al aire libre.`,
      timestamp: getTimeAgo(alertTime1),
      createdAt: alertTime1
    });
  } else if (level === 'moderate') {
    alerts.push({
      id: '1',
      severity: 'warning',
      message: `Calidad del aire moderada en ${locationName}. Los grupos sensibles deben considerar limitar la exposición prolongada.`,
      timestamp: getTimeAgo(alertTime1),
      createdAt: alertTime1
    });
  } else {
    // Para niveles "good" también mostrar una alerta informativa
    alerts.push({
      id: '1',
      severity: 'info',
      message: `La calidad del aire en ${locationName} es buena. Es un buen momento para actividades al aire libre.`,
      timestamp: getTimeAgo(alertTime1),
      createdAt: alertTime1
    });
  }
  
  // Alerta 2: Actualización de datos satelitales (siempre presente)
  const updateHoursAgo = Math.floor(Math.random() * 2) + 3; // 3-4 horas atrás
  const updateTime = new Date(now.getTime() - updateHoursAgo * 60 * 60 * 1000);
  alerts.push({
    id: '2',
    severity: 'info',
    message: `Los datos del satélite NASA TEMPO se han actualizado con las últimas mediciones para ${locationName}.`,
    timestamp: getTimeAgo(updateTime),
    createdAt: updateTime
  });
  
  // Alerta 3: Pronóstico (aleatoria basada en la hora)
  if (currentHour >= 6 && currentHour < 18 && Math.random() > 0.4) {
    const nextHours = Math.floor(Math.random() * 4) + 2; // 2-5 horas
    const forecastLevel = aqi > 100 ? 'incrementar' : 'mejorar';
    const forecastHoursAgo = Math.floor(Math.random() * 2) + 1;
    const forecastTime = new Date(now.getTime() - forecastHoursAgo * 60 * 60 * 1000);
    alerts.push({
      id: '3',
      severity: aqi > 100 ? 'warning' : 'info',
      message: `Se espera que la calidad del aire ${forecastLevel} en las próximas ${nextHours} horas en ${locationName}.`,
      timestamp: getTimeAgo(forecastTime),
      createdAt: forecastTime
    });
  }
  
  // Alerta 4: Recomendación de salud (si AQI > 100)
  if (aqi > 100 && Math.random() > 0.5) {
    const healthHoursAgo = Math.floor(Math.random() * 3) + 1;
    const healthTime = new Date(now.getTime() - healthHoursAgo * 60 * 60 * 1000);
    alerts.push({
      id: '4',
      severity: 'warning',
      message: 'Grupos sensibles (niños, adultos mayores, personas con problemas respiratorios) deben evitar ejercicio intenso al aire libre.',
      timestamp: getTimeAgo(healthTime),
      createdAt: healthTime
    });
  }
  
  return alerts;
};

// @component: AirQualityApp
export const AirQualityApp = () => {
  const [currentLocation, setCurrentLocation] = useState({
    lat: 40.7128,
    lng: -74.0060,
    name: 'Nueva York'
  });
  const [currentAQI, setCurrentAQI] = useState(85);
  const [activeTab, setActiveTab] = useState<'overview' | 'forecast' | 'map' | 'alerts'>('overview');
  const [showNotifications, setShowNotifications] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMapInterfaceOpen, setIsMapInterfaceOpen] = useState(false);
  const [alerts, setAlerts] = useState<AlertData[]>([]);
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>(() => {
    try {
      const raw = localStorage.getItem('notificationSettings');
      if (raw) return JSON.parse(raw);
    } catch (error) {
      console.error('Error loading notification settings:', error);
    }
    return {
      airQualityAlerts: true,
      dailySummary: true,
      forecastUpdates: false,
    };
  });
  const filteredAlerts = React.useMemo(() => {
    return alerts.filter(a => {
      // id '3' es pronóstico; id '1' es calidad del aire; id '4' salud (relacionada a calidad del aire)
      if (!notificationSettings.forecastUpdates && a.id === '3') return false;
      if (!notificationSettings.airQualityAlerts && (a.id === '1' || a.id === '4')) return false;
      return true;
    });
  }, [alerts, notificationSettings]);

  // Notificaciones nativas del navegador eliminadas
  
  // Generar datos dinámicos basados en el AQI actual
  const cityData = generateCityData(currentAQI);
  const pollutants = cityData.pollutants;
  const weather = cityData.weather;
  const forecastData = cityData.forecastData;
  const historicalData = cityData.historicalData;
  
  const aqiLevel = calculateAQILevel(currentAQI);

  // Actualizar alertas cada hora y cuando cambie la ubicación o AQI
  useEffect(() => {
    // Generar alertas iniciales
    const newAlerts = generateDynamicAlerts(currentAQI, currentLocation.name);
    setAlerts(newAlerts);

    // Actualizar alertas cada hora (3600000 ms)
    const alertInterval = setInterval(() => {
      const updatedAlerts = generateDynamicAlerts(currentAQI, currentLocation.name);
      setAlerts(updatedAlerts);
    }, 3600000); // 1 hora en milisegundos

    return () => clearInterval(alertInterval);
  }, [currentAQI, currentLocation.name]);

  // Actualizar los timestamps de las alertas cada minuto para que se actualicen dinámicamente
  useEffect(() => {
    const timestampInterval = setInterval(() => {
      setAlerts(prevAlerts => 
        prevAlerts.map(alert => ({
          ...alert,
          timestamp: getTimeAgo(alert.createdAt)
        }))
      );
    }, 60000); // 1 minuto en milisegundos

    return () => clearInterval(timestampInterval);
  }, []);

  // Persistir configuración de notificaciones
  useEffect(() => {
    try {
      localStorage.setItem('notificationSettings', JSON.stringify(notificationSettings));
    } catch (error) {
      console.error('Error saving notification settings:', error);
    }
  }, [notificationSettings]);

  // Sin efectos de notificaciones del navegador

  // Función para seleccionar una ciudad del mapa
  const handleCitySelect = (location: AirQualityLocation) => {
    setCurrentLocation({
      lat: location.lat,
      lng: location.lng,
      name: location.name
    });
    setCurrentAQI(location.aqi);
    // Cambiar automáticamente a la pestaña de resumen
    setActiveTab('overview');
  };
  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(position => {
        setCurrentLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          name: 'Ubicación actual'
        });
      }, error => {
        console.log('Acceso a ubicación denegado:', error);
      });
    }
  }, []);

  // @return
  return <div className="h-screen w-full relative overflow-hidden flex" style={{
    fontFamily: "'Nunito', 'Quicksand', 'Poppins', sans-serif"
  }}>
    {/* Fondo de la Tierra 3D */}
    <EarthBackground />
    
    {/* Overlay semi-transparente para mejorar la legibilidad (15% más opacidad) */}
    <div className="absolute inset-0 bg-gradient-to-br from-[#1a3a52]/55 via-[#2d5a7b]/45 to-[#1a3a52]/55 z-10" />

    {/* Contenido principal con z-index mayor */}
    <div className="relative z-20 h-full w-full flex">
      {/* Barra lateral de escritorio */}
      <aside className="hidden lg:flex lg:flex-col lg:w-72 bg-gradient-to-b from-[#2d5a7b]/60 to-[#1a3a52]/60 backdrop-blur-sm border-r-2 border-[#87CEEB]/30 shadow-2xl">
        <div className="p-3 border-b border-[#87CEEB]/20">
          <div className="flex items-center justify-center">
            {/* Centered extra large logo with white shadow effect */}
            <div className="relative">
              <img src="/logo.png" alt="App Logo" className="w-64 h-64 object-contain" style={{
                filter: 'drop-shadow(0 4px 8px rgba(255, 255, 255, 0.3)) drop-shadow(0 2px 4px rgba(255, 255, 255, 0.5))'
              }} />
              <div className="absolute -top-1 -right-1 w-7 h-7 bg-[#98D8C8] rounded-full animate-pulse shadow-lg shadow-[#98D8C8]/50" />
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          <button onClick={() => setActiveTab('overview')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all font-semibold ${activeTab === 'overview' ? 'bg-gradient-to-r from-[#87CEEB] to-[#5DADE2] text-white shadow-lg shadow-[#87CEEB]/40' : 'text-[#B0E0E6] hover:bg-[#87CEEB]/10'}`} style={activeTab === 'overview' ? {
          boxShadow: '0 8px 16px rgba(135, 206, 235, 0.3), inset 0 -3px 8px rgba(0, 0, 0, 0.2)'
        } : {}}>
            <Activity className="w-5 h-5" />
            <span>Resumen</span>
          </button>
          <button onClick={() => setActiveTab('forecast')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all font-semibold ${activeTab === 'forecast' ? 'bg-gradient-to-r from-[#87CEEB] to-[#5DADE2] text-white shadow-lg shadow-[#87CEEB]/40' : 'text-[#B0E0E6] hover:bg-[#87CEEB]/10'}`} style={activeTab === 'forecast' ? {
          boxShadow: '0 8px 16px rgba(135, 206, 235, 0.3), inset 0 -3px 8px rgba(0, 0, 0, 0.2)'
        } : {}}>
            <TrendingUp className="w-5 h-5" />
            <span>Pronóstico</span>
          </button>
          <button onClick={() => setActiveTab('map')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all font-semibold ${activeTab === 'map' ? 'bg-gradient-to-r from-[#87CEEB] to-[#5DADE2] text-white shadow-lg shadow-[#87CEEB]/40' : 'text-[#B0E0E6] hover:bg-[#87CEEB]/10'}`} style={activeTab === 'map' ? {
          boxShadow: '0 8px 16px rgba(135, 206, 235, 0.3), inset 0 -3px 8px rgba(0, 0, 0, 0.2)'
        } : {}}>
            <MapPin className="w-5 h-5" />
            <span>Mapa Global</span>
          </button>
          <button onClick={() => setActiveTab('alerts')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all font-semibold ${activeTab === 'alerts' ? 'bg-gradient-to-r from-[#87CEEB] to-[#5DADE2] text-white shadow-lg shadow-[#87CEEB]/40' : 'text-[#B0E0E6] hover:bg-[#87CEEB]/10'}`} style={activeTab === 'alerts' ? {
          boxShadow: '0 8px 16px rgba(135, 206, 235, 0.3), inset 0 -3px 8px rgba(0, 0, 0, 0.2)'
        } : {}}>
            <Bell className="w-5 h-5" />
            <span>Alertas</span>
            {alerts.length > 0 && <span className="ml-auto bg-[#98D8C8] text-[#1a3a52] text-xs px-2 py-1 rounded-full font-bold shadow-md">
                {alerts.length}
              </span>}
          </button>
        </nav>

        <div className="p-4 border-t border-[#87CEEB]/20">
          <div className="bg-[#87CEEB]/10 backdrop-blur rounded-lg p-4 border border-[#87CEEB]/30">
            <div className="flex items-center gap-2 mb-2">
              <MapPin className="w-4 h-4 text-[#98D8C8]" />
              <span className="text-xs font-bold text-white">
                <span>Ubicación Actual</span>
              </span>
            </div>
            <p className="text-sm text-white font-semibold">
              <span>{currentLocation.name}</span>
            </p>
            <p className="text-xs text-[#B0E0E6] mt-1">
              <span>{currentLocation.lat.toFixed(4)}°, {currentLocation.lng.toFixed(4)}°</span>
            </p>
          </div>
        </div>
      </aside>

      {/* Superposicion de barra lateral movil */}
      <AnimatePresence>
        {sidebarOpen && <motion.div initial={{
        opacity: 0
      }} animate={{
        opacity: 1
      }} exit={{
        opacity: 0
      }} className="lg:hidden fixed inset-0 bg-black/50 z-40" onClick={() => setSidebarOpen(false)}>
            <motion.aside initial={{
          x: -300
        }} animate={{
          x: 0
        }} exit={{
          x: -300
        }} className="w-72 h-full bg-gradient-to-b from-[#2d5a7b]/70 to-[#1a3a52]/70 backdrop-blur-sm border-r-2 border-[#87CEEB]/30 shadow-2xl" onClick={e => e.stopPropagation()}>
              <div className="p-6 border-b border-[#87CEEB]/20">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <img src="/logo.png" alt="App Logo" className="w-8 h-8 object-contain" />
                      <div className="absolute -top-1 -right-1 w-2 h-2 bg-[#98D8C8] rounded-full animate-pulse shadow-lg shadow-[#98D8C8]/50" />
                    </div>
                    <div>
                      <h1 className="text-lg font-bold text-white tracking-wide">
                        <span>NASA TEMPO</span>
                      </h1>
                      <p className="text-xs text-[#B0E0E6]">
                        <span>Monitor de Calidad del Aire</span>
                      </p>
                    </div>
                  </div>
                  <button onClick={() => setSidebarOpen(false)} className="p-2 hover:bg-[#87CEEB]/10 rounded-full transition-colors">
                    <X className="w-5 h-5 text-white" />
                  </button>
                </div>
              </div>

              <nav className="p-4 space-y-2">
                <button onClick={() => {
              setActiveTab('overview');
              setSidebarOpen(false);
            }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all font-semibold ${activeTab === 'overview' ? 'bg-gradient-to-r from-[#87CEEB] to-[#5DADE2] text-white shadow-lg shadow-[#87CEEB]/40' : 'text-[#B0E0E6] hover:bg-[#87CEEB]/10'}`} style={activeTab === 'overview' ? {
              boxShadow: '0 8px 16px rgba(135, 206, 235, 0.3), inset 0 -3px 8px rgba(0, 0, 0, 0.2)'
            } : {}}>
                  <Activity className="w-5 h-5" />
                  <span>Resumen</span>
                </button>
                <button onClick={() => {
              setActiveTab('forecast');
              setSidebarOpen(false);
            }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all font-semibold ${activeTab === 'forecast' ? 'bg-gradient-to-r from-[#87CEEB] to-[#5DADE2] text-white shadow-lg shadow-[#87CEEB]/40' : 'text-[#B0E0E6] hover:bg-[#87CEEB]/10'}`} style={activeTab === 'forecast' ? {
              boxShadow: '0 8px 16px rgba(135, 206, 235, 0.3), inset 0 -3px 8px rgba(0, 0, 0, 0.2)'
            } : {}}>
                  <TrendingUp className="w-5 h-5" />
                  <span>Pronóstico</span>
                </button>
                <button onClick={() => {
              setActiveTab('map');
              setSidebarOpen(false);
            }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all font-semibold ${activeTab === 'map' ? 'bg-gradient-to-r from-[#87CEEB] to-[#5DADE2] text-white shadow-lg shadow-[#87CEEB]/40' : 'text-[#B0E0E6] hover:bg-[#87CEEB]/10'}`} style={activeTab === 'map' ? {
              boxShadow: '0 8px 16px rgba(135, 206, 235, 0.3), inset 0 -3px 8px rgba(0, 0, 0, 0.2)'
            } : {}}>
                  <MapPin className="w-5 h-5" />
                  <span>Mapa Global</span>
                </button>
                <button onClick={() => {
              setActiveTab('alerts');
              setSidebarOpen(false);
            }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all font-semibold ${activeTab === 'alerts' ? 'bg-gradient-to-r from-[#87CEEB] to-[#5DADE2] text-white shadow-lg shadow-[#87CEEB]/40' : 'text-[#B0E0E6] hover:bg-[#87CEEB]/10'}`} style={activeTab === 'alerts' ? {
              boxShadow: '0 8px 16px rgba(135, 206, 235, 0.3), inset 0 -3px 8px rgba(0, 0, 0, 0.2)'
            } : {}}>
                  <Bell className="w-5 h-5" />
                  <span>Alertas</span>
                  {alerts.length > 0 && <span className="ml-auto bg-[#98D8C8] text-[#1a3a52] text-xs px-2 py-1 rounded-full font-bold shadow-md">
                      {alerts.length}
                    </span>}
                </button>
              </nav>
            </motion.aside>
          </motion.div>}
      </AnimatePresence>

      {/* Contenido principal */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Encabezado movil/escritorio */}
        <header className="bg-gradient-to-r from-[#2d5a7b]/60 to-[#4A90A4]/60 backdrop-blur-sm shadow-lg p-4 flex items-center justify-between sticky top-0 z-30 border-b-2 border-[#87CEEB]/30">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 hover:bg-[#87CEEB]/10 rounded-full transition-colors">
              <Menu className="w-6 h-6 text-white" />
            </button>
            <div className="lg:hidden flex items-center gap-2">
              <div className="relative">
                <img src="/logo.png" alt="App Logo" className="w-6 h-6 object-contain" />
                <div className="absolute -top-1 -right-1 w-2 h-2 bg-[#98D8C8] rounded-full animate-pulse shadow-lg shadow-[#98D8C8]/50" />
              </div>
              <div>
                <h1 className="text-base font-bold text-white tracking-wide">
                  <span>NASA TEMPO</span>
                </h1>
              </div>
            </div>
            <div className="hidden lg:block">
              <h2 className="text-xl font-bold text-white capitalize">
                <span>{activeTab === 'overview' ? 'Resumen' : activeTab === 'forecast' ? 'Pronóstico' : activeTab === 'map' ? 'Mapa Global' : 'Alertas'}</span>
              </h2>
              <p className="text-xs text-[#B0E0E6]">
                <span>Monitoreo de calidad del aire en tiempo real</span>
              </p>
            </div>
          </div>
          <button onClick={() => setShowNotifications(!showNotifications)} className="relative p-2 hover:bg-[#87CEEB]/10 rounded-full transition-colors">
            <Bell className="w-5 h-5 text-white" />
            {filteredAlerts.length > 0 && <span className="absolute top-1 right-1 w-2 h-2 bg-[#98D8C8] rounded-full animate-pulse shadow-lg shadow-[#98D8C8]/50" />}
          </button>
        </header>

        {/* Men� desplegable de notificaciones */}
        <AnimatePresence>
          {showNotifications && <motion.div initial={{
          opacity: 0,
          y: -20
        }} animate={{
          opacity: 1,
          y: 0
        }} exit={{
          opacity: 0,
          y: -20
        }} className="absolute top-16 right-4 left-4 lg:left-auto lg:w-96 bg-gradient-to-br from-[#2d5a7b]/60 to-[#4A90A4]/60 backdrop-blur-sm rounded-xl shadow-2xl p-4 z-40 border border-[#87CEEB]/30 max-h-96 overflow-y-auto">
              <h3 className="font-bold text-white mb-3">
                <span>Notificaciones</span>
              </h3>
              {filteredAlerts.map(alert => <div key={alert.id} className="mb-3 last:mb-0 p-3 bg-[#87CEEB]/10 backdrop-blur rounded-lg border border-[#87CEEB]/30">
                  <div className="flex items-start gap-2">
                    {alert.severity === 'critical' && <AlertCircle className="w-4 h-4 text-[#E67E22] mt-0.5" />}
                    {alert.severity === 'warning' && <AlertTriangle className="w-4 h-4 text-[#F8B739] mt-0.5" />}
                    {alert.severity === 'info' && <Info className="w-4 h-4 text-[#87CEEB] mt-0.5" />}
                    <div className="flex-1">
                      <p className="text-sm text-white">
                        <span>{alert.message}</span>
                      </p>
                      <p className="text-xs text-[#B0E0E6] mt-1">
                        <span>{alert.timestamp}</span>
                      </p>
                    </div>
                  </div>
                </div>)}
            </motion.div>}
        </AnimatePresence>

        {/* �rea de contenido */}
        <div className="flex-1 overflow-auto pb-20 lg:pb-0">
          {activeTab === 'overview' && <motion.div initial={{
          opacity: 0
        }} animate={{
          opacity: 1
        }} className="p-4 lg:p-6 space-y-4 lg:space-y-6 text-lg lg:text-xl">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
                {/* Tarjeta de ICA */}
                <div className="bg-gradient-to-br from-[#2d5a7b]/50 to-[#1a3a52]/50 backdrop-blur-xs rounded-2xl shadow-2xl p-6 border border-[#87CEEB]/30 lg:col-span-2">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                    <div className="flex items-center gap-4">
                      <MapPin className="w-5 h-5 text-[#98D8C8] flex-shrink-0" />
                      <div>
                        <span className="text-4xl lg:text-5xl font-bold text-white">
                          <span>{currentLocation.name}</span>
                        </span>
                        <p className="text-base lg:text-lg text-[#B0E0E6]">
                          <span>{currentLocation.lat.toFixed(4)}°,
                          {currentLocation.lng.toFixed(4)}°</span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-8">
                      <motion.div initial={{
                    scale: 0.8
                  }} animate={{
                    scale: 1
                  }} className="flex-shrink-0">
                        <div className="w-32 h-32 lg:w-36 lg:h-36 rounded-full flex items-center justify-center bg-gradient-to-br from-[#87CEEB]/30 to-[#87CEEB]/10 backdrop-blur border-4 border-[#98D8C8]/50" style={{
                      boxShadow: '0 12px 24px rgba(152, 216, 200, 0.3), inset 0 -4px 12px rgba(0, 0, 0, 0.2)'
                    }}>
                          <div className="w-24 h-24 lg:w-28 lg:h-28 rounded-full flex items-center justify-center bg-gradient-to-br from-[#87CEEB]/40 to-[#87CEEB]/20 backdrop-blur" style={{
                        boxShadow: 'inset 0 4px 8px rgba(0, 0, 0, 0.15)'
                      }}>
                            <span className="text-4xl lg:text-5xl font-bold text-white drop-shadow-lg">
                              {currentAQI}
                            </span>
                          </div>
                        </div>
                      </motion.div>

                      <div className="text-left">
                        <h2 className="text-2xl lg:text-3xl font-bold text-white mb-2 tracking-wide">
                          <span>Indice de Calidad del Aire</span>
                        </h2>
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#87CEEB]/20 backdrop-blur border border-[#87CEEB]/40" style={{
                      boxShadow: '0 4px 12px rgba(135, 206, 235, 0.2), inset 0 -2px 6px rgba(0, 0, 0, 0.15)'
                    }}>
                          <CheckCircle className="w-4 h-4 text-[#98D8C8]" />
                          <span className="font-bold text-white text-base lg:text-lg">
                            <span>{getAQILabel(aqiLevel)}</span>
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-[#87CEEB]/10 backdrop-blur rounded-xl p-4 mt-6 border border-[#87CEEB]/30">
                    <p className="text-base lg:text-lg text-[#B0E0E6] leading-relaxed">
                      <span>
                        La calidad del aire es aceptable para la mayoria de las personas. Los grupos sensibles deben considerar reducir la actividad prolongada al aire libre.
                      </span>
                    </p>
                  </div>
                </div>

                {/* Cuadr�cula de contaminantes */}
                <div className="bg-gradient-to-br from-[#2d5a7b]/50 to-[#1a3a52]/50 backdrop-blur-xs rounded-2xl shadow-2xl p-6 border border-[#87CEEB]/30">
                  <h3 className="text-2xl font-bold text-white mb-4">
                    <span>Niveles de Contaminantes</span>
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    {pollutants.map(pollutant => <div key={pollutant.name} className="bg-[#87CEEB]/10 backdrop-blur rounded-xl p-4 border border-[#87CEEB]/30 hover:bg-[#87CEEB]/15 transition-colors" style={{
                  boxShadow: '0 4px 8px rgba(135, 206, 235, 0.15), inset 0 -2px 4px rgba(0, 0, 0, 0.1)'
                }}>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-bold text-white">
                            <span>{pollutant.name}</span>
                          </span>
                          {pollutant.trend === 'up' && <TrendingUp className="w-3 h-3 text-[#E67E22]" />}
                          {pollutant.trend === 'down' && <TrendingDown className="w-3 h-3 text-[#98D8C8]" />}
                        </div>
                        <div className="flex items-baseline gap-1">
                          <span className="text-xl font-bold text-white">{pollutant.value}</span>
                          <span className="text-sm text-[#B0E0E6]">
                            <span>{pollutant.unit}</span>
                          </span>
                        </div>
                        <div className="mt-2 h-1.5 rounded-full bg-[#87CEEB]/20">
                          <div className="h-full rounded-full transition-all" style={{
                      backgroundColor: getAQIColor(pollutant.level),
                      width: '70%'
                    }} />
                        </div>
                      </div>)}
                  </div>
                </div>

                {/* Condiciones clim�ticas */}
                <div className="bg-gradient-to-br from-[#2d5a7b]/50 to-[#1a3a52]/50 backdrop-blur-xs rounded-2xl shadow-2xl p-6 border border-[#87CEEB]/30">
                  <h3 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                    <Cloud className="w-5 h-5 text-[#98D8C8]" />
                    <span>Condiciones Climaticas</span>
                  </h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center p-3 bg-[#87CEEB]/10 backdrop-blur rounded-xl border border-[#87CEEB]/30" style={{
                  boxShadow: '0 4px 8px rgba(135, 206, 235, 0.15), inset 0 -2px 4px rgba(0, 0, 0, 0.1)'
                }}>
                      <Sun className="w-6 h-6 text-[#F8B739] mx-auto mb-2" />
                      <p className="text-2xl font-bold text-white">{weather.temp}°</p>
                      <p className="text-xs text-[#B0E0E6] mt-1">
                        <span>Temperatura</span>
                      </p>
                    </div>
                    <div className="text-center p-3 bg-[#87CEEB]/10 backdrop-blur rounded-xl border border-[#87CEEB]/30" style={{
                  boxShadow: '0 4px 8px rgba(135, 206, 235, 0.15), inset 0 -2px 4px rgba(0, 0, 0, 0.1)'
                }}>
                      <Droplets className="w-6 h-6 text-[#87CEEB] mx-auto mb-2" />
                      <p className="text-2xl font-bold text-white">{weather.humidity}%</p>
                      <p className="text-xs text-[#B0E0E6] mt-1">
                        <span>Humedad</span>
                      </p>
                    </div>
                    <div className="text-center p-3 bg-[#87CEEB]/10 backdrop-blur rounded-xl border border-[#87CEEB]/30" style={{
                  boxShadow: '0 4px 8px rgba(135, 206, 235, 0.15), inset 0 -2px 4px rgba(0, 0, 0, 0.1)'
                }}>
                      <Wind className="w-6 h-6 text-[#5DADE2] mx-auto mb-2" />
                      <p className="text-2xl font-bold text-white">{weather.windSpeed}</p>
                      <p className="text-xs text-[#B0E0E6] mt-1">
                        <span>km/h {weather.windDirection}</span>
                      </p>
                    </div>
                  </div>
                </div>

                {/* Índices Atmosféricos */}
                <div className="bg-gradient-to-br from-[#2d5a7b]/50 to-[#1a3a52]/50 backdrop-blur-xs rounded-2xl shadow-2xl p-6 border border-[#87CEEB]/30 lg:col-span-2">
                  <h3 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                    <Satellite className="w-5 h-5 text-[#98D8C8]" />
                    <span>Índices Atmosféricos</span>
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-[#87CEEB]/10 backdrop-blur rounded-xl p-4 border border-[#87CEEB]/30">
                      <div className="flex items-center gap-3 mb-2">
                        <Activity className="w-5 h-5 text-[#E67E22]" />
                        <h4 className="font-bold text-white text-xl">Aerosol Index</h4>
                        <span className="ml-auto text-3xl font-bold text-[#E67E22]">{weather.aerosolIndex}</span>
                      </div>
                      <p className="text-sm text-[#B0E0E6] leading-relaxed">
                        Medición de aerosoles atmosféricos correlacionada con la calidad del aire. 
                        Valores más altos indican mayor presencia de partículas en suspensión.
                      </p>
                    </div>
                    <div className="bg-[#87CEEB]/10 backdrop-blur rounded-xl p-4 border border-[#87CEEB]/30">
                      <div className="flex items-center gap-3 mb-2">
                        <Sun className="w-5 h-5 text-[#F39C12]" />
                        <h4 className="font-bold text-white text-xl">UV Index</h4>
                        <span className="ml-auto text-3xl font-bold text-[#F39C12]">{weather.uvIndex}</span>
                      </div>
                      <p className="text-sm text-[#B0E0E6] leading-relaxed">
                        Índice de radiación ultravioleta. Valores 0-2: Bajo, 3-5: Moderado, 6-7: Alto, 
                        8-10: Muy Alto, 11+: Extremo. Use protección solar cuando sea necesario.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Tendencia de 7 d�as */}
                <div className="bg-gradient-to-br from-[#2d5a7b]/50 to-[#1a3a52]/50 backdrop-blur-xs rounded-2xl shadow-2xl p-6 border border-[#87CEEB]/30 lg:col-span-2">
                  <h3 className="text-2xl font-bold text-white mb-4">
                    <span>Tendencia de 7 Dias</span>
                  </h3>
                  <ResponsiveContainer width="100%" height={250}>
                    <AreaChart data={historicalData}>
                      <defs>
                        <linearGradient id="aqiGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#2E86AB" stopOpacity={0.8} />
                          <stop offset="50%" stopColor="#A23B72" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#F18F01" stopOpacity={0.1} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(46, 134, 171, 0.2)" />
                      <XAxis dataKey="date" tick={{
                    fontSize: 12,
                    fill: '#FFFFFF'
                  }} stroke="rgba(46, 134, 171, 0.3)" />
                      <YAxis tick={{
                    fontSize: 12,
                    fill: '#FFFFFF'
                  }} stroke="rgba(46, 134, 171, 0.3)" />
                      <Tooltip contentStyle={{
                    backgroundColor: '#2d5a7b',
                    border: '1px solid #2E86AB',
                    borderRadius: '8px',
                    color: '#FFFFFF'
                  }} />
                      <Area type="monotone" dataKey="aqi" stroke="#2E86AB" strokeWidth={3} fillOpacity={1} fill="url(#aqiGradient)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </motion.div>}

          {activeTab === 'forecast' && <motion.div initial={{
          opacity: 0
        }} animate={{
          opacity: 1
        }} className="p-4 lg:p-6 space-y-4 lg:space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
                {/* Información de la ciudad seleccionada */}
                <div className="bg-gradient-to-br from-[#2d5a7b]/50 to-[#1a3a52]/50 backdrop-blur-xs rounded-2xl shadow-2xl p-4 border border-[#87CEEB]/30 lg:col-span-2">
                  <div className="flex items-center gap-4">
                    <MapPin className="w-5 h-5 text-[#98D8C8] flex-shrink-0" />
                    <div className="flex-1">
                      <span className="text-base font-bold text-white">
                        <span>Pronóstico para {currentLocation.name}</span>
                      </span>
                      <p className="text-xs text-[#B0E0E6]">
                        <span>ICA Actual: {currentAQI} - {getAQILabel(aqiLevel)}</span>
                      </p>
                    </div>
                  </div>
                </div>
                
                {/* Pron�stico de 24 horas */}
                <div className="bg-gradient-to-br from-[#2d5a7b]/50 to-[#1a3a52]/50 backdrop-blur-xs rounded-2xl shadow-2xl p-6 border border-[#87CEEB]/30 lg:col-span-2">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-2xl font-bold text-white">
                      <span>Pronóstico de 24 Horas</span>
                    </h3>
                    <Calendar className="w-5 h-5 text-[#98D8C8]" />
                  </div>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={forecastData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(46, 134, 171, 0.2)" />
                      <XAxis dataKey="time" tick={{
                    fontSize: 10,
                    fill: '#FFFFFF'
                  }} stroke="rgba(46, 134, 171, 0.3)" />
                      <YAxis tick={{
                    fontSize: 10,
                    fill: '#FFFFFF'
                  }} stroke="rgba(46, 134, 171, 0.3)" />
                      <Tooltip contentStyle={{
                    backgroundColor: '#2d5a7b',
                    border: '1px solid #2E86AB',
                    borderRadius: '8px',
                    color: '#FFFFFF'
                  }} />
                      <Legend wrapperStyle={{
                    fontSize: '12px',
                    color: '#FFFFFF'
                  }} />
                      <Line type="monotone" dataKey="aqi" stroke="#2E86AB" strokeWidth={3} name="ICA" dot={{
                    fill: '#4A9EDE',
                    r: 4
                  }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                {/* Pron�stico de contaminantes */}
                <div className="bg-gradient-to-br from-[#2d5a7b]/50 to-[#1a3a52]/50 backdrop-blur-xs rounded-2xl shadow-2xl p-6 border border-[#87CEEB]/30 lg:col-span-2">
                  <h3 className="text-2xl font-bold text-white mb-4">
                    <span>Pronóstico de Contaminantes</span>
                  </h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={forecastData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(46, 134, 171, 0.2)" />
                      <XAxis dataKey="time" tick={{
                    fontSize: 10,
                    fill: '#FFFFFF'
                  }} stroke="rgba(46, 134, 171, 0.3)" />
                      <YAxis tick={{
                    fontSize: 10,
                    fill: '#FFFFFF'
                  }} stroke="rgba(46, 134, 171, 0.3)" />
                      <Tooltip contentStyle={{
                    backgroundColor: '#2d5a7b',
                    border: '1px solid #2E86AB',
                    borderRadius: '8px',
                    color: '#FFFFFF'
                  }} />
                      <Legend wrapperStyle={{
                    fontSize: '12px',
                    color: '#FFFFFF'
                  }} />
                      <Bar dataKey="no2" fill="#1A73E8" name="NO2" />
                      <Bar dataKey="pm25" fill="#4285F4" name="PM2.5" />
                      <Bar dataKey="o3" fill="#6FA8FF" name="O3" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Desglose por hora */}
                <div className="bg-gradient-to-br from-[#2d5a7b]/50 to-[#1a3a52]/50 backdrop-blur-xs rounded-2xl shadow-2xl p-6 border border-[#87CEEB]/30 lg:col-span-2">
                  <h3 className="text-2xl font-bold text-white mb-4">
                    <span>Desglose por Hora</span>
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                    {forecastData.map((forecast, idx) => <div key={idx} className="flex items-center justify-between p-4 bg-[#87CEEB]/10 backdrop-blur rounded-lg border border-[#87CEEB]/30" style={{
                  boxShadow: '0 4px 8px rgba(135, 206, 235, 0.15), inset 0 -2px 4px rgba(0, 0, 0, 0.1)'
                }}>
                        <div className="flex-1">
                          <span className="text-sm font-semibold text-white block">
                            <span>{forecast.time}</span>
                          </span>
                          <span className="text-xs text-[#B0E0E6]">
                            <span>{getAQILabel(calculateAQILevel(forecast.aqi))}</span>
                          </span>
                        </div>
                        <div className="w-12 h-12 rounded-full flex items-center justify-center border-2 border-[#98D8C8]/50 bg-[#87CEEB]/10 backdrop-blur" style={{
                    boxShadow: '0 4px 8px rgba(152, 216, 200, 0.2), inset 0 -2px 4px rgba(0, 0, 0, 0.15)'
                  }}>
                          <span className="text-sm font-bold text-white">{forecast.aqi}</span>
                        </div>
                      </div>)}
                  </div>
                </div>
              </div>
            </motion.div>}

          {activeTab === 'map' && <TempoMapInline />}

          {activeTab === 'alerts' && <motion.div initial={{
          opacity: 0
        }} animate={{
          opacity: 1
        }} className="p-4 lg:p-6 space-y-4 lg:space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
                {/* Recomendaciones de salud */}
                <div className="bg-gradient-to-br from-[#2d5a7b]/50 to-[#1a3a52]/50 backdrop-blur-xs rounded-2xl shadow-2xl p-6 border border-[#87CEEB]/30">
                  <h3 className="text-lg font-bold text-white mb-4">
                    <span>Recomendaciones de Salud</span>
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3 p-4 bg-[#98D8C8]/20 backdrop-blur rounded-lg border border-[#98D8C8]/40" style={{
                  boxShadow: '0 4px 8px rgba(152, 216, 200, 0.2), inset 0 -2px 4px rgba(0, 0, 0, 0.1)'
                }}>
                      <CheckCircle className="w-5 h-5 text-[#98D8C8] mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-bold text-sm text-white">
                          <span>Poblacion General</span>
                        </p>
                        <p className="text-xs text-[#B0E0E6]">
                          <span>Las actividades al aire libre son aceptables. Disfrute de su rutina habitual.</span>
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 p-4 bg-[#F8B739]/20 backdrop-blur rounded-lg border border-[#F8B739]/40" style={{
                  boxShadow: '0 4px 8px rgba(248, 183, 57, 0.2), inset 0 -2px 4px rgba(0, 0, 0, 0.1)'
                }}>
                      <AlertTriangle className="w-5 h-5 text-[#F8B739] mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-bold text-sm text-white">
                          <span>Grupos Sensibles</span>
                        </p>
                        <p className="text-xs text-[#B0E0E6]">
                          <span>Considere reducir el ejercicio prolongado o intenso al aire libre.</span>
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 p-4 bg-[#E67E22]/20 backdrop-blur rounded-lg border border-[#E67E22]/40" style={{
                  boxShadow: '0 4px 8px rgba(230, 126, 34, 0.2), inset 0 -2px 4px rgba(0, 0, 0, 0.1)'
                }}>
                      <Info className="w-5 h-5 text-[#E67E22] mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-bold text-sm text-white">
                          <span>Niños y Adultos Mayores</span>
                        </p>
                        <p className="text-xs text-[#B0E0E6]">
                          <span>Tome descansos durante las actividades al aire libre si experimenta sintomas.</span>
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Alertas activas */}
                <div className="bg-gradient-to-br from-[#2d5a7b]/50 to-[#1a3a52]/50 backdrop-blur-xs rounded-2xl shadow-2xl p-6 border border-[#87CEEB]/30">
                  <h3 className="text-lg font-bold text-white mb-4">
                    <span>Alertas Activas</span>
                  </h3>
                  {filteredAlerts.length > 0 ? <div className="space-y-3">
                      {filteredAlerts.map(alert => <div key={alert.id} className={`p-4 rounded-lg border backdrop-blur ${alert.severity === 'critical' ? 'bg-[#E67E22]/20 border-[#E67E22]/40' : alert.severity === 'warning' ? 'bg-[#F8B739]/20 border-[#F8B739]/40' : 'bg-[#87CEEB]/20 border-[#87CEEB]/40'}`} style={{
                  boxShadow: alert.severity === 'critical' ? '0 4px 8px rgba(230, 126, 34, 0.2), inset 0 -2px 4px rgba(0, 0, 0, 0.1)' : alert.severity === 'warning' ? '0 4px 8px rgba(248, 183, 57, 0.2), inset 0 -2px 4px rgba(0, 0, 0, 0.1)' : '0 4px 8px rgba(135, 206, 235, 0.2), inset 0 -2px 4px rgba(0, 0, 0, 0.1)'
                }}>
                          <div className="flex items-start gap-3">
                            {alert.severity === 'critical' && <AlertCircle className="w-5 h-5 text-[#E67E22] mt-0.5 flex-shrink-0" />}
                            {alert.severity === 'warning' && <AlertTriangle className="w-5 h-5 text-[#F8B739] mt-0.5 flex-shrink-0" />}
                            {alert.severity === 'info' && <Info className="w-5 h-5 text-[#87CEEB] mt-0.5 flex-shrink-0" />}
                            <div className="flex-1">
                              <p className="text-sm text-white font-semibold">
                                <span>{alert.message}</span>
                              </p>
                              <p className="text-xs text-[#B0E0E6] mt-1">
                                <span>{alert.timestamp}</span>
                              </p>
                            </div>
                          </div>
                        </div>)}
                    </div> : <p className="text-sm text-[#B0E0E6] text-center py-4">
                      <span>No hay alertas activas en este momento</span>
                    </p>}
                </div>

                {/* Resumen diario (visible solo si está activo) */}
                {notificationSettings.dailySummary && (
                  <div className="bg-gradient-to-br from-[#2d5a7b]/50 to-[#1a3a52]/50 backdrop-blur-xs rounded-2xl shadow-2xl p-6 border border-[#87CEEB]/30 lg:col-span-2">
                    <h3 className="text-lg font-bold text-white mb-2">
                      <span>Resumen Diario</span>
                    </h3>
                    <p className="text-sm text-[#B0E0E6]">
                      <span>Recibirás un resumen diario de la calidad del aire y pronóstico.
                      Esta opción está activada.</span>
                    </p>
                  </div>
                )}

                {/* Configuraci�n de notificaciones */}
                <div className="bg-gradient-to-br from-[#2d5a7b]/50 to-[#1a3a52]/50 backdrop-blur-xs rounded-2xl shadow-2xl p-6 border border-[#87CEEB]/30 lg:col-span-2">
                  <h3 className="text-lg font-bold text-white mb-4">
                    <span>Configuracion de Notificaciones</span>
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex items-center justify-between p-4 bg-[#87CEEB]/10 backdrop-blur rounded-lg border border-[#87CEEB]/30" style={{
                  boxShadow: '0 4px 8px rgba(135, 206, 235, 0.15), inset 0 -2px 4px rgba(0, 0, 0, 0.1)'
                }}>
                      <div className="flex-1 mr-4">
                        <p className="text-sm font-bold text-white">
                          <span>Alertas de Calidad del Aire</span>
                        </p>
                        <p className="text-xs text-[#B0E0E6] mt-1">
                          <span>Recibe notificaciones cuando cambia el ICA</span>
                        </p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
                        <input
                          type="checkbox"
                          className="sr-only peer"
                          checked={notificationSettings.airQualityAlerts}
                          onChange={(e) =>
                            setNotificationSettings({
                              ...notificationSettings,
                              airQualityAlerts: e.target.checked,
                            })
                          }
                        />
                        <div className="w-11 h-6 bg-[#87CEEB]/20 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#98D8C8]/50 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#98D8C8]" />
                      </label>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-[#87CEEB]/10 backdrop-blur rounded-lg border border-[#87CEEB]/30" style={{
                  boxShadow: '0 4px 8px rgba(135, 206, 235, 0.15), inset 0 -2px 4px rgba(0, 0, 0, 0.1)'
                }}>
                      <div className="flex-1 mr-4">
                        <p className="text-sm font-bold text-white">
                          <span>Resumen Diario</span>
                        </p>
                        <p className="text-xs text-[#B0E0E6] mt-1">
                          <span>Recibe informes diarios</span>
                        </p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
                        <input
                          type="checkbox"
                          className="sr-only peer"
                          checked={notificationSettings.dailySummary}
                          onChange={(e) =>
                            setNotificationSettings({
                              ...notificationSettings,
                              dailySummary: e.target.checked,
                            })
                          }
                        />
                        <div className="w-11 h-6 bg-[#87CEEB]/20 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#98D8C8]/50 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#98D8C8]" />
                      </label>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-[#87CEEB]/10 backdrop-blur rounded-lg border border-[#87CEEB]/30" style={{
                  boxShadow: '0 4px 8px rgba(135, 206, 235, 0.15), inset 0 -2px 4px rgba(0, 0, 0, 0.1)'
                }}>
                      <div className="flex-1 mr-4">
                        <p className="text-sm font-bold text-white">
                          <span>Actualizaciones de Pronostico</span>
                        </p>
                        <p className="text-xs text-[#B0E0E6] mt-1">
                          <span>Notificaciones de pronostico</span>
                        </p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
                        <input
                          type="checkbox"
                          className="sr-only peer"
                          checked={notificationSettings.forecastUpdates}
                          onChange={(e) =>
                            setNotificationSettings({
                              ...notificationSettings,
                              forecastUpdates: e.target.checked,
                            })
                          }
                        />
                        <div className="w-11 h-6 bg-[#87CEEB]/20 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#98D8C8]/50 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#98D8C8]" />
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>}
        </div>

        {/* Navegacion inferior movil */}
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-gradient-to-r from-[#2d5a7b]/70 to-[#4A90A4]/70 backdrop-blur-sm border-t-2 border-[#87CEEB]/30 shadow-2xl z-30">
          <div className="grid grid-cols-4 gap-1 p-2">
            <button onClick={() => setActiveTab('overview')} className={`flex flex-col items-center gap-1 py-2.5 px-3 rounded-lg transition-all ${activeTab === 'overview' ? 'bg-gradient-to-r from-[#87CEEB] to-[#5DADE2] text-white' : 'text-[#B0E0E6] hover:bg-[#87CEEB]/10'}`} style={activeTab === 'overview' ? {
            boxShadow: '0 6px 12px rgba(135, 206, 235, 0.3), inset 0 -3px 6px rgba(0, 0, 0, 0.2)'
          } : {}}>
              <Activity className="w-5 h-5" />
              <span className="text-xs font-bold">
                <span>Resumen</span>
              </span>
            </button>
            <button onClick={() => setActiveTab('forecast')} className={`flex flex-col items-center gap-1 py-2.5 px-3 rounded-lg transition-all ${activeTab === 'forecast' ? 'bg-gradient-to-r from-[#87CEEB] to-[#5DADE2] text-white' : 'text-[#B0E0E6] hover:bg-[#87CEEB]/10'}`} style={activeTab === 'forecast' ? {
            boxShadow: '0 6px 12px rgba(135, 206, 235, 0.3), inset 0 -3px 6px rgba(0, 0, 0, 0.2)'
          } : {}}>
              <TrendingUp className="w-5 h-5" />
              <span className="text-xs font-bold">
                <span>Pronóstico</span>
              </span>
            </button>
            <button onClick={() => setActiveTab('map')} className={`flex flex-col items-center gap-1 py-2.5 px-3 rounded-lg transition-all ${activeTab === 'map' ? 'bg-gradient-to-r from-[#87CEEB] to-[#5DADE2] text-white' : 'text-[#B0E0E6] hover:bg-[#87CEEB]/10'}`} style={activeTab === 'map' ? {
            boxShadow: '0 6px 12px rgba(135, 206, 235, 0.3), inset 0 -3px 6px rgba(0, 0, 0, 0.2)'
          } : {}}>
              <MapPin className="w-5 h-5" />
              <span className="text-xs font-bold">
                <span>Mapa</span>
              </span>
            </button>
            <button onClick={() => setActiveTab('alerts')} className={`flex flex-col items-center gap-1 py-2.5 px-3 rounded-lg transition-all ${activeTab === 'alerts' ? 'bg-gradient-to-r from-[#87CEEB] to-[#5DADE2] text-white' : 'text-[#B0E0E6] hover:bg-[#87CEEB]/10'}`} style={activeTab === 'alerts' ? {
            boxShadow: '0 6px 12px rgba(135, 206, 235, 0.3), inset 0 -3px 6px rgba(0, 0, 0, 0.2)'
          } : {}}>
              <Bell className="w-5 h-5" />
              <span className="text-xs font-bold">
                <span>Alertas</span>
              </span>
            </button>
          </div>
        </nav>
      </div>
    </div> {/* Cierre del div del contenido principal */}
  </div>; {/* Cierre del div contenedor principal */}
};
