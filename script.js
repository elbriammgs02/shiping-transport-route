/* =========================================================
   SISTEMA DE LOGÍSTICA MARÍTIMA
   Los datos (rutas y clima) están en rutas.js
========================================================= */


/* =========================================================
   CONFIGURACIÓN GENERAL
========================================================= */

const DIAS_VIAJE = 90;                          // día en que el buque llega al destino
const DIAS_RECOJO = 60;                         // plazo para recoger la mercancía
const DIA_MAXIMO = DIAS_VIAJE + DIAS_RECOJO;    // día 150: plazo vencido, mercancía decomisada


/* =========================================================
   GEOMETRÍA Y POSICIÓN DEL BUQUE (funciones puras)
========================================================= */

/* Distancia en km entre dos puntos [lat, lng] (fórmula de haversine) */
function distanciaKm(a, b) {
    const R = 6371;
    const rad = Math.PI / 180;
    const dLat = (b[0] - a[0]) * rad;
    const dLng = (b[1] - a[1]) * rad;
    const h =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(a[0] * rad) * Math.cos(b[0] * rad) * Math.sin(dLng / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(h));
}

/* Índice del waypoint más cercano a un punto */
function indiceMasCercano(waypoints, punto) {
    let mejor = 0;
    let mejorDist = Infinity;
    waypoints.forEach(function (w, i) {
        const d = distanciaKm(w, [punto.lat, punto.lng]);
        if (d < mejorDist) {
            mejorDist = d;
            mejor = i;
        }
    });
    return { indice: mejor, distancia: mejorDist };
}

/*
   Calcula, una sola vez por ruta:
   - la distancia acumulada en cada waypoint
   - qué waypoint corresponde a cada puerto
   Así el barco puede llegar a cada puerto el día indicado en la tabla.
*/
function prepararRuta(ruta) {
    const w = ruta.waypoints;

    ruta.acumulado = [0];
    for (let i = 1; i < w.length; i++) {
        ruta.acumulado[i] = ruta.acumulado[i - 1] + distanciaKm(w[i - 1], w[i]);
    }

    ruta.indicePunto = ruta.puntos.map(function (p) {
        const r = indiceMasCercano(w, p);
        if (r.distancia > 1) {
            console.warn(
                `[${ruta.nombre}] "${p.nombre}" no está en los waypoints ` +
                `(a ${r.distancia.toFixed(1)} km del más cercano).`
            );
        }
        return r.indice;
    });

    ruta.puntos.forEach(function (p, i) {
        if (i > 0 && ruta.indicePunto[i] <= ruta.indicePunto[i - 1]) {
            console.warn(`[${ruta.nombre}] "${p.nombre}" está fuera de orden en los waypoints.`);
        }
    });

    const ultimo = ruta.puntos[ruta.puntos.length - 1];
    if (ultimo.dia !== DIAS_VIAJE) {
        console.warn(`[${ruta.nombre}] el destino final llega el día ${ultimo.dia}, pero DIAS_VIAJE es ${DIAS_VIAJE}.`);
    }
}

/*
   Posición [lat, lng] del buque en un día dado.
   Entre dos puertos consecutivos avanza por los waypoints de ese tramo,
   en proporción a los días que la tabla asigna a ese tramo.
*/
function posicionEnDia(ruta, dia) {
    const puntos = ruta.puntos;
    const w = ruta.waypoints;

    if (dia <= puntos[0].dia) {
        return w[0];
    }

    if (dia >= puntos[puntos.length - 1].dia) {
        return w[w.length - 1];
    }

    let t = 0;
    while (dia >= puntos[t + 1].dia) {
        t++;
    }

    const fraccionTramo = (dia - puntos[t].dia) / (puntos[t + 1].dia - puntos[t].dia);
    const iIni = ruta.indicePunto[t];
    const iFin = ruta.indicePunto[t + 1];
    const kmObjetivo =
        ruta.acumulado[iIni] +
        fraccionTramo * (ruta.acumulado[iFin] - ruta.acumulado[iIni]);

    let i = iIni;
    while (i + 1 < iFin && ruta.acumulado[i + 1] < kmObjetivo) {
        i++;
    }

    const largo = ruta.acumulado[i + 1] - ruta.acumulado[i];
    const f = largo > 0 ? (kmObjetivo - ruta.acumulado[i]) / largo : 0;

    return [
        w[i][0] + (w[i + 1][0] - w[i][0]) * f,
        w[i][1] + (w[i + 1][1] - w[i][1]) * f
    ];
}

