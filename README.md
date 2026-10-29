# Cafetera (backend)

Java 21 · Spring Boot 4 · MySQL 8 · Flyway · JWT

## Arrancar

```bash
docker compose down -v      # IMPORTANTE la primera vez: borra la BD antigua (las migraciones V1/V2 han cambiado)
docker compose up -d
mvn spring-boot:run         # o ejecutar CafeteraApplication desde el IDE
```

Valores por defecto de desarrollo (cámbialos con variables de entorno en un despliegue real):
`JWT_SECRET`, `ADMIN_USER` (admin), `ADMIN_PASSWORD` (admin12345), `CORS_ORIGIN`.

Cafetera de demo: código `CAFE2345`.

## Prueba rápida

```bash
curl localhost:8080/api/machines/CAFE2345/coffees
curl -X POST localhost:8080/api/machines/CAFE2345/coffees/1/quote
curl -X POST localhost:8080/api/machines/CAFE2345/coffees/1/serve -H 'Content-Type: application/json' -d '{"expectedPrice":1.23}'

TOKEN=$(curl -s -X POST localhost:8080/api/auth/login -H 'Content-Type: application/json' \
  -d '{"username":"admin","password":"admin12345"}' | sed 's/.*"token":"\([^"]*\)".*/\1/')
curl -X POST localhost:8080/api/machines/CAFE2345/stock/3/restock -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' -d '{"quantity":500}'
curl "localhost:8080/api/machines/CAFE2345/stats" -H "Authorization: Bearer $TOKEN"
```

## API

| Acceso | Ruta |
|---|---|
| Público | `GET /api/machines/{code}`, `/coffees`, `/stock`, `/stock/low` · `POST /coffees/{id}/quote` y `/serve` · `GET /api/coffees`, `/api/ingredients` · `POST /api/coffees` |
| Login | `POST /api/auth/login` |
| Admin u operador de esa cafetera | `POST /stock/{ingredientId}/restock` · `PUT /stock/{ingredientId}` · `GET /servings`, `/restocks`, `/stats` |
| Autenticado | `GET /api/me/machines` |
| Solo admin | `POST/GET /api/machines` · `/api/users` · `PUT/DELETE /api/coffees/{id}` · `/api/ingredients` (escritura) · `/api/stats`, `/api/stats/machines` |
