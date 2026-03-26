# Admin Events: `today=true` por defecto + comportamiento de filtros (Guía para IA Frontend)

**Pantalla:** `https://fvx-ticket.web.app/admin/events`

Este documento describe el comportamiento recomendado del listado de eventos en el Admin (Angular) usando la API `GET /api/events/`, considerando el nuevo comportamiento del query param `today=true`.

---

## 1) API

### Endpoint

`GET /api/events/`

### Scope por organización

La API devuelve eventos **solo** de la organización asociada al request:

- Con JWT: organización tomada desde `UserOrganization` activo del usuario
- Con API Key: organización tomada desde `APIKey.organization`

---

## 2) Filtro `today=true` (nuevo comportamiento)

### Objetivo

Traer **todos los eventos que incluyen el día de hoy dentro de su rango de fechas**, **independiente de su estado**.

### Uso

`GET /api/events/?today=true`

### Regla importante

Cuando `today=true` está presente:

- El backend aplica filtro por rango de fechas para incluir hoy.
- El backend **ignora** el filtro `status` aunque el frontend lo envíe.

Ejemplo (equivalentes):

- `GET /api/events/?today=true`
- `GET /api/events/?today=true&status=active`  (status se ignora)
- `GET /api/events/?today=true&status=pending` (status se ignora)

---

## 3) Requerimiento UI: `today=true` debe ser el default

En la pantalla `/admin/events`:

- **Default:** mostrar eventos de hoy (por rango de fechas)
  - request recomendado: `GET /api/events/?today=true`

---

## 4) Filtros sugeridos en UI

Se recomienda un selector de vista (o chips) con opciones:

### A) "Hoy" (default)

- `GET /api/events/?today=true`

### B) "Todos"

- `GET /api/events/`

### C) "Por estado" (manual)

Aplicar `status` solo cuando NO se está usando `today=true`:

- `GET /api/events/?status=active`
- `GET /api/events/?status=pending`
- `GET /api/events/?status=finished`
- `GET /api/events/?status=cancelled`
- `GET /api/events/?status=draft`
- `GET /api/events/?status=suspended`

---

## 5) Nota importante para frontend (evitar params vacíos)

- No enviar query params vacíos, por ejemplo `organization__code=''`.
- Si no hay valor, no incluir el parámetro en la request.