/* Punto por el que va el buque y el siguiente */
function obtenerPuntoActual(ruta, dia) {
    let actual = ruta.puntos[0];
    let siguiente = ruta.puntos[1] || null;

    for (let i = 0; i < ruta.puntos.length; i++) {
        if (dia >= ruta.puntos[i].dia) {
            actual = ruta.puntos[i];
            siguiente = ruta.puntos[i + 1] || null;
        }
    }

    return { actual, siguiente };
}

/* Fecha simulada (siempre desde el 1 de enero) */
function obtenerFecha(dia) {
    if (dia <= 31) return `${dia} de Enero`;
    if (dia <= 59) return `${dia - 31} de Febrero`;
    if (dia <= 90) return `${dia - 59} de Marzo`;
    return `Día ${dia - DIAS_VIAJE} de recojo`;
}

/* Tráfico simulado */
function obtenerNivelTrafico(dia) {
    if (dia > DIAS_VIAJE) return "bajo";

    const valor = Math.sin(dia * 0.35) + Math.sin(dia * 0.11);

    if (valor > 0.8) return "alto";
    if (valor > -0.4) return "medio";
    return "bajo";
}


/* =========================================================
   INTERFAZ (se ejecuta cuando carga la página)
========================================================= */

window.addEventListener("load", function () {

    Object.values(CATALOGO_RUTAS).forEach(prepararRuta);

    let rutaActual = "ruta1";
    let datosRuta = CATALOGO_RUTAS[rutaActual];

    let mapa = null;
    let marcadorMovil = null;
    let capaRuta = null;
    let capaTrafico = null;

    const $ = function (id) {
        return document.getElementById(id);
    };


    /* ---------- Mapa ---------- */

    function inicializarMapa() {
        if (!$("map")) {
            console.error("No se encontró #map");
            return;
        }

        if (typeof L === "undefined") {
            console.error("Leaflet no cargó. Revisa la conexión a Internet o el CDN de Leaflet.");
            $("map").innerHTML = '<div class="map-load-error">No se pudo cargar el mapa. Revisa tu conexión y vuelve a intentar.</div>';
            return;
        }

        mapa = L.map("map", { zoomControl: true, worldCopyJump: true }).setView([0, 0], 2);

        // Esri World Street Map: evita los bloqueos previos de OSM/CARTO y no requiere API key en este uso.
        const capaBase = L.tileLayer(
            "https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}",
            { attribution: "Tiles &copy; Esri", maxZoom: 19, crossOrigin: true }
        );

        capaBase.on("tileerror", function (evento) {
            console.error("No se pudo cargar una tesela del mapa base:", evento);
        });

        capaBase.addTo(mapa);

        // Asegura que Leaflet calcule bien el tamaño del mapa al cargar.
        setTimeout(function () {
            mapa.invalidateSize();
        }, 150);

        capaRuta = L.layerGroup().addTo(mapa);
        capaTrafico = L.layerGroup().addTo(mapa);

        dibujarRuta();
        actualizarTodo(1);
    }


    /* ---------- Iconos ---------- */

    function obtenerColor(tipo) {
        if (tipo === "Origen") return "#22c55e";
        if (tipo === "Destino Final") return "#ef4444";
        return "#facc15";
    }

    function crearIcono(tipo) {
        const color = obtenerColor(tipo);
        const tamaño = 14;

        return L.divIcon({
            className: "puerto-marker",
            html: `<div style="
                width:${tamaño}px;
                height:${tamaño}px;
                border-radius:50%;
                background:${color};
                border:3px solid white;
                box-shadow:0 2px 8px rgba(0,0,0,.35);
            "></div>`,
            iconSize: [tamaño, tamaño],
            iconAnchor: [tamaño / 2, tamaño / 2]
        });
    }

    function crearIconoBarco() {
        return L.divIcon({
            className: "barco-marker",
            html: `<div style="
                font-size:30px;
                width:42px;
                height:42px;
                display:flex;
                align-items:center;
                justify-content:center;
                filter:drop-shadow(0 3px 4px rgba(0,0,0,.35));
            ">🚢</div>`,
            iconSize: [42, 42],
            iconAnchor: [21, 21]
        });
    }


    /* ---------- Tráfico en el mapa ---------- */

    function crearZonaTrafico(posicion, nivel) {
        const color =
            nivel === "alto" ? "#ef4444" :
            nivel === "medio" ? "#facc15" :
            "#22c55e";

        const radio =
            nivel === "alto" ? 70000 :
            nivel === "medio" ? 55000 :
            40000;

        return L.circle(posicion, {
            radius: radio,
            color: color,
            fillColor: color,
            fillOpacity: 0.12,
            weight: 2
        });
    }

    function dibujarTrafico(dia) {
        if (!capaTrafico) return;

        capaTrafico.clearLayers();

        if (dia >= DIAS_VIAJE) return;

        crearZonaTrafico(
            posicionEnDia(datosRuta, dia),
            obtenerNivelTrafico(dia)
        ).addTo(capaTrafico);
    }


    /* ---------- Ruta y puertos ---------- */

    function dibujarRuta() {
        if (!mapa || !capaRuta) return;

        capaRuta.clearLayers();

        const waypoints = datosRuta.waypoints;

        L.polyline(waypoints, {
            color: "#6366f1",
            weight: 4,
            opacity: 0.8,
            dashArray: "10 8"
        }).addTo(capaRuta);

        mapa.fitBounds(L.latLngBounds(waypoints), { padding: [40, 40] });

        datosRuta.puntos.forEach(function (punto) {
            const marcador = L.marker([punto.lat, punto.lng], {
                icon: crearIcono(punto.tipo)
            });

            const clima = CLIMA[punto.nombre] || {
                estado: "Información no disponible",
                temperatura: "--",
                icono: "🌍"
            };

            marcador.bindPopup(`
                <div style="min-width:190px;font-family:Arial,sans-serif;">
                    <strong style="font-size:16px;">${punto.nombre}</strong>
                    <hr style="border:none;border-top:1px solid #ddd;margin:8px 0;">
                    <div><strong>Tipo:</strong> ${punto.tipo}</div>
                    <div><strong>Día de llegada:</strong> ${punto.dia}</div>
                    <div style="margin-top:8px;">${clima.icono} ${clima.estado}</div>
                    <div>🌡️ ${clima.temperatura}</div>
                </div>
            `);

            marcador.addTo(capaRuta);
        });

        const contador = $("totalPuntos");
        if (contador) {
            contador.textContent = datosRuta.puntos.length;
        }
    }


    /* ---------- Buque ---------- */

    function actualizarBarco(dia) {
        if (!mapa) return;

        const posicion = posicionEnDia(datosRuta, dia);

        if (!marcadorMovil) {
            marcadorMovil = L.marker(posicion, {
                icon: crearIconoBarco(),
                zIndexOffset: 1000
            }).addTo(mapa);
        } else {
            marcadorMovil.setLatLng(posicion);
        }

        const puntoActual = obtenerPuntoActual(datosRuta, dia);

        marcadorMovil.bindPopup(`
            <div style="font-family:Arial,sans-serif;min-width:170px;">
                <strong>🚢 Buque</strong>
                <br><br>
                <strong>Día:</strong> ${dia}
                <br>
                <strong>Fecha:</strong> ${obtenerFecha(dia)}
                <br><br>
                <strong>Situación:</strong>
                ${dia >= DIAS_VIAJE ? "Mercancía en destino" : "En tránsito"}
            </div>
        `);

        actualizarPanelSeguimiento(dia, puntoActual);
        actualizarAlertas(dia, puntoActual);
        dibujarTrafico(dia);
        actualizarTabla(dia);
    }


    /* ---------- Panel de seguimiento ---------- */

    function calcularUbicacionTexto(dia, puntoActual) {
        if (dia === puntoActual.actual.dia) {
            return puntoActual.actual.nombre;
        }

        const destino = puntoActual.siguiente || puntoActual.actual;
        return `En tránsito hacia ${destino.nombre}`;
    }

    function actualizarPanelSeguimiento(dia, puntoActual) {
        const progreso = ((dia - 1) / (DIA_MAXIMO - 1)) * 100;
        const destinoFinal = datosRuta.puntos[datosRuta.puntos.length - 1];

        if ($("diaActual")) $("diaActual").textContent = dia;
        if ($("fechaActual")) $("fechaActual").textContent = obtenerFecha(dia);
        if ($("progressBar")) $("progressBar").style.width = `${progreso}%`;
        if ($("progressPercent")) $("progressPercent").textContent = `${Math.round(progreso)}%`;

        if ($("valDia")) {
            if (dia <= DIAS_VIAJE) {
                $("valDia").textContent = `Día ${dia} — Viaje`;
            } else if (dia < DIA_MAXIMO) {
                $("valDia").textContent = `Día ${dia} — Recojo ${dia - DIAS_VIAJE}/${DIAS_RECOJO}`;
            } else {
                $("valDia").textContent = `Día ${dia} — Plazo vencido`;
            }
        }

        if ($("ubicacionActual")) {
            $("ubicacionActual").textContent =
                dia >= DIAS_VIAJE
                    ? destinoFinal.nombre
                    : calcularUbicacionTexto(dia, puntoActual);
        }

        if ($("infoSimulacion")) {
            let texto;

            if (dia < DIAS_VIAJE) {
                texto = puntoActual.siguiente
                    ? `Próximo punto: ${puntoActual.siguiente.nombre}`
                    : "Buque en tránsito.";
            } else if (dia === DIAS_VIAJE) {
                texto = `La mercancía llegó al destino final. Comienza el plazo de ${DIAS_RECOJO} días para recogerla.`;
            } else if (dia < DIA_MAXIMO) {
                texto = `Mercancía almacenada en destino. Quedan ${DIA_MAXIMO - dia} días para recogerla.`;
            } else {
                texto = "El plazo de recojo ha vencido. La mercancía fue decomisada.";
            }

            $("infoSimulacion").textContent = texto;
        }
    }


    /* ---------- Alertas ---------- */

    function tarjetaAlerta(clase, titulo, cuerpo) {
        return `
            <div class="collection-alert ${clase}">
                <strong>${titulo}</strong>
                ${cuerpo}
            </div>
        `;
    }

    function alertaRecojoHTML(dia) {
        const restantes = DIA_MAXIMO - dia;

        if (dia < DIAS_VIAJE) {
            return "";
        }

        if (dia === DIAS_VIAJE) {
            return tarjetaAlerta(
                "collection-60",
                "📦 MERCANCÍA LLEGADA",
                `La mercancía llegó al destino final.<br><br>
                 🟠 Tienes <strong>${DIAS_RECOJO} días</strong> para recogerla.`
            );
        }

        if (dia >= DIA_MAXIMO) {
            return tarjetaAlerta(
                "collection-decomisada",
                "🚨 MERCANCÍA DECOMISADA",
                `El plazo máximo de ${DIAS_RECOJO} días para recoger la mercancía ha vencido.<br><br>
                 ❌ La mercancía no fue recogida y ha sido <strong>DECOMISADA</strong>.`
            );
        }

        /* Más de 45 días restantes */
        if (restantes > 45) {
            return tarjetaAlerta(
                "collection-60",
                "🟠 PLAZO DE RECOJO",
                `Tu mercancía se encuentra esperando ser recogida.<br><br>
                 Te quedan <strong>${restantes} días</strong> para recogerla.`
            );
        }

        /* Entre 31 y 45 días restantes */
        if (restantes > 30) {
            return tarjetaAlerta(
                "collection-45",
                "🟡 ALERTA DE RECOJO",
                `La mercancía aún no ha sido recogida.<br><br>
                 Te quedan <strong>${restantes} días</strong> para recogerla.`
            );
        }

        /* 30 días o menos */
        return tarjetaAlerta(
            "collection-30",
            "🔴 ÚLTIMO PLAZO",
            `La mercancía todavía no ha sido recogida.<br><br>
             Te quedan solamente <strong>${restantes} días</strong>.`
        );
    }

    function actualizarAlertas(dia, puntoActual) {

        /* Clima: del próximo puerto, o del destino si ya llegó */
        const puertoClima =
            dia >= DIAS_VIAJE
                ? datosRuta.puntos[datosRuta.puntos.length - 1]
                : puntoActual.siguiente || puntoActual.actual;

        const clima = CLIMA[puertoClima.nombre] || {
            estado: "Condiciones normales",
            temperatura: "--",
            icono: "🌍"
        };

        if ($("alertaClima")) {
            $("alertaClima").innerHTML = `
                <strong>${clima.icono} Clima</strong>
                <br>
                ${puertoClima.nombre}
                <br>
                ${clima.estado} · ${clima.temperatura}
            `;
        }

        if ($("mapInfoClima")) {
            $("mapInfoClima").innerHTML = `${clima.icono} <strong>Clima:</strong> ${clima.estado} · ${clima.temperatura}`;
        }

        /* Tráfico */
        const nivel = obtenerNivelTrafico(dia);
        let textoTrafico;

        if (dia >= DIAS_VIAJE) {
            textoTrafico = "📦 Mercancía en destino";
        } else if (nivel === "alto") {
            textoTrafico = "🔴 Tráfico marítimo alto";
        } else if (nivel === "medio") {
            textoTrafico = "🟡 Tráfico marítimo medio";
        } else {
            textoTrafico = "🟢 Tráfico marítimo bajo";
        }

        if ($("alertaTrafico")) {
            $("alertaTrafico").innerHTML = `
                <strong>🚦 Tráfico</strong>
                <br>
                ${textoTrafico}
            `;
        }

        if ($("mapInfoTrafico")) {
            $("mapInfoTrafico").innerHTML = `🚦 <strong>Tráfico:</strong> ${textoTrafico.replace(/^[^ ]+\s*/, "")}`;
        }

        if ($("mapInfoMercancia")) {
            let estadoMercancia = "🚢 <strong>Mercancía:</strong> en tránsito";
            if (dia === DIAS_VIAJE) estadoMercancia = "📦 <strong>Mercancía:</strong> llegada al destino";
            else if (dia > DIAS_VIAJE && dia < DIA_MAXIMO) estadoMercancia = "🏢 <strong>Mercancía:</strong> almacenada, pendiente de recojo";
            else if (dia >= DIA_MAXIMO) estadoMercancia = "🚨 <strong>Mercancía:</strong> decomisada por vencimiento del plazo simulado";
            $("mapInfoMercancia").innerHTML = estadoMercancia;
        }

        if ($("mapInfoRecojo")) {
            if (dia < DIAS_VIAJE) {
                $("mapInfoRecojo").innerHTML = `📍 <strong>Ruta:</strong> ${puntoActual.siguiente ? "hacia " + puntoActual.siguiente.nombre : "en curso"}`;
            } else if (dia === DIAS_VIAJE) {
                $("mapInfoRecojo").innerHTML = `⏱️ <strong>Recojo:</strong> inicia plazo simulado de ${DIAS_RECOJO} días`;
            } else if (dia < DIA_MAXIMO) {
                const diasAlmacen = dia - DIAS_VIAJE;
                const costoDemo = diasAlmacen * 12;
                $("mapInfoRecojo").innerHTML = `⏱️ <strong>Recojo:</strong> quedan ${DIA_MAXIMO-dia} días · almacenaje demo: $${costoDemo}`;
            } else {
                $("mapInfoRecojo").innerHTML = `⚠️ <strong>Plazo vencido:</strong> operación marcada como decomisada en esta simulación`;
            }
        }

        /* Alertas de recojo (no aparecen antes de la llegada) */
        if ($("panelAlertas")) {
            $("panelAlertas").innerHTML = alertaRecojoHTML(dia);
        }

        /* Alerta flotante del mapa */
        if ($("mapAlertContent")) {
            let html;

            if (dia < DIAS_VIAJE) {
                html = "🚢 Buque en tránsito hacia el destino.";
            } else if (dia === DIAS_VIAJE) {
                html = `📦 <strong>Mercancía llegada.</strong> Comienza el plazo de ${DIAS_RECOJO} días para recogerla.`;
            } else if (dia < DIA_MAXIMO) {
                html = `📦 Te quedan <strong>${DIA_MAXIMO - dia} días</strong> para recoger la mercancía.`;
            } else {
                html = "🚨 <strong>MERCANCÍA DECOMISADA.</strong> El plazo de recojo ha vencido.";
            }

            $("mapAlertContent").innerHTML = html;
        }

        mostrarAlertaImportante(dia);
    }


    /* ---------- Tabla ---------- */

    function actualizarTabla(dia) {
        const tabla = $("tablaDatos");
        if (!tabla) return;

        tabla.innerHTML = "";

        datosRuta.puntos.forEach(function (punto, index) {
            let estado;
            let claseEstado;

            if (punto.tipo === "Destino Final" && dia >= punto.dia) {
                if (dia >= DIA_MAXIMO) {
                    estado = "Decomisada";
                    claseEstado = "collection-decomisada";
                } else {
                    estado = "Llegada completada";
                    claseEstado = "status-arrived";
                }
            } else if (dia >= punto.dia) {
                estado = "Completado";
                claseEstado = "status-success";
            } else {
                estado = "Pendiente";
                claseEstado = "status-pending";
            }

            const fila = document.createElement("tr");

            fila.innerHTML = `
                <td>${index + 1}</td>
                <td><strong>${punto.nombre}</strong></td>
                <td>${punto.lat.toFixed(4)}</td>
                <td>${punto.lng.toFixed(4)}</td>
                <td>${punto.tipo}</td>
                <td>Día ${punto.dia}</td>
                <td><span class="${claseEstado}">${estado}</span></td>
            `;

            tabla.appendChild(fila);
        });
    }


    /* ---------- Actualizar todo ---------- */

    function actualizarTodo(dia) {
        dia = Math.max(1, Math.min(DIA_MAXIMO, Number(dia)));
        actualizarBarco(dia);
    }


    /* ---------- Cambiar de ruta ---------- */

    function cambiarRuta(nuevaRuta) {
        if (!CATALOGO_RUTAS[nuevaRuta]) {
            console.warn("Ruta no encontrada:", nuevaRuta);
            return;
        }

        rutaActual = nuevaRuta;
        datosRuta = CATALOGO_RUTAS[rutaActual];

        if ($("sliderDia")) $("sliderDia").value = 1;

        if (capaRuta) capaRuta.clearLayers();
        if (capaTrafico) capaTrafico.clearLayers();

        if (marcadorMovil) {
            marcadorMovil.remove();
            marcadorMovil = null;
        }

        if ($("panelAlertas")) $("panelAlertas").innerHTML = "";
        if ($("nombreRuta")) $("nombreRuta").textContent = datosRuta.nombre;
        if ($("routeSummary")) $("routeSummary").textContent = datosRuta.descripcion;

        dibujarRuta();
        actualizarTodo(1);

        setTimeout(function () {
            if (mapa) mapa.invalidateSize();
        }, 300);
    }


    /* ---------- Ventana de calculadora ---------- */

    function abrirCalculadora() {
        if (!$("calculatorModal")) return;
        $("calculatorModal").classList.add("is-open");
        $("calculatorModal").setAttribute("aria-hidden", "false");
    }

    function cerrarCalculadora() {
        if (!$("calculatorModal")) return;
        $("calculatorModal").classList.remove("is-open");
        $("calculatorModal").setAttribute("aria-hidden", "true");
    }

    if ($("abrirCalculadora")) $("abrirCalculadora").addEventListener("click", abrirCalculadora);
    if ($("cerrarCalculadora")) $("cerrarCalculadora").addEventListener("click", cerrarCalculadora);
    if ($("calculatorModal")) {
        $("calculatorModal").addEventListener("click", function (e) {
            if (e.target === this) cerrarCalculadora();
        });
    }

    /* ---------- Alertas importantes sobre la pantalla ---------- */

    let ultimaAlertaMostrada = "";
    function mostrarAlertaImportante(dia) {
        if (!$("toastAlert") || !$("toastAlertContent")) return;
        const restantes = DIA_MAXIMO - dia;
        let clave = "";
        let html = "";

        if (dia === DIAS_VIAJE) {
            clave = rutaActual + "-60";
            html = `📦 <strong>Mercancía llegada.</strong><br>Tienes ${DIAS_RECOJO} días para recogerla.`;
        } else if (restantes === 45) {
            clave = rutaActual + "-45";
            html = "🟡 <strong>Alerta de recojo.</strong><br>Quedan 45 días para recoger la mercancía.";
        } else if (restantes === 30) {
            clave = rutaActual + "-30";
            html = "🔴 <strong>Último plazo.</strong><br>Quedan 30 días para recoger la mercancía.";
        } else if (dia >= DIA_MAXIMO) {
            clave = rutaActual + "-decomisada";
            html = "🚨 <strong>MERCANCÍA DECOMISADA.</strong><br>El plazo máximo de recojo ha vencido.";
        }

        if (!clave || clave === ultimaAlertaMostrada) return;
        ultimaAlertaMostrada = clave;
        $("toastAlertContent").innerHTML = html;
        $("toastAlert").classList.add("is-visible");
        $("toastAlert").setAttribute("aria-hidden", "false");
    }

    if ($("cerrarToast")) {
        $("cerrarToast").addEventListener("click", function () {
            $("toastAlert").classList.remove("is-visible");
            $("toastAlert").setAttribute("aria-hidden", "true");
        });
    }

    /* ---------- Controles ---------- */

    if ($("selectRuta")) {
        $("selectRuta").addEventListener("change", function () {
            cambiarRuta(this.value);
        });
    }

    if ($("sliderDia")) {
        /* Los límites del slider salen de la configuración */
        $("sliderDia").min = 1;
        $("sliderDia").max = DIA_MAXIMO;

        $("sliderDia").addEventListener("input", function () {
            actualizarTodo(Number(this.value));
        });
    }

    if ($("sliderMax")) {
        $("sliderMax").textContent = `Día ${DIA_MAXIMO}`;
    }



    /* ---------- Mercancía ---------- */
    const MERCANCIAS = {
        "Televisores": [
            {n:"43 pulgadas", alto:.68, ancho:1.08, largo:.16, peso:12, precio:320},
            {n:"55 pulgadas", alto:.83, ancho:1.35, largo:.17, peso:18, precio:480},
            {n:"65 pulgadas", alto:.98, ancho:1.58, largo:.19, peso:25, precio:700}
        ],
        "Motocicletas": [
            {n:"125–150 cc", alto:1.10, ancho:.75, largo:2.00, peso:125, precio:1800},
            {n:"200–250 cc", alto:1.18, ancho:.82, largo:2.12, peso:155, precio:2800}
        ],
        "Fardos de ropa": [
            {n:"Fardo 45 kg", alto:.80, ancho:.60, largo:.70, peso:45, precio:180},
            {n:"Fardo 80 kg", alto:1.00, ancho:.70, largo:.80, peso:80, precio:300}
        ],
        "Electrodomésticos": [
            {n:"Refrigerador", alto:1.85, ancho:.75, largo:.78, peso:75, precio:650},
            {n:"Lavadora", alto:.90, ancho:.65, largo:.70, peso:65, precio:420}
        ],
        "Repuestos de vehículos": [
            {n:"Caja mediana", alto:.45, ancho:.55, largo:.65, peso:30, precio:250},
            {n:"Caja pesada", alto:.60, ancho:.70, largo:.80, peso:60, precio:480}
        ]
    };

    function cargarTiposMercancia() {
        if (!$('tipoMercancia')) return;
        $('tipoMercancia').innerHTML = Object.keys(MERCANCIAS).map(n => `<option>${n}</option>`).join('');
        cargarPresentaciones();
    }
    function cargarPresentaciones() {
        const tipo=$('tipoMercancia').value;
        $('presentacionMercancia').innerHTML=MERCANCIAS[tipo].map((x,i)=>`<option value="${i}">${x.n}</option>`).join('');
        actualizarMercancia(true);
    }
    function actualizarMercancia(cargarPrecio) {
        if (!$('tipoMercancia')) return;
        const x=MERCANCIAS[$('tipoMercancia').value][Number($('presentacionMercancia').value)||0];
        if(cargarPrecio) $('precioUnitario').value=x.precio;
        const cant=Math.max(1,Number($('cantidadMercancia').value)||1);
        const cambio=Math.max(.01,Number($('tipoCambio').value)||1);
        const precio=Math.max(0,Number($('precioUnitario').value)||0);
        const vol=x.alto*x.ancho*x.largo*cant, peso=x.peso*cant, usd=precio*cant;
        $('resumenMercancia').innerHTML=`<strong>${$('tipoMercancia').value} · ${x.n}</strong><br>Dimensiones unitarias: ${x.largo.toFixed(2)} × ${x.ancho.toFixed(2)} × ${x.alto.toFixed(2)} m<br>Peso total: <strong>${peso.toLocaleString('es-BO')} kg</strong> · Volumen: <strong>${vol.toFixed(2)} m³</strong><br>Valor: <strong>USD ${usd.toLocaleString('es-BO',{minimumFractionDigits:2})}</strong> · <strong>Bs ${(usd*cambio).toLocaleString('es-BO',{minimumFractionDigits:2})}</strong>`;
    }
    function abrirMercancia(){ $('mercanciaModal').classList.add('is-open'); $('mercanciaModal').setAttribute('aria-hidden','false'); }
    function cerrarMercancia(){ $('mercanciaModal').classList.remove('is-open'); $('mercanciaModal').setAttribute('aria-hidden','true'); }
    if($('abrirMercancia')) $('abrirMercancia').addEventListener('click',abrirMercancia);
    if($('cerrarMercancia')) $('cerrarMercancia').addEventListener('click',cerrarMercancia);
    if($('mercanciaModal')) $('mercanciaModal').addEventListener('click',function(e){if(e.target===this)cerrarMercancia();});
    if($('tipoMercancia')) $('tipoMercancia').addEventListener('change',cargarPresentaciones);
    if($('presentacionMercancia')) $('presentacionMercancia').addEventListener('change',()=>actualizarMercancia(true));
    ['cantidadMercancia','tipoCambio','precioUnitario'].forEach(id=>{if($(id)) $(id).addEventListener('input',()=>actualizarMercancia(false));});
    cargarTiposMercancia();

    /* ---------- Simulación automática ---------- */
    let autoTimer=null;
    function detenerAuto(){ if(autoTimer){clearInterval(autoTimer);autoTimer=null;} }
    function iniciarAuto(){
        detenerAuto();
        const ms=Number($('velocidadAuto').value)||1000;
        autoTimer=setInterval(function(){
            let d=Number($('sliderDia').value);
            if(d>=DIA_MAXIMO){detenerAuto();return;}
            d++; $('sliderDia').value=d; actualizarTodo(d);
        },ms);
    }
    if($('btnAuto')) $('btnAuto').addEventListener('click',iniciarAuto);
    if($('btnPausa')) $('btnPausa').addEventListener('click',detenerAuto);
    if($('velocidadAuto')) $('velocidadAuto').addEventListener('change',function(){if(autoTimer) iniciarAuto();});

    /* ---------- Calculadora de volumen ---------- */

    if ($("calcular")) {
        $("calcular").addEventListener("click", function () {
            const alto = Number($("alto").value);
            const ancho = Number($("ancho").value);
            const largo = Number($("largo").value);
            const cantidad = Number($("cantidad").value);

            const resultado = $("resultado");
            if (!resultado) return;

            const medidas = [alto, ancho, largo, cantidad];
            const datosValidos =
                medidas.every(function (v) { return Number.isFinite(v) && v >= 0; }) &&
                Number.isInteger(cantidad);

            if (!datosValidos) {
                resultado.textContent =
                    "Ingresa medidas válidas (números positivos) y una cantidad entera.";
                return;
            }

            const volumenTotal = alto * ancho * largo * cantidad;
            resultado.textContent = `Volumen total: ${volumenTotal.toFixed(2)} m³`;
        });
    }


    /* ---------- Inicio ---------- */

    inicializarMapa();

    if ($("selectRuta")) {
        $("selectRuta").value = rutaActual;
    }

    console.log("Sistema de logística marítima cargado correctamente.");
});
