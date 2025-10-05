#!/bin/bash

echo "================================================"
echo "  INSTALANDO DEPENDENCIAS PARA MAPA TEMPO"
echo "================================================"

# Dependencias Python para el backend
echo "📦 Instalando dependencias Python..."
pip install flask flask-cors earthaccess xarray h5netcdf netCDF4 numpy

# Dependencias JavaScript/React para el frontend (si es necesario)
echo "📦 Verificando dependencias npm..."
npm install --save framer-motion lucide-react

echo "✅ Todas las dependencias instaladas correctamente"
echo ""
echo "================================================"
echo "  INSTRUCCIONES DE USO"
echo "================================================"
echo "1. Ejecutar backend Python:"
echo "   cd src/api && python tempo.py"
echo ""
echo "2. Ejecutar frontend React:"
echo "   npm run dev"
echo ""
echo "3. Navegar a http://localhost:5173"
echo "4. Usar el botón 'TEMPO Satelital' para ver el mapa de calor"
echo ""
echo "================================================"
echo "  CREDENCIALES EARTHDATA"
echo "================================================"
echo "⚠️  Las credenciales NASA están configuradas en:"
echo "   src/api/tempo.py"
echo ""
echo "Si necesitas cambiarlas, edita las variables:"
echo "   EARTHDATA_USERNAME"
echo "   EARTHDATA_PASSWORD"
echo "================================================"