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
os.environ['EARTHDATA_USERNAME'] = "alfredo_ae6353563"
os.environ['EARTHDATA_PASSWORD'] = "!7xbvu74PN#uU&X"
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
    """Colores EPA oficiales."""
    if aqi is None:
        return '#808080'
    elif aqi <= 50:
        return '#00E400'  # Verde
    elif aqi <= 100:
        return '#FFFF00'  # Amarillo
    elif aqi <= 150:
        return '#FF7E00'  # Naranja
    elif aqi <= 200:
        return '#FF0000'  # Rojo
    elif aqi <= 300:
        return '#8F3F97'  # Morado
    else:
        return '#7E0023'  # Marrón

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
        print(f"\n  [DEBUG] Buscando {config['short_name']} V{config['version']}")
        print(f"  [DEBUG] Temporal: {temporal}")
        print(f"  [DEBUG] BBox: ({lon - 0.5}, {lat - 0.5}, {lon + 0.5}, {lat + 0.5})")
        
        try:
            # Buscar granules
            results = earthaccess.search_data(
                short_name=config["short_name"],
                version=config["version"],
                temporal=temporal,
                bounding_box=(lon - 0.5, lat - 0.5, lon + 0.5, lat + 0.5),
                count=1
            )
            
            print(f"  [DEBUG] Granules encontrados: {len(results)}")
            
            if not results:
                print(f"  [DEBUG] Sin granules")
                continue
            
            print(f"  [DEBUG] Fecha granule: {results[0].get('umm', {}).get('TemporalExtent', {}).get('RangeDateTime', {}).get('BeginningDateTime', 'N/A')}")
            
            # Abrir archivo (streaming)
            files = earthaccess.open(results[:1])
            print(f"  [DEBUG] Archivos abiertos: {len(files)}")
            
            if not files:
                print(f"  [DEBUG] No se pudo abrir archivo")
                continue
            
            # Abrir root (coordenadas) y product (variables)
            ds_root = xr.open_dataset(files[0], engine='h5netcdf')
            ds_product = xr.open_dataset(files[0], engine='h5netcdf', group='product')
            
            print(f"  [DEBUG] Variables product: {list(ds_product.data_vars)}")
            print(f"  [DEBUG] Coordenadas root: {list(ds_root.coords)}")
            
            # Verificar coordenadas
            if 'latitude' not in ds_root.coords or 'longitude' not in ds_root.coords:
                print(f"  [DEBUG] No hay lat/lon en root")
                ds_root.close()
                ds_product.close()
                continue
            
            lat_arr = ds_root['latitude'].values
            lon_arr = ds_root['longitude'].values
            
            print(f"  [DEBUG] Rango lat: {lat_arr.min():.2f} a {lat_arr.max():.2f}")
            print(f"  [DEBUG] Rango lon: {lon_arr.min():.2f} a {lon_arr.max():.2f}")
            
            # Encontrar píxel más cercano
            lat_idx = np.abs(lat_arr - lat).argmin()
            lon_idx = np.abs(lon_arr - lon).argmin()
            
            print(f"  [DEBUG] Índices: lat={lat_idx}, lon={lon_idx}")
            print(f"  [DEBUG] Coordenada píxel: {lat_arr[lat_idx]:.4f}, {lon_arr[lon_idx]:.4f}")
            
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
                print(f"  [DEBUG] troposphere: {float(valor):.2e}")
            
            # Variable 2: Incertidumbre
            if 'vertical_column_troposphere_uncertainty' in ds_product.data_vars:
                var = ds_product['vertical_column_troposphere_uncertainty']
                if 'time' in var.dims:
                    valor = var.isel(latitude=lat_idx, longitude=lon_idx, time=0).values
                else:
                    valor = var.isel(latitude=lat_idx, longitude=lon_idx).values
                vars_dict['uncertainty'] = float(valor)
                print(f"  [DEBUG] uncertainty: {float(valor):.2e}")
            
            # Variable 3: Columna estratosférica
            if 'vertical_column_stratosphere' in ds_product.data_vars:
                var = ds_product['vertical_column_stratosphere']
                if 'time' in var.dims:
                    valor = var.isel(latitude=lat_idx, longitude=lon_idx, time=0).values
                else:
                    valor = var.isel(latitude=lat_idx, longitude=lon_idx).values
                vars_dict['stratosphere'] = float(valor)
                print(f"  [DEBUG] stratosphere: {float(valor):.2e}")
            
            # Variable 4: Quality flag (0 = bueno)
            if 'main_data_quality_flag' in ds_product.data_vars:
                var = ds_product['main_data_quality_flag']
                if 'time' in var.dims:
                    valor = var.isel(latitude=lat_idx, longitude=lon_idx, time=0).values
                else:
                    valor = var.isel(latitude=lat_idx, longitude=lon_idx).values
                vars_dict['quality_flag'] = float(valor)
                print(f"  [DEBUG] quality_flag: {float(valor)}")
            
            # Guardar si tiene datos válidos (no NaN)
            if vars_dict and not np.isnan(vars_dict.get('troposphere', np.nan)):
                resultados['contaminantes'][config["contaminante"]] = vars_dict
                resultados['tiene_datos'] = True
                print(f"  [DEBUG] ✓ Datos válidos guardados")
            else:
                print(f"  [DEBUG] ✗ Valor es NaN")
            
            ds_root.close()
            ds_product.close()
            
        except Exception as e:
            print(f"  [DEBUG] ERROR: {type(e).__name__}: {e}")
            import traceback
            traceback.print_exc()
            continue
    
    return resultados

@app.route('/api/tempo', methods=['POST'])
def get_tempo_data():
    data = request.json
    lat_centro = data.get('lat')
    lon_centro = data.get('lon')
    num_coordenadas = data.get('num_coordenadas', 2)  # Default 5 puntos
    radio = data.get('radio', 10000)  # Default 10km para mayor dispersión
    
    if not lat_centro or not lon_centro:
        return jsonify({'error': 'Coordenadas requeridas'}), 400
    
    print(f"\n{'='*70}")
    print(f"CONSULTA TEMPO - ÍNDICE DE CALIDAD DEL AIRE")
    print(f"Centro: {lat_centro}, {lon_centro}")
    print(f"Radio: {radio}m | Puntos: {num_coordenadas}")
    print(f"{'='*70}\n")
    
    coordenadas = generar_coordenadas_aleatorias(lat_centro, lon_centro, radio, num_coordenadas)
    
    resultados = []
    
    for i, coord in enumerate(coordenadas, 1):
        lat = coord['lat']
        lon = coord['lon']
        
        print(f"[{i}/{num_coordenadas}] {lat:.6f}, {lon:.6f}")
        
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
        
        if datos['tiene_datos'] and aqi:
            print(f"  ✓ AQI: {aqi} ({categoria}) | Color: {color}")
            for contaminante, variables in datos['contaminantes'].items():
                print(f"    {contaminante}: {variables.get('troposphere', 0):.2e}")
        else:
            print(f"  ✗ Sin datos válidos")
        
        resultados.append(resultado)
    
    con_datos = sum(1 for r in resultados if r['tiene_datos'])
    
    print(f"\n{'='*70}")
    print(f"RESUMEN: {con_datos}/{num_coordenadas} puntos con datos")
    print(f"{'='*70}\n")
    
    return jsonify({
        'coordenada_central': {'lat': lat_centro, 'lon': lon_centro},
        'radio_metros': radio,
        'total_puntos': num_coordenadas,
        'puntos_con_datos': con_datos,
        'resultados': resultados
    })

if __name__ == '__main__':
    app.run(debug=True, port=5000)