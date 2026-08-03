# Himlayan Cemetery Management System

Cemetery management platform for Himlayan Memorial Park, Solano, Nueva Vizcaya. A **Laravel 13 + Inertia + React** application covering public memorial maps, online inquiries, burial permits, pre-need plans, columbary, and a full role-based admin console.

## Features

- **Interactive Memorial Map** — Leaflet GIS map with A* pathfinding navigation across the cemetery's path-node graph
- **Public Portals** — Lot catalog, memorial map, inquiry submission, pre-need plans, columbarium and reservation flows
- **Admin Console** — Role-based (super admin / RCC / engineer / staff)
  - Plots, contracts & installment payments, burial scheduling & permits
  - Pre-need plans, columbary niches, client feedback & notifications
  - Users, settings, audit logs, reports, map/pathway editors
- **Engineer Workspace** — GIS map editor: drag-and-drop plot placement, border polygon editing, entrance/path/boundary tools, undo/redo
- **A\* Pathfinding** — turn-by-turn navigation across the cemetery path network
- **Burial Permits** — procedure workflow with PDF export (barryvdh/laravel-dompdf)
- **Gemini AI** — visitor concierge chat + image analysis for documents/headstones
- **Automations** — scheduled reminders for burials and installment payments

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Laravel 13 (PHP 8.3), Sanctum, Eloquent, scheduler |
| Frontend | Inertia + React 19, TypeScript (strict), Tailwind v4 |
| GIS | Leaflet, react-leaflet, Leaflet Draw |
| Docs | barryvdh/laravel-dompdf |
| AI | Google Gemini (chat + image analysis) |

## Getting Started

### Prerequisites
- PHP 8.3+, Composer
- Node.js 22+, npm

### Installation

```bash
git clone https://github.com/Aeshi-Nero/himlayan-cemetery-management.git
cd himlayan-cemetery-management
composer install
cp .env.example .env
php artisan key:generate
php artisan migrate --seed
npm install
npm run build
```

Or run the convenience script: `composer run setup`

### Development
```bash
composer run dev   # server + queue + logs + Vite concurrently
```

## Environment Variables

| Variable | Description |
|----------|-------------|
| `APP_KEY` | Laravel app key (from `php artisan key:generate`) |
| `APP_URL` | Application base URL |
| `DB_CONNECTION` / `DB_HOST` / `DB_DATABASE` / `DB_USERNAME` / `DB_PASSWORD` | Database |
| `GEMINI_API_KEY` | Google Gemini API key for AI concierge |
| `SANCTUM_STATEFUL_DOMAINS` | Domains for SPA-session auth |
| `MAIL_*` | Outbound mail for notifications/reminders |

## Default Accounts

Seeded by `DatabaseSeeder`. Default passwords follow the demo policy; change in production.

| Email | Role |
|-------|------|
| `admin@himlayan.gov.ph` | Super Admin |
| `rcc@himlayan.gov.ph` | RCC Clerk |
| `engineer@himlayan.gov.ph` | Engineer |

## Key Routes

- Public: `/`, `/lots`, `/map`, `/inquiry`, `/plans`, `/columbarium`, `/reserve`
- Admin: `/admin/dashboard` (+ many others), gated by role
- Engineer: `/engineer/workspace`

## API

REST-style JSON under `/api`. See `routes/web.php`. RBAC enforced server-side via `role:` middleware:

- Public reads — plots, burials, pathfinding, ceremony-map, public inquiries
- Admin (auth) — contracts, payments, burials, permits, plans, niches, clients, feedback, notifications, audit, dashboard
- Super admin only — users, settings

## Notes

- A single Express/TypeScript precursor existed; it is preserved on the `express-legacy` git tag.
- Run scheduled jobs (`SendBurialReminders`, `SendInstallmentReminders`) via `php artisan schedule:work`.