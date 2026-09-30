// test/solicitudes.test.js
// Ejecutar con: npm test
const assert = require("assert");
const { buscarSolicitud } = require("../lib/solicitudes");
const { evaluarTiempo, diasHabilesEntre } = require("../lib/tiempos");

const dataset = {
  "POL-2026-0417": {
    radicado: "POL-2026-0417",
    nombreCertificado: "Copia Diploma de Grado",
    costo: "$97.200",
    estado: "pendiente",
    areaActual: "Decanatura de Facultad",
    fechaRadicacion: "2026-08-03",
    diasHabilesEsperados: 8,
    historial: [
      { area: "Registro y Control Académico", fecha: "2026-08-12", accion: "Solicitud radicada" },
      { area: "Tesorería", fecha: "2026-08-13", accion: "Pago de $97.200 verificado" },
      { area: "Decanatura de Facultad", fecha: "2026-08-14", accion: "En revisión — pendiente de documento" },
    ],
  },
  "POL-2026-0512": {
    radicado: "POL-2026-0512",
    nombreCertificado: "Certificado de Notas General - Firma Original",
    costo: "$93.400",
    estado: "trasladada",
    areaActual: "Legalizaciones (Apostilla)",
    fechaRadicacion: "2026-08-05",
    diasHabilesEsperados: 5,
    historial: [
      { area: "Registro y Control Académico", fecha: "2026-08-05", accion: "Solicitud radicada" },
      { area: "Legalizaciones (Apostilla)", fecha: "2026-08-10", accion: "Trasladada para legalización internacional" },
    ],
  },
  "POL-2026-0603": {
    radicado: "POL-2026-0603",
    nombreCertificado: "Certificado de Notas por Periodo - Firma Original",
    costo: "$27.800",
    estado: "en revision",
    areaActual: "Registro y Control Académico",
    fechaRadicacion: "2026-09-28",
    diasHabilesEsperados: 5,
    historial: [
      { area: "Registro y Control Académico", fecha: "2026-09-28", accion: "Solicitud radicada" },
      { area: "Tesorería", fecha: "2026-09-29", accion: "Pago de $27.800 verificado" },
      { area: "Registro y Control Académico", fecha: "2026-09-30", accion: "En revisión — dentro del tiempo esperado" },
    ],
  },
};

// Caso principal: radicado válido y existente -> devuelve la solicitud con su historial y su tiempo
(function casoPrincipal() {
  const fechaReferencia = new Date("2026-08-17T00:00:00"); // 10 días hábiles después del 2026-08-03
  const r = buscarSolicitud("POL-2026-0417", dataset, fechaReferencia);
  assert.strictEqual(r.ok, true);
  assert.strictEqual(r.codigo, 200);
  assert.strictEqual(r.solicitud.estado, "pendiente");
  assert.ok(Array.isArray(r.solicitud.historial), "debe incluir un arreglo de historial");
  assert.strictEqual(r.solicitud.historial.length, 3);
  console.log("OK - caso principal (radicado válido, existente y con historial)");
})();

// Ventana de tiempos — ejemplo exacto pedido por el docente: se esperan 8 días
// hábiles y la solicitud lleva 10 -> debe marcarse como retrasada.
(function ventanaDeTiemposConAlerta() {
  const fechaReferencia = new Date("2026-08-17T00:00:00"); // 10 días hábiles después del 2026-08-03
  const r = buscarSolicitud("POL-2026-0417", dataset, fechaReferencia);
  assert.strictEqual(r.solicitud.tiempo.diasHabilesTranscurridos, 10);
  assert.strictEqual(r.solicitud.tiempo.diasHabilesEsperados, 8);
  assert.strictEqual(r.solicitud.tiempo.retrasada, true);
  console.log("OK - ventana de tiempos (8 días esperados, 10 transcurridos -> alerta activada)");
})();

// Ventana de tiempos — dentro del plazo: no debe activarse la alerta.
(function ventanaDeTiemposSinAlerta() {
  const fechaReferencia = new Date("2026-08-10T00:00:00"); // 5 días hábiles después del 2026-08-03
  const r = buscarSolicitud("POL-2026-0417", dataset, fechaReferencia);
  assert.strictEqual(r.solicitud.tiempo.diasHabilesTranscurridos, 5);
  assert.strictEqual(r.solicitud.tiempo.retrasada, false);
  console.log("OK - ventana de tiempos (dentro del plazo, sin alerta)");
})();

// Radicado nuevo y dentro del plazo: no debe mostrar la alerta de retraso.
(function radicadoDentroDelPlazo() {
  const fechaReferencia = new Date("2026-09-30T00:00:00"); // 2 días hábiles después del 2026-09-28
  const r = buscarSolicitud("POL-2026-0603", dataset, fechaReferencia);
  assert.strictEqual(r.ok, true);
  assert.strictEqual(r.solicitud.estado, "en revision");
  assert.strictEqual(r.solicitud.tiempo.diasHabilesTranscurridos, 2);
  assert.strictEqual(r.solicitud.tiempo.diasHabilesEsperados, 5);
  assert.strictEqual(r.solicitud.tiempo.retrasada, false);
  console.log("OK - radicado POL-2026-0603 dentro del plazo (sin alerta)");
})();

// diasHabilesEntre no debe contar sábados ni domingos.
(function conteoExcluyeFinesDeSemana() {
  const inicio = new Date("2026-08-03T00:00:00"); // lunes
  const fin = new Date("2026-08-10T00:00:00"); // lunes siguiente (incluye un fin de semana)
  const dias = diasHabilesEntre(inicio, fin);
  assert.strictEqual(dias, 5);
  console.log("OK - el conteo de días hábiles excluye sábados y domingos");
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
