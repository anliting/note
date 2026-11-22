# Set Up Development Environment

```
git clone --recurse-submodules git@github.com:anliting/note.git
```

Set `COMPOSE_FILE` in `.env`:

```
echo 'COMPOSE_FILE=compose.yml:dev/compose.yml:compose.override.yml' >>.env
```

Set `POSTGRES_PASSWORD` in `.env`:

```
echo "POSTGRES_PASSWORD=$(pwgen -s 16 1)" >>.env
```

```
cat >compose.override.yml <<EOF
name: develop-note
services:
  gateway:
    ports:
      - '[::1]:443:443'
EOF
```

```
mkcert -install
mkcert ::1
docker compose up -d db
./dbVc -t 0
docker compose up -d app gateway
```

# Design

Session cookie has a max age of 2147483647 by design. "Revoking session cookie" is a pending issue and it will be implemented.

Folder item uses content type as etag by design. For a given folder item URL, only content type would be changed overtime.

# To-Do

Markdown.

Add a switch for style changing animation.

Only use style changing animation on foreground.

