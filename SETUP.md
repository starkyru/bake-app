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
│   │   ├── proxy.conf.json       # API proxy config
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
   ```bash
   cp apps/api/.env.example apps/api/.env
   ```
   Update `.env` with your database and Redis connection details.

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
