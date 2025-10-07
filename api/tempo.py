from flask import Flask, request, jsonify
from flask_cors import CORS
import earthaccess
import xarray as xr
import numpy as np
from datetime import datetime, timedelta
import random
import math
import os
import traceback
import json
from dotenv import load_dotenv

# Load .env file for local development
load_dotenv()

# Load credentials
def load_credentials():
    """
    Load credentials in priority order:
    1. Environment variables (production/Vercel)
    2. .env file (local development)
    """
    try:
        username = os.environ.get('EARTHDATA_USERNAME')
        password = os.environ.get('EARTHDATA_PASSWORD')

        if username and password:
            print(f"Credentials loaded successfully for user: {username}")
            return username, password
        else:
            print("No credentials found. Please set EARTHDATA_USERNAME and EARTHDATA_PASSWORD")
            return None, None

    except Exception as e:
        print(f"Error loading credentials: {e}")
        return None, None

# Global auth variable (will be initialized on first request)
auth = None

def ensure_authenticated():
    """Ensure earthaccess is authenticated. Call this at the start of each request."""
    global auth
    if auth is None:
        username, password = load_credentials()
        if username and password:
            try:
                auth = earthaccess.login(strategy="environment")
                print("Earthdata authentication successful!")
            except Exception as e:
                print(f"Error initializing Earthdata authentication: {e}")
                raise
    return auth


# EXACT SAME FUNCTIONS AS ORIGINAL App.py
def calcular_indice_realista(contaminantes):
    """
    Índice compuesto 0-500 (escala EPA-style) usando 12 variables.
    Pesos basados en impacto y confiabilidad del dato satelital.
    """
    for nombre, vars in contaminantes.items():
        if vars.get('quality_flag', 0) > 0:
            return None
    
    subindices = []
    confianzas = []
    
    # --- NO2 (PESO 50%) ---
    if 'NO2' in contaminantes:
        no2_vars = contaminantes['NO2']
        trop = no2_vars.get('troposphere', 0)
        unc = no2_vars.get('uncertainty', 0)
        strat = no2_vars.get('stratosphere', 0)
        confianza_no2 = max(0, 1 - (unc / trop if trop > 0 else 1))
        
        if trop < 5e14: aqi_no2 = 25
        elif trop < 1e15: aqi_no2 = 50
        elif trop < 2e15: aqi_no2 = 75
        elif trop < 4e15: aqi_no2 = 100
        elif trop < 7e15: aqi_no2 = 125
        elif trop < 1e16: aqi_no2 = 150
        elif trop < 1.5e16: aqi_no2 = 175
        elif trop < 2e16: aqi_no2 = 200
        elif trop < 3e16: aqi_no2 = 250
        elif trop < 5e16: aqi_no2 = 300
        else: aqi_no2 = 400
        
        if strat < 2e15 or strat > 4e15: aqi_no2 += 15
        
        subindices.append(aqi_no2)
        confianzas.append(confianza_no2 * 0.5)
    
    # --- HCHO (PESO 35%) ---
    if 'HCHO' in contaminantes:
        hcho_vars = contaminantes['HCHO']
        trop = hcho_vars.get('troposphere', 0)
        unc = hcho_vars.get('uncertainty', 0)
        confianza_hcho = max(0, 1 - (unc / trop if trop > 0 else 1))
        
        if trop < 5e14: aqi_hcho = 30
        elif trop < 1e15: aqi_hcho = 50
        elif trop < 2e15: aqi_hcho = 75
        elif trop < 3e15: aqi_hcho = 100
        elif trop < 5e15: aqi_hcho = 150
        elif trop < 8e15: aqi_hcho = 200
        elif trop < 1.2e16: aqi_hcho = 250
        elif trop < 1.5e16: aqi_hcho = 300
        else: aqi_hcho = 400
        
        subindices.append(aqi_hcho)
        confianzas.append(confianza_hcho * 0.35)
    
    # --- O3 (PESO 15%) ---
    if 'O3' in contaminantes:
        total = contaminantes['O3'].get('troposphere', 0)
        
        if 7.5e18 < total < 8.5e18: aqi_o3 = 50
        elif 7e18 < total < 9e18: aqi_o3 = 75
        elif 6.5e18 < total < 9.5e18: aqi_o3 = 100
        elif 6e18 < total < 1e19: aqi_o3 = 125
        else: aqi_o3 = 150
        
        subindices.append(aqi_o3)
        confianzas.append(0.15)
    
    if not subindices: return None
    
    suma_ponderada = sum(idx * conf for idx, conf in zip(subindices, confianzas))
    suma_confianzas = sum(confianzas)
    
    if suma_confianzas == 0: return None
    
    indice_final = suma_ponderada / suma_confianzas
    
    num_altos = sum(1 for idx in subindices if idx > 150)
    if num_altos >= 2:
        indice_final *= 1.15
    
    return min(500, max(0, int(indice_final)))

