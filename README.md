# PoliSeguimiento — Incremento 1

Consulta del estado y la ubicación de una solicitud de certificado especial del Politécnico Grancolombiano, mediante su número de radicado.

## Alcance de este incremento

- Buscar una solicitud por número de radicado (formato `POL-AAAA-NNNN`).
- Ver el área actual y el estado (`pendiente` o `trasladada`) de esa solicitud.
- Manejar los casos de radicado inválido y radicado no encontrado.

Quedan **fuera de alcance** en este incremento: historial de movimientos, detalle del pendiente, traslado entre áreas, y la integración con los sistemas reales de la institución (se usan datos de prueba en `data/solicitudes.json`).

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
