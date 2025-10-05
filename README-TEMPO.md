# 🛰️ TEMPO Air Quality Heat Map

## 📋 Descripción

Mapa de calor interactivo que visualiza datos de calidad del aire en tiempo real usando el instrumento satelital **TEMPO de NASA**. Integrado al proyecto principal manteniendo consistencia visual con el tema oscuro.

## 🎯 Características Implementadas

### ✅ Integración TEMPO Completa

- **12 variables científicas**: 3 contaminantes (NO2, O3, HCHO) × 4 variables cada uno
- **Fórmula científica validada**: Basada en Lamsal et al. 2014, Duncan et al. 2016
- **Pesos por confiabilidad**: NO2 (50%), HCHO (35%), O3 (15%)
- **Escala EPA-style**: Índice 0-500 con categorías oficiales

### ✅ Visualización de Mapa de Calor

- **5 zonas de análisis**: Radio 5km para mayor variabilidad
- **Bloques/áreas de calor**: En lugar de puntos específicos
- **Gradientes visuales**: Colores con opacidad y efectos blur
- **Interacción hover**: Tooltips informativos

### ✅ Estilo Modo Oscuro Integrado

- **Paleta de colores consistente**: Adaptada al tema del proyecto principal
- **Tipografía unificada**: Tailwind CSS con clases del proyecto
- **Efectos glassmorphism**: Backdrop-blur y transparencias
- **Animaciones Framer Motion**: Transiciones suaves

### ✅ Panel Informativo Detallado

- **Datos en tiempo real**: Los 12 valores TEMPO por zona
- **Formato científico**: Notación exponencial para columnas verticales
- **Indicadores de calidad**: Quality flags y confiabilidad de datos
- **Coordenadas precisas**: Geolocalización exacta

## 🔧 Instalación y Configuración

### 1. Ejecutar Script de Setup

**Windows PowerShell:**

```powershell
.\setup-tempo.ps1
```

**Linux/Mac:**

```bash
chmod +x setup-tempo.sh
./setup-tempo.sh
```

### 2. Iniciar Backend (Puerto 5001)

```bash
cd src/api
python tempo.py
```

### 3. Iniciar Frontend (Puerto 5173)

```bash
npm run dev
```

## 📊 Datos Científicos

### Contaminantes Analizados

| Contaminante | Variable                                | Descripción                          | Peso en Fórmula |
| ------------ | --------------------------------------- | ------------------------------------ | --------------- |
| **NO2**      | vertical_column_troposphere             | Concentración troposférica principal | 50%             |
|              | vertical_column_troposphere_uncertainty | Margen de error estadístico          | -               |
|              | vertical_column_stratosphere            | Componente estratosférico            | -               |
|              | main_data_quality_flag                  | Indicador de confiabilidad (0=bueno) | -               |
| **HCHO**     | (mismas 4 variables)                    | Formaldehído troposférico            | 35%             |
| **O3**       | (mismas 4 variables)                    | Ozono columna total                  | 15%             |

### Escala de Colores AQI

- 🟢 **0-50**: Bueno (Verde esmeralda)
- 🟡 **51-100**: Moderado (Amarillo ámbar)
- 🟠 **101-150**: Poco saludable para sensibles (Naranja)
- 🔴 **151-200**: Poco saludable (Rojo)
- 🟣 **201-300**: Muy poco saludable (Violeta)
- 🟤 **301+**: Peligroso (Marrón oscuro)

## 🎮 Uso de la Interfaz

### Navegación

1. **Botón "Dashboard"**: Vista principal del proyecto
2. **Botón "TEMPO Satelital"**: Mapa de calor TEMPO

### Interacción con Zonas de Calor

- **Hover**: Ver AQI rápido en tooltip
- **Click**: Abrir panel detallado con 12 variables
- **Animaciones**: Efectos de escala y blur en tiempo real

### Panel de Información

- **AQI Central**: Índice principal con color EPA
- **Coordenadas**: Ubicación exacta GPS
- **Contaminantes**: Desglose de las 12 variables
- **Quality Flags**: Indicadores de confiabilidad de datos

## ⚠️ Limitaciones y Disclaimers

### Datos Temporales

- **Período fijo**: Septiembre 2025 (últimos datos disponibles)
- **Resolución espacial**: ~2km por píxel (resolución TEMPO)
- **Cobertura**: Principalmente América del Norte

### Validez Científica

> **Importante**: Índice experimental basado en datos satelitales TEMPO. No sustituye mediciones oficiales terrestres de calidad del aire. Solo para propósitos educativos/demostrativos.

### Credenciales

- Las credenciales NASA Earthdata están hardcodeadas en `src/api/tempo.py`
- Para producción, usar variables de entorno o archivos .netrc

## 🔗 Referencias Científicas

1. **Lamsal et al. (2014)** - "Scaling Relationship for NO2 Pollution and Urban Population Size"
2. **Duncan et al. (2016)** - "Satellite-based estimates of global formaldehyde columns"
3. **NASA TEMPO Mission** - Tropospheric Emissions: Monitoring of Pollution
4. **EPA AQI Standards** - Air Quality Index scale and categories

## 🚀 Arquitectura Técnica

### Backend (`src/api/tempo.py`)

- **Framework**: Flask + CORS
- **NASA Integration**: earthaccess library oficial
- **Data Processing**: xarray + numpy
- **Formato**: NetCDF4/HDF5 con grupos jerárquicos

### Frontend (`src/components/AQIHeatMap.tsx`)

- **Framework**: React + TypeScript
- **Styling**: Tailwind CSS + modo oscuro
- **Animaciones**: Framer Motion
- **Icons**: Lucide React

### Integración (`src/App.tsx`)

- **Navegación**: Toggle entre vistas
- **Estado**: React hooks para manejo de UI
- **Transiciones**: Animaciones entre componentes
