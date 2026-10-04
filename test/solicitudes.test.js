// test/solicitudes.test.js
// Ejecutar con: npm test
const assert = require("assert");
const { buscarSolicitud, reenviarDocumento } = require("../lib/solicitudes");
const { evaluarTiempo, diasHabilesEntre, esFestivoColombia } = require("../lib/tiempos");

const dataset = {
  "POL-2026-0417": {
    radicado: "POL-2026-0417",
    nombreCertificado: "Copia Diploma de Grado",
    costo: "$97.200",
    estado: "pendiente",
    areaActual: "Decanatura de Facultad",
    fechaRadicacion: "2026-09-07", // lunes sin festivos cerca, para aislar el ejemplo del docente
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
  const fechaReferencia = new Date("2026-09-21T00:00:00"); // 10 días hábiles después del 2026-09-07
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
  const fechaReferencia = new Date("2026-09-21T00:00:00"); // 10 días hábiles después del 2026-09-07 (sin festivos de por medio)
  const r = buscarSolicitud("POL-2026-0417", dataset, fechaReferencia);
  assert.strictEqual(r.solicitud.tiempo.diasHabilesTranscurridos, 10);
  assert.strictEqual(r.solicitud.tiempo.diasHabilesEsperados, 8);
  assert.strictEqual(r.solicitud.tiempo.retrasada, true);
  console.log("OK - ventana de tiempos (8 días esperados, 10 transcurridos -> alerta activada)");
})();

// Ventana de tiempos — dentro del plazo: no debe activarse la alerta.
(function ventanaDeTiemposSinAlerta() {
  const fechaReferencia = new Date("2026-09-14T00:00:00"); // 5 días hábiles después del 2026-09-07
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
  const inicio = new Date("2026-09-07T00:00:00"); // lunes
  const fin = new Date("2026-09-14T00:00:00"); // lunes siguiente (incluye un fin de semana)
  const dias = diasHabilesEntre(inicio, fin);
  assert.strictEqual(dias, 5);
  console.log("OK - el conteo de días hábiles excluye sábados y domingos");
})();

