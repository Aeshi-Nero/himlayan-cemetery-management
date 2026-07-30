# Himlayan Cemetery Management System

A comprehensive cemetery management platform for Himlayan Memorial Park, Solano, Nueva Vizcaya. Features public memorial maps, online lot inquiries, admin console, GIS plot editing, A* pathfinding navigation, and Gemini AI concierge.

## Features

- **Interactive Memorial Map** — Leaflet-based GIS map with 80+ plots across 4 sections, pathfinding overlay, and plot status visualization
- **Public Inquiry Portal** — Submit lot inquiries, view lot availability, search by section/type/price
- **Admin Console** — Role-based dashboard for super admin, RCC clerk, engineer, and staff
  - Plot management with CRUD, filtering, CSV import/export
  - Contract and payment tracking with installment support
  - Burial scheduling and deceased records management
  - Inquiry processing with auto-reservation workflow
  - User management, audit logs, and activity tracking
- **Engineer Workspace** — GIS map editor with drag-and-drop plot placement, border polygon editing, entrance/path/boundary tools, undo/redo
- **A* Pathfinding** — Navigate the cemetery via a 19-node graph network with turn-by-turn directions
- **Gemini AI Concierge** — Chat assistant for visitors and image analysis for document/headstone inspection
- **Memorial Lots Catalog** — Browse available single lawn lots (₱15,000), family mausoleum lots (₱35,000), and garden apartment terraces (₱60,000)

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, TypeScript, Vite, Tailwind CSS v4, Leaflet/react-leaflet, Zustand, motion, recharts |
| Backend | Express 4, TypeScript, tsx, JWT (jsonwebtoken + bcryptjs), Google GenAI SDK |
| Build | Vite (frontend), esbuild (backend bundle) |
| GIS | Leaflet, Leaflet Draw, react-leaflet |
| AI | Google Gemini 2.5 Flash (chat), Gemini 2.5 Pro (image analysis) |

## Getting Started

### Prerequisites
- Node.js 22+
- npm

### Installation

```bash
git clone https://github.com/Aeshi-Nero/himlayan-cemetery-management.git
cd himlayan-cemetery-management
npm install
cp .env.example .env
```

### Environment Variables

| Variable | Description |
|----------|-------------|
| `PORT` | Server port (default: 3000) |
| `JWT_SECRET` | JWT access token secret |
| `JWT_REFRESH_SECRET` | JWT refresh token secret |
| `GEMINI_API_KEY` | Google Gemini API key (for AI concierge features) |

### Run

```bash
npm run dev        # Development with HMR
npm run build      # Production build
npm start          # Serve production build
```

### Default Accounts

| Email | Role | Password |
|-------|------|----------|
| admin@himlayan.gov.ph | Super Admin | Admin@123 |
| rcc@himlayan.gov.ph | RCC Clerk | Admin@123 |
| engineer@himlayan.gov.ph | Engineer | Admin@123 |
| staff@himlayan.gov.ph | Staff | Admin@123 |

## Project Structure

```
server.ts                     # Express backend (all API routes, seed data, A*)
src/
  main.tsx                    # React entry point
  App.tsx                     # Router configuration
  types.ts                    # Shared TypeScript interfaces
  api/client.ts               # Axios HTTP client with JWT interceptor
  store/authStore.ts          # Zustand authentication state
  components/                 # Reusable components (Navbar, Gemini modals, etc.)
  pages/                      # Public pages (Landing, Map, Lots, Inquiry, Login)
  pages/admin/                # Admin pages (Dashboard, Contracts, Payments, etc.)
  assets/images/              # Cemetery imagery and logos
  utils/mapUsageTracker.ts    # Map usage statistics
```

## API Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/health` | — | Health check |
| POST | `/api/auth/login` | — | Login |
| POST | `/api/auth/refresh-token` | — | Refresh JWT |
| GET | `/api/plots` | — | List plots (with filters) |
| GET | `/api/plots/:id` | — | Plot detail |
| POST | `/api/inquiries` | — | Submit public inquiry |
| GET | `/api/pathfinding/find-path` | — | A* navigation |
| GET | `/api/dashboard` | ✓ | Admin dashboard stats |
| CRUD | `/api/contracts` | ✓ | Contract management |
| CRUD | `/api/payments` | ✓ | Payment records |
| CRUD | `/api/burials` | ✓ | Burial scheduling |
| CRUD | `/api/clients` | ✓ | Client records |
| CRUD | `/api/users` | ✓ | User management (super_admin) |
| GET | `/api/audit` | ✓ | Activity log |
| POST | `/api/gemini/chat` | — | AI concierge chat |
| POST | `/api/gemini/analyze-image` | — | AI image analysis |

## Deployment

Build and deploy with:

```bash
npm run build
node dist/server.cjs
```

The project includes a `Dockerfile` and `docker-compose.yml` for containerized deployment.

## License

Developed for the Local Government Unit of Solano, Nueva Vizcaya.
