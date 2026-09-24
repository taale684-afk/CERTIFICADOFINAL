// server.js
// API REST del Incremento 1: consulta de estado de una solicitud por radicado.
const express = require("express");
const path = require("path");
const fs = require("fs");
const { buscarSolicitud } = require("./lib/solicitudes");

const app = express();
const PORT = process.env.PORT || 3000;

function cargarSolicitudes() {
  const raw = fs.readFileSync(path.join(__dirname, "data", "solicitudes.json"), "utf-8");
  return JSON.parse(raw);
}

// Sirve el frontend estático
app.use(express.static(path.join(__dirname, "public")));

// GET /api/solicitudes/:radicado
app.get("/api/solicitudes/:radicado", (req, res) => {
  const dataset = cargarSolicitudes();
  const resultado = buscarSolicitud(req.params.radicado, dataset);

  if (!resultado.ok) {
    const mensajes = {
      formato_invalido: "El número de radicado debe tener el formato POL-AAAA-NNNN.",
      no_encontrada: "No encontramos una solicitud con ese número de radicado.",
    };
    return res.status(resultado.codigo).json({
      error: resultado.error,
      mensaje: mensajes[resultado.error],
    });
  }

  return res.status(200).json(resultado.solicitud);
});

app.listen(PORT, () => {
  console.log(`PoliSeguimiento API escuchando en http://localhost:${PORT}`);
});

