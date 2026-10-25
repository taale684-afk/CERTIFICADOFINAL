// server.js
// Punto de arranque: crea la base de datos, la llena con los datos de ejemplo la
// primera vez y levanta el servidor. Las rutas viven en lib/app.js.
const path = require("path");
const fs = require("fs");
const { crearRepositorio } = require("./lib/repositorio");
const { crearApp } = require("./lib/app");
const { obtenerFechaReferencia } = require("./lib/config");
const { formatoISO } = require("./lib/tiempos");

const PORT = process.env.PORT || 3000;
const RUTA_BD = process.env.DB_PATH || path.join(__dirname, "data", "poliseguimiento.db");
const RUTA_SEMILLA = path.join(__dirname, "data", "solicitudes.json");

const repositorio = crearRepositorio(RUTA_BD);
if (repositorio.estaVacio()) {
  repositorio.sembrar(JSON.parse(fs.readFileSync(RUTA_SEMILLA, "utf-8")));
  console.log(`Base de datos creada con ${repositorio.contar()} solicitudes de ejemplo.`);
}

const { fecha, simulada } = obtenerFechaReferencia();
const app = crearApp({
  repositorio,
  fechaReferencia: fecha,
  fechaSimulada: simulada,
  carpetaPublica: path.join(__dirname, "public"),
});

app.listen(PORT, () => {
  console.log(`PoliSeguimiento API escuchando en http://localhost:${PORT}`);
  console.log(simulada ? `Modo demostración: fecha simulada ${formatoISO(fecha)}` : "Fecha de referencia: hoy");
});
