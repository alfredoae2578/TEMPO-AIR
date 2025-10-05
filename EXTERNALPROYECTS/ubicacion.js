let mapa;
let capasCalor = [];
let timeoutBusqueda = null;
let modoClickActivo = false;
let pinTemporal = null;
let coordenadasTemporales = null;

document.addEventListener('DOMContentLoaded', () => {
    mapa = L.map('mapa').setView([20, 0], 2);
    
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19
    }).addTo(mapa);

    mapa.on('click', manejarClickMapa);
});

function limpiarCapasCalor() {
    capasCalor.forEach(capa => mapa.removeLayer(capa));
    capasCalor = [];
}

function manejarClickMapa(e) {
    if (!modoClickActivo) return;

    const lat = e.latlng.lat;
    const lon = e.latlng.lng;

    coordenadasTemporales = { lat, lon };

    if (pinTemporal) {
        mapa.removeLayer(pinTemporal);
    }

    const iconoTemporal = L.divIcon({
        html: '<div style="background:#FF9800;width:24px;height:24px;border-radius:50%;border:3px solid white;box-shadow:0 3px 8px rgba(0,0,0,0.4);"></div>',
        className: '',
        iconSize: [24, 24],
        iconAnchor: [12, 12]
    });

    pinTemporal = L.marker([lat, lon], { icon: iconoTemporal })
        .addTo(mapa)
        .bindPopup(`<b>📍 Pin temporal</b><br>${lat.toFixed(6)}, ${lon.toFixed(6)}<br><small>Haz clic en otro lugar para moverlo</small>`);

    mostrarBotonConfirmar();
}

function mostrarBotonConfirmar() {
    const resultado = document.getElementById('resultado');
    resultado.innerHTML = `
        <div class="cargando">
            📍 Pin colocado en:<br>
            ${coordenadasTemporales.lat.toFixed(6)}, ${coordenadasTemporales.lon.toFixed(6)}
        </div>
        <button class="btn-confirmar" onclick="confirmarUbicacion()">✓ Confirmar y Consultar</button>
        <button onclick="cancelarModoClick()" style="background:#f44336;margin-top:5px;">✗ Cancelar</button>
    `;
}

async function confirmarUbicacion() {
    modoClickActivo = false;
    document.querySelectorAll('.opciones button')[1].classList.remove('activo');

    const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${coordenadasTemporales.lat}&lon=${coordenadasTemporales.lon}&accept-language=es`
    );
    const data = await response.json();
    const nombre = data.display_name;

    if (pinTemporal) {
        mapa.removeLayer(pinTemporal);
        pinTemporal = null;
    }

    consultarTEMPO(coordenadasTemporales.lat, coordenadasTemporales.lon, nombre);
}

function cancelarModoClick() {
    modoClickActivo = false;
    document.querySelectorAll('.opciones button')[1].classList.remove('activo');
    
    if (pinTemporal) {
        mapa.removeLayer(pinTemporal);
        pinTemporal = null;
    }
    
    coordenadasTemporales = null;
    document.getElementById('resultado').innerHTML = '';
}

function usarClickMapa() {
    modoClickActivo = true;
    document.querySelectorAll('.opciones button')[1].classList.add('activo');
    
    document.getElementById('resultado').innerHTML = 
        '<div class="cargando">🗺️ Haz clic en el mapa para seleccionar ubicación...</div>';
}

async function buscarUbicaciones() {
    const input = document.getElementById('inputBusqueda');
    const sugerencias = document.getElementById('sugerencias');
    const query = input.value.trim();

    if (query.length < 3) {
        sugerencias.style.display = 'none';
        return;
    }

    clearTimeout(timeoutBusqueda);
    
    timeoutBusqueda = setTimeout(async () => {
        try {
            const response = await fetch(
                `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5`
            );
            const lugares = await response.json();

            if (lugares.length === 0) {
                sugerencias.innerHTML = '<div class="sugerencia">No se encontraron resultados</div>';
                sugerencias.style.display = 'block';
                return;
            }

            sugerencias.innerHTML = lugares.map(lugar => 
                `<div class="sugerencia" onclick="seleccionarLugar(${lugar.lat}, ${lugar.lon}, '${lugar.display_name.replace(/'/g, "\\'")}')">
                    ${lugar.display_name}
                </div>`
            ).join('');
            
            sugerencias.style.display = 'block';
        } catch (error) {
            console.error('Error buscando ubicaciones:', error);
        }
    }, 300);
}

function seleccionarLugar(lat, lon, nombre) {
    cancelarModoClick();
    document.getElementById('inputBusqueda').value = nombre;
    document.getElementById('sugerencias').style.display = 'none';
    mapa.setView([lat, lon], 13);
    consultarTEMPO(lat, lon, nombre);
}

async function usarUbicacionActual() {
    cancelarModoClick();
    const resultado = document.getElementById('resultado');
    
    if (!navigator.geolocation) {
        resultado.innerHTML = '<div class="error">Tu navegador no soporta geolocalización</div>';
        return;
    }

    resultado.innerHTML = '<div class="cargando">⏳ Obteniendo ubicación actual...</div>';

    try {
        const posicion = await new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0
            });
        });

        const lat = posicion.coords.latitude;
        const lon = posicion.coords.longitude;

        const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&accept-language=es`
        );
        const data = await response.json();
        const nombre = data.display_name;

        mapa.setView([lat, lon], 13);
        consultarTEMPO(lat, lon, nombre);
    } catch (error) {
        let mensaje = 'Error al obtener ubicación';
        if (error.code === 1) mensaje = 'Permiso denegado';
        else if (error.code === 2) mensaje = 'Ubicación no disponible';
        else if (error.code === 3) mensaje = 'Tiempo agotado';
        
        resultado.innerHTML = `<div class="error">⌘ ${mensaje}</div>`;
    }
}

