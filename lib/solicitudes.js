// lib/solicitudes.js
const { evaluarTiempo } = require("./tiempos");

// Regla esencial: el radicado debe seguir el formato POL-AAAA-NNNN
const RADICADO_REGEX = /^POL-\d{4}-\d{4}$/;

function esRadicadoValido(radicado) {
  return RADICADO_REGEX.test(radicado);
}

function buscarSolicitud(radicado, dataset, fechaReferencia = new Date()) {
  const normalizado = (radicado || "").toUpperCase();
  if (!esRadicadoValido(normalizado)) {
    return { ok: false, codigo: 400, error: "formato_invalido" };
  }
  const solicitud = dataset[normalizado];
  if (!solicitud) {
    return { ok: false, codigo: 404, error: "no_encontrada" };
  }

  const tiempo = evaluarTiempo(
    solicitud.fechaRadicacion,
    solicitud.diasHabilesEsperados,
    fechaReferencia
  );

  return { ok: true, codigo: 200, solicitud: { ...solicitud, tiempo } };
}

module.exports = { esRadicadoValido, buscarSolicitud, RADICADO_REGEX };