def get_color_from_score(aqi):
    if aqi is None: return '#808080'
    if aqi <= 50: return '#00E400'
    if aqi <= 100: return '#FFFF00'
    if aqi <= 150: return '#FF7E00'
    if aqi <= 200: return '#FF0000'
    if aqi <= 300: return '#8F3F97'
    return '#7E0023'

def get_categoria(aqi):
    if aqi is None: return "Sin datos"
    if aqi <= 50: return "Bueno"
    if aqi <= 100: return "Moderado"
    if aqi <= 150: return "Poco saludable para sensibles"
    if aqi <= 200: return "Poco saludable"
    if aqi <= 300: return "Muy poco saludable"
    return "Peligroso"

def consultar_tempo_coordenada(lat, lon):
    print(f"\n--- Consultando datos para {lat:.6f}, {lon:.6f} ---")

    # Ensure authentication before making requests
    ensure_authenticated()

    fecha_fin = datetime.now()
    fecha_inicio = fecha_fin - timedelta(days=30)
    temporal = (fecha_inicio.strftime('%Y-%m-%d'), fecha_fin.strftime('%Y-%m-%d'))
    
    datasets_config = [
        {"short_name": "TEMPO_NO2_L3", "version": "V03", "contaminante": "NO2"},
        {"short_name": "TEMPO_O3TOT_L3", "version": "V03", "contaminante": "O3"},
        {"short_name": "TEMPO_HCHO_L3", "version": "V03", "contaminante": "HCHO"},
    ]
    
    resultados = {'tiene_datos': False, 'contaminantes': {}}
    
    for config in datasets_config:
        print(f"\n  [DEBUG] Buscando {config['short_name']}...")
        
        try:
            results = earthaccess.search_data(
                short_name=config["short_name"], version=config["version"],
                temporal=temporal, bounding_box=(lon - 0.5, lat - 0.5, lon + 0.5, lat + 0.5),
                count=1
            )
            
            print(f"  [DEBUG] Granules encontrados: {len(results)}")
            if not results: continue
            
            files = earthaccess.open(results[:1])
            print(f"  [DEBUG] Archivos abiertos: {len(files)}")
            if not files: continue

            ds_root = xr.open_dataset(files[0], engine='h5netcdf')
            ds_product = xr.open_dataset(files[0], engine='h5netcdf', group='product')
            
            if 'latitude' not in ds_root.coords or 'longitude' not in ds_root.coords:
                print("  [DEBUG] [X] No se encontraron coordenadas 'latitude'/'longitude' en el archivo.")
                ds_root.close(); ds_product.close(); continue
            
            lat_arr = ds_root['latitude'].values
            lon_arr = ds_root['longitude'].values
            lat_idx = np.abs(lat_arr - lat).argmin()
            lon_idx = np.abs(lon_arr - lon).argmin()
            
            print(f"  [DEBUG] Coordenada de píxel más cercano: {lat_arr[lat_idx]:.4f}, {lon_arr[lon_idx]:.4f}")
            
            vars_dict = {}
            variables_a_extraer = {
                'troposphere': 'vertical_column_troposphere',
                'uncertainty': 'vertical_column_troposphere_uncertainty',
                'stratosphere': 'vertical_column_stratosphere',
                'quality_flag': 'main_data_quality_flag'
            }

            for nombre_interno, nombre_tempo in variables_a_extraer.items():
                if nombre_tempo in ds_product.data_vars:
                    var = ds_product[nombre_tempo]
                    selector = {'latitude': lat_idx, 'longitude': lon_idx}
                    if 'time' in var.dims: selector['time'] = 0
                    valor = var.isel(**selector).values
                    vars_dict[nombre_interno] = float(valor)
                    print(f"    - {nombre_interno}: {float(valor):.2e}")

            if vars_dict and not np.isnan(vars_dict.get('troposphere', np.nan)):
                resultados['contaminantes'][config["contaminante"]] = vars_dict
                resultados['tiene_datos'] = True
                print("  [DEBUG] [OK] Datos validos guardados.")
            else:
                print("  [DEBUG] [X] El valor principal es NaN o no hay datos.")

            
            ds_root.close()
            ds_product.close()

        except Exception as e:
            print(f"  [DEBUG] [ERROR] al procesar {config['short_name']}: {type(e).__name__} - {e}")
            traceback.print_exc() # Imprime el traceback completo para mas detalles
            continue
    
    return resultados

