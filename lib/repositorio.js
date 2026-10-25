// lib/repositorio.js
// Capa de persistencia: guarda las solicitudes y su historial en SQLite.
// El resto de la aplicación no conoce SQL: pide y entrega objetos con la misma
// forma que antes tenía el archivo JSON (radicado, estado, historial, etc.).
const fs = require("fs");
const path = require("path");
const Database = require("better-sqlite3");

const ESQUEMA = `
CREATE TABLE IF NOT EXISTS solicitudes (
  radicado               TEXT PRIMARY KEY,
  nombre_certificado     TEXT NOT NULL,
  costo                  TEXT NOT NULL,
  estado                 TEXT NOT NULL CHECK (estado IN ('pendiente', 'en revision', 'trasladada')),
  area_actual            TEXT NOT NULL,
  descripcion_area       TEXT NOT NULL,
  fecha_radicacion       TEXT NOT NULL,
  dias_habiles_esperados INTEGER NOT NULL CHECK (dias_habiles_esperados > 0)
);

CREATE TABLE IF NOT EXISTS movimientos (
  id       INTEGER PRIMARY KEY AUTOINCREMENT,
  radicado TEXT NOT NULL REFERENCES solicitudes (radicado) ON DELETE CASCADE,
  area     TEXT NOT NULL,
  fecha    TEXT NOT NULL,
  accion   TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_movimientos_radicado ON movimientos (radicado, id);
`;

function crearRepositorio(ruta = ":memory:") {
  if (ruta !== ":memory:") fs.mkdirSync(path.dirname(ruta), { recursive: true });

  const db = new Database(ruta);
  db.pragma("foreign_keys = ON");
  db.exec(ESQUEMA);

  const selSolicitud = db.prepare("SELECT * FROM solicitudes WHERE radicado = ?");
  const selMovimientos = db.prepare("SELECT area, fecha, accion FROM movimientos WHERE radicado = ? ORDER BY id");
  const contarMovimientos = db.prepare("SELECT COUNT(*) AS n FROM movimientos WHERE radicado = ?");
  const contarSolicitudes = db.prepare("SELECT COUNT(*) AS n FROM solicitudes");
  const insMovimiento = db.prepare("INSERT INTO movimientos (radicado, area, fecha, accion) VALUES (?, ?, ?, ?)");
  const upsertSolicitud = db.prepare(`
    INSERT INTO solicitudes
      (radicado, nombre_certificado, costo, estado, area_actual, descripcion_area, fecha_radicacion, dias_habiles_esperados)
    VALUES
      (@radicado, @nombre_certificado, @costo, @estado, @area_actual, @descripcion_area, @fecha_radicacion, @dias_habiles_esperados)
    ON CONFLICT (radicado) DO UPDATE SET
      nombre_certificado     = excluded.nombre_certificado,
      costo                  = excluded.costo,
      estado                 = excluded.estado,
      area_actual            = excluded.area_actual,
      descripcion_area       = excluded.descripcion_area,
      fecha_radicacion       = excluded.fecha_radicacion,
      dias_habiles_esperados = excluded.dias_habiles_esperados
  `);

  // Devuelve la solicitud con la misma forma que usa el servicio de negocio, o undefined si no existe.
  function obtener(radicado) {
    const fila = selSolicitud.get(radicado);
    if (!fila) return undefined;
    return {
      radicado: fila.radicado,
      nombreCertificado: fila.nombre_certificado,
      costo: fila.costo,
      estado: fila.estado,
      areaActual: fila.area_actual,
      descripcionArea: fila.descripcion_area,
      fechaRadicacion: fila.fecha_radicacion,
      diasHabilesEsperados: fila.dias_habiles_esperados,
      historial: selMovimientos.all(radicado),
    };
  }

  // Inserta o actualiza la solicitud y agrega solo los movimientos nuevos del historial.
  // Todo ocurre en una transacción: o se guarda completo, o no se guarda nada.
  const guardar = db.transaction((s) => {
    upsertSolicitud.run({
      radicado: s.radicado,
      nombre_certificado: s.nombreCertificado,
      costo: s.costo,
      estado: s.estado,
      area_actual: s.areaActual,
      descripcion_area: s.descripcionArea,
      fecha_radicacion: s.fechaRadicacion,
      dias_habiles_esperados: s.diasHabilesEsperados,
    });
    const existentes = contarMovimientos.get(s.radicado).n;
    for (const m of s.historial.slice(existentes)) {
      insMovimiento.run(s.radicado, m.area, m.fecha, m.accion);
    }
  });

  const estaVacio = () => contarSolicitudes.get().n === 0;

  // "semilla" es un objeto cuyas claves son radicados (el formato de data/solicitudes.json).
  const sembrar = db.transaction((semilla) => {
    for (const s of Object.values(semilla)) guardar(s);
  });

  const reiniciar = db.transaction((semilla) => {
    db.exec("DELETE FROM movimientos; DELETE FROM solicitudes;");
    sembrar(semilla);
  });

  const transaccion = (fn) => db.transaction(fn)();

  return {
    obtener,
    guardar,
    estaVacio,
    sembrar,
    reiniciar,
    transaccion,
    contar: () => contarSolicitudes.get().n,
    cerrar: () => db.close(),
  };
}

module.exports = { crearRepositorio };
