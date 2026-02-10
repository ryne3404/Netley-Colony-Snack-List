# SnackList - Family Snack Ordering System

## Overview

SnackList is a family snack ordering system that allows multiple families to select snacks from a shared catalog, each with a points budget. An admin manages the snack catalog (with categories) and views a master shopping list that aggregates all family selections. The app has two user flows: admin management (snacks, categories, master list) and family-facing pages (browsing and selecting snacks within a points allowance).

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Monorepo Structure
The project uses a three-folder monorepo pattern:
- **`client/`** — React frontend (SPA)
- **`server/`** — Express backend (API server)
- **`shared/`** — Shared TypeScript code (schema definitions, route contracts, Zod validators)

### Frontend
- **Framework:** React with TypeScript
- **Routing:** wouter (lightweight client-side router)
- **State/Data Fetching:** TanStack React Query for server state management
- **Forms:** react-hook-form with Zod resolvers for validation
- **UI Components:** shadcn/ui (new-york style) built on Radix UI primitives
- **Styling:** Tailwind CSS with CSS custom properties for theming, custom fonts (Outfit for display, Inter for body)
- **Icons:** lucide-react
- **Build:** Vite with React plugin

The frontend uses a sidebar-based layout with pages for: Master List, Manage Snacks, Manage Categories, and per-family detail views. Path aliases `@/` maps to `client/src/` and `@shared/` maps to `shared/`.

### Backend
- **Framework:** Express 5 on Node.js
- **Runtime:** tsx for development, esbuild for production bundling
- **API Design:** RESTful JSON API under `/api/` prefix. Routes are defined as a typed contract in `shared/routes.ts` with Zod schemas for input validation and response types. The server and client both import from this shared contract.
- **Development:** Vite dev server is used as middleware for HMR during development. In production, the built static files are served by Express.

### Database
- **Database:** PostgreSQL (required, uses `DATABASE_URL` env var)
- **ORM:** Drizzle ORM with `drizzle-zod` for generating Zod schemas from table definitions
- **Schema location:** `shared/schema.ts` — contains all table definitions, relations, and insert schemas
- **Migrations:** Drizzle Kit with `db:push` command for schema synchronization
- **Connection:** node-postgres (`pg`) Pool

### Data Model
Four main tables:
1. **categories** — Snack categories (id, name)
2. **families** — Family groups with a points budget (id, name, pointsAllowed)
3. **snacks** — Snack items with optional category, store, link, image, and point cost
4. **selections** — Pivot table linking families to snacks with quantity (unique constraint on familyId + snackId)

### API Route Contract
Routes are defined in `shared/routes.ts` as a typed object (`api`) with method, path, input schema, and response schemas. Both client hooks and server handlers reference this contract, ensuring type safety across the stack. A `buildUrl` helper handles parameterized paths.

### Key API Endpoints
- `GET/POST /api/categories` — List/create categories
- `PUT/DELETE /api/categories/:id` — Update/delete category
- `GET/POST /api/families` — List/create families
- `GET /api/families/:id` — Get single family
- `GET/POST /api/snacks` — List/create snacks
- `PUT/DELETE /api/snacks/:id` — Update/delete snack
- `GET /api/families/:familyId/selections` — Get selections for a family
- `POST /api/selections` — Update a selection (upsert)
- `GET /api/master-list` — Aggregated shopping list across all families

### Build Process
- **Dev:** `tsx server/index.ts` runs the server which sets up Vite middleware for the client
- **Build:** Custom `script/build.ts` runs Vite build for client, then esbuild for server (bundling key deps, externalizing others)
- **Production:** `node dist/index.cjs` serves built static files and API

## External Dependencies

- **PostgreSQL** — Primary database, connected via `DATABASE_URL` environment variable. Uses `pg` Pool and `connect-pg-simple` for session storage capability.
- **Drizzle ORM + Drizzle Kit** — Database ORM and migration tooling
- **Radix UI** — Headless UI primitives (full suite: dialog, select, accordion, tabs, tooltip, etc.)
- **shadcn/ui** — Pre-built component library on top of Radix
- **TanStack React Query** — Client-side data fetching and caching
- **Zod** — Schema validation used on both client and server
- **Vite** — Frontend build tool with HMR in development
- **esbuild** — Server bundling for production
- **Google Fonts** — Outfit and Inter font families loaded via CSS import