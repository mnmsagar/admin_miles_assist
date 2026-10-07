# AdminHub — ER / Data Model

Two distinct populations:
- **AdminUser** — operators of the admin portal (authenticate here, have roles).
- **Customer** — end-users of the public website (subjects of transactions/bookings),
  managed/viewed from the admin portal. No admin-portal login.

```mermaid
erDiagram
    CUSTOMER ||--o{ TRANSACTION : "has"
    CUSTOMER ||--o{ BOOKING : "has"
    CUSTOMER ||--o{ ACTIVITY_LOG : "has"
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

    CUSTOMER {
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
        uuid customerId FK
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
        uuid customerId FK
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
        uuid customerId FK
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
- **Customer → Transaction / Booking / ActivityLog** (1:N, cascade).
- **Transaction → TransactionEvent**, **Booking → BookingEvent** (1:N, cascade).
- **Booking → Transaction** (optional 1:1 invoice link, `SetNull`).
- **Alert**, **SystemHealthSnapshot** — standalone.

## Why two tables (AdminUser vs Customer)
This API powers the **admin portal**; a separate **customer portal/website** serves
end-users. The two populations are disjoint: admins authenticate and manage; customers
transact and book. Splitting keeps FKs unambiguous (`transactions.customerId` always
points to a `Customer`), isolates admin credentials from customer data, and lets the
`Customer` table be reused by the future customer portal. Dashboard "Total Users" counts
customers.

## Indexes
- `AdminUser`: role, status, joinedAt, fullName, email
- `Customer`: role, status, joinedAt, fullName, email
- `Transaction`: customerId, status, type, occurredAt, amount
- `Booking`: customerId, status, serviceType, scheduledAt, paymentStatus
- Event/log/token tables: foreign keys + createdAt
