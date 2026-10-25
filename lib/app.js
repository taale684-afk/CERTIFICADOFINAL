// lib/app.js
// Rutas de la API REST. Recibe sus dependencias (repositorio, fecha de referencia)
// en lugar de crearlas, para poder probar la API completa sin abrir un puerto fijo.
const express = require("express");
const { buscarSolicitud, reenviarDocumento } = require("./solicitudes");
const { formatoISO } = require("./tiempos");

const MENSAJES = {
  formato_invalido: "El número de radicado debe tener el formato POL-AAAA-NNNN.",
  no_encontrada: "No encontramos una solicitud con ese número de radicado.",
  archivo_requerido: "Debes indicar el nombre del archivo que vas a reenviar.",
};

function crearApp({ repositorio, fechaReferencia, fechaSimulada = false, carpetaPublica }) {
  const app = express();

  // Cada respuesta indica contra qué fecha se calculó el tiempo, para que una fecha simulada nunca pase desapercibida.
  function conReferencia(solicitud) {
    solicitud.tiempo.fechaReferencia = formatoISO(fechaReferencia);
    solicitud.tiempo.simulada = fechaSimulada;
    return solicitud;
  }

  function mensajeDeError(resultado) {
    if (resultado.error === "estado_no_permite_reenvio") {
      return `Esta solicitud está "${resultado.estadoActual}" y no admite reenvío de documentos en este momento.`;
    }
    return MENSAJES[resultado.error];
  }

  if (carpetaPublica) app.use(express.static(carpetaPublica));
  app.use(express.json());

  // GET /api/solicitudes/:radicado
  app.get("/api/solicitudes/:radicado", (req, res) => {
    const id = String(req.params.radicado).toUpperCase();
    const solicitud = repositorio.obtener(id);
    const resultado = buscarSolicitud(id, solicitud ? { [id]: solicitud } : {}, fechaReferencia);

    if (!resultado.ok) {
      return res.status(resultado.codigo).json({ error: resultado.error, mensaje: mensajeDeError(resultado) });
    }
    return res.status(200).json(conReferencia(resultado.solicitud));
  });

  // POST /api/solicitudes/:radicado/reenvio
  // Caso de uso: reenviar un documento para resolver una modificación especial.
  // Leer, validar y guardar ocurren en una sola transacción de base de datos.
  app.post("/api/solicitudes/:radicado/reenvio", (req, res) => {
    const id = String(req.params.radicado).toUpperCase();
    const nombreArchivo = req.body && req.body.nombreArchivo;

    const resultado = repositorio.transaccion(() => {
      const solicitud = repositorio.obtener(id);
      const r = reenviarDocumento(id, nombreArchivo, solicitud ? { [id]: solicitud } : {}, fechaReferencia);
      if (r.ok) repositorio.guardar(solicitud); // el servicio modificó "solicitud" (estado e historial)
      return r;
    });

    if (!resultado.ok) {
      return res.status(resultado.codigo).json({ error: resultado.error, mensaje: mensajeDeError(resultado) });
    }
    return res.status(200).json(conReferencia(resultado.solicitud));
  });

  return app;
}

module.exports = { crearApp };
