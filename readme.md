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

# Design

Session cookie has a max age of 2147483647 is by design. "Revoking session cookie" is a pending issue and it will be implemented.

Folder item uses content type as etag is by design. For a given folder item URL, only content type would be changed overtime.

# To-Do

Markdown.

Add a switch for style changing animation.

Only use style changing animation on foreground.

