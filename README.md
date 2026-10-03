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

Los radicados de prueba corresponden a dos certificados reales publicados por el Politécnico Grancolombiano, con sus tiempos de entrega y costos 2026 oficiales (https://www.poli.edu.co/certificados):

| Radicado | Certificado | Tiempo de entrega publicado | Costo 2026 | Estado esperado |
|---|---|---|---|---|
| POL-2026-0417 | Copia Diploma de Grado | 8 días hábiles | $97.200 | Retrasada (radicada en agosto) |
| POL-2026-0512 | Certificado de Notas General - Firma Original | 2 a 5 días hábiles (se tomó el máximo, 5, como plazo de alerta) | $93.400 | Retrasada (radicada en agosto) |
| POL-2026-0603 | Certificado de Notas por Periodo - Firma Original | 2 a 5 días hábiles (máximo 5) | $27.800 | Dentro del plazo, sin alerta (radicada recientemente) |

Las fechas de radicación de POL-2026-0417 y POL-2026-0512 son fijas (agosto de 2026), por lo que aparecerán como **retrasadas** si las consultas después de esa fecha: eso es precisamente el comportamiento que la alerta debe mostrar. POL-2026-0603 se radicó pocos días hábiles antes de esta entrega, por lo que se mantendrá **dentro del plazo** durante los primeros días hábiles siguientes; pasado ese margen, también empezará a mostrarse como retrasada, ya que el cálculo siempre se hace contra la fecha real del día en que se ejecuta la aplicación. Para ver ambos comportamientos (con y sin alerta) de forma controlada y permanente, revisa las pruebas automatizadas (`npm test`), que fijan una fecha de referencia específica para cada escenario.

## Cómo ejecutar el proyecto

```bash
npm install
npm start
```

Luego abre `http://localhost:3000` en el navegador. Radicados de prueba disponibles: `POL-2026-0417` (pendiente, retrasada), `POL-2026-0512` (trasladada, retrasada) y `POL-2026-0603` (en revisión, dentro del plazo).

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