# EXACT SAME BUSINESS LOGIC AS ORIGINAL get_tempo_data() function
def process_tempo_request(data):
    """Same logic as original get_tempo_data route"""
    lat_centro = data.get('lat')
    lon_centro = data.get('lon')
    
    if not lat_centro or not lon_centro:
        return {'error': 'Coordenadas requeridas'}, 400
    
    coordenadas = [{'lat': lat_centro, 'lon': lon_centro}]
    
    resultados = []
    
    for coord in coordenadas:
        lat, lon = coord['lat'], coord['lon']
        datos = consultar_tempo_coordenada(lat, lon)
        
        aqi = calcular_indice_realista(datos['contaminantes'])
        color = get_color_from_score(aqi)
        categoria = get_categoria(aqi)
        
        resultado = {
            'lat': lat, 'lon': lon,
            'tiene_datos': datos['tiene_datos'],
            'contaminantes': datos['contaminantes'],
            'aqi_satelital': aqi,
            'categoria': categoria,
            'color': color
        }
        resultados.append(resultado)
    
    print("\n--- Resultado Final Enviado ---")
    if aqi:
        print(f"  AQI Calculado: {aqi} ({categoria})")
    else:
        print("  No se pudo calcular el AQI (sin datos válidos).")
    print("-----------------------------\n")

    return {'resultados': resultados}, 200

# Vercel serverless function handler
def handler(req):
    """Vercel serverless function entry point"""
    try:
        # Handle CORS preflight
        if req.method == 'OPTIONS':
            return {
                'statusCode': 200,
                'headers': {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Methods': 'POST, OPTIONS',
                    'Access-Control-Allow-Headers': 'Content-Type',
                },
                'body': ''
            }
        
        if req.method != 'POST':
            return {
                'statusCode': 405,
                'headers': {'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Method not allowed'})
            }
        
        # Parse request body
        try:
            if hasattr(req, 'body'):
                data = json.loads(req.body) if isinstance(req.body, str) else req.body
            else:
                data = req.json if hasattr(req, 'json') else {}
        except:
            return {
                'statusCode': 400,
                'headers': {'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Invalid JSON'})
            }
        
        # Process using exact same logic as original
        result, status_code = process_tempo_request(data)
        
        return {
            'statusCode': status_code,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Content-Type': 'application/json'
            },
            'body': json.dumps(result)
        }
        
    except Exception as e:
        print(f"Error in serverless handler: {e}")
        traceback.print_exc()
        return {
            'statusCode': 500,
            'headers': {'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Internal server error'})
        }

# Flask app for local development
app = Flask(__name__)
CORS(app)

@app.route('/api/tempo', methods=['POST', 'OPTIONS'])
def get_tempo_data():
    """Flask route for local development (same logic as Vercel handler)"""
    if request.method == 'OPTIONS':
        return '', 200
    
    try:
        data = request.get_json()
        result, status_code = process_tempo_request(data)
        
        if status_code == 200:
            return jsonify(result)
        else:
            return jsonify(result), status_code
            
    except Exception as e:
        print(f"Error in Flask route: {e}")
        traceback.print_exc()
        return jsonify({'error': 'Internal server error'}), 500

# Local development server
if __name__ == '__main__':
    print("Starting local development server...")
    print("TEMPO API available at: http://localhost:5000/api/tempo")
    print("Frontend should run on: http://localhost:5173")
    print("=" * 50)
    app.run(debug=True, port=5000, host='0.0.0.0')