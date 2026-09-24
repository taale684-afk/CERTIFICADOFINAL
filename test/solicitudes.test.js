// test/solicitudes.test.js
// Ejecutar con: npm test
const assert = require("assert");
const { buscarSolicitud } = require("../lib/solicitudes");

const dataset = {
  "POL-2026-0417": {
    radicado: "POL-2026-0417",
    nombreCertificado: "Duplicado de diploma con apostilla",
    estado: "pendiente",
    areaActual: "Decanatura de Facultad",
  },
  "POL-2026-0512": {
    radicado: "POL-2026-0512",
    nombreCertificado: "Certificación especial de continuidad académica",
    estado: "trasladada",
    areaActual: "Legalizaciones (Apostilla)",
  },
};

// Caso principal: radicado válido y existente -> devuelve la solicitud
(function casoPrincipal() {
  const r = buscarSolicitud("POL-2026-0417", dataset);
  assert.strictEqual(r.ok, true);
  assert.strictEqual(r.codigo, 200);
  assert.strictEqual(r.solicitud.estado, "pendiente");
  console.log("OK - caso principal (radicado válido y existente)");
})();

// Caso alternativo: radicado válido en minúsculas -> se normaliza y encuentra
(function casoAlternativo() {
  const r = buscarSolicitud("pol-2026-0512", dataset);
  assert.strictEqual(r.ok, true);
  assert.strictEqual(r.solicitud.estado, "trasladada");
  console.log("OK - caso alternativo (radicado en minúsculas se normaliza)");
})();

// Caso de error 1: formato de radicado inválido
(function casoErrorFormato() {
  const r = buscarSolicitud("ABC-123", dataset);
  assert.strictEqual(r.ok, false);
  assert.strictEqual(r.codigo, 400);
  assert.strictEqual(r.error, "formato_invalido");
  console.log("OK - caso de error (formato de radicado inválido)");
})();

// Caso de error 2: radicado con formato válido pero inexistente
(function casoErrorNoEncontrada() {
  const r = buscarSolicitud("POL-2026-9999", dataset);
  assert.strictEqual(r.ok, false);
  assert.strictEqual(r.codigo, 404);
  assert.strictEqual(r.error, "no_encontrada");
  console.log("OK - caso de error (radicado no encontrado)");
})();

console.log("\nTodas las pruebas pasaron correctamente.");
