# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Bake App is a Cafe-Bakery Automation Platform — an Nx monorepo with React 19 frontends (Vite) and a NestJS 10 backend. It manages POS, inventory, recipes, production planning, finance, and reporting.

## Commands

```bash
# Backend API (NestJS)
npm run serve:api          # Dev mode with watch (port 3000)
npm run build              # Build API
npm run build:prod         # Production build with webpack

# Frontend Apps (React + Vite)
npm run serve:pos          # POS app (port 4200)
npm run serve:admin        # Admin dashboard (port 4201)
npm run serve:kitchen      # Kitchen display (port 4202)
npm run serve:hub          # Hub portal (port 4204)
npm run serve:mobile       # Expo mobile app

# Quality
npm run test               # Run Jest tests (API)
npm run lint               # ESLint
```

All frontend Vite dev servers proxy `/api` requests to `http://localhost:3000`.

## Architecture

### Monorepo Layout

- **`apps/api/`** — NestJS backend. Feature-based modules: auth, users, roles, permissions, pos, inventory, recipes, production, finance, reporting, notifications, settings, websocket. Entry: `apps/api/src/main.ts`.
- **`apps/pos-app/`** — React POS for cashiers (port 4200). Vite + React Router.
- **`apps/admin-dashboard/`** — React admin panel (port 4201). Shell layout with sidebar, 13 content pages.
- **`apps/kitchen-screen/`** — React Kitchen Display System (port 4202). Dark theme, WebSocket real-time, kanban board.
- **`apps/hub-app/`** — React hub portal at `bake.ilia.to` — login + role-based links to sub-apps (port 4204).
- **`apps/mobile-app/`** — React Native (Expo) mobile app with Zustand, expo-router, expo-secure-store.
- **`libs/shared-types/`** — TypeScript models (User, Order, Product, Inventory, Recipe), enums (UserRole, OrderStatus), constants. No framework dependency — shared across all apps and the backend.
- **`libs/react/auth/`** — Auth context, SSO cookie utils, JWT decode, ProtectedRoute guard.
- **`libs/react/api-client/`** — Fetch-based API client + TanStack Query hooks for every API domain (orders, products, recipes, inventory, etc.).
- **`libs/react/store/`** — Zustand stores: cart (POS), WebSocket, UI state.
- **`libs/react/ui/`** — Reusable React components: DataTable, StatsCard, StatusBadge, Sidebar, Header, CurrencyDisplay, ProductCard, etc.

### Path Aliases

All imports use `@bake-app/` prefix:
- `@bake-app/shared-types` — shared TypeScript interfaces and enums
- `@bake-app/react/auth` — auth context, hooks, guards
- `@bake-app/react/api-client` — fetch client + TanStack Query hooks
- `@bake-app/react/store` — Zustand stores
- `@bake-app/react/ui` — reusable UI components

App sources: `@bake-app/api/*`, `@bake-app/pos-app/*`, `@bake-app/admin-dashboard/*`, etc.

### Frontend Stack

- **React 19** with TypeScript strict mode
- **Vite 5** for dev server and production builds
- **React Router v7** — `createBrowserRouter` with `<ProtectedRoute>` wrapper
- **TanStack Query v5** — server state management, caching, mutations with auto-invalidation
- **Zustand v5** — client-only state (POS cart, WebSocket connection, UI sidebar)
- **Tailwind CSS v4** — utility-first styling with bakery theme colors
- **Lucide React** — icons (replaces Material Icons)
- **Sonner** — toast notifications
- **React Hook Form** — complex forms (recipe editor, settings)
- **Socket.io Client** — WebSocket real-time updates (kitchen screen)

### Backend Stack

- **NestJS 10** with TypeORM entities, PostgreSQL
- **JWT + RBAC** auth with fine-grained permissions (`resource:action` format)
- **WebSockets** via Socket.io with role-based room routing
- **Swagger** at `/api/docs` (non-production)
- **Global ValidationPipe** with whitelist + forbidNonWhitelisted + transform
- **Redis** for caching and Bull job queues (infrastructure ready)
- **30 TypeORM entities** across 13 modules

