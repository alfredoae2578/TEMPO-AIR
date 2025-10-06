from flask import Flask, request, jsonify
from flask_cors import CORS
import earthaccess
import xarray as xr
import numpy as np
from datetime import datetime, timedelta
import random
import math
import os

app = Flask(__name__)
CORS(app)

# Credenciales
os.environ['EARTHDATA_USERNAME'] = ""
os.environ['EARTHDATA_PASSWORD'] = ""
auth = earthaccess.login(strategy="environment")

def generar_coordenadas_aleatorias(lat_centro, lon_centro, radio_metros, cantidad):
    """Genera coordenadas aleatorias dentro de un radio en metros."""
    coordenadas = []
    radio_tierra = 6371000
    
    for _ in range(cantidad):
        angulo = random.uniform(0, 2 * math.pi)
        distancia = random.uniform(0, radio_metros)
        
        delta_lat = (distancia * math.cos(angulo)) / radio_tierra
        delta_lon = (distancia * math.sin(angulo)) / (radio_tierra * math.cos(math.radians(lat_centro)))
        
        nueva_lat = lat_centro + math.degrees(delta_lat)
        nueva_lon = lon_centro + math.degrees(delta_lon)
        
        coordenadas.append({'lat': nueva_lat, 'lon': nueva_lon})
    
    return coordenadas

def calcular_indice_calidad(contaminantes):
    """
    Índice 0-500 (escala EPA-style) usando 12 variables.
    Pesos: NO2 (50%), HCHO (35%), O3 (15%)
    Basado en Lamsal et al. 2014, Duncan et al. 2016
    """
    # Rechazar datos con quality flag malo
    for nombre, vars in contaminantes.items():
        if vars.get('quality_flag', 0) > 0:
            return None
    
    subindices = []
    confianzas = []
    
    # NO2 (PESO 50% - mejor indicador satelital)
    if 'NO2' in contaminantes:
        no2_vars = contaminantes['NO2']
        trop = no2_vars.get('troposphere', 0)
        unc = no2_vars.get('uncertainty', 0)
        strat = no2_vars.get('stratosphere', 0)
        
        # Confianza basada en incertidumbre
        confianza_no2 = max(0, 1 - (unc / trop if trop > 0 else 1))
        
        # Umbrales de columna troposférica (molec/cm²)
        if trop < 5e14:
            aqi_no2 = 25
        elif trop < 1e15:
            aqi_no2 = 50
        elif trop < 2e15:
            aqi_no2 = 75
        elif trop < 4e15:
            aqi_no2 = 100
        elif trop < 7e15:
            aqi_no2 = 125
        elif trop < 1e16:
            aqi_no2 = 150
        elif trop < 1.5e16:
            aqi_no2 = 175
        elif trop < 2e16:
            aqi_no2 = 200
        elif trop < 3e16:
            aqi_no2 = 250
        elif trop < 5e16:
            aqi_no2 = 300
        else:
            aqi_no2 = 400
        
        # Penalizar estratosfera anormal
        if strat < 2e15 or strat > 4e15:
            aqi_no2 += 15
        
        subindices.append(aqi_no2)
        confianzas.append(confianza_no2 * 0.5)
    
    # HCHO (PESO 35% - indicador VOC)
    if 'HCHO' in contaminantes:
        hcho_vars = contaminantes['HCHO']
        trop = hcho_vars.get('troposphere', 0)
        unc = hcho_vars.get('uncertainty', 0)
        
        confianza_hcho = max(0, 1 - (unc / trop if trop > 0 else 1))
        
        if trop < 5e14:
            aqi_hcho = 30
        elif trop < 1e15:
            aqi_hcho = 50
        elif trop < 2e15:
            aqi_hcho = 75
        elif trop < 3e15:
            aqi_hcho = 100
        elif trop < 5e15:
            aqi_hcho = 150
        elif trop < 8e15:
            aqi_hcho = 200
        elif trop < 1.2e16:
            aqi_hcho = 250
        elif trop < 1.5e16:
            aqi_hcho = 300
        else:
            aqi_hcho = 400
        
        subindices.append(aqi_hcho)
        confianzas.append(confianza_hcho * 0.35)
    
    # O3 (PESO 15% - columna total, menos útil)
    if 'O3' in contaminantes:
        total = contaminantes['O3'].get('troposphere', 0)
        
        if 7.5e18 < total < 8.5e18:
            aqi_o3 = 50
        elif 7e18 < total < 9e18:
            aqi_o3 = 75
        elif 6.5e18 < total < 9.5e18:
            aqi_o3 = 100
        elif 6e18 < total < 1e19:
            aqi_o3 = 125
        else:
            aqi_o3 = 150
        
        subindices.append(aqi_o3)
        confianzas.append(0.15)
    
    if not subindices:
        return None
    
    # Promedio ponderado
    suma_ponderada = sum(idx * conf for idx, conf in zip(subindices, confianzas))
    suma_confianzas = sum(confianzas)
    
    if suma_confianzas == 0:
        return None
    
    indice_final = suma_ponderada / suma_confianzas
    
    # Boost sinérgico: múltiples contaminantes altos
    num_altos = sum(1 for idx in subindices if idx > 150)
    if num_altos >= 2:
        indice_final *= 1.15
    
    return min(500, max(0, int(indice_final)))

