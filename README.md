# AdminHub API

Production-ready REST API for the **AdminHub** admin console — Backend Developer Round 2 Practical Assignment.

Built from the Figma design as the primary source of truth (see [docs/REQUIREMENTS_ANALYSIS.md](docs/REQUIREMENTS_ANALYSIS.md)).

## Tech Stack
- **NestJS 10** + **Node.js 20** + **TypeScript**
- **PostgreSQL 16** (via Docker)
- **Prisma 5** ORM (migrations + seed)
- **JWT** auth (`@nestjs/jwt` + Passport), **bcrypt** password hashing
- **class-validator / class-transformer** DTO validation
- **Swagger / OpenAPI** documentation
- **Helmet** + **@nestjs/throttler** rate limiting

## Domain model: two user populations
This API powers the **admin portal**. A separate **customer portal/website** serves
end-users. The two populations are modelled as separate tables:
- **AdminUser** — operators who log into this admin API (roles: Super Admin / Admin / Editor / Viewer).
- **Customer** — website end-users shown/managed in the admin portal; they own the
  transactions and bookings. (No admin-portal login.)

## Modules
| Module | Responsibility |
|--------|----------------|
| Auth | Admin login, refresh/logout, current user, JWT + role guards |
| Admin Users | Admin-team CRUD, filter/search/sort, bulk role/suspend |
| Customers | Customer CRUD, filter/search/sort, bulk suspend, detail with activity + transactions + bookings |
| Transactions | List, detail (events + ledger), create, status change |
| Bookings | List, detail (events + customer summary), create, reschedule/cancel |
| Dashboard | KPI stats (Total Users = customers, with vs-last-month %), revenue charts, alerts, system health |

---

## Quick Start

### 1. Prerequisites
- Node.js 20+
- Docker (for PostgreSQL) — or your own PostgreSQL 16 instance

### 2. Install
```bash
npm install
```

### 3. Environment
```bash
cp .env.example .env
# adjust values if needed (JWT_SECRET, DB creds, admin seed creds)
```

### 4. Start the database
```bash
docker compose up -d
```
This runs PostgreSQL on **localhost:5433** (mapped to avoid clashing with a local 5432).

### 5. Run migrations
```bash
npm run prisma:migrate      # creates tables from migrations (dev)
# or, against a clean DB in CI/prod:
npm run prisma:deploy
```

### 6. Seed realistic data
```bash
npm run db:seed
```

### 7. Run the API
```bash
npm run start:dev
```
- API base: `http://localhost:3000/api`
- Swagger UI: `http://localhost:3000/api/docs`

---

## Test Admin Credentials
| Email | Password |
|-------|----------|
| `admin@adminhub.com` | `Admin@12345` |

Other seeded users log in with password `Password@123`.

> Configure via `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` in `.env`.

---

## API Overview

All routes are prefixed with `/api`. All routes except `POST /auth/login` require
`Authorization: Bearer <token>`.

### Health
| Method | Path | Notes |
|--------|------|-------|
| GET | `/health` | Public liveness/readiness — pings PostgreSQL |

```json
{ "status": "ok", "database": "up", "uptime": 94, "timestamp": "2026-10-07T05:12:18.713Z" }
```

### Auth
| Method | Path | Notes |
|--------|------|-------|
| POST | `/auth/login` | Public, rate-limited (5/min) → `{ accessToken, refreshToken, user }` |
| POST | `/auth/refresh` | Public → rotates refresh token, returns a new pair |
| POST | `/auth/logout` | Public → revokes a refresh token |
| GET | `/auth/me` | Current user |

**Token strategy:** short-lived JWT **access token** (`JWT_EXPIRES_IN`, default `15m`)
+ long-lived opaque **refresh token** (`REFRESH_TOKEN_EXPIRES_IN_DAYS`, default `7`).
Refresh tokens are stored as SHA-256 hashes, **rotated on every use** (the old one is
revoked), and can be revoked via logout.

### Dashboard
| Method | Path | Notes |
|--------|------|-------|
| GET | `/dashboard/stats` | 4 KPIs + % change vs last month |
| GET | `/dashboard/charts?range=6M` | `7D\|1M\|3M\|6M\|1Y` |
| GET | `/dashboard/alerts` | System alerts |
| GET | `/dashboard/health` | Uptime / response time / sessions |

