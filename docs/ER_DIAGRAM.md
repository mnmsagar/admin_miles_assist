# AdminHub — ER / Data Model

Two distinct populations:
- **AdminUser** — operators of the admin portal (authenticate here, have roles).
- **User** — the application's registered users (subjects of transactions/bookings),
  managed/viewed from the admin portal's Users Directory. No admin-portal login.

```mermaid
erDiagram
    USER ||--o{ TRANSACTION : "has"
    USER ||--o{ BOOKING : "has"
    USER ||--o{ ACTIVITY_LOG : "has"
    ADMIN_USER ||--o{ REFRESH_TOKEN : "has"
    TRANSACTION ||--o{ TRANSACTION_EVENT : "has"
    BOOKING ||--o{ BOOKING_EVENT : "has"
    BOOKING |o--|| TRANSACTION : "invoice (optional)"

    ADMIN_USER {
        uuid id PK
        string displayId UK "ADM-0001"
        string fullName
        string email UK
        string passwordHash
        string phone
        enum role "SUPER_ADMIN|ADMIN|EDITOR|VIEWER"
        enum status "ACTIVE|INACTIVE|SUSPENDED"
        bool twoFactorEnabled
        datetime joinedAt
        datetime lastActiveAt
        datetime createdAt
        datetime updatedAt
    }

    USER {
        uuid id PK
        string displayId UK "USR-4821"
        string fullName
        string email UK
        string phone
        date dateOfBirth
        string mailingAddress
        enum role "SUPER_ADMIN|ADMIN|EDITOR|VIEWER"
        enum status "ACTIVE|INACTIVE|SUSPENDED"
        bool twoFactorEnabled
        datetime joinedAt
        datetime lastActiveAt
        datetime createdAt
        datetime updatedAt
    }

    TRANSACTION {
        uuid id PK
        string displayId UK "TXN-1082"
        string reference UK "REF-98342718"
        uuid userId FK
        enum type "PAYMENT|REFUND|TRANSFER"
        decimal amount "negative for refunds"
        enum status "PENDING|COMPLETED|FAILED|REFUNDED"
        string paymentMethod
        decimal gatewayFee
        decimal subtotal
        decimal grandTotal
        datetime occurredAt
        datetime settledAt
        datetime createdAt
        datetime updatedAt
    }

    TRANSACTION_EVENT {
        uuid id PK
        uuid transactionId FK
        string label
        string description
        datetime occurredAt
    }

    BOOKING {
        uuid id PK
        string displayId UK "BKG-2341"
        uuid userId FK
        enum serviceType
        datetime scheduledAt
        int durationMinutes
        enum status "PENDING|CONFIRMED|COMPLETED|CANCELLED"
        decimal amount
        string location
        string meetingTimeSlot
        string clientNotes
        enum paymentStatus "PAID|UNPAID"
        string invoiceRef UK
        uuid transactionId FK "optional"
        datetime createdAt
        datetime updatedAt
    }

    BOOKING_EVENT {
        uuid id PK
        uuid bookingId FK
        string label
        string description
        datetime occurredAt
    }

    ACTIVITY_LOG {
        uuid id PK
        uuid userId FK
        string title
        string description
        datetime createdAt
    }

    REFRESH_TOKEN {
        uuid id PK
        uuid adminUserId FK
        string tokenHash UK
        datetime expiresAt
        datetime revokedAt
        datetime createdAt
    }

    ALERT {
        uuid id PK
        string title
        string description
        enum severity "CRITICAL|WARNING|INFO|SUCCESS"
        bool isRead
        datetime createdAt
    }

    SYSTEM_HEALTH_SNAPSHOT {
        uuid id PK
        decimal uptimePercent
        int avgResponseTimeMs
        int activeSessions
        datetime capturedAt
    }
```

## Relationships
- **AdminUser → RefreshToken** (1:N, cascade) — only admins log into the portal.
- **User → Transaction / Booking / ActivityLog** (1:N, cascade).
- **Transaction → TransactionEvent**, **Booking → BookingEvent** (1:N, cascade).
- **Booking → Transaction** (optional 1:1 invoice link, `SetNull`).
- **Alert**, **SystemHealthSnapshot** — standalone.

## Why two tables (AdminUser vs User)
This API powers the **admin portal**; a separate **end-user portal/website** serves the
application's users. The two populations are disjoint: admins authenticate and manage;
users transact and book. Splitting keeps FKs unambiguous (`transactions.userId` always
points to a `User`), isolates admin credentials from user data, and lets the `User`
table be reused by the future end-user portal. Dashboard "Total Users" counts `User`
records.

## Indexes
- `AdminUser`: role, status, joinedAt, fullName, email
- `User`: role, status, joinedAt, fullName, email
- `Transaction`: userId, status, type, occurredAt, amount
- `Booking`: userId, status, serviceType, scheduledAt, paymentStatus
- Event/log/token tables: foreign keys + createdAt
