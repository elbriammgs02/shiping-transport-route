/* =========================================================
   DATOS DEL PROYECTO
   Aquí viven las rutas y el clima. Para agregar una ruta
   nueva solo hay que sumar un bloque a CATALOGO_RUTAS y una
   <option> al <select> del index.html.

   REGLAS:
   - Cada punto de "puntos" (puerto/canal) debe aparecer con
     sus coordenadas EXACTAS dentro de "waypoints". El script
     usa eso para que el barco llegue a cada puerto el día
     indicado en "dia".
   - Los waypoints van en orden, siguiendo el agua (no tierra).
   - El "dia" del destino final debe ser igual a DIAS_VIAJE.
========================================================= */

const CATALOGO_RUTAS = {

    /* ---------------------------------------------------
       RUTA 1: Miami → Canal de Panamá → Antofagasta
       Estrecho de Florida → Canal de Yucatán → Caribe →
       Colón → Canal → Balboa → costa del Pacífico
    --------------------------------------------------- */
    ruta1: {
        nombre: "Ruta 1",
        descripcion: "Miami → Canal de Panamá → Antofagasta",
        puntos: [
            { nombre: "Puerto de Miami",       lat: 25.7781, lng: -80.1791, dia: 1,  tipo: "Origen" },
            { nombre: "Canal de Panamá",       lat: 9.0800,  lng: -79.6800, dia: 35, tipo: "Intermedio" },
            { nombre: "Puerto de Antofagasta", lat: -23.6500, lng: -70.4000, dia: 90, tipo: "Destino Final" }
        ],
        waypoints: [
            [25.7781, -80.1791],            // Miami
            [25.2, -79.9],                  // Estrecho de Florida
            [24.4, -80.3],
            [24.0, -81.4],                  // al sur de los Cayos
            [23.6, -82.5],                  // al norte de La Habana
            [23.7, -83.8],
            [22.7, -85.6],
            [21.6, -85.9],                  // Canal de Yucatán
            [19.5, -85.2],                  // Mar Caribe
            [16.5, -82.5],
            [13.5, -80.7],
            [11.5, -80.0],
            [9.75, -79.95],                 // aproximación a Colón
            [9.36, -79.90],                 // Colón (entrada Atlántico)
            [9.0800, -79.6800],             // Canal de Panamá
            [8.90, -79.53],                 // Balboa (salida Pacífico)
            [8.6, -79.4],                   // Golfo de Panamá
            [7.0, -79.4],
            [5.0, -80.5],
            [2.0, -81.5],
            [0.0, -82.3],
            [-2.0, -82.6],
            [-4.5, -82.6],
            [-7.0, -81.7],                  // frente a Perú
            [-9.5, -80.5],
            [-12.0, -78.5],
            [-14.5, -77.0],
            [-16.5, -75.0],
            [-18.5, -72.3],
            [-21.5, -71.5],                 // frente a Chile
            [-23.0, -71.5],
            [-23.65, -71.0],
            [-23.6500, -70.4000]            // Antofagasta
        ]
    },


    /* ---------------------------------------------------
       RUTA 2: Shanghái → Singapur → Suez → Ciudad del Cabo
               → Estrecho de Magallanes → Arica
       (No pasa por Hamburgo.)
       Mar de China → Malaca → Índico → Mar Rojo → Suez →
       Mediterráneo → Gibraltar → Atlántico → Cabo →
       Atlántico Sur → Magallanes → Pacífico
    --------------------------------------------------- */
    ruta2: {
        nombre: "Ruta 2",
        descripcion: "Shanghái → Singapur → Suez → Sudáfrica → Magallanes → Arica",
        puntos: [
            { nombre: "Puerto de Shanghái",        lat: 31.2304,  lng: 121.4737, dia: 1,  tipo: "Origen" },
            { nombre: "Puerto de Singapur",        lat: 1.2644,   lng: 103.8222, dia: 15, tipo: "Intermedio" },
            { nombre: "Canal de Suez",             lat: 30.5852,  lng: 32.2654,  dia: 30, tipo: "Intermedio" },
            { nombre: "Puerto de Ciudad del Cabo", lat: -33.9249, lng: 18.4241,  dia: 60, tipo: "Intermedio" },
            { nombre: "Estrecho de Magallanes",    lat: -52.57,   lng: -69.55,   dia: 78, tipo: "Intermedio" },
            { nombre: "Puerto de Arica",           lat: -18.4783, lng: -70.3126, dia: 90, tipo: "Destino Final" }
        ],
        waypoints: [
            /* SHANGHÁI → salida por el estuario del Yangtsé (hacia el este) */
            [31.2304, 121.4737],
            [31.4, 121.55],
            [31.35, 122.1],
            [31.25, 122.9],
            [30.5, 123.6],
            [29.0, 123.5],
            [27.5, 123.0],

            /* ESTRECHO DE TAIWÁN */
            [26.0, 122.0],
            [25.6, 120.6],
            [24.3, 119.4],
            [22.6, 118.6],

            /* MAR DE CHINA MERIDIONAL (costa de Vietnam) */
            [22.0, 116.5],
            [20.3, 114.0],
            [18.7, 111.9],
            [17.3, 110.6],
            [14.5, 110.2],
            [12.0, 110.3],
            [9.5, 108.0],
            [7.5, 106.6],
            [5.5, 105.3],
            [3.4, 105.0],
            [2.0, 104.8],
            [1.27, 104.45],
            [1.2, 104.1],

            /* SINGAPUR */
            [1.2644, 103.8222],

            /* ESTRECHO DE MALACA */
            [1.17, 103.65],
            [1.15, 103.55],
            [1.4, 103.0],
            [1.95, 102.35],
            [2.4, 101.6],
            [3.2, 100.7],
            [4.4, 99.4],
            [5.6, 97.6],
            [6.5, 95.3],

            /* OCÉANO ÍNDICO (al sur de Sri Lanka, canal de los 8°) */
            [5.7, 94.2],
            [5.6, 90.0],
            [5.3, 85.0],
            [5.3, 81.0],
            [6.3, 77.5],
            [7.7, 73.0],
            [9.5, 66.0],
            [14.2, 55.0],

            /* GOLFO DE ADÉN Y BAB EL-MANDEB */
            [13.2, 50.0],
            [12.4, 47.5],
            [11.8, 45.5],
            [12.6, 43.3],

            /* MAR ROJO */
            [13.9, 42.2],
            [15.0, 41.4],
            [16.5, 40.7],
            [18.0, 39.8],
            [19.7, 38.6],
            [21.5, 37.8],
            [23.5, 37.0],
            [25.0, 35.9],
            [26.5, 35.0],
            [27.3, 34.8],

            /* GOLFO DE SUEZ */
            [27.9, 33.7],
            [28.3, 33.35],
            [29.05, 32.88],
            [29.6, 32.52],
            [29.9, 32.56],

            /* CANAL DE SUEZ */
            [30.5852, 32.2654],
            [31.0, 32.33],
            [31.27, 32.32],

            /* MEDITERRÁNEO */
            [32.3, 31.3],
            [33.5, 28.0],
            [34.0, 24.0],
            [35.0, 20.0],
            [35.2, 15.5],
            [35.4, 14.0],
            [36.4, 12.5],
            [37.3, 11.5],
            [37.9, 10.3],
            [38.2, 8.0],
            [38.0, 3.0],
            [36.7, 0.0],
            [36.0, -2.5],
            [35.95, -4.5],

            /* GIBRALTAR */
            [35.95, -5.55],
            [35.85, -6.6],

            /* ATLÁNTICO NORTE (al oeste de Canarias) */
            [34.5, -9.5],
            [31.5, -13.5],
            [28.5, -19.5],
            [24.0, -19.0],
            [20.0, -19.0],
            [15.0, -19.0],
            [10.0, -19.0],

            /* ATLÁNTICO CENTRAL Y SUR */
            [5.0, -18.0],
            [0.0, -16.0],
            [-5.0, -15.0],
            [-10.0, -14.0],
            [-15.0, -13.0],
            [-20.0, -11.0],
            [-25.0, -9.0],
            [-30.0, -5.0],

            /* CIUDAD DEL CABO */
            [-33.9249, 18.4241],

            /* ATLÁNTICO SUR (hacia Patagonia, rodeando Malvinas por el sur) */
            [-36.0, 17.0],
            [-39.0, 12.0],
            [-42.0, 5.0],
            [-45.0, -5.0],
            [-47.0, -15.0],
            [-49.0, -25.0],
            [-50.5, -35.0],
            [-51.5, -45.0],
            [-53.0, -55.0],
            [-54.0, -60.0],
            [-53.4, -65.5],
            [-52.6, -67.2],

            /* ESTRECHO DE MAGALLANES (trazado aproximado) */
            [-52.55, -68.4],
            [-52.57, -69.55],
            [-52.75, -70.55],
            [-53.2, -70.7],
            [-53.7, -71.0],
            [-54.0, -71.4],
            [-53.85, -72.0],
            [-53.55, -73.0],
            [-53.05, -73.9],
            [-52.7, -74.7],

            /* PACÍFICO SUR (costa de Chile, mar afuera) */
            [-52.6, -75.6],
            [-50.5, -77.0],
            [-46.0, -77.5],
            [-42.0, -76.0],
            [-38.0, -75.0],
            [-34.0, -73.5],
            [-30.0, -72.9],
            [-26.0, -72.5],
            [-22.0, -72.0],
            [-19.0, -71.2],

            /* ARICA */
            [-18.4783, -70.3126]
        ]
    },


    /* ---------------------------------------------------
       RUTA 3: Hamburgo → Santos → Nueva Palmira → Puerto Busch
       Elba → Mar del Norte → Canal de la Mancha → Atlántico →
       Santos → Río de la Plata → Paraná → Paraguay
    --------------------------------------------------- */
    ruta3: {
        nombre: "Ruta 3",
        descripcion: "Hamburgo → Santos → Nueva Palmira → Puerto Busch",
        puntos: [
            { nombre: "Puerto de Hamburgo", lat: 53.5461,  lng: 9.9662,   dia: 1,  tipo: "Origen" },
            { nombre: "Puerto de Santos",   lat: -23.9608, lng: -46.3339, dia: 40, tipo: "Intermedio" },
            { nombre: "Nueva Palmira",      lat: -33.8819, lng: -58.4161, dia: 65, tipo: "Intermedio" },
            { nombre: "Puerto Busch",       lat: -19.6833, lng: -57.8167, dia: 90, tipo: "Destino Final" }
        ],
        waypoints: [
            /* RÍO ELBA */
            [53.5461, 9.9662],
            [53.58, 9.75],
            [53.65, 9.5],
            [53.77, 9.3],
            [53.9, 9.0],
            [54.0, 8.4],

            /* MAR DEL NORTE */
            [54.55, 7.8],
            [54.3, 6.0],
            [53.7, 4.5],
            [52.5, 3.2],
            [51.7, 2.2],

            /* CANAL DE LA MANCHA */
            [51.0, 1.45],
            [50.2, 0.0],
            [50.1, -2.0],
            [49.8, -3.5],
            [49.3, -6.2],

            /* GOLFO DE VIZCAYA Y COSTA IBÉRICA */
            [47.5, -7.0],
            [45.0, -9.0],
            [42.5, -11.0],
            [39.0, -11.0],
            [36.0, -11.0],

            /* ATLÁNTICO NORTE (al oeste de Madeira y Canarias) */
            [33.0, -14.0],
            [29.0, -20.0],
            [24.0, -21.0],
            [19.0, -20.5],
            [15.0, -20.5],
            [10.0, -21.0],

            /* ATLÁNTICO SUR (mar afuera de Brasil) */
            [5.0, -22.0],
            [0.0, -26.0],
            [-5.0, -29.0],
            [-10.0, -31.0],
            [-15.0, -33.0],
            [-20.0, -34.0],
            [-23.5, -40.0],
            [-24.5, -44.0],
            [-24.7, -45.6],
            [-24.4, -46.1],

            /* SANTOS */
            [-23.9608, -46.3339],

            /* SANTOS → RÍO DE LA PLATA */
            [-25.5, -46.0],
            [-26.5, -46.5],
            [-28.5, -47.0],
            [-30.5, -48.5],
            [-33.0, -50.5],
            [-35.0, -53.0],
            [-35.5, -55.0],
            [-35.55, -56.0],
            [-35.0, -57.0],
            [-34.65, -57.85],
            [-34.4, -58.25],
            [-34.1, -58.3],

            /* NUEVA PALMIRA */
            [-33.8819, -58.4161],

            /* RÍO PARANÁ (trazado aproximado) */
            [-33.85, -58.75],
            [-33.70, -59.10],
            [-33.55, -59.60],
            [-33.33, -60.15],
            [-32.95, -60.62],
            [-31.7, -60.55],
            [-30.0, -59.6],
            [-29.1, -59.25],
            [-28.5, -59.0],
            [-27.47, -58.83],
            [-27.32, -58.62],

            /* RÍO PARAGUAY (trazado aproximado) */
            [-26.9, -58.35],
            [-26.2, -58.15],
            [-25.28, -57.63],
            [-24.3, -57.45],
            [-23.4, -57.43],
            [-22.15, -57.95],
            [-21.04, -57.87],
            [-20.23, -58.17],
            [-19.9, -57.95],

            /* PUERTO BUSCH */
            [-19.6833, -57.8167]
        ]
    }
};


