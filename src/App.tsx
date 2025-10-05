import { useMemo } from 'react';
import { Container, Theme } from './settings/types';
import { AirQualityApp } from './components/generated/AirQualityApp';

const theme: Theme = 'dark';
// only use 'centered' container for standalone components, never for full page apps or websites.
const container: Container = 'none';

function App() {
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
      {/* Content */}
      <div className="w-full h-full">
        {renderContent()}
      </div>
    </div>
  );
}

export default App;