function getTextoCalidad(score) {
    if (score >= 80) return 'Excelente';
    if (score >= 65) return 'Buena';
    if (score >= 50) return 'Moderada';
    if (score >= 35) return 'Mala';
    return 'Pésima';
}

async function consultarTEMPO(lat, lon, nombre) {
    const resultado = document.getElementById('resultado');
    const numCoord = parseInt(document.getElementById('numCoord').value);
    const radio = parseInt(document.getElementById('radio').value) * 1000; // km a metros

    limpiarCapasCalor();
    resultado.innerHTML = '<div class="cargando">⏳ Consultando datos TEMPO...</div>';

    try {
        const response = await fetch('http://localhost:5000/api/tempo', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ lat, lon, num_coordenadas: numCoord, radio })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Error al consultar TEMPO');
        }

        // Marcador central
        const iconoCentral = L.divIcon({
            html: '<div style="background:#2196F3;width:20px;height:20px;border-radius:50%;border:3px solid white;box-shadow:0 2px 5px rgba(0,0,0,0.3);"></div>',
            className: '',
            iconSize: [20, 20],
            iconAnchor: [10, 10]
        });
        
        const marcadorCentral = L.marker([lat, lon], { icon: iconoCentral })
            .addTo(mapa)
            .bindPopup(`<b>📍 Ubicación consulta</b><br>${nombre}<br>${lat.toFixed(6)}, ${lon.toFixed(6)}`);
        capasCalor.push(marcadorCentral);

        const puntosConDatos = data.resultados.filter(r => r.tiene_datos);
        
        // BLOQUES DE CALOR: círculos de colores por zona
        puntosConDatos.forEach((item, index) => {
            const radio_zona = 3000; // 3km de radio visual
            
            const circulo = L.circle([item.lat, item.lon], {
                color: item.color,
                fillColor: item.color,
                fillOpacity: 0.4,
                opacity: 0.8,
                radius: radio_zona,
                weight: 2
            }).addTo(mapa);

            // Popup con detalles
            const contaminantes = item.contaminantes;
            let detallesHTML = `<b>🌡️ Zona ${index + 1}</b><br>`;
            detallesHTML += `<div class="indice-score" style="background:${item.color};">${item.indice_calidad}</div><br>`;
            detallesHTML += `<b>${getTextoCalidad(item.indice_calidad)}</b><br><br>`;
            
            if (contaminantes.NO2) {
                detallesHTML += `<b>NO₂:</b> ${contaminantes.NO2.troposphere.toExponential(2)} molec/cm²<br>`;
            }
            if (contaminantes.O3) {
                detallesHTML += `<b>O₃:</b> ${contaminantes.O3.troposphere.toExponential(2)} molec/cm²<br>`;
            }
            if (contaminantes.HCHO) {
                detallesHTML += `<b>HCHO:</b> ${contaminantes.HCHO.troposphere.toExponential(2)} molec/cm²<br>`;
            }
            
            detallesHTML += `<br><small>${item.lat.toFixed(6)}, ${item.lon.toFixed(6)}</small>`;
            
            circulo.bindPopup(detallesHTML);
            capasCalor.push(circulo);
        });

        // Ajustar vista
        if (puntosConDatos.length > 0) {
            const bounds = L.latLngBounds(
                [[lat, lon]],
                puntosConDatos.map(p => [p.lat, p.lon])
            );
            mapa.fitBounds(bounds, { padding: [80, 80] });
        }

        // Panel de resultados
        const conDatos = puntosConDatos.length;
        const sinDatos = data.resultados.length - conDatos;

        let html = `
            <div class="resultado">
                <div class="dato">
                    <span class="etiqueta">📍 Ubicación:</span><br>
                    <span class="valor">${nombre}</span>
                </div>
                <div class="dato">
                    <span class="etiqueta">🎯 Coordenadas:</span>
                    <span class="valor">${lat.toFixed(6)}, ${lon.toFixed(6)}</span>
                </div>
                <div class="dato">
                    <span class="etiqueta">📊 Zonas analizadas:</span>
                    <span class="valor">${conDatos} con datos / ${sinDatos} sin datos</span>
                </div>
        `;

        if (conDatos > 0) {
            html += '<hr style="margin: 15px 0;"><h3 style="font-size:14px;margin-bottom:10px;">Zonas de Calidad:</h3>';
            
            puntosConDatos.forEach((item, index) => {
                html += `
                    <div class="zona-calor" style="border-left-color:${item.color}; background:${item.color}15;">
                        <div style="display:flex;justify-content:space-between;align-items:center;">
                            <span><b>Zona ${index + 1}</b></span>
                            <span class="indice-score" style="background:${item.color};font-size:16px;padding:3px 10px;">
                                ${item.indice_calidad}
                            </span>
                        </div>
                        <small style="color:#666;">${getTextoCalidad(item.indice_calidad)}</small>
                    </div>
                `;
            });
        }

        html += '</div>';
        resultado.innerHTML = html;

    } catch (error) {
        resultado.innerHTML = `<div class="error">⌘ ${error.message}</div>`;
    }
}

document.addEventListener('click', (e) => {
    if (!e.target.closest('#inputBusqueda') && !e.target.closest('#sugerencias')) {
        document.getElementById('sugerencias').style.display = 'none';
    }
});