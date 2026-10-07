# Claude Code Instructions — Backend Developer Round 2

## Project

Build the production-ready REST API for the **Backend Developer Round 2 Practical Assignment**.

The assignment requires:

- NestJS + Node.js + TypeScript
- PostgreSQL
- Prisma OR TypeORM (choose one and use it consistently)
- REST APIs
- JWT authentication
- DTO validation with class-validator/class-transformer (or Zod)
- Swagger/OpenAPI/Postman documentation
- `.env` configuration
- Database migrations
- Realistic seed data

## Primary References

### Figma — PRIMARY DESIGN REFERENCE

Use the provided Figma design as the primary source for determining:

- screens
- tables
- columns
- forms
- filters
- charts
- dashboard KPIs
- statuses
- detail views
- user interactions
- required backend data
- entities and relationships
- API behaviour

Figma:
https://www.figma.com/community/file/1687046333054375145

### Frontend UI Reference

Use this only as an additional reference for understanding interactions:

https://miles-flax.vercel.app/

The frontend is a static implementation. Do not treat it as the source of truth when it conflicts with Figma.

## Critical Rule: Analyze Before Coding

Do NOT immediately generate the backend from assumptions.

First inspect/analyze the Figma design through the available Figma MCP integration.

Before implementing code, produce a backend requirements analysis covering:

1. Every screen
2. Every table/list
3. Every form
4. Every filter
5. Every sort option
6. Every search field
7. Every chart
8. Every KPI/statistic
9. Every status value
10. Every detail view
11. Every entity
12. Entity fields
13. Entity relationships
14. Required CRUD operations
15. Pagination requirements
16. Dashboard calculations
17. Date filtering requirements
18. Any additional modules/entities visible in Figma

If something cannot be established from Figma, explicitly mark it as an assumption instead of silently inventing it.

## Required Modules

At minimum:

- Auth
- Dashboard
- Users
- Transactions
- Bookings

Add additional modules/entities only when supported by the Figma design or clearly required to implement its demonstrated functionality.

Each module should follow clean NestJS separation:

- module
- controller
- service
- DTOs
- entity/model where appropriate

## Required API Contract

At minimum implement:

### Auth

POST `/auth/login`

GET `/auth/me`

### Dashboard

GET `/dashboard/stats`

GET `/dashboard/charts`

GET `/dashboard/alerts`

### Users

GET `/users`

GET `/users/:id`

POST `/users`

PATCH `/users/:id`

DELETE `/users/:id`

### Transactions

GET `/transactions`

GET `/transactions/:id`

POST `/transactions`

PATCH `/transactions/:id/status`

### Bookings

GET `/bookings`

GET `/bookings/:id`

POST `/bookings`

PATCH `/bookings/:id`

Endpoint names may be adjusted if the final domain model requires it, but all Figma-supported functionality must be covered.

## List API Requirements

All list endpoints must support where relevant:

- `page`
- `limit`
- search
- filters
- date range
- sorting
- sort order

Response metadata should follow:

```json
{
  "data": [],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

Backend must calculate dashboard statistics and chart series. Do not make the frontend calculate business statistics.

## Database Requirements

Design a normalized PostgreSQL schema.

Use:

- primary keys
- foreign keys
- appropriate PostgreSQL types
- enums where appropriate
- unique constraints
- indexes for commonly searched/filtered/sorted columns
- `createdAt`
- `updatedAt`

All schema changes must be handled through migrations.

Do not manually create production tables.

Create realistic seed data so the dashboard, charts, tables, filters and detail pages can be demonstrated.

Include an ER diagram/schema diagram in the final submission.

## Authentication & Security

Use JWT authentication.

Passwords must be hashed using bcrypt or Argon2.

Never return password hashes.

Protect secured routes with authentication guards.

Use DTO whitelisting/validation.

Reject or strip unexpected properties according to the chosen validation strategy.

Use ORM parameterization and avoid unsafe raw SQL.

Add appropriate security middleware such as Helmet.

Add rate limiting, especially for login.

Never commit secrets.

Provide `.env.example`.

## Error Handling

Implement consistent errors for:

- 400 validation errors
- 401 unauthenticated
- 403 unauthorized
- 404 not found
- 409 conflicts
- 500 unexpected errors

Use a global exception filter and validation pipe.

A consistent error shape should contain fields such as:

```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "error": "Bad Request",
  "timestamp": "2026-01-01T00:00:00.000Z",
  "path": "/api/users"
}
```

Do not expose stack traces or sensitive implementation details.

Empty list results should return HTTP 200 with an empty `data` array and valid metadata.

## Architecture Rules

Keep controllers thin.

Business logic belongs in services.

Prefer reusable utilities/helpers for:

- pagination
- filtering
- sorting
- response formatting

Use strong TypeScript types.

Avoid unnecessary `any`.

Use meaningful names.

Keep modules cohesive.

Avoid duplicated business logic.

Use sensible logging.

## Suggested Project Structure

Adapt this to the final domain:

```text
src/
├── auth/
│   ├── auth.controller.ts
│   ├── auth.service.ts
│   ├── auth.module.ts
│   ├── dto/
│   ├── guards/
│   └── strategies/
│
├── dashboard/
│   ├── dashboard.controller.ts
│   ├── dashboard.service.ts
│   └── dashboard.module.ts
│
├── users/
│   ├── users.controller.ts
│   ├── users.service.ts
│   ├── users.module.ts
│   └── dto/
│
├── transactions/
│   ├── transactions.controller.ts
│   ├── transactions.service.ts
│   ├── transactions.module.ts
│   └── dto/
│
├── bookings/
│   ├── bookings.controller.ts
│   ├── bookings.service.ts
│   ├── bookings.module.ts
│   └── dto/
│
├── common/
│   ├── decorators/
│   ├── filters/
│   ├── guards/
│   ├── interceptors/
│   ├── pipes/
│   └── pagination/
│
├── prisma/
│   └── prisma.service.ts
│
├── app.module.ts
└── main.ts

