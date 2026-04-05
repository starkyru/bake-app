# Architecture Overview

## System Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              FRONTEND APPS                                      │
│                                                                                 │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐           │
│  │   POS App    │ │    Admin     │ │   Kitchen    │ │   Hub App    │           │
│  │   (React)    │ │  Dashboard   │ │   Display    │ │   (React)    │           │
│  │   :4200      │ │  :4201       │ │  :4202       │ │   :4204      │           │
│  └──────┬───────┘ └──────┬───────┘ └──────┬───────┘ └──────┬───────┘           │
│         │                │                │                │                    │
│  ┌──────────────┐ ┌──────────────┐                                             │
│  │  Ordering    │ │  Mobile App  │                                             │
│  │  (React)     │ │  (Expo RN)   │                                             │
│  │  storefront  │ │              │                                             │
│  └──────┬───────┘ └──────┬───────┘                                             │
│         │                │                                                      │
│         └────────────────┼─────────────────────────────────┘                    │
│                          │                                                      │
│  ┌───────────────────────┼──────────────────────────────────────┐               │
│  │     Shared Libraries  │                                      │               │
│  │  @bake-app/react/api-client   @bake-app/react/auth           │               │
│  │  @bake-app/react/store        @bake-app/react/ui             │               │
│  │  @bake-app/shared-types                                      │               │
│  └───────────────────────┼──────────────────────────────────────┘               │
└──────────────────────────┼──────────────────────────────────────────────────────┘
                           │ HTTP/REST        WebSocket (Socket.io)
                           │ /api/v1/*        ws://
┌──────────────────────────┼──────────────────────────────────────────────────────┐
│                     NestJS API Server (:3000 dev / :3100 prod)                  │
│                                                                                 │
│  ┌──────────────────────────────────────────────────────────────────────────┐   │
│  │                        API Gateway Layer                                 │   │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐     │   │
│  │  │JWT Guard │ │Roles     │ │Validation│ │Swagger   │ │Throttler │     │   │
│  │  │          │ │Guard     │ │Pipe      │ │/api/docs │ │          │     │   │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘     │   │
│  └──────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
│  ┌──────────────────────────────────────────────────────────────────────────┐   │
│  │                      Feature Modules (15)                                │   │
│  │                                                                          │   │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐     │   │
│  │  │  Auth    │ │  Users   │ │  Roles   │ │   POS    │ │Permissions│     │   │
│  │  │  Module  │ │  Module  │ │  Module  │ │  Module  │ │  Module  │     │   │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘     │   │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐     │   │
│  │  │Inventory │ │ Recipes  │ │Production│ │ Finance  │ │Reporting │     │   │
│  │  │  Module  │ │  Module  │ │  Module  │ │  Module  │ │  Module  │     │   │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘     │   │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐     │   │
│  │  │Notific.  │ │WebSocket │ │Settings  │ │ Online   │ │ Payment  │     │   │
│  │  │  Module  │ │  Module  │ │  Module  │ │ Ordering │ │Providers │     │   │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘     │   │
│  └──────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
│  ┌──────────────────────────────────────────────────────────────────────────┐   │
│  │                    Data & Infrastructure                                  │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                   │   │
│  │  │  PostgreSQL  │  │    Redis     │  │  Bull Queue  │                   │   │
│  │  │  (TypeORM)   │  │  (Cache)     │  │  (Jobs)      │                   │   │
│  │  │  46 entities │  │              │  │              │                   │   │
│  │  └──────────────┘  └──────────────┘  └──────────────┘                   │   │
│  └──────────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## Module Dependency Graph

```
AppModule
├── ConfigModule (global)
├── ThrottlerModule
├── TypeOrmModule (PostgreSQL, autoLoadEntities, synchronize: dev only)
├── AuthModule
│   ├── JwtModule
│   └── PassportModule
├── UsersModule
├── RolesModule
├── PermissionsModule
├── PosModule ──────────────────► EventEmitter2
│   └── entities: Category, Product, Order, OrderItem, Payment, Menu, MenuProduct,
│                 ProductOptionGroup, ProductOption
├── InventoryModule ────────────► EventEmitter2
│   └── entities: Ingredient, IngredientCategory, InventoryItem, InventoryItemPackage,
│                 InventoryShipment, InventoryMovement, Location
├── RecipesModule
│   └── entities: Recipe, RecipeIngredient, RecipeLink, RecipeVersion
├── ProductionModule ───────────► EventEmitter2
│   └── entities: ProductionPlan, ProductionTask
├── FinanceModule
│   └── entities: FinanceTransaction, ExpenseRecord
├── ReportingModule
│   └── reads from: all POS, Finance, Inventory, Production entities
├── NotificationsModule ────────► EventEmitter2
│   └── entities: Notification
├── SettingsModule
│   └── entities: Setting
├── WebsocketModule
│   ├── EventEmitterModule.forRoot()
│   ├── JwtModule (for handshake auth)
│   ├── AppWebSocketGateway
│   └── WsEventsListener
├── OnlineOrderingModule
│   └── entities: Customer, CustomerAddress, LocationConfig, LocationMenu,
│                 MenuSchedule, MenuTag, MenuConfig, DeliveryZone,
│                 OrderItemOption, CustomOrderRequest,
│                 CustomerNotificationSubscription, PushSubscription,
│                 StorefrontConfig
└── PaymentProvidersModule
    └── entities: StorefrontPaymentConfig
```

---

## Cross-Domain SSO Flow

```
┌──────────┐     login      ┌──────────┐     JWT token      ┌──────────────┐
│  Hub App │───────────────►│ Auth API │────────────────────►│ localStorage │
│ bake.    │                │ /auth/   │                     │    +         │
│ ilia.to  │                │ login    │                     │ cookie       │
└──────────┘                └──────────┘                     │ (bake_token) │
                                                             │ .bake.ilia.to│
     On app load, AuthProvider syncs cookie ↔ localStorage   └──────┬───────┘
                                                                    │
         ┌──────────────────────────────────────────────────────────┤
         │                    │                    │                │
   ┌─────▼──────┐     ┌──────▼─────┐     ┌───────▼────┐   ┌──────▼──────┐
   │ pos.bake.  │     │admin.bake. │     │kitchen.bake│   │ order.bake. │
   │ ilia.to    │     │ilia.to     │     │.ilia.to    │   │ ilia.to     │
   │            │     │            │     │            │   │             │
   │ reads      │     │ reads      │     │ reads      │   │ reads       │
   │ bake_token │     │ bake_token │     │ bake_token │   │ bake_token  │
   └────────────┘     └────────────┘     └────────────┘   └─────────────┘
```

---

## WebSocket Event Flow

```
┌─────────────┐    emit()     ┌─────────────────┐   @OnEvent()   ┌────────────────┐
│             │──────────────►│                 │──────────────►│                │
│  Service    │   EventEmitter│  WsEvents       │  emitToRoom() │  WebSocket     │
│  (POS,      │               │  Listener       │               │  Gateway       │
│  Inventory, │               │                 │               │  (Socket.io)   │
│  etc.)      │               │                 │               │                │
└─────────────┘               └─────────────────┘               └───────┬────────┘
                                                                        │
                                                               Socket.io emit
                                                                        │
                                                    ┌───────────────────┼──────────────┐
                                                    │                   │              │
                                              ┌─────▼─────┐     ┌──────▼────┐  ┌──────▼────┐
                                              │  kitchen   │     │   pos     │  │  manager  │
                                              │   room     │     │   room    │  │   room    │
                                              │            │     │           │  │           │
                                              │ chef       │     │ cashier   │  │ owner     │
                                              │ baker      │     │ barista   │  │ manager   │
                                              │ barista    │     │           │  │           │
                                              └────────────┘     └───────────┘  └───────────┘

Events: order:new, order:statusChanged, inventory:updated, production:taskUpdated, etc.
Client: useWebSocketStore (Zustand) auto-invalidates TanStack Query caches on events.
```

---

## Online Ordering Architecture

```
                      Customer-facing                          Admin-facing
                    ┌─────────────────┐                   ┌─────────────────┐
                    │  Ordering App   │                   │ Admin Dashboard │
                    │ (React SPA)     │                   │                 │
                    │ tulipbakeryclt  │                   │ Online Config   │
                    │ .com            │                   │ Online Orders   │
                    └────────┬────────┘                   │ Custom Requests │
                             │                            │ Customers       │
                             │                            └────────┬────────┘
                             │                                     │
                    ┌────────▼─────────────────────────────────────▼────────┐
                    │                  API Server                           │
                    │                                                      │
                    │  /api/v1/storefront/*     /api/v1/admin/*            │
                    │  (Customer JWT auth)      (Staff JWT + RBAC)        │
                    │                                                      │
                    │  ┌─────────────────────────────────────────────┐     │
                    │  │          OnlineOrderingModule               │     │
                    │  │                                             │     │
                    │  │  Storefront controllers (public/auth):     │     │
                    │  │    CustomerAuth, OnlineMenu, Orders,       │     │
                    │  │    CustomOrders, CustomerProfile            │     │
                    │  │                                             │     │
                    │  │  Admin controllers (staff auth + RBAC):    │     │
                    │  │    LocationConfig, MenuConfig, Customers,  │     │
                    │  │    OnlineOrders, CustomOrders, Storefront  │     │
                    │  └─────────────────────────────────────────────┘     │
                    │                                                      │
                    │  ┌─────────────────────────────────────────────┐     │
                    │  │        PaymentProvidersModule               │     │
                    │  │  Stripe / PayPal webhooks                  │     │
                    │  │  Encrypted secret storage                  │     │
                    │  └─────────────────────────────────────────────┘     │
                    └──────────────────────────────────────────────────────┘
```

---

## Entity Relationship Overview

```
                    ┌──────────────┐
                    │   Customer   │ (online ordering)
                    └──────┬───────┘
                           │
              ┌────────────┼────────────┐
              │            │            │
        ┌─────▼────┐ ┌────▼─────┐ ┌────▼──────────┐
        │ Address  │ │  Order   │ │CustomOrderReq │
        └──────────┘ └────┬─────┘ └───────────────┘
                          │
                    ┌─────▼──────┐     ┌────────────┐
                    │ OrderItem  │────►│  Product   │
                    └─────┬──────┘     └─────┬──────┘
                          │                  │
                    ┌─────▼──────┐     ┌─────▼──────────┐
                    │OrderItemOpt│     │ProductOptGroup │
                    └────────────┘     └─────┬──────────┘
                                             │
                    ┌────────────┐      ┌────▼──────────┐
                    │  Payment   │      │ ProductOption │
                    └────────────┘      └───────────────┘

┌────────────┐     ┌────────────┐     ┌────────────┐
│   Recipe   │────►│RecipeIngr. │◄────│ Ingredient │
└──────┬─────┘     └────────────┘     └──────┬─────┘
       │                                     │
┌──────▼─────┐                        ┌──────▼─────────┐
│RecipeLink  │                        │ InventoryItem  │
│RecipeVers. │                        └──────┬─────────┘
└────────────┘                               │
                                      ┌──────▼─────────┐
┌──────────────┐                      │InventoryMovmnt │
│ProductionPlan│                      └────────────────┘
└──────┬───────┘
       │           ┌──────────┐     ┌──────────────┐
┌──────▼───────┐   │ Location │────►│LocationConfig│
│ProductionTask│   │          │────►│DeliveryZone  │
└──────────────┘   │          │────►│StorefrontCfg │
                   └──────────┘     └──────────────┘

┌──────────┐  ┌────────────┐  ┌──────────┐  ┌────────────┐
│   Menu   │─►│ MenuConfig │  │ MenuTag  │  │MenuSchedule│
│          │─►│ LocMenu    │  │          │  │            │
└──────────┘  └────────────┘  └──────────┘  └────────────┘

All entities extend BaseEntity: { id: UUID, createdAt: Date, updatedAt: Date }
```

---

## User Roles & Access Matrix

| Role | POS | Inventory | Recipes | Production | Finance | Reports | Online Ordering | Notifications |
|------|-----|-----------|---------|------------|---------|---------|-----------------|--------------|
| Owner | Full | Full | Full | Full | Full | All | Full | Receive |
| Manager | Full | Full | Full | Full | View | Most | Full | Receive |
| Accountant | View | - | - | - | Full | Finance | View Orders | Receive |
| Chef | - | View | Full | Full | - | Prod/Inv | View Custom | Receive |
| Baker | - | View | View | Execute | - | - | - | Receive |
| Barista | Operate | View | View | Execute | - | - | - | Receive |
| Cashier | Operate | - | - | - | - | - | - | Receive |
| Warehouse | - | Full | - | - | - | Inventory | - | Receive |
| Marketing | - | - | - | - | - | Sales | View | Receive |

---

## Deployment Architecture

```
                                    ┌─────────────────────────┐
                                    │     GitHub Actions       │
                                    │                         │
                                    │  test → build → deploy  │
                                    │         + db:sync        │
                                    └────────────┬────────────┘
                                                 │ SSH + rsync
                                                 ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                         VPS (bake.ilia.to)                              │
│                                                                         │
│  ┌──────────────────────────────────────────────────────────────┐       │
│  │                        nginx                                  │       │
│  │                                                               │       │
│  │  bake.ilia.to        → hub-app (static)                      │       │
│  │  pos.bake.ilia.to    → pos-app (static)                      │       │
│  │  admin.bake.ilia.to  → admin-dashboard (static)              │       │
│  │  kitchen.bake.ilia.to→ kitchen-screen (static)               │       │
│  │  api.bake.ilia.to    → proxy to localhost:3100               │       │
│  └──────────────────────────────────────────────────────────────┘       │
│                                                                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                  │
│  │  PM2         │  │  PostgreSQL  │  │    Redis     │                  │
│  │  bake-api    │  │  16          │  │    7         │                  │
│  │  port 3100   │  │              │  │              │                  │
│  └──────────────┘  └──────────────┘  └──────────────┘                  │
└──────────────────────────────────────────────────────────────────────────┘

Schema management: `node scripts/db-sync.js` runs TypeORM synchronize
                   after each deploy (safe for additive changes).
```

---

## Technology Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19 (Vite 5, TypeScript strict) |
| Routing | React Router v7 |
| Server State | TanStack Query v5 |
| Client State | Zustand v5 |
| Styling | Tailwind CSS v4 |
| Icons | Lucide React |
| Toasts | Sonner |
| Forms | React Hook Form |
| Backend Framework | NestJS 10 |
| Database | PostgreSQL 16 (TypeORM, 46 entities) |
| Cache | Redis 7 |
| Job Queue | Bull (Redis-backed) |
| WebSocket | Socket.io via @nestjs/platform-socket.io |
| Event Bus | @nestjs/event-emitter (EventEmitter2) |
| Auth | JWT + Passport (staff) / JWT (customers) |
| API Docs | Swagger (OpenAPI) at /api/docs |
| Monorepo | Nx |
| Mobile | React Native (Expo) with expo-router |
| CI/CD | GitHub Actions → SSH deploy |
| Process Manager | PM2 (production) |
