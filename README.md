# Komari Admin

Standalone administration console for Komari/Sonar server. Split out of the
former `web` monorepo's `admin-ui`, which used to be bundled together with
the default frontend theme (now provided separately by `theme-nova`).

Always served under `/admin/` by the Go backend
(`server/internal/platform/frontend`), which embeds this project's build
output (`dist/`, entry `admin.html`) alongside the default theme's build.

## Development

```bash
npm install
npm run dev
```

The dev server proxies `/api` and `/themes` to `VITE_API_TARGET`
(default `http://127.0.0.1:25774`).

## Build

```bash
npm run build
```

Output goes to `dist/`. The server's packaging step
(`server/scripts/pack_frontend.go`) consumes this `dist/` directory and
embeds it under `admin/` in the combined frontend archive.
