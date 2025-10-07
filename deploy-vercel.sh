#!/bin/bash

# Script para deploy en Vercel con limpieza previa
# Uso: ./deploy-vercel.sh

echo "🧹 Limpiando archivos innecesarios antes del deploy..."

# Remover carpetas que pueden causar problemas de tamaño
rm -rf .next
rm -rf .nuxt
rm -rf dist
rm -rf build
rm -rf node_modules/.cache
rm -rf .cache

# Remover archivos temporales
find . -name "*.log" -delete
find . -name "*.tmp" -delete
find . -name "__pycache__" -type d -exec rm -rf {} + 2>/dev/null || true

echo "✅ Limpieza completada"

# Deploy a producción
echo "🚀 Desplegando a Vercel..."
vercel --prod

echo "✅ Deploy completado!"