prisma/
├── schema.prisma
├── migrations/
└── seed.ts
```

Modify the structure if the actual Figma analysis indicates additional domain modules.

## Development Workflow

Follow this order:

### Phase 1 — Discovery

1. Inspect Figma using Figma MCP.
2. Inspect the static frontend reference.
3. Create a requirements/domain analysis.
4. Identify entities and relationships.
5. Identify all API requirements.
6. Identify dashboard calculations.

Do not code until this analysis is complete.

### Phase 2 — Design

Create:

- ER/data model
- Prisma/ORM schema
- entity relationships
- enums
- indexes
- API contract
- DTO design
- pagination/filter/sort strategy

Review the design for normalization and unnecessary duplication.

### Phase 3 — Implementation

Implement:

1. project configuration
2. database connection
3. migrations
4. seed
5. common infrastructure
6. authentication
7. users
8. transactions
9. bookings
10. dashboard
11. any additional Figma-required modules

### Phase 4 — Validation

Test:

- authentication
- validation
- authorization
- CRUD
- pagination
- search
- filters
- sorting
- date ranges
- empty results
- invalid IDs
- duplicate values
- dashboard statistics
- charts
- status changes

### Phase 5 — Documentation

Provide:

- Swagger/OpenAPI
- README
- `.env.example`
- migration instructions
- seed instructions
- test admin credentials
- ER diagram
- architecture explanation

## Important Assignment Constraints

Never:

- use Firebase
- use Supabase
- use json-server
- use another ready-made backend service
- hard-code API responses
- mock API responses instead of PostgreSQL data
- commit secrets/private keys
- manually create database tables instead of migrations

Every application data response must ultimately come from PostgreSQL.

## Optional Bonus

Only after all required functionality is complete, consider:

- Docker Compose
- unit tests
- e2e tests
- RBAC
- soft delete
- audit logging
- Redis caching
- CSV exports
- deployment

Do not sacrifice required functionality for bonus features.

## Code Generation Behaviour

When implementing a feature:

1. Explain briefly what is being implemented.
2. Inspect existing code before modifying it.
3. Reuse existing abstractions where appropriate.
4. Do not create duplicate utilities/services.
5. Keep changes scoped to the feature.
6. Run/type-check/test after meaningful changes.
7. Fix errors rather than ignoring them.
8. Never silently change the database model because of an implementation shortcut.
9. If a requirement is ambiguous, identify the ambiguity and state the assumption.
10. Prefer production-ready code over a quick demo.

## Final Quality Checklist

Before considering the assignment complete, verify:

- [ ] NestJS architecture is modular
- [ ] TypeScript is used throughout
- [ ] PostgreSQL is the actual data store
- [ ] ORM is configured correctly
- [ ] migrations work from a clean database
- [ ] seed works
- [ ] JWT authentication works
- [ ] passwords are hashed
- [ ] secured routes are protected
- [ ] DTO validation works
- [ ] pagination works
- [ ] search works
- [ ] filters work
- [ ] sorting works
- [ ] date filtering works
- [ ] CRUD endpoints work
- [ ] dashboard stats are calculated by backend
- [ ] chart data is calculated by backend
- [ ] errors are consistent
- [ ] Swagger is available
- [ ] `.env.example` exists
- [ ] README is complete
- [ ] ER diagram exists
- [ ] test admin credentials are documented
- [ ] no secrets are committed
- [ ] no mocked/hard-coded application data is being returned

## Git

Use meaningful commits, for example:

```text
chore: initialize NestJS project
feat: add database schema and migrations
feat: add admin authentication
feat: add users module
feat: add transactions module
feat: add bookings module
feat: add dashboard statistics
feat: add dashboard chart APIs
feat: add Swagger documentation
test: add API integration tests
docs: add setup and architecture documentation
```

Do not make one giant commit containing the entire project unless necessary.
