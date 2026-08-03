# Himlayan Cemetery Management System — opencode Agent Guide

> **Live repo:** `https://github.com/Aeshi-Nero/himlayan-cemetery-management`
> This is a **Laravel + Inertia + React** rewrite of the system. The old Express/TypeScript version is preserved on the `express-legacy` git tag.

## Project Overview

Cemetery management platform for Himlayan Memorial Park, Solano, Nueva Vizcaya. Laravel 13 backend (Elastic ORM, Sanctum, Inertia) with a React 19 + TypeScript + Tailwind frontend. Includes GIS memorial map, A* pathfinding, burial permits, pre-need plans, columbary, Gemini AI concierge, and role-based admin.

## Quick Start

```bash
composer install
cp .env.example .env
php artisan key:generate
php artisan migrate --seed
npm install
npm run dev        # build-only
php artisan serve  # backend + Vite

# one-shot full setup
composer run setup
```

## Architecture

```
app/
  Console/Commands/            # SendBurialReminders, SendInstallmentReminders
  Http/Controllers/Api/        # REST controllers (Plot, Contract, Burial, etc.)
  Http/Middleware/EnsureUserRole.php  # RBAC (role:super_admin|rcc|engineer)
  Models/                      # Eloquent models (Plot, Contract, Payment, ...)
database/
  migrations/                  # schema (chronologically ordered)
  seeders/DatabaseSeeder.php   # demo data
resources/js/
  Pages/                       # Inertia React pages (Public/Admin/Engineer/Auth)
  Components/                  # Shared + role-scoped UI
  constants/geo.ts             # map geometry constants
  types/index.ts               # shared TS types
routes/
  web.php                      # web + Inertia + Api routes
  auth.php                     # auth routes
```

## Coding Standards ("NASA-grade")

- **TypeScript strict**: `npm run typecheck` (`tsc --noEmit`) must pass clean. No `any`, no `!` assertions.
- **Lint**: `npm run lint` runs ESLint with `--max-warnings 0`. Must pass.
- **PHP**: follow Laravel conventions; return types on all methods; type hints on params.
- **RBAC is enforced server-side** via `EnsureUserRole` middleware (`role:`), not just in the UI.
- **Naming**: `handle{Action}` for event handlers; snake_case DB columns; camelCase JS.
- **Keep components < 400 lines**; split early; extract constants (see `resources/js/constants/geo.ts`).

### Before every commit/push
```bash
npm run typecheck
npm run lint
```
The `Engineer/EngineerWorkspacePage.tsx`, `Public/MemorialMapPage.tsx`, `Admin/MapEditorPage.tsx`, `Public/LotDetailPage.tsx`, and `constants/geo.ts` are runs against `--max-warnings 0` in the lint script.

## Git Workflow
- Commit messages: `{type}: {description}` (e.g., `feat: add burial permit PDF export`).
- `master` = stable. Feature branches for work-in-progress.
- Never commit `.env` (gitignored), `vendor/`, or `node_modules/`.

## Feature Map (API)
- Public: `GET /api/plots`, `GET /api/plots/{id}`, `GET /api/burials`, A* pathfinding (`find-path`), ceremony-map, stats, public inquiries.
- Auth (session + Sanctum): admin dashboard, contracts, payments, burials, burial-permits, pre-need-plans, columbary-niches, clients, feedback, notifications.
- RBAC: `role:super_admin` gates user/settings management; `role:engineer,super_admin` gates the Engineer Workspace.

## Deployment
- Web server: `public/` (Laravel convention) — point docroot here on Render/Forge.
- Env required: `APP_KEY`, `APP_URL`, `DB_*`, `GEMINI_API_KEY`, `SANCTUM_STATEFUL_DOMAINS`.
- Commands scheduled via Laravel scheduler (`SendBurialReminders`, `SendInstallmentReminders`) — run `php artisan schedule:work`.

## Deployment (Render — Docker)

Deployment is Docker-based via Render. See `Dockerfile`, `render.yaml`, and `deploy/`.

- **Dockerfile** is multi-stage: Node 22 builds `public/build` assets, then PHP 8.4-FPM (Alpine) serves via Nginx (port 8080) managed by supervisord.
- **`deploy/entrypoint.sh`** runs on container start: generates `APP_KEY` if missing, touches the SQLite DB (chown'd to `www-data`), runs `migrate --force`, seeds only on an empty DB, then starts Nginx + PHP-FPM + scheduler (`schedule:work`).
- **Volume/persistence:** Render mounts a disk at `/var/lib/laravel`; set `DB_DATABASE=/var/lib/laravel/data/database.sqlite`.
- **Health check:** `/up` (Laravel's built-in route).
- Verify locally: `docker build -t himlayan:test . && docker run -p 8080:8080 himlayan:test` then curl `/up`.
- Deploying requires PHP 8.4 (the Composer lockfile pins packages needing `php >=8.4.1`).
- Local rebuild smoke test:
  ```bash
  KEY="base64:$(openssl rand -base64 32)"
  docker run -p 8090:8080 -e APP_KEY="$KEY" -e APP_URL=http://localhost:8090 \
    -e DB_CONNECTION=sqlite -e DB_DATABASE=/var/lib/laravel/data/database.sqlite \
    -e SESSION_DRIVER=database -e CACHE_STORE=database -e QUEUE_CONNECTION=database himlayan:test
  ```