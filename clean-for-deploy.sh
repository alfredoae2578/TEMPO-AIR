#!/bin/bash

# Script de limpieza manual
# Uso: ./clean-for-deploy.sh

echo "🧹 Limpiando archivos para reducir tamaño de función serverless..."

# Remover carpetas de build
echo "Removiendo carpetas de build..."
rm -rf .next
rm -rf .nuxt  
rm -rf dist
rm -rf build

# Remover caches
echo "Removiendo caches..."
rm -rf node_modules/.cache
rm -rf .cache
rm -rf .vite

# Remover archivos temporales
echo "Removiendo archivos temporales..."
find . -name "*.log" -delete
find . -name "*.tmp" -delete
find . -name ".DS_Store" -delete

# Remover __pycache__ de Python
echo "Removiendo __pycache__ de Python..."
find . -name "__pycache__" -type d -exec rm -rf {} + 2>/dev/null || true
find . -name "*.pyc" -delete

# Mostrar tamaños después de limpieza
echo "📊 Tamaños de carpetas después de la limpieza:"
du -sh api/ 2>/dev/null || echo "api/ no encontrada"
du -sh src/ 2>/dev/null || echo "src/ no encontrada"
du -sh . | head -1

echo "✅ Limpieza completada. Ahora puedes hacer deploy con: vercel --prod"