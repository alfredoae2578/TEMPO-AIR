Write-Host "================================================" -ForegroundColor Cyan
Write-Host "  INSTALLING DEPENDENCIES FOR TEMPO MAP" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan

# Python dependencies for the backend
Write-Host "📦 Installing Python dependencies..." -ForegroundColor Yellow
pip install flask flask-cors earthaccess xarray h5netcdf netCDF4 numpy

# JavaScript/React dependencies for the frontend
Write-Host "📦 Checking npm dependencies..." -ForegroundColor Yellow
npm install --save framer-motion lucide-react

Write-Host "✅ All dependencies installed successfully" -ForegroundColor Green
Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "  USAGE INSTRUCTIONS" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "1. Run backend Python:" -ForegroundColor White
Write-Host "   cd EXTERNALPROYECTS" -ForegroundColor Gray
Write-Host "   python App.py" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Run frontend React:" -ForegroundColor White
Write-Host "   npm run dev" -ForegroundColor Gray
Write-Host ""
Write-Host "3. Go to http://localhost:5173" -ForegroundColor White
Write-Host "4. Use the 'TEMPO Satelital' button to view the heatmap" -ForegroundColor White
Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "  EARTHDATA CREDENTIALS" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "⚠️  NASA credentials are configured in:" -ForegroundColor Yellow
Write-Host "   EXTERNALPROYECTS/App.py" -ForegroundColor Gray
Write-Host ""
Write-Host "If you need to change them, edit the variables:" -ForegroundColor White
Write-Host "   EARTHDATA_USERNAME" -ForegroundColor Gray
Write-Host "   EARTHDATA_PASSWORD" -ForegroundColor Gray
Write-Host "================================================" -ForegroundColor Cyan

# Ask if user wants to run the backend now
$response = Read-Host "`nDo you want to run the TEMPO backend now? (y/n)"
if ($response -eq "y" -or $response -eq "Y") {
    Write-Host "🚀 Starting TEMPO backend..." -ForegroundColor Green
    Set-Location "EXTERNALPROYECTS\"
    python tempo.py
}
