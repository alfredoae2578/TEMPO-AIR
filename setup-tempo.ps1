Write-Host "================================================" -ForegroundColor Cyan
Write-Host "  INSTALANDO DEPENDENCIAS PARA MAPA TEMPO" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan

# Dependencias Python para el backend
Write-Host "📦 Instalando dependencias Python..." -ForegroundColor Yellow
pip install flask flask-cors earthaccess xarray h5netcdf netCDF4 numpy

# Dependencias JavaScript/React para el frontend
Write-Host "📦 Verificando dependencias npm..." -ForegroundColor Yellow
npm install --save framer-motion lucide-react

Write-Host "✅ Todas las dependencias instaladas correctamente" -ForegroundColor Green
Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "  INSTRUCCIONES DE USO" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "1. Ejecutar backend Python:" -ForegroundColor White
Write-Host "   cd src\api" -ForegroundColor Gray
Write-Host "   python tempo.py" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Ejecutar frontend React:" -ForegroundColor White
Write-Host "   npm run dev" -ForegroundColor Gray
Write-Host ""
Write-Host "3. Navegar a http://localhost:5173" -ForegroundColor White
Write-Host "4. Usar el botón 'TEMPO Satelital' para ver el mapa de calor" -ForegroundColor White
Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "  CREDENCIALES EARTHDATA" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "⚠️  Las credenciales NASA están configuradas en:" -ForegroundColor Yellow
Write-Host "   src\api\tempo.py" -ForegroundColor Gray
Write-Host ""
Write-Host "Si necesitas cambiarlas, edita las variables:" -ForegroundColor White
Write-Host "   EARTHDATA_USERNAME" -ForegroundColor Gray
Write-Host "   EARTHDATA_PASSWORD" -ForegroundColor Gray
Write-Host "================================================" -ForegroundColor Cyan

# Preguntar si quiere ejecutar el backend ahora
$response = Read-Host "`n¿Quieres ejecutar el backend TEMPO ahora? (s/n)"
if ($response -eq "s" -or $response -eq "S") {
    Write-Host "🚀 Iniciando backend TEMPO..." -ForegroundColor Green
    Set-Location "src\api"
    python tempo.py
}