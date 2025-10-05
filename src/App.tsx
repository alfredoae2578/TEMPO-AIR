import { useMemo, useState } from 'react';
import { Container, Theme } from './settings/types';
import { AirQualityApp } from './components/generated/AirQualityApp';
import AQIHeatMap from './components/AQIHeatMap';
import { motion } from 'framer-motion';
import { Satellite, Activity } from 'lucide-react';

const theme: Theme = 'dark';
const container: Container = 'none';

function App() {
  const [currentView, setCurrentView] = useState<'dashboard' | 'heatmap'>('dashboard');

  function setTheme(theme: Theme) {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }

  setTheme(theme);

  const generatedComponent = useMemo(() => {
    return <AirQualityApp />;
  }, []);

  const renderContent = () => {
    if (currentView === 'heatmap') {
      return <AQIHeatMap />;
    }
    
    if (container === 'centered') {
      return (
        <div className="h-full w-full flex flex-col items-center justify-center">
          {generatedComponent}
        </div>
      );
    } else {
      return generatedComponent;
    }
  };

  return (
    <div className="relative w-full h-screen">
      {/* Navigation Toggle */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="absolute top-4 right-4 z-50 flex gap-2"
      >
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setCurrentView('dashboard')}
          className={`px-4 py-2 rounded-lg backdrop-blur-sm border transition-all ${
            currentView === 'dashboard' 
              ? 'bg-blue-600 text-white border-blue-500' 
              : 'bg-white/10 text-white/70 border-white/20 hover:bg-white/20'
          }`}
        >
          <Activity className="w-4 h-4 inline mr-2" />
          Dashboard
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setCurrentView('heatmap')}
          className={`px-4 py-2 rounded-lg backdrop-blur-sm border transition-all ${
            currentView === 'heatmap' 
              ? 'bg-blue-600 text-white border-blue-500' 
              : 'bg-white/10 text-white/70 border-white/20 hover:bg-white/20'
          }`}
        >
          <Satellite className="w-4 h-4 inline mr-2" />
          TEMPO Satelital
        </motion.button>
      </motion.div>

      {/* Content */}
      <motion.div
        key={currentView}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3 }}
        className="w-full h-full"
      >
        {renderContent()}
      </motion.div>
    </div>
  );
}

export default App;