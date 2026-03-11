# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Bake App is a Café-Bakery Automation Platform — an Nx monorepo with Angular 17 frontends and a NestJS 10 backend. It manages POS, inventory, recipes, production planning, finance, and reporting.

## Commands

```bash
# Backend API (NestJS)
npm run serve:api          # Dev mode with watch (port 3000)
npm run build              # Build API
npm run build:prod         # Production build with webpack

# Frontend Apps (Angular)
npm run serve:pos          # POS app (port 4200)
npm run serve:admin        # Admin dashboard (port 4201)
npm run serve:kitchen      # Kitchen display (port 4202)
npm run serve:manager      # Manager dashboard (port 4203)
npm run serve:hub          # Hub portal (port 4204)
npm run serve:mobile       # Expo mobile app

# Quality
npm run test               # Run Jest tests
npm run lint               # ESLint
```

All frontend dev servers proxy `/api` requests to `http://localhost:3000`.

## Architecture

### Monorepo Layout

- **`apps/api/`** — NestJS backend. Feature-based modules: auth, users, roles, pos, inventory, recipes, production, finance, reporting, notifications. Entry: `apps/api/src/main.ts`.
- **`apps/pos-app/`** — Angular POS for cashiers (port 4200)
- **`apps/admin-dashboard/`** — Admin panel (port 4201)
- **`apps/kitchen-screen/`** — Kitchen Display System (port 4202)
- **`apps/manager-dashboard/`** — Manager dashboard (port 4203)
- **`apps/hub-app/`** — Hub portal at `bake.ilia.to` — login + role-based links to sub-apps (port 4204)
- **`apps/mobile-app/`** — React Native (Expo) mobile app with Zustand, expo-router, expo-secure-store
- **`libs/shared-types/`** — Models (User, Order, Product, Inventory, Recipe), enums (UserRole, OrderStatus, InventoryStatus), shared across frontend and backend
- **`libs/api-client/`** — Angular HTTP client service (`ApiClientService` with get/post/put/delete)
- **`libs/auth/`** — JWT auth services and guards
- **`libs/state/`** — NgRx store configuration
- **`libs/ui-components/`** — Reusable Angular Material components

### Path Aliases

All imports use `@bake-app/` prefix: `@bake-app/shared-types`, `@bake-app/api-client`, `@bake-app/auth`, `@bake-app/state`, `@bake-app/ui-components`. App sources accessible via `@bake-app/api/*`, `@bake-app/pos-app/*`, etc.

### Key Patterns

- **Angular**: Standalone components with `bootstrapApplication`, NgRx with strict immutability, Angular Material UI
- **NestJS**: Feature modules with TypeORM entities, global validation pipe (whitelist + forbidNonWhitelisted + transform), JWT + RBAC auth, Swagger at `/api/docs`
- **Database**: PostgreSQL via TypeORM (auto-sync in dev), Redis for caching and Bull job queues
- **Real-time**: WebSockets via Socket.io
- **Offline**: IndexedDB via Dexie for POS transaction queue
- **9 User Roles**: OWNER, MANAGER, ACCOUNTANT, CHEF, BAKER, BARISTA, CASHIER, WAREHOUSE, MARKETING

### Module Boundaries

ESLint enforces Nx module boundaries: each app scope (`scope:api`, `scope:pos-app`, `scope:admin`, `scope:kitchen`, `scope:manager`) can only depend on `scope:shared` libraries. Apps cannot import from each other.

## UI Conventions

- **Loading states**: All data tables and settings panels must show a `MatProgressBar` (indeterminate) while data is loading. For `BakeDataTableComponent`, pass `[loading]="loading"`. For settings sub-components, add `<mat-progress-bar *ngIf="loading" mode="indeterminate">` above the form. Set `loading = true` before API calls, `loading = false` in both `next` and `error` callbacks.
- **Submit button disabling**: All form submit buttons (Add, Create, Save, Update) that trigger network calls must be disabled while the request is in flight. Use a `saving = false` property, set to `true` before the API call, `false` in both `next` and `error` callbacks. Bind with `[disabled]="saving"` on the button.

## Code Style

- Prettier: semicolons, single quotes, 2-space indent, 100 char line width, ES5 trailing commas
- TypeScript strict mode