### Cross-Domain SSO

- JWT stored in both `localStorage` and a shared cookie (`bake_token`) on `.bake.ilia.to`
- On app startup, `AuthProvider` syncs cookie <-> localStorage (token passthrough)
- Enables single sign-on: log in once at hub, access POS/Admin/Kitchen without re-login
- Cookie logic in `libs/react/auth/src/cookie-utils.ts`

### Real-Time Architecture

- WebSocket events flow: Service emits domain event → `WsEventsListener` routes to rooms → clients receive
- Rooms: `kitchen`, `pos`, `manager`, `user:{userId}`
- Events: `order:new`, `order:statusChanged`, `inventory:updated`, `production:taskUpdated`, etc.
- `useWebSocketStore` (Zustand) auto-invalidates TanStack Query caches on WebSocket events

### 9 User Roles

OWNER, MANAGER, ACCOUNTANT, CHEF, BAKER, BARISTA, CASHIER, WAREHOUSE, MARKETING

### Module Boundaries

Apps cannot import from each other. Apps import only from `libs/` (shared scope).

## UI Conventions

- **Loading states**: All DataTable components accept a `loading` prop. Show `<LoadingSpinner>` while data is fetching. TanStack Query's `isLoading` handles this automatically.
- **Submit button disabling**: All form submit buttons must be disabled while mutations are in flight. Use `mutation.isPending` from TanStack Query mutations.
- **Toast notifications**: Use `toast.success()` / `toast.error()` from `sonner` for user feedback on CRUD operations.
- **Confirmation dialogs**: Use `useConfirmation()` hook from `@bake-app/react/ui` for destructive actions (delete).
- **Theme colors**: Warm bakery browns — primary `#8b4513`, dark `#3e2723`, medium `#5d4037`, light `#faf3e8`. Kitchen screen uses dark theme (`#0D1B2A`, `#16213E`).
- **Fonts**: Inter for UI text, JetBrains Mono for prices/numbers/order numbers (`font-mono` Tailwind class).

## Code Style

- Prettier: semicolons, single quotes, 2-space indent, 100 char line width, ES5 trailing commas
- TypeScript strict mode
- React: functional components only, hooks for state/effects
- File naming: kebab-case for files (`payment-dialog.tsx`), PascalCase for components (`PaymentDialog`)
- Hooks: `use` prefix (`useAuth`, `useCartStore`, `useProducts`)

## Database

PostgreSQL with 30 TypeORM entities. See `docs/db-schema.html` for interactive ER diagram. Key entity groups:
- **Auth**: User, Role, Permission, RolePermission, UserPermission, RefreshToken
- **POS**: Order, OrderItem, Payment, Product, Category, Menu, MenuProduct
- **Inventory**: Ingredient, IngredientCategory, InventoryItem, InventoryItemPackage, InventoryShipment, InventoryMovement, Location
- **Recipes**: Recipe, RecipeIngredient, RecipeLink, RecipeVersion
- **Production**: ProductionPlan, ProductionTask
- **Finance**: FinanceTransaction, ExpenseRecord
- **Other**: Notification, Setting

All entities inherit from BaseEntity (UUID id, createdAt, updatedAt). Monetary values use `decimal(10,2)` or `decimal(12,2)`. Soft deletes via `isActive: boolean` flag.

## Deployment

- Production host: `bake.ilia.to` (hub), `pos.bake.ilia.to`, `admin.bake.ilia.to`, `kitchen.bake.ilia.to`
- API: `api.bake.ilia.to` (nginx proxies to port 3100)
- Frontend: Static files from `vite build` output, served by nginx
- Backend: `node dist/apps/api/main.js`
- Database: PostgreSQL 16, Redis 7 (docker-compose for local dev)
