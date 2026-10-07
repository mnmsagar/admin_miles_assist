# AdminHub — Backend Requirements Analysis (Phase 1)

> Source of truth: Figma design `Admin Hub (Community)` (fileKey `0KFFDtjmZNLuy6I1rOVIdg`), inspected via Figma MCP.
> Secondary reference: https://miles-flax.vercel.app/ (static frontend).
> Assumptions are explicitly tagged **[ASSUMPTION]**.

> **Revision (user model):** This API powers the **admin portal**; a separate
> **customer portal/website** serves end-users. Accordingly the single `User`
> entity below was split into two tables — **AdminUser** (portal operators who log
> in, with roles) and **Customer** (website end-users who own transactions &
> bookings). FKs point to `Customer`; auth/refresh tokens belong to `AdminUser`;
> dashboard "Total Users" counts customers. See [ER_DIAGRAM.md](./ER_DIAGRAM.md).

---

## 1. Screens Inventory

| # | Screen (Figma frame) | Type | Purpose |
|---|----------------------|------|---------|
| 1 | `dashboard-main` | Desktop | KPIs, revenue chart, recent transactions, alerts, system health |
| 2 | `users-page` | Desktop | Users directory (list + filters + bulk actions) |
| 3 | `transactions-page` | Desktop | Transactions ledger (list + filters) |
| 4 | `bookings-page` | Desktop | Bookings directory (list + filters) |
| 5 | user-detail (in bookings frame) | Desktop | Single user profile + activity + related txns/bookings |
| 6 | transaction-detail | Desktop | Single transaction invoice + processing history + ledger |
| 7 | booking-detail | Desktop | Single booking logistics + payment + lifecycle logs |
| 8 | `mobile-transactions` | Mobile | Transactions list (mobile) |
| 9 | `mobile-bookings` | Mobile | Bookings list (mobile) |
| 10 | `mobile-user-detail` / `mobile-transaction-detail` / `mobile-booking-detail` | Mobile | Detail views (mobile) |
| — | `Design System` | Reference | Colors, typography, components (not a backend concern) |

Mobile screens are responsive variants of the same data — **no new backend entities**.

---

## 2. Entities & Relationships

### Core entities
1. **User** — admin console users AND customers (the directory shows app users; bookings/transactions reference customers). **[ASSUMPTION]** A single `User` table serves both "console operators" (with roles Admin/Editor/Viewer/Super Admin) and "customers" referenced by bookings/transactions. Role governs access.
2. **Transaction** — financial records (payment/refund/transfer).
3. **Booking** — service/consultation bookings.
4. **Alert** — system alerts shown on dashboard.
5. **ActivityLog** — per-user activity entries (user detail "Recent Activity Log").
6. **TransactionEvent** — processing-history steps of a transaction (Initiated → Authorized → Completed).
7. **BookingEvent** — booking lifecycle logs (Created → Confirmed → Confirmation Sent).

### Relationships
- `User (1) ──< (N) Transaction` — a transaction belongs to a user (customer).
- `User (1) ──< (N) Booking` — a booking belongs to a user (customer).
- `User (1) ──< (N) ActivityLog`.
- `Transaction (1) ──< (N) TransactionEvent`.
- `Booking (1) ──< (N) BookingEvent`.
- `Booking (0..1) ── (1) Transaction` — **[ASSUMPTION]** a booking may link to an invoice/transaction (booking detail shows "Invoice Link #INV-...").
- `Alert` — standalone (no FK) **[ASSUMPTION]**.

---

## 3. Entity Fields

### 3.1 User
| Field | Type | Notes |
|-------|------|-------|
| id | uuid (PK) | |
| displayId | string unique | e.g. `#USR-4821` |
| fullName | string | |
| email | string unique | |
| passwordHash | string | never returned |
| phone | string? | `+1 555-0123` |
| dateOfBirth | date? | |
| mailingAddress | string? | |
| role | enum `UserRole` | SUPER_ADMIN, ADMIN, EDITOR, VIEWER |
| status | enum `UserStatus` | ACTIVE, INACTIVE, SUSPENDED |
| avatarUrl | string? | **[ASSUMPTION]** |
| twoFactorEnabled | boolean | default false |
| joinedAt | datetime | "Join Date" |
| lastActiveAt | datetime? | "Last Active" / "Last Login Activity" |
| createdAt / updatedAt | datetime | |

### 3.2 Transaction
| Field | Type | Notes |
|-------|------|-------|
| id | uuid (PK) | |
| displayId | string unique | `#TXN-1082` |
| reference | string? unique | `#REF-98342718` |
| userId | uuid (FK → User) | |
| type | enum `TransactionType` | PAYMENT, REFUND, TRANSFER |
| amount | decimal(12,2) | negative allowed for refunds (`-$420.00`) |
| status | enum `TransactionStatus` | COMPLETED, PENDING, FAILED, REFUNDED, PAID |
| paymentMethod | string? | `Credit Card (Visa ending in 4582)` |
| gatewayFee | decimal(12,2)? | `$4.90` |
| subtotal | decimal(12,2)? | `$145.10` |
| grandTotal | decimal(12,2)? | `$150.00` |
| occurredAt | datetime | "DATE & TIME" |
| settledAt | datetime? | ledger "Settled At" |
| createdAt / updatedAt | datetime | |

**Note:** PAID vs COMPLETED both appear. **[ASSUMPTION]** Treat `PAID` as a synonym surfaced in detail view; normalize to one enum set `{COMPLETED, PENDING, FAILED, REFUNDED}` and render PAID = COMPLETED, OR keep PAID as distinct. **Decision for Phase 2:** keep `{PENDING, COMPLETED, FAILED, REFUNDED}` and map "Paid" → COMPLETED.

### 3.3 Booking
| Field | Type | Notes |
|-------|------|-------|
| id | uuid (PK) | |
| displayId | string unique | `#BKG-2341` |
| userId | uuid (FK → User) | customer |
| serviceType | enum `ServiceType` | see §5 |
| scheduledAt | datetime | "DATE & TIME" |
| durationMinutes | int | 60, 90, 120 (1.0/1.5/2.0 hrs) |
| status | enum `BookingStatus` | CONFIRMED, COMPLETED, PENDING, CANCELLED, ACTIVE |
| amount | decimal(12,2) | `$180.00` |
| location | string? | `Virtual - Zoom Link Provided` |
| meetingTimeSlot | string? | `2:00 PM - 3:30 PM (EST)` |
| clientNotes | text? | "Client Special Notes" |
| paymentStatus | enum `PaymentStatus` | PAID, UNPAID **[ASSUMPTION]** |
| invoiceRef | string? | `#INV-10294` |
| transactionId | uuid? (FK → Transaction) | optional invoice link |
| createdAt / updatedAt | datetime | |

**Note:** `ACTIVE` appears in mobile bookings, `CONFIRMED` in desktop. **[ASSUMPTION]** They are the same state; normalize to `{PENDING, CONFIRMED, COMPLETED, CANCELLED}` and treat ACTIVE = CONFIRMED.

### 3.4 Alert
| Field | Type | Notes |
|-------|------|-------|
| id | uuid (PK) | |
| title | string | `Server capacity at 92%` |
| description | string | `Scale resources` |
| severity | enum `AlertSeverity` | CRITICAL, WARNING, INFO, SUCCESS |
| createdAt | datetime | rendered as "2 hours ago" |

### 3.5 ActivityLog
| Field | Type | Notes |
|-------|------|-------|
| id | uuid (PK) | |
| userId | uuid (FK → User) | |
| title | string | `Created booking #BKG-2341` |
| description | string | `Strategy development session` |
| createdAt | datetime | |

### 3.6 TransactionEvent
| Field | Type | Notes |
|-------|------|-------|
| id | uuid (PK) | |
| transactionId | uuid (FK) | |
| label | string | `Completed & Disbursed` |
| description | string | `Settled in merchant bank account` |
| occurredAt | datetime | |

### 3.7 BookingEvent
| Field | Type | Notes |
|-------|------|-------|
| id | uuid (PK) | |
| bookingId | uuid (FK) | |
| label | string | `Status Set to Confirmed` |
| description | string | `Consultant assigned automatically` |
| occurredAt | datetime | |

---

## 4. Enums

| Enum | Values |
|------|--------|
| UserRole | SUPER_ADMIN, ADMIN, EDITOR, VIEWER |
| UserStatus | ACTIVE, INACTIVE, SUSPENDED |
| TransactionType | PAYMENT, REFUND, TRANSFER |
| TransactionStatus | PENDING, COMPLETED, FAILED, REFUNDED |
| BookingStatus | PENDING, CONFIRMED, COMPLETED, CANCELLED |
| ServiceType | BUSINESS_CONSULTATION, TECHNICAL_SUPPORT, EXECUTIVE_COACHING, STRATEGY_SESSION, PERSONAL_TRAINING, IT_CONSULTATION, EXECUTIVE_TRAINING, PLATFORM_AUDIT, DATABASE_MIGRATION, SECURITY_ASSESSMENT |
| PaymentStatus | PAID, UNPAID |
| AlertSeverity | CRITICAL, WARNING, INFO, SUCCESS |

---

## 5. List Screens — columns, search, filters, sort

### 5.1 Users (`GET /users`)
- **Columns:** User (name+email+avatar), Role, Status, Join Date, Last Active, Actions
- **Search:** name or email
- **Filters:** `role` (All/Admin/Editor/Viewer), `status` (Active/Inactive/Suspended)
- **Sort:** Date Joined (default), **[ASSUMPTION]** also name / last active
- **Bulk actions:** Change Role, Suspend Accounts (multi-select)
- **Stat cards:** Total Users, Active Users, New This Month

### 5.2 Transactions (`GET /transactions`)
- **Columns:** Transaction ID, User, Type, Amount, Status, Date & Time, Actions
- **Search:** ID or user
- **Filters:** `dateRange` (Last 30 Days…), `type` (All/Payment/Refund/Transfer), `amount` (ranges) **[ASSUMPTION amount = min/max]**
- **Sort:** date (default desc) **[ASSUMPTION]**
- **Stat cards:** Total Transactions, Total Volume, Avg. Transaction, Success Rate
- **Action:** Export CSV (bonus)

### 5.3 Bookings (`GET /bookings`)
- **Columns:** Booking ID, Customer, Service, Date & Time, Duration, Status, Amount, Actions
- **Search:** ID or client
- **Filters:** `dateRange`, `status` (All…), `serviceType` (All…)
- **Sort:** scheduled date **[ASSUMPTION]**
- **Stat cards:** Total, Active, Completed, Cancelled bookings (each with % change)
- **Action:** Export List (bonus)

All lists use shared pagination meta `{ page, limit, total, totalPages }`.

---

## 6. Dashboard calculations (backend-computed)

| Widget | Computation |
|--------|-------------|
| Total Users | `COUNT(users)` + % change vs previous month |
| Total Revenue | `SUM(transactions.amount WHERE type=PAYMENT AND status=COMPLETED)` + % change |
| Active Bookings | `COUNT(bookings WHERE status IN (PENDING, CONFIRMED))` + % change |
| Pending Transactions | `COUNT(transactions WHERE status=PENDING)` + % change |
| Revenue Overview chart | Monthly revenue series; range toggles 7D / 1M / 3M / 6M / 1Y |
| Success Rate | `COMPLETED / total transactions` |
| Avg Transaction | `AVG(amount)` |
| Total Volume | `SUM(ABS(amount))` **[ASSUMPTION]** |
| System Alerts | latest N alerts ordered by `createdAt` |
| System Health (uptime, response time, sessions) | **[ASSUMPTION]** static/synthetic — not derived from business tables; return from a config/mock service or a `SystemHealth` snapshot |

"% change vs last month" = `(current - previous) / previous * 100`, computed in the service layer.

---

## 7. API Contract (planned — confirms CLAUDE.md minimum + detail endpoints)

### Auth
- `POST /auth/login` → `{ accessToken, user }`
- `GET /auth/me` → current user

### Dashboard
- `GET /dashboard/stats` → 4 KPIs with % change
- `GET /dashboard/charts?range=6M` → revenue series
- `GET /dashboard/alerts` → system alerts
- `GET /dashboard/health` → system health **[ASSUMPTION add-on]**

### Users
- `GET /users` (page, limit, search, role, status, sortBy, sortOrder)
- `GET /users/:id` (+ activity log, recent transactions, recent bookings)
- `POST /users`
- `PATCH /users/:id`
- `DELETE /users/:id`
- `PATCH /users/bulk` (change role / suspend) **[ASSUMPTION — bulk actions]**

### Transactions
- `GET /transactions` (page, limit, search, type, status, amountMin, amountMax, dateFrom, dateTo, sortBy, sortOrder)
- `GET /transactions/:id` (+ events, ledger entries for same user)
- `POST /transactions`
- `PATCH /transactions/:id/status`

### Bookings
- `GET /bookings` (page, limit, search, status, serviceType, dateFrom, dateTo, sortBy, sortOrder)
- `GET /bookings/:id` (+ lifecycle events)
- `POST /bookings`
- `PATCH /bookings/:id` (reschedule / cancel / update)

---

## 8. Open assumptions to confirm
1. Single `User` table for both operators and customers (role-based). ✔ default chosen.
2. `PAID` transaction status → mapped to `COMPLETED`.
3. `ACTIVE` booking status → mapped to `CONFIRMED`.
4. System Health metrics are synthetic (not computed from business data).
5. Bulk user actions (Change Role / Suspend) require a bulk endpoint.
6. Booking → Transaction link is optional (via `invoiceRef` / `transactionId`).
7. "Amount" filter on transactions = min/max range.
