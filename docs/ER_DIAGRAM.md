# AdminHub — ER / Data Model

```mermaid
erDiagram
    USER ||--o{ TRANSACTION : "has"
    USER ||--o{ BOOKING : "has"
    USER ||--o{ ACTIVITY_LOG : "has"
    TRANSACTION ||--o{ TRANSACTION_EVENT : "has"
    BOOKING ||--o{ BOOKING_EVENT : "has"
    BOOKING |o--|| TRANSACTION : "invoice (optional)"

    USER {
        uuid id PK
        string displayId UK "USR-0001"
        string fullName
        string email UK
        string passwordHash
        string phone
        date dateOfBirth
        string mailingAddress
        enum role "SUPER_ADMIN|ADMIN|EDITOR|VIEWER"
        enum status "ACTIVE|INACTIVE|SUSPENDED"
        string avatarUrl
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
- **User → Transaction** (1:N, cascade delete)
- **User → Booking** (1:N, cascade delete)
- **User → ActivityLog** (1:N, cascade delete)
- **Transaction → TransactionEvent** (1:N, cascade delete)
- **Booking → BookingEvent** (1:N, cascade delete)
- **Booking → Transaction** (optional 1:1 invoice link, `SetNull` on delete)
- **Alert**, **SystemHealthSnapshot** — standalone

## Indexes
Indexed columns match the UI's search / filter / sort needs:
- `User`: role, status, joinedAt, fullName, email
- `Transaction`: userId, status, type, occurredAt, amount
- `Booking`: userId, status, serviceType, scheduledAt, paymentStatus
- Event/log tables: foreign keys + createdAt
