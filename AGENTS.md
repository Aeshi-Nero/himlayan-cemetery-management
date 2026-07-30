# Himlayan Cemetery Management System — opencode Agent Guide

## Project Overview

Monolithic React + Express (TypeScript) cemetery management system with in-memory data store, Leaflet GIS map, A* pathfinding, Gemini AI concierge, and role-based admin console.

## Quick Start

```bash
npm install
npm run dev     # dev mode (Vite HMR + tsx server)
npm run build   # production build
npm run start   # serve production build
```

## Architecture

```
server.ts                   # Express backend (auth, API routes, A* pathfinding, seed data)
src/
  main.tsx                  # React entry point
  App.tsx                   # Router (public routes + /admin/* protected routes)
  types.ts                  # TypeScript interfaces (User, Plot, Contract, etc.)
  api/client.ts             # Axios instance with JWT auto-refresh interceptor
  store/authStore.ts        # Zustand auth state (localStorage persistence)
  components/               # Reusable UI components (Navbar, FadingVideo, GeminiChat, etc.)
  pages/                    # Public pages (LandingPage, MemorialLotsPage, MemorialMapPage, etc.)
  pages/admin/              # Admin pages (Dashboard, Contracts, Payments, etc.)
  utils/mapUsageTracker.ts  # Analytics counter
```

## Coding Standards

### TypeScript
- Use `strict: true` in tsconfig — no `any` types, no unchecked `!` assertions
- Prefer `unknown` over `any` — narrow with type guards
- Use optional chaining (`?.`) and nullish coalescing (`??`) instead of `!`
- All functions must have explicit return types
- Event handlers: name as `handle{Action}` (e.g., `handleSubmit`, `handleDelete`)

### React
- Components: function components only, no class components
- State: Zustand for global state, `useState` for local UI state
- Effects: list all dependencies explicitly
- No inline styles — use Tailwind CSS utility classes
- One component per file, max ~400 lines. Split large components early.

### API
- All responses: `{ success: boolean, data?: T, error?: string, pagination?: {...} }`
- Public routes: GET reads open to all
- Protected routes: require `Authorization: Bearer <token>` header
- Role enforcement on the backend via middleware (not just frontend)
- Use `PATCH` for partial updates, `PUT` for full replacement

## Git Workflow
- Commit messages: `{type}: {description}` (e.g., `feat: add entrance lot type`)
- Always run `npm run build` and `npm run lint` before pushing
- Branch: `main` for stable, feature branches for work-in-progress

## Laravel Migration Roadmap

When porting to Laravel, follow the reference in `backend_backup/` which has:
- Prisma schema (models, enums, relations)
- Zod validation schemas
- RBAC middleware (role hierarchy)
- Error handler middleware
- Rate limiting config

### Model Mapping
| TypeScript | Laravel |
|-----------|---------|
| `User` | `User extends Authenticatable` (Sanctum tokens) |
| `Plot` | `Plot` (with `belongsTo` relationships) |
| `Contract` | `Contract` (client, plot, payments) |
| `Payment` | `Payment` (contract) |
| `Inquiry` | `Inquiry` (client, plot) |
| `Burial` | `Burial` (plot, contract) |
| `PathNode` / `PathEdge` | Graph models for A* |
| `ActivityLog` | Audit trail |

### Key Migration Steps
1. Run `php artisan make:migration` for each entity (use Prisma schema as blueprint)
2. Replace in-memory `plotsStore` with `Plot::all()` / `Plot::query()->paginate()`
3. Replace JWT with Laravel Sanctum (HttpOnly cookies)
4. Remove hardcoded `Admin@123` password bypass
5. Port A* pathfinding to PHP or keep as standalone microservice
6. Use Form Request validation instead of inline `if (!field)` checks
7. Use DB transactions for multi-entity mutations (contract + plot status + audit log)

## Deployment
- Build: `npm run build` produces `dist/` (static) + `dist/server.cjs` (backend)
- Port: `PORT` env var (default 3000)
- Required env: `GEMINI_API_KEY`, `JWT_SECRET`, `JWT_REFRESH_SECRET`
