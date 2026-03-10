# Bake App - Phase 1 Monorepo Structure

Complete folder and file structure for the unified café-bakery automation platform Phase 1 prototype.

## 🏗️ Project Structure

```
bake-app/
├── apps/                          # All applications
│   ├── api/                       # NestJS Backend API
│   │   ├── src/
│   │   │   ├── main.ts           # Application entry point
│   │   │   ├── app.module.ts     # Root module
│   │   │   ├── modules/          # Feature modules
│   │   │   │   ├── auth/
│   │   │   │   ├── users/
│   │   │   │   ├── roles/
│   │   │   │   ├── pos/
│   │   │   │   ├── inventory/
│   │   │   │   ├── recipes/
│   │   │   │   ├── production/
│   │   │   │   ├── finance/
│   │   │   │   ├── reporting/
│   │   │   │   └── notifications/
│   │   │   ├── common/           # Shared utilities
│   │   │   ├── database/         # Database config & migrations
│   │   │   └── config/           # Configuration files
│   │   ├── package.json
│   │   └── .env.example
│   │
│   ├── pos-app/                  # Point of Sale Angular App
│   │   ├── src/
│   │   │   ├── main.ts
│   │   │   ├── app/
│   │   │   ├── environments/
│   │   │   ├── index.html
│   │   │   └── styles.css
│   │   ├── proxy.conf.js          # API proxy config (reads from .env)
│   │   └── tsconfig.app.json
│   │
│   ├── admin-dashboard/          # Admin Dashboard Angular App
│   ├── kitchen-screen/           # Kitchen Display Screen
│   └── manager-dashboard/        # Manager Dashboard
│
├── libs/                          # Shared libraries
│   ├── ui-components/            # Reusable Angular components
│   ├── shared-types/             # TypeScript models & interfaces
│   ├── auth/                      # Authentication services & guards
│   ├── api-client/               # HTTP client wrapper
│   └── state/                    # NgRx store configuration
│
├── .angular.json                 # Angular workspace configuration
├── angular.json                  # Angular build configuration
├── tsconfig.json                 # Root TypeScript configuration
├── package.json                  # Root dependencies
├── jest.config.js                # Test configuration
├── .eslintrc.json                # Linting configuration
├── .prettierrc                   # Code formatting rules
├── .gitignore                    # Git ignore patterns
├── nx.json                       # Monorepo configuration
├── Technology.md                 # Phase 1 tech stack
├── SecondPhaseTechnology.md      # Phase 2 roadmap
└── README.md
```

## 🚀 Setup Instructions

### Prerequisites
- Node.js 18+ (LTS recommended)
- npm 9+
- PostgreSQL 12+ (for database)
- Redis 6+ (for caching & queues)

### Installation

1. **Install dependencies:**
   ```bash
   npm install --legacy-peer-deps
   ```

2. **Configure environment:**

   Each app has its own `.env.example` file. Copy it to `.env` and adjust values:

   ```bash
   # API (required)
   cp apps/api/.env.example apps/api/.env

   # Frontend apps (optional — defaults to http://localhost:3000)
   cp apps/pos-app/.env.example apps/pos-app/.env
   cp apps/admin-dashboard/.env.example apps/admin-dashboard/.env
   cp apps/kitchen-screen/.env.example apps/kitchen-screen/.env
   cp apps/hub-app/.env.example apps/hub-app/.env

   # Mobile app
   cp apps/mobile-app/.env.example apps/mobile-app/.env
   ```

   See the [Environment Configuration](#-environment-configuration) section below for details.

3. **Create database:**
   ```bash
   # Use your preferred PostgreSQL client to create the bake_app database
   createdb bake_app
   ```

## 📦 Running the Applications

### Backend API
```bash
npm run serve:api
# or
npm run start:dev  # Development mode with watch

# API will run on http://localhost:3000
# Swagger docs available at http://localhost:3000/api/docs
```

### Frontend Applications
Open separate terminals for each app:

```bash
# POS Application (port 4200)
npm run serve:pos

# Admin Dashboard (port 4201)
npm run serve:admin

# Kitchen Screen (port 4202)
npm run serve:kitchen

# Manager Dashboard (port 4203)
npm run serve:manager
```

## 🛠️ Development Workflow

### Building
```bash
npm run build
```

### Testing
```bash
npm run test
```

### Linting
```bash
npm run lint
```

## 📁 File Organization

### Backend Module Structure
Each backend module follows this pattern:
```
module/
├── module.module.ts          # Module definition
├── module.controller.ts      # REST endpoints
├── module.service.ts         # Business logic
├── dto/                      # Data Transfer Objects
├── entities/                 # TypeORM entities
└── module.spec.ts            # Tests
```

### Frontend Module Structure
Each Angular app has:
```
app/
├── app.component.ts          # Root component
├── app.routes.ts             # Routing configuration
├── pages/                    # Page components
├── services/                 # API services
└── state/                    # NgRx store (optional)
```

### Shared Libraries
Each library provides:
```
lib/
├── src/index.ts              # Public API
├── src/lib/                  # Implementation
├── tsconfig.json             # TypeScript config
└── ng-package.json           # Building config
```

## 🔐 Authentication

- JWT-based authentication
- Role-based access control (RBAC)
- Protected routes via AuthGuard
- Token stored in localStorage

## 📡 API Integration

All Angular apps use the shared `@bake-app/api-client` library:
```typescript
import { ApiClientService } from '@bake-app/api-client';

// Use in services
this.apiClient.get('/api/v1/users');
this.apiClient.post('/api/v1/orders', orderData);
```

## 🗄️ Database

- **ORM:** TypeORM
- **Database:** PostgreSQL
- **Migrations:** TypeORM CLI
- **Real-time:** WebSockets for live updates

## 🚦 State Management

Angular apps use NgRx for state management:
- Store: Centralized state
- Effects: Side effects management
- Entity Adapter: Normalized collections
- DevTools: Redux debugging

## 🔄 Real-Time Features

WebSocket support for:
- Live inventory updates
- Order status synchronization
- Kitchen display updates
- Notification broadcasting

## 📚 API Documentation

Swagger docs available at:
```
http://localhost:3000/api/docs
```

All endpoints follow RESTful conventions with `/api/v1/` prefix.

## 🧪 Testing Strategy

- **Unit Tests:** Jest
- **E2E Tests:** Playwright (setup ready)
- **Coverage Target:** 80%+

## ⚙️ Environment Configuration

Each application reads its configuration from a `.env` file in its root directory. `.env` files are git-ignored — only `.env.example` files are committed.

### API (`apps/api/.env`)

| Variable | Description | Default |
|---|---|---|
| `NODE_ENV` | Environment mode | `development` |
| `PORT` | API server port | `3000` |
| `CORS_ORIGINS` | Comma-separated allowed origins | `http://localhost:4200,...4204` |
| `DB_HOST` | PostgreSQL host | `localhost` |
| `DB_PORT` | PostgreSQL port | `5432` |
| `DB_USERNAME` | Database user | `postgres` |
| `DB_PASSWORD` | Database password | `postgres` |
| `DB_NAME` | Database name | `bake_app` |
| `REDIS_HOST` | Redis host | `localhost` |
| `REDIS_PORT` | Redis port | `6379` |
| `JWT_SECRET` | Secret for JWT signing | *(must change in prod)* |
| `JWT_EXPIRATION` | Token expiry duration | `24h` |
| `ANTHROPIC_API_KEY` | API key for AI recipe features | *(optional)* |

### Frontend Apps (`apps/<app-name>/.env`)

All Angular frontend apps (pos-app, admin-dashboard, kitchen-screen, hub-app) share the same config:

| Variable | Description | Default |
|---|---|---|
| `API_URL` | Backend API URL for the dev proxy | `http://localhost:3000` |

To point a frontend at the production API during development:
```bash
echo "API_URL=https://api.bake.ilia.to" > apps/admin-dashboard/.env
```

The proxy is configured in `proxy.conf.js` which reads from `.env`. In production builds, frontends use relative `/api` paths and nginx proxies to the API.

### Hub App (`apps/hub-app/.env`)

Additional variables for sub-app links:

| Variable | Description | Default |
|---|---|---|
| `POS_URL` | POS app URL | `https://pos.bake.ilia.to` |
| `ADMIN_URL` | Admin dashboard URL | `https://admin.bake.ilia.to` |
| `KITCHEN_URL` | Kitchen display URL | `https://kitchen.bake.ilia.to` |

### Mobile App (`apps/mobile-app/.env`)

| Variable | Description | Default |
|---|---|---|
| `API_URL` | Backend API URL | `http://localhost:3000` (dev) / `https://api.bake.ilia.to` (prod) |
| `WS_URL` | WebSocket URL | Same as `API_URL` |

### Production Deployment

On the VPS, the API reads from `/opt/bake-app/.env.production` via PM2's `ecosystem.config.js`. Frontend apps are pre-built static files served by nginx with `/api` and `/socket.io/` proxied to the API on port 3100.

### Security Notes

- Never commit `.env` files (they are in `.gitignore`)
- Only `.env.example` files with placeholder values are committed
- Production `.env.production` should have `600` file permissions
- NestJS does not serve static files, so `.env` is not web-accessible
- nginx serves only the built frontend assets from `/var/www/bake-app/`

## 📝 Next Steps

1. Implement database entities and migrations
2. Build authentication module
3. Create POS module with order management
4. Implement inventory management
5. Add recipe management
6. Develop reporting features
7. Integrate real-time WebSockets

## 📖 Documentation Files

- [Technology.md](Technology.md) - Phase 1 tech stack details
- [SecondPhaseTechnology.md](SecondPhaseTechnology.md) - Phase 2 roadmap

## 🤝 Contributing

- Follow existing file structure
- Use TypeScript for type safety
- Add tests for new features
- Run linting before committing

## 📄 License

MIT
