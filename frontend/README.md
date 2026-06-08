# Frontend

Static web UI for Custo3D.

## What it does

- shows service health
- lists backend resources
- lets you bootstrap the first household
- lets you create records via the generic CRUD API

## Deployment model

- served by Caddy
- `/api/*` is proxied to the backend container
- only bound to `127.0.0.1:3000` on the server

