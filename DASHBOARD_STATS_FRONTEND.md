# Dashboard Stats — Guía para Frontend (ADMIN WEB)

Endpoint **agregado** para los contadores del panel de control.
Reemplaza la estrategia previa de paginar `/events`, `/persons`, `/tickets` y `/attendees` solo para leer el `count` total.

---

## ¿Por qué este endpoint?

Antes, para pintar las 4 tarjetas (Eventos / Personas / Tickets / Asistentes) el frontend hacía algo como:

```
GET /api/attendees/?page=1
GET /api/attendees/?page=2
...
GET /api/attendees/?page=83
GET /api/tickets/?page=1
... etc.
```

Cientos de requests por sesión. Con este endpoint **una sola llamada** devuelve los 4 contadores.

---

## Endpoint

```
GET /api/dashboard/stats/
```

### Autenticación
Requiere **API Key** (header `X-API-Key`) **o** sesión autenticada (`Authorization: Bearer <jwt>`).
Mismo esquema que `/api/daily-consolidated/`.

### Query params

| Param                | Tipo   | Requerido | Descripción |
|----------------------|--------|-----------|-------------|
| `organization_code`  | string | ❌ no     | Si se envía, filtra los contadores a esa organización (`Organization.code`). Si se omite o viene vacío, devuelve **totales globales** (todas las organizaciones). |

### Ejemplos

```
GET /api/dashboard/stats/                          → totales globales
GET /api/dashboard/stats/?organization_code=WM001  → solo Walmart
GET /api/dashboard/stats/?organization_code=       → equivale a globales (vacío)
```

### Response 200

```json
{
  "events": 31,
  "persons": 1150,
  "tickets": 1796,
  "attendees": 1796,
  "organization_code": "WM001"
}
```

| Campo                | Tipo            | Descripción |
|----------------------|-----------------|-------------|
| `events`             | int             | Cantidad de eventos (no eliminados). |
| `persons`            | int             | Cantidad de personas (no eliminadas). |
| `tickets`            | int             | Cantidad de tickets generados (no eliminados). |
| `attendees`          | int             | Cantidad de asistentes inscritos (relaciones `EventAttendee`). |
| `organization_code`  | string \| null  | El código por el que se filtró. `null` si fue consulta global. Útil para que el frontend confirme el scope. |

### Errores

| HTTP | Caso | Respuesta |
|------|------|-----------|
| 400  | `organization_code` no existe | `{ "organization_code": ["No existe una organización con code \"XYZ\"."] }` |
| 401  | Sin auth | Mensaje estándar de DRF. |

---

## Notas sobre los conteos

- Todos los modelos relevantes (`Event`, `Person`, `Ticket`) usan **soft delete**: los registros con `is_removed=True` **no se cuentan** (Django filtra automáticamente vía el manager por defecto).
- `EventAttendee` no es soft-deletable: se cuentan todas las inscripciones existentes.
- El filtro por organización aplica:
  - Directo en `Event`, `Person`, `Ticket` (campo `organization`).
  - Indirecto en `EventAttendee` vía `event.organization`.

---

## Migración desde el flujo viejo

**Antes (Angular):**
```ts
// 80+ requests
const allAttendees = await this.fetchAllPages('/api/attendees/');
const allTickets   = await this.fetchAllPages('/api/tickets/');
const allEvents    = await this.fetchAllPages('/api/events/');
const allPersons   = await this.fetchAllPages('/api/persons/');
this.kpis = {
  events: allEvents.length,
  persons: allPersons.length,
  tickets: allTickets.length,
  attendees: allAttendees.length,
};
```

**Ahora:**
```ts
// 1 request
const stats = await this.http.get<DashboardStats>(
  `/api/dashboard/stats/${orgCode ? `?organization_code=${orgCode}` : ''}`
).toPromise();

this.kpis = stats;
```

Donde:
```ts
interface DashboardStats {
  events: number;
  persons: number;
  tickets: number;
  attendees: number;
  organization_code: string | null;
}
```

---

## Rendimiento

Cada contador se resuelve con un `COUNT(*)` en PostgreSQL — operación O(1) con índices ya existentes. Tiempo de respuesta esperado: **< 100 ms** incluso con cientos de miles de registros.

Si se requiere refresco automático en el panel, se recomienda **polling cada 30–60 s** o **WebSocket** (no implementado aún) — pero ya **no** seguir paginando endpoints completos.