/* =========================================================
   CLIMA (datos simulados por puerto)
========================================================= */

const CLIMA = {
    "Puerto de Miami":           { estado: "Parcialmente nublado", temperatura: "27 °C", icono: "🌤️" },
    "Canal de Panamá":           { estado: "Lluvias tropicales",   temperatura: "29 °C", icono: "🌧️" },
    "Puerto de Antofagasta":     { estado: "Despejado",            temperatura: "19 °C", icono: "☀️" },
    "Puerto de Shanghái":        { estado: "Nublado",              temperatura: "24 °C", icono: "☁️" },
    "Puerto de Singapur":        { estado: "Tormentas aisladas",   temperatura: "30 °C", icono: "⛈️" },
    "Canal de Suez":             { estado: "Despejado",            temperatura: "31 °C", icono: "☀️" },
    "Puerto de Ciudad del Cabo": { estado: "Parcialmente nublado", temperatura: "18 °C", icono: "🌤️" },
    "Estrecho de Magallanes":    { estado: "Vientos fuertes",      temperatura: "7 °C",  icono: "💨" },
    "Puerto de Arica":           { estado: "Despejado",            temperatura: "21 °C", icono: "☀️" },
    "Puerto de Santos":          { estado: "Lluvias moderadas",    temperatura: "25 °C", icono: "🌧️" },
    "Nueva Palmira":             { estado: "Parcialmente nublado", temperatura: "20 °C", icono: "🌤️" },
    "Puerto Busch":              { estado: "Cálido y despejado",   temperatura: "30 °C", icono: "☀️" },
    "Puerto de Hamburgo":        { estado: "Nublado",              temperatura: "14 °C", icono: "☁️" }
};
