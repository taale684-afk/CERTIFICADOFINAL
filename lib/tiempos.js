// lib/tiempos.js
// Calcula días hábiles transcurridos desde la radicación y determina si la
// solicitud superó el tiempo esperado de entrega (regla pedida por el docente:
// ej. se esperan 8 días hábiles y la solicitud lleva 10 -> debe alertar).

function esDiaHabil(fecha) {
  const dia = fecha.getDay(); // 0 = domingo, 6 = sábado
  return dia !== 0 && dia !== 6;
}

// Cuenta los días hábiles estrictamente posteriores a "inicio" y hasta "fin" (inclusive).
function diasHabilesEntre(inicio, fin) {
  let contador = 0;
  const cursor = new Date(inicio);
  cursor.setHours(0, 0, 0, 0);
  const limite = new Date(fin);
  limite.setHours(0, 0, 0, 0);

  cursor.setDate(cursor.getDate() + 1);
  while (cursor <= limite) {
    if (esDiaHabil(cursor)) contador++;
    cursor.setDate(cursor.getDate() + 1);
  }
  return contador;
}

// fechaRadicacion: string "AAAA-MM-DD"; fechaReferencia: Date (por defecto, hoy).
function evaluarTiempo(fechaRadicacion, diasHabilesEsperados, fechaReferencia = new Date()) {
  const inicio = new Date(fechaRadicacion + "T00:00:00");
  const diasHabilesTranscurridos = diasHabilesEntre(inicio, fechaReferencia);
  return {
    diasHabilesTranscurridos,
    diasHabilesEsperados,
    retrasada: diasHabilesTranscurridos > diasHabilesEsperados,
  };
}

module.exports = { esDiaHabil, diasHabilesEntre, evaluarTiempo };