def get_color_from_score(aqi):
    """Colores adaptados al modo oscuro del proyecto."""
    if aqi is None:
        return '#6B7280'  # gray-500 - sin datos
    elif aqi <= 50:
        return '#10B981'  # emerald-500 - bueno
    elif aqi <= 100:
        return '#F59E0B'  # amber-500 - moderado
    elif aqi <= 150:
        return '#F97316'  # orange-500 - poco saludable para sensibles
    elif aqi <= 200:
        return '#EF4444'  # red-500 - poco saludable
    elif aqi <= 300:
        return '#8B5CF6'  # violet-500 - muy poco saludable
    else:
        return '#7C2D12'  # red-900 - peligroso

def get_categoria(aqi):
    """Categoría textual EPA."""
    if aqi is None:
        return "Sin datos"
    elif aqi <= 50:
        return "Bueno"
    elif aqi <= 100:
        return "Moderado"
    elif aqi <= 150:
        return "Poco saludable para sensibles"
    elif aqi <= 200:
        return "Poco saludable"
    elif aqi <= 300:
        return "Muy poco saludable"
    else:
        return "Peligroso"

def consultar_tempo_coordenada(lat, lon):
    """
    Consulta 3 contaminantes TEMPO (NO2, O3, HCHO).
    Extrae 4 variables de cada uno: troposphere, uncertainty, stratosphere, quality_flag.
    Total: 12 valores para índice de calidad del aire.
    """
    
    # Temporal: septiembre 2025 (últimos datos disponibles)
    temporal = ("2025-09-01", "2025-09-30")
    
    # 3 datasets de contaminantes
    datasets_config = [
        {"short_name": "TEMPO_NO2_L3", "version": "V03", "contaminante": "NO2"},
        {"short_name": "TEMPO_O3TOT_L3", "version": "V03", "contaminante": "O3"},
        {"short_name": "TEMPO_HCHO_L3", "version": "V03", "contaminante": "HCHO"},
    ]
    
    resultados = {
        'tiene_datos': False,
        'contaminantes': {}
    }
    
    for config in datasets_config:
        try:
            # Buscar granules
            results = earthaccess.search_data(
                short_name=config["short_name"],
                version=config["version"],
                temporal=temporal,
                bounding_box=(lon - 0.5, lat - 0.5, lon + 0.5, lat + 0.5),
                count=1
            )
            
            if not results:
                continue
            
            # Abrir archivo (streaming)
            files = earthaccess.open(results[:1])
            
            if not files:
                continue
            
            # Abrir root (coordenadas) y product (variables)
            ds_root = xr.open_dataset(files[0], engine='h5netcdf')
            ds_product = xr.open_dataset(files[0], engine='h5netcdf', group='product')
            
            # Verificar coordenadas
            if 'latitude' not in ds_root.coords or 'longitude' not in ds_root.coords:
                ds_root.close()
                ds_product.close()
                continue
            
            lat_arr = ds_root['latitude'].values
            lon_arr = ds_root['longitude'].values
            
            # Encontrar píxel más cercano
            lat_idx = np.abs(lat_arr - lat).argmin()
            lon_idx = np.abs(lon_arr - lon).argmin()
            
            # Extraer 4 variables
            vars_dict = {}
            
            # Variable 1: Columna troposférica (valor principal)
            if 'vertical_column_troposphere' in ds_product.data_vars:
                var = ds_product['vertical_column_troposphere']
                if 'time' in var.dims:
                    valor = var.isel(latitude=lat_idx, longitude=lon_idx, time=0).values
                else:
                    valor = var.isel(latitude=lat_idx, longitude=lon_idx).values
                vars_dict['troposphere'] = float(valor)
            
            # Variable 2: Incertidumbre
            if 'vertical_column_troposphere_uncertainty' in ds_product.data_vars:
                var = ds_product['vertical_column_troposphere_uncertainty']
                if 'time' in var.dims:
                    valor = var.isel(latitude=lat_idx, longitude=lon_idx, time=0).values
                else:
                    valor = var.isel(latitude=lat_idx, longitude=lon_idx).values
                vars_dict['uncertainty'] = float(valor)
            
            # Variable 3: Columna estratosférica
            if 'vertical_column_stratosphere' in ds_product.data_vars:
                var = ds_product['vertical_column_stratosphere']
                if 'time' in var.dims:
                    valor = var.isel(latitude=lat_idx, longitude=lon_idx, time=0).values
                else:
                    valor = var.isel(latitude=lat_idx, longitude=lon_idx).values
                vars_dict['stratosphere'] = float(valor)
            
            # Variable 4: Quality flag (0 = bueno)
            if 'main_data_quality_flag' in ds_product.data_vars:
                var = ds_product['main_data_quality_flag']
                if 'time' in var.dims:
                    valor = var.isel(latitude=lat_idx, longitude=lon_idx, time=0).values
                else:
                    valor = var.isel(latitude=lat_idx, longitude=lon_idx).values
                vars_dict['quality_flag'] = float(valor)
            
            # Guardar si tiene datos válidos (no NaN)
            if vars_dict and not np.isnan(vars_dict.get('troposphere', np.nan)):
                resultados['contaminantes'][config["contaminante"]] = vars_dict
                resultados['tiene_datos'] = True
            
            ds_root.close()
            ds_product.close()
            
        except Exception as e:
            continue
    
    return resultados

