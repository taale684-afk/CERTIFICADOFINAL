// scripts/reset-db.js
// Restablece la base de datos con los datos de ejemplo originales (data/solicitudes.json).
// Úsalo después de probar el reenvío para repetir la demostración: npm run reset-db
const path = require("path");
const fs = require("fs");
const { crearRepositorio } = require("../lib/repositorio");

const RUTA_BD = process.env.DB_PATH || path.join(__dirname, "..", "data", "poliseguimiento.db");
const semilla = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "data", "solicitudes.json"), "utf-8"));

const repositorio = crearRepositorio(RUTA_BD);
repositorio.reiniciar(semilla);
repositorio.cerrar();
console.log(`Base de datos restablecida con ${Object.keys(semilla).length} solicitudes de ejemplo: ${RUTA_BD}`);
