// test/api.test.js
// Pruebas de la API completa (rutas + servicio + base de datos) sin abrir un puerto fijo.
// Verifican de punta a punta el flujo vertical: consultar, reenviar, guardar y volver a consultar.
const assert = require("assert");
const { crearRepositorio } = require("../lib/repositorio");
const { crearApp } = require("../lib/app");

const semilla = require("../data/solicitudes.json");
const FECHA_DEMO = new Date("2026-10-02T12:00:00");

async function conServidor(prueba) {
  const repositorio = crearRepositorio(":memory:");
  repositorio.sembrar(semilla);
  const app = crearApp({ repositorio, fechaReferencia: FECHA_DEMO, fechaSimulada: true });
  const servidor = app.listen(0);
  const base = `http://localhost:${servidor.address().port}`;
  try {
    await prueba(base);
  } finally {
    servidor.close();
    repositorio.cerrar();
  }
}
const post = (url, cuerpo) =>
  fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(cuerpo) });

(async () => {
  await conServidor(async (base) => {
    // Consulta de una solicitud retrasada: estado, historial, tiempo y aviso de fecha simulada.
    const r = await fetch(`${base}/api/solicitudes/POL-2026-0417`);
    assert.strictEqual(r.status, 200);
    const d = await r.json();
    assert.strictEqual(d.estado, "pendiente");
    assert.strictEqual(d.historial.length, 3);
    assert.strictEqual(d.tiempo.retrasada, true);
    assert.strictEqual(d.tiempo.simulada, true);
    assert.strictEqual(d.tiempo.fechaReferencia, "2026-10-02");
    console.log("OK - API: consulta una solicitud retrasada con su historial y la fecha simulada");

    // Consulta de una solicitud dentro del plazo.
    const d2 = await (await fetch(`${base}/api/solicitudes/pol-2026-0603`)).json(); // en minúsculas
    assert.strictEqual(d2.tiempo.retrasada, false);
    assert.strictEqual(d2.tiempo.diasHabilesTranscurridos, 4);
    console.log("OK - API: consulta una solicitud dentro del plazo (y normaliza las minúsculas)");

    // Errores de consulta.
    assert.strictEqual((await fetch(`${base}/api/solicitudes/POL-2026-9999`)).status, 404);
    assert.strictEqual((await fetch(`${base}/api/solicitudes/abc`)).status, 400);
    console.log("OK - API: responde 404 si no existe y 400 si el formato es inválido");
  });

  await conServidor(async (base) => {
    // Flujo vertical completo: reenviar, ver el resultado y comprobar que quedó guardado.
    const r = await post(`${base}/api/solicitudes/POL-2026-0417/reenvio`, { nombreArchivo: "cedula_corregida.pdf" });
    assert.strictEqual(r.status, 200);
    const reenviada = await r.json();
    assert.strictEqual(reenviada.estado, "en revision");
    assert.strictEqual(reenviada.historial.length, 4);

    const consulta = await (await fetch(`${base}/api/solicitudes/POL-2026-0417`)).json();
    assert.strictEqual(consulta.estado, "en revision");
    assert.ok(consulta.historial.at(-1).accion.includes("cedula_corregida.pdf"));
    assert.strictEqual(consulta.historial.at(-1).fecha, "2026-10-02");
    console.log("OK - API: el reenvío cambia el estado, agrega el movimiento y queda guardado en la base");

    // Un segundo reenvío ya no se admite: la solicitud dejó de estar pendiente.
    const otra = await post(`${base}/api/solicitudes/POL-2026-0417/reenvio`, { nombreArchivo: "otra.pdf" });
    assert.strictEqual(otra.status, 409);
    console.log("OK - API: un segundo reenvío se rechaza con 409 porque ya no está pendiente");
  });

  await conServidor(async (base) => {
    // Reglas de rechazo del reenvío.
    const trasladada = await post(`${base}/api/solicitudes/POL-2026-0512/reenvio`, { nombreArchivo: "doc.pdf" });
    assert.strictEqual(trasladada.status, 409);
    assert.match((await trasladada.json()).mensaje, /trasladada/);

    assert.strictEqual((await post(`${base}/api/solicitudes/POL-2026-0417/reenvio`, {})).status, 400); // sin archivo
    assert.strictEqual((await post(`${base}/api/solicitudes/POL-2026-9999/reenvio`, { nombreArchivo: "x.pdf" })).status, 404);

    const intacta = await (await fetch(`${base}/api/solicitudes/POL-2026-0512`)).json();
    assert.strictEqual(intacta.estado, "trasladada"); // un rechazo no modifica nada
    console.log("OK - API: el reenvío se rechaza (409, 400 y 404) sin modificar los datos");
  });

  console.log("\nTodas las pruebas de la API pasaron correctamente.");
})().catch((e) => { console.error(e); process.exit(1); });