@app.route('/api/tempo', methods=['POST'])
def get_tempo_data():
    data = request.json
    lat_centro = data.get('lat')
    lon_centro = data.get('lon')
    num_coordenadas = data.get('num_coordenadas', 5)  # Reducido a 5
    radio = data.get('radio', 5000)  # 5km para mayor dispersión
    
    if not lat_centro or not lon_centro:
        return jsonify({'error': 'Coordenadas requeridas'}), 400
    
    coordenadas = generar_coordenadas_aleatorias(lat_centro, lon_centro, radio, num_coordenadas)
    
    resultados = []
    
    for i, coord in enumerate(coordenadas, 1):
        lat = coord['lat']
        lon = coord['lon']
        
        datos = consultar_tempo_coordenada(lat, lon)
        
        # Calcular AQI satelital (0-500)
        aqi = calcular_indice_calidad(datos['contaminantes']) if datos['tiene_datos'] else None
        color = get_color_from_score(aqi)
        categoria = get_categoria(aqi)
        
        resultado = {
            'lat': lat,
            'lon': lon,
            'tiene_datos': datos['tiene_datos'],
            'contaminantes': datos['contaminantes'],
            'aqi_satelital': aqi,
            'categoria': categoria,
            'color': color
        }
        
        resultados.append(resultado)
    
    con_datos = sum(1 for r in resultados if r['tiene_datos'])
    
    return jsonify({
        'coordenada_central': {'lat': lat_centro, 'lon': lon_centro},
        'radio_metros': radio,
        'total_puntos': num_coordenadas,
        'puntos_con_datos': con_datos,
        'resultados': resultados
    })

if __name__ == '__main__':
    app.run(debug=True, port=5001)