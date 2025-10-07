#!/bin/bash

# Script para git add, commit y push rápido
# Uso: ./git-push.sh "mensaje del commit"

if [ -z "$1" ]; then
    MESSAGE="update: automated commit"
else
    MESSAGE="$1"
fi

echo "📝 Agregando archivos..."
git add .

echo "💾 Haciendo commit: $MESSAGE"
git commit -m "$MESSAGE"

echo "🚀 Subiendo a GitHub..."
git push origin main

echo "✅ ¡Listo! Cambios subidos a GitHub"