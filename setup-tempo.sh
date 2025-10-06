#!/bin/bash

echo "================================================"
echo "  INSTALLING DEPENDENCIES FOR TEMPO MAP"
echo "================================================"

# Python dependencies for the backend
echo "📦 Installing Python dependencies..."
pip install flask flask-cors earthaccess xarray h5netcdf netCDF4 numpy

# JavaScript/React dependencies for the frontend (if needed)
echo "📦 Checking npm dependencies..."
npm install --save framer-motion lucide-react

echo "✅ All dependencies installed successfully"
echo ""
echo "================================================"
echo "  USAGE INSTRUCTIONS"
echo "================================================"
echo "1. Run Python backend:"
echo "   cd EXTERNALPROYECTS && python App.py"
echo ""
echo "2. Run React frontend:"
echo "   npm run dev"
echo ""
echo "3. Go to http://localhost:5173"
echo "4. Use the 'TEMPO Satelital' button to view the heatmap"
echo ""
echo "================================================"
echo "  EARTHDATA CREDENTIALS"
echo "================================================"
echo "⚠️  NASA credentials are set in:"
echo "   EXTERNALPROYECTS/App.py"
echo ""
echo "Configure the following environment variables in your .env file:"
echo "   EARTHDATA_USERNAME"
echo "   EARTHDATA_PASSWORD"
echo "================================================"
