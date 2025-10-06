# 🛰️ NASA TEMPO Air Quality Monitoring Platform

## 🌍 Project Overview

An advanced air quality monitoring platform that combines **NASA's TEMPO satellite data** with interactive 3D Earth visualization and comprehensive air quality analytics. Built for the NASA Space Apps Challenge, this platform provides real-time air pollution insights using cutting-edge satellite technology.

## ✨ Key Features

### 🛰️ NASA TEMPO Satellite Integration
- **Real-time satellite data** from NASA's TEMPO (Tropospheric Emissions: Monitoring of Pollution) instrument
- **12 scientific variables** across 3 major pollutants (NO2, O3, HCHO)
- **EPA-validated formulas** based on peer-reviewed research (Lamsal et al. 2014, Duncan et al. 2016)
- **Scientific accuracy** with quality flags and uncertainty measurements

### 🌐 Interactive 3D Earth Visualization
- **Immersive 3D Earth** with realistic textures and materials
- **Dynamic star field** and nebula background effects
- **Smooth camera controls** and orbital navigation
- **Real-time rendering** using React Three Fiber

### 📊 Advanced Air Quality Analytics
- **Comprehensive dashboard** with multiple visualization types
- **Heat map overlays** showing pollution concentration zones
- **Historical trends** and forecast predictions
- **Multi-pollutant analysis** (NO2, PM2.5, O3, HCHO)

### 🎯 Smart Alert System
- **Real-time notifications** for air quality changes
- **Location-based alerts** for sensitive groups
- **Customizable thresholds** and notification preferences
- **Health recommendations** based on current conditions

## 🚀 Technologies Used

### Frontend Stack
- **React 18** with TypeScript for type-safe development
- **Vite** for lightning-fast development and building
- **Three.js & React Three Fiber** for 3D Earth visualization
- **Framer Motion** for smooth animations and transitions
- **Recharts** for advanced data visualization
- **Tailwind CSS** with dark mode support

### Backend Integration
- **Python Flask API** for NASA data processing
- **NASA Earthaccess** official library for satellite data
- **xarray & numpy** for scientific data manipulation
- **NetCDF4/HDF5** for handling satellite data formats

### UI/UX Libraries
- **Lucide React** for consistent iconography
- **shadcn/ui components** for modern interface elements
- **DND Kit** for drag-and-drop interactions
- **CMDK** for command palette functionality

## 📋 Installation & Setup

### Prerequisites
- Node.js 18+ and npm
- Python 3.8+ with pip
- NASA Earthdata account (free registration)

### Quick Start

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd SPACEAPPSCHALLENGES
   ```

2. **Run the automated setup script**
   
   **Linux/Mac:**
   ```bash
   chmod +x setup-tempo.sh
   ./setup-tempo.sh
   ```
   
   **Windows:**
   ```powershell
   .\setup-tempo.ps1
   ```

3. **Start the backend API (Port 5001)**
   ```bash
   cd EXTERNALPROYECTS
   python App.py
   ```

4. **Start the frontend development server (Port 5173)**
   ```bash
   npm run dev
   ```

5. **Open your browser** and navigate to `http://localhost:5173`

### Manual Installation

If you prefer manual setup:

```bash
# Install frontend dependencies
npm install

# Install Python dependencies
pip install flask flask-cors earthaccess xarray numpy netcdf4

# Build for production
npm run build
```

## 🎮 Usage Guide

### Main Dashboard
- **Global overview** of air quality metrics
- **Interactive charts** showing trends and forecasts
- **Real-time alerts** and health recommendations
- **Weather integration** with atmospheric conditions

### TEMPO Satellite View
- **Heat map visualization** with 5 analysis zones
- **Hover interactions** for quick AQI readings
- **Detailed panels** showing all 12 scientific variables
- **Scientific data** in proper exponential notation

### 3D Earth Experience
- **Orbital navigation** around realistic 3D Earth
- **Dynamic backgrounds** with stars and nebula effects
- **Smooth transitions** between views
- **Immersive experience** for data exploration

## 📊 Scientific Data

### Pollutants Monitored

| Pollutant | Description | Health Impact | Weight in Formula |
|-----------|-------------|---------------|------------------|
| **NO2** | Nitrogen Dioxide | Respiratory irritation, asthma triggers | 50% |
| **HCHO** | Formaldehyde | Carcinogenic, eye/throat irritation | 35% |
| **O3** | Tropospheric Ozone | Lung damage, breathing difficulties | 15% |

### Data Variables (per pollutant)
- **Vertical Column Troposphere**: Main concentration measurement
- **Uncertainty Values**: Statistical error margins
- **Stratosphere Component**: Upper atmosphere contribution
- **Quality Flags**: Data reliability indicators (0 = highest quality)

### AQI Scale & Color Coding
- 🟢 **0-50**: Good (Safe for all activities)
- 🟡 **51-100**: Moderate (Acceptable for most people)
- 🟠 **101-150**: Unhealthy for Sensitive Groups
- 🔴 **151-200**: Unhealthy (Everyone may experience effects)
- 🟣 **201-300**: Very Unhealthy (Health warnings)
- 🟤 **301+**: Hazardous (Emergency conditions)

## 🔧 Development

### Project Structure
```
src/
├── components/
│   ├── generated/AirQualityApp.tsx    # Main dashboard
│   ├── AQIHeatMap.tsx                 # TEMPO heat map
│   ├── earth3d/                       # 3D Earth components
│   └── ...
├── api/tempo.py                       # NASA TEMPO API
├── hooks/                             # Custom React hooks
├── lib/                              # Utilities
└── settings/                         # Theme and configuration
```

### Available Scripts
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier

## ⚠️ Important Notes

### Data Limitations
- **Historical period**: September 2025 (latest available TEMPO data)
- **Geographic coverage**: Primarily North America
- **Resolution**: ~2km per pixel (TEMPO instrument limitation)
- **Update frequency**: Based on satellite overpass schedule

### Scientific Disclaimer
> **Important**: This platform uses experimental satellite-derived air quality indices. While based on validated scientific methods, it should not replace official ground-based monitoring stations for health-critical decisions. Intended for educational and research purposes.

### Environment Setup & Credentials

**Required: NASA Earthdata Login Credentials**

1. **Get NASA Earthdata credentials**:
   - Visit: https://urs.earthdata.nasa.gov/
   - Create a free account or log in
   - Note your username and password

2. **Configure environment variables**:
   - Copy the `.env` file (contains template values)
   - Replace the dummy values with your actual credentials:
   ```bash
   EARTHDATA_USERNAME=your_actual_username
   EARTHDATA_PASSWORD=your_actual_password
   ```

3. **Security Note**: 
   - Never commit real credentials to version control
   - The `.env` file is included in this repo with dummy values for setup reference
   - After setup, your real `.env` file will be ignored by git

## 🌟 Features Highlights

### Real-time Integration
- **Live TEMPO data** processing and visualization
- **Dynamic heat maps** with 5km analysis zones
- **Interactive tooltips** and detailed information panels

### User Experience
- **Dark mode optimized** interface
- **Glassmorphism effects** and modern UI patterns
- **Responsive design** for all screen sizes
- **Accessibility features** and keyboard navigation

## 🏆 NASA Space Apps Challenge

This project was developed for the NASA Space Apps Challenge Hackathon

### Technology Credits
- **NASA Earthdata** for satellite data access
- **React Three Fiber** for 3D visualization capabilities
- **Recharts** for data visualization components
- **Tailwind CSS** for utility-first styling

## 📄 License

This project is developed for educational and research purposes as part of the NASA Space Apps Challenge.
