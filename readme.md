Set `dbPassword` in `.env`.

`.env`:
COMPOSE_FILE=compose.yml:dev/compose.yml

```
mkcert -install
mkcert ::1
docker compose up -d db
docker compose exec -T db psql -U postgres <db0
docker compose up -d app
```

# To-Do

Markdown.

Add a switch for style changing animation.

Only use style changing animation on foreground.

