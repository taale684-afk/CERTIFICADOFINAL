# PoliSeguimiento — Incremento 1

Consulta del estado y la ubicación de una solicitud de certificado especial del Politécnico Grancolombiano, mediante su número de radicado.

## Alcance de este incremento

- Buscar una solicitud por número de radicado (formato `POL-AAAA-NNNN`).
- Ver el área actual y el estado (`pendiente` o `trasladada`) de esa solicitud.
- Ver el historial de movimientos entre áreas (fecha y acción realizada en cada etapa).
- Ver los días hábiles transcurridos desde la radicación frente a los días hábiles esperados, con una **alerta visible** cuando el tiempo esperado se supera (por ejemplo, se esperan 8 días hábiles y la solicitud lleva 10).
- Manejar los casos de radicado inválido y radicado no encontrado.

Quedan **fuera de alcance** en este incremento: el detalle del pendiente, el aviso de traslado entre áreas como pantalla independiente, y la integración con los sistemas reales de la institución (se usan datos de prueba en `data/solicitudes.json`). La validación de estos estados y áreas con Registro Académico, y la prueba con al menos dos usuarios sobre este prototipo navegable, quedan documentadas como próximos pasos en el plan de la iteración.

### Nota sobre los datos de ejemplo y la fecha actual

Los radicados de prueba tienen fechas de radicación fijas (agosto de 2026). Como el cálculo de días hábiles se hace siempre contra la fecha real del día en que se ejecuta la aplicación, es normal y esperado que ambos ejemplos aparezcan como **retrasados** si los pruebas después de esa fecha: eso es precisamente el comportamiento que la alerta debe mostrar. Para ver el caso "dentro del plazo" de forma controlada, revisa las pruebas automatizadas (`npm test`), que fijan una fecha de referencia específica para cada escenario.

## Cómo ejecutar el proyecto

```bash
npm install
npm start
```

Luego abre `http://localhost:3000` en el navegador. Radicados de prueba disponibles: `POL-2026-0417` (pendiente) y `POL-2026-0512` (trasladada).

## Cómo correr las pruebas

```bash
npm test
```

## Estructura del proyecto

```
poliseguimiento/
├── server.js              # Servidor Express y definición del endpoint
├── lib/solicitudes.js      # Lógica de negocio (validación y búsqueda)
├── data/solicitudes.json   # Datos de prueba (mock)
├── public/index.html       # Frontend del Incremento 1
├── test/solicitudes.test.js
└── package.json
```

## Equipo

Samuel Araque · Alejandro Taborda · John Cortes — Politécnico Grancolombiano, Práctica Aplicada de Sistemas.