### Admin Users (admin-portal team)
| Method | Path | Notes |
|--------|------|-------|
| GET | `/admin-users` | `page,limit,search,role,status,sortBy,sortOrder,dateFrom,dateTo` |
| GET | `/admin-users/:id` | Single admin |
| POST | `/admin-users` | Admin+ |
| PATCH | `/admin-users/:id` | Admin+ |
| PATCH | `/admin-users/bulk` | Bulk `CHANGE_ROLE\|SUSPEND\|ACTIVATE` |
| DELETE | `/admin-users/:id` | Super Admin |

### Customers (website end-users)
| Method | Path | Notes |
|--------|------|-------|
| GET | `/customers` | `page,limit,search,role,status,sortBy,sortOrder,dateFrom,dateTo` |
| GET | `/customers/:id` | + activity log, recent txns & bookings |
| POST | `/customers` | Editor+ |
| PATCH | `/customers/:id` | Editor+ |
| PATCH | `/customers/bulk` | Bulk `CHANGE_ROLE\|SUSPEND\|ACTIVATE` |
| DELETE | `/customers/:id` | Admin+ |

> Customers also carry a `role` (Admin/Editor/Viewer), mirroring the Figma Users
> Directory. It is a label on the customer record; admin-portal access is still
> governed only by `AdminUser` roles.

### Transactions
| Method | Path | Notes |
|--------|------|-------|
| GET | `/transactions` | `search,type,status,amountMin,amountMax,dateFrom,dateTo,sort*` |
| GET | `/transactions/:id` | + events + related ledger |
| POST | `/transactions` | Editor+ |
| PATCH | `/transactions/:id/status` | Editor+ |

### Bookings
| Method | Path | Notes |
|--------|------|-------|
| GET | `/bookings` | `search,status,serviceType,paymentStatus,dateFrom,dateTo,sort*` |
| GET | `/bookings/:id` | + events + customer summary |
| POST | `/bookings` | Editor+ |
| PATCH | `/bookings/:id` | Reschedule / cancel / update |

### List response shape
```json
{
  "data": [],
  "meta": { "page": 1, "limit": 20, "total": 100, "totalPages": 5 }
}
```

### Error response shape
```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "error": "Bad Request",
  "timestamp": "2026-10-06T00:00:00.000Z",
  "path": "/api/users"
}
```

---

## Scripts
| Script | Action |
|--------|--------|
| `npm run start:dev` | Run with watch |
| `npm run build` | Compile to `dist/` |
| `npm run prisma:migrate` | Create/apply dev migration |
| `npm run prisma:deploy` | Apply migrations (prod/CI) |
| `npm run db:seed` | Seed realistic data |
| `npm run db:reset` | Drop, re-migrate, re-seed |
| `npm run prisma:studio` | Visual DB browser |

---

## Architecture Notes
- **Thin controllers**, business logic in services.
- Shared helpers for pagination / sorting / date-range filtering (`src/common/pagination`).
- Global `ValidationPipe` with whitelist + `forbidNonWhitelisted` (unknown props rejected).
- Global `HttpExceptionFilter` → consistent error shape, maps Prisma errors to HTTP codes.
- Dashboard statistics & chart series are **computed in the backend**, never by the client.
- Passwords hashed with bcrypt; password hashes never leave the service layer.
- JWT guard applied globally (`@Public()` opts out); `@Roles()` for RBAC.
- Short access tokens + rotating, revocable refresh tokens (SHA-256 hashed at rest).
- Swagger UI is disabled when `NODE_ENV=production` (override with `SWAGGER_ENABLED=true`).
- DB connection is composed from individual `DB_*` vars (no hand-written `DATABASE_URL`);
  set `DB_SSL=true` for remote/managed Postgres. The app builds the URL in
  `PrismaService`; the Prisma CLI gets it via `scripts/with-db-url.ts`.

See [docs/REQUIREMENTS_ANALYSIS.md](docs/REQUIREMENTS_ANALYSIS.md) and [docs/ER_DIAGRAM.md](docs/ER_DIAGRAM.md).