// diasHabilesEntre tampoco debe contar festivos colombianos (ej. 12 de octubre,
// Día de la Raza, que en 2026 cae lunes).
(function conteoExcluyeFestivosColombianos() {
  const inicio = new Date("2026-10-09T00:00:00"); // viernes
  const fin = new Date("2026-10-13T00:00:00"); // martes (incluye sáb, dom y el festivo del lunes)
  const dias = diasHabilesEntre(inicio, fin);
  assert.strictEqual(dias, 1); // solo cuenta el martes 13
  console.log("OK - el conteo de días hábiles excluye festivos colombianos (12 de octubre)");
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

// Catálogo ampliado: un certificado ICETEX trasladado debe reportar el área correcta.
(function catalogoAmpliadoIcetexTrasladado() {
  const dataset2 = { "POL-2026-0702": {
    radicado: "POL-2026-0702",
    nombreCertificado: "Certificado ICETEX - Giro Adicional por Carga Académica",
    costo: "$13.700",
    estado: "trasladada",
    areaActual: "ICETEX (Gestión Financiera)",
    fechaRadicacion: "2026-09-29",
    diasHabilesEsperados: 5,
    historial: [
      { area: "Registro y Control Académico", fecha: "2026-09-29", accion: "Solicitud radicada" },
      { area: "ICETEX (Gestión Financiera)", fecha: "2026-10-01", accion: "Trasladada para confirmar carga académica" },
    ],
  }};
  const r = buscarSolicitud("POL-2026-0702", dataset2);
  assert.strictEqual(r.ok, true);
  assert.strictEqual(r.solicitud.estado, "trasladada");
  assert.strictEqual(r.solicitud.areaActual, "ICETEX (Gestión Financiera)");
  console.log("OK - catálogo ampliado: certificado ICETEX trasladado");
})();

// Catálogo ampliado: Copia Acta de Grado (8 días esperados) marcada como retrasada con fecha de referencia fija.
(function catalogoAmpliadoActaDeGradoRetrasada() {
  const dataset3 = { "POL-2026-0707": {
    radicado: "POL-2026-0707",
    nombreCertificado: "Copia Acta de Grado",
    costo: "$47.700",
    estado: "trasladada",
    areaActual: "Legalizaciones (Apostilla)",
    fechaRadicacion: "2026-08-20",
    diasHabilesEsperados: 8,
    historial: [{ area: "Registro y Control Académico", fecha: "2026-08-20", accion: "Solicitud radicada" }],
  }};
  const fechaReferencia = new Date("2026-09-03T00:00:00"); // bastante más de 8 días hábiles después
  const r = buscarSolicitud("POL-2026-0707", dataset3, fechaReferencia);
  assert.strictEqual(r.solicitud.tiempo.retrasada, true);
  console.log("OK - catálogo ampliado: Copia Acta de Grado marcada como retrasada");
})();

// Reenvío de documento — caso principal: solicitud "pendiente" pasa a "en revision"
// y queda registrado un nuevo movimiento en el historial.
(function reenvioCasoPrincipal() {
  const datasetReenvio = {
    "POL-2026-0417": {
      radicado: "POL-2026-0417",
      estado: "pendiente",
      areaActual: "Decanatura de Facultad",
      fechaRadicacion: "2026-08-12",
      diasHabilesEsperados: 8,
      historial: [{ area: "Registro y Control Académico", fecha: "2026-08-12", accion: "Solicitud radicada" }],
    },
  };
  const r = reenviarDocumento("POL-2026-0417", "cedula_corregida.pdf", datasetReenvio, new Date("2026-08-20T00:00:00"));
  assert.strictEqual(r.ok, true);
  assert.strictEqual(r.solicitud.estado, "en revision");
  assert.strictEqual(r.solicitud.historial.length, 2);
  assert.ok(r.solicitud.historial[1].accion.includes("cedula_corregida.pdf"));
  console.log("OK - reenvío de documento (caso principal: pendiente -> en revision)");
})();

// Reenvío de documento — caso de error: una solicitud "trasladada" no admite reenvío.
(function reenvioCasoError() {
  const datasetReenvio = {
    "POL-2026-0512": {
      radicado: "POL-2026-0512",
      estado: "trasladada",
      areaActual: "Legalizaciones (Apostilla)",
      fechaRadicacion: "2026-08-05",
      diasHabilesEsperados: 5,
      historial: [],
    },
  };
  const r = reenviarDocumento("POL-2026-0512", "documento.pdf", datasetReenvio);
  assert.strictEqual(r.ok, false);
  assert.strictEqual(r.codigo, 409);
  assert.strictEqual(r.error, "estado_no_permite_reenvio");
  assert.strictEqual(r.estadoActual, "trasladada");
  console.log("OK - reenvío de documento (caso de error: estado trasladada lo rechaza)");
})();

// Reenvío de documento — caso de error: falta el nombre del archivo.
(function reenvioSinArchivo() {
  const datasetReenvio = {
    "POL-2026-0417": { radicado: "POL-2026-0417", estado: "pendiente", areaActual: "Decanatura de Facultad", historial: [] },
  };
  const r = reenviarDocumento("POL-2026-0417", "", datasetReenvio);
  assert.strictEqual(r.ok, false);
  assert.strictEqual(r.codigo, 400);
  assert.strictEqual(r.error, "archivo_requerido");
  console.log("OK - reenvío de documento (caso de error: falta el archivo)");
})();

// esFestivoColombia debe reconocer el festivo y rechazar un día cercano que no lo es.
(function identificaFestivoColombiano() {
  assert.strictEqual(esFestivoColombia(new Date("2026-10-12T00:00:00")), true); // Día de la Raza
  assert.strictEqual(esFestivoColombia(new Date("2026-10-13T00:00:00")), false); // martes normal
  console.log("OK - esFestivoColombia identifica correctamente el 12 de octubre de 2026");
})();

console.log("\nTodas las pruebas pasaron correctamente.");
