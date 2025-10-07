#!/bin/bash

# Script para iniciar tanto frontend como backend automáticamente
# Uso: ./start-dev.sh

echo "🚀 Iniciando TEMPO-AIR en modo desarrollo..."
echo ""

# Función para limpiar procesos al salir
cleanup() {
    echo ""
    echo "🛑 Deteniendo servicios..."
    kill $(jobs -p) 2>/dev/null
    exit 0
}

# Configurar trap para limpieza
trap cleanup SIGINT SIGTERM

# Verificar si Python está instalado
if ! command -v python &> /dev/null; then
    echo "❌ Python no está instalado. Por favor instala Python 3.7+"
    exit 1
fi

# Verificar si las dependencias de Python están instaladas
echo "📦 Verificando dependencias de Python..."
if ! python -c "import flask, flask_cors, earthaccess, xarray, numpy, netCDF4, h5netcdf" 2>/dev/null; then
    echo "⚠️  Instalando dependencias de Python..."
    pip install -r requirements.txt
fi

echo "🐍 Iniciando servidor Python (Puerto 5000)..."
cd api && python tempo.py &
PYTHON_PID=$!

# Esperar un poco para que el servidor Python se inicie
sleep 3

# Verificar si el servidor Python está corriendo
if curl -s http://localhost:5000/api/tempo -X POST -H "Content-Type: application/json" -d '{"lat":0,"lon":0}' &>/dev/null; then
    echo "✅ Servidor Python iniciado correctamente"
else
    echo "⚠️  El servidor Python puede tardar en iniciarse..."
fi

cd ..

echo "⚛️  Iniciando servidor Vite (Puerto 5173)..."
npm run dev:frontend &
VITE_PID=$!

echo ""
echo "🌐 Servicios disponibles:"
echo "   Frontend: http://localhost:5173"
echo "   API:      http://localhost:5000/api/tempo"
echo ""
echo "💡 Presiona Ctrl+C para detener ambos servicios"

# Esperar a que terminen los procesos
wait