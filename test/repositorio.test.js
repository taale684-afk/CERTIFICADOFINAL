// test/repositorio.test.js
// Pruebas de la capa de persistencia (SQLite). Ejecutar con: npm test
const assert = require("assert");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { crearRepositorio } = require("../lib/repositorio");
const { reenviarDocumento } = require("../lib/solicitudes");

const semilla = require("../data/solicitudes.json");
const TOTAL = Object.keys(semilla).length;

// La base se llena con los datos de ejemplo y reproduce cada solicitud con su historial en orden.
(function sembrarYObtener() {
  const repo = crearRepositorio(":memory:");
  assert.strictEqual(repo.estaVacio(), true);
  repo.sembrar(semilla);
  assert.strictEqual(repo.estaVacio(), false);
  assert.strictEqual(repo.contar(), TOTAL);
  const s = repo.obtener("POL-2026-0417");
  assert.strictEqual(s.nombreCertificado, "Copia Diploma de Grado");
  assert.strictEqual(s.diasHabilesEsperados, 8);
  assert.deepStrictEqual(s.historial, semilla["POL-2026-0417"].historial);
  repo.cerrar();
  console.log(`OK - la base se llena con ${TOTAL} solicitudes y conserva el orden del historial`);
})();

// Un radicado que no existe devuelve undefined (no lanza error).
(function obtenerInexistente() {
  const repo = crearRepositorio(":memory:");
  repo.sembrar(semilla);
  assert.strictEqual(repo.obtener("POL-2026-9999"), undefined);
  repo.cerrar();
  console.log("OK - consultar un radicado inexistente devuelve undefined");
})();

// El reenvío cambia el estado y agrega un movimiento, y los datos sobreviven al cerrar y volver a abrir la base.
(function persisteDespuesDeReabrir() {
  const archivo = path.join(fs.mkdtempSync(path.join(os.tmpdir(), "poliseg-")), "prueba.db");
  let repo = crearRepositorio(archivo);
  repo.sembrar(semilla);

  const s = repo.obtener("POL-2026-0417");
  const r = reenviarDocumento("POL-2026-0417", "cedula.pdf", { "POL-2026-0417": s }, new Date(2026, 9, 2, 12));
  assert.strictEqual(r.ok, true);
  repo.guardar(s);
  repo.cerrar();

  repo = crearRepositorio(archivo); // se abre de nuevo el archivo, como si se reiniciara el servidor
  const despues = repo.obtener("POL-2026-0417");
  assert.strictEqual(despues.estado, "en revision");
  assert.strictEqual(despues.historial.length, semilla["POL-2026-0417"].historial.length + 1);
  assert.ok(despues.historial.at(-1).accion.includes("cedula.pdf"));
  repo.cerrar();
  fs.rmSync(path.dirname(archivo), { recursive: true, force: true });
  console.log("OK - el reenvío persiste: los datos siguen ahí después de cerrar y reabrir la base");
})();

// Guardar dos veces la misma solicitud no duplica los movimientos del historial.
(function guardarNoDuplicaHistorial() {
  const repo = crearRepositorio(":memory:");
  repo.sembrar(semilla);
  const s = repo.obtener("POL-2026-0512");
  repo.guardar(s);
  repo.guardar(s);
  assert.strictEqual(repo.obtener("POL-2026-0512").historial.length, semilla["POL-2026-0512"].historial.length);
  repo.cerrar();
  console.log("OK - guardar repetidamente no duplica los movimientos del historial");
})();

// La base rechaza estados que no existen (restricción CHECK).
(function rechazaEstadoInvalido() {
  const repo = crearRepositorio(":memory:");
  repo.sembrar(semilla);
  const s = repo.obtener("POL-2026-0417");
  s.estado = "inventado";
  assert.throws(() => repo.guardar(s), /CHECK constraint failed/);
  assert.strictEqual(repo.obtener("POL-2026-0417").estado, "pendiente"); // no quedó nada a medias
  repo.cerrar();
  console.log("OK - la base rechaza un estado inválido y no deja cambios a medias");
})();

// reiniciar devuelve la base a los datos de ejemplo originales.
(function reiniciarRestauraLaSemilla() {
  const repo = crearRepositorio(":memory:");
  repo.sembrar(semilla);
  const s = repo.obtener("POL-2026-0417");
  reenviarDocumento("POL-2026-0417", "otro.pdf", { "POL-2026-0417": s }, new Date(2026, 9, 2, 12));
  repo.guardar(s);
  assert.strictEqual(repo.obtener("POL-2026-0417").estado, "en revision");
  repo.reiniciar(semilla);
  assert.strictEqual(repo.obtener("POL-2026-0417").estado, "pendiente");
  assert.strictEqual(repo.contar(), TOTAL);
  repo.cerrar();
  console.log("OK - reiniciar restaura los datos de ejemplo originales");
})();
