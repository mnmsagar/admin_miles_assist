import * as dotenv from 'dotenv';
import {
  PrismaClient,
  AdminRole,
  AccountStatus,
  TransactionType,
  TransactionStatus,
  BookingStatus,
  PaymentStatus,
  ServiceType,
  AlertSeverity,
  Prisma,
} from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { buildDatabaseUrl } from '../src/config/build-database-url';

dotenv.config();

const prisma = new PrismaClient({
  datasources: { db: { url: buildDatabaseUrl() } },
});

const SALT_ROUNDS = Number(process.env.BCRYPT_SALT_ROUNDS ?? 10);
const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL ?? 'admin@adminhub.com';
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD ?? 'Admin@12345';

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}
function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
function money(min: number, max: number): number {
  return Math.round((Math.random() * (max - min) + min) * 100) / 100;
}
function pad(prefix: string, n: number): string {
  return `${prefix}-${String(n).padStart(4, '0')}`;
}

// Admin-portal operators (staff who log in and manage)
const ADMIN_SEED = [
  { fullName: 'Sarah Jenkins', email: 'sarah.j@adminhub.com', role: AdminRole.ADMIN },
  { fullName: 'Wade Warren', email: 'wade.w@adminhub.com', role: AdminRole.EDITOR },
  { fullName: 'Kristin Watson', email: 'kristin.w@adminhub.com', role: AdminRole.ADMIN },
  { fullName: 'Cameron Williamson', email: 'cameron.w@adminhub.com', role: AdminRole.VIEWER },
];

// Website end-users (customers with transactions/bookings).
// Each carries a role, mirroring the Figma Users Directory (Admin/Editor/Viewer).
const CUSTOMER_SEED = [
  { fullName: 'Jane Cooper', email: 'jane.c@example.com', role: AdminRole.ADMIN, status: AccountStatus.ACTIVE },
  { fullName: 'Arlene McCoy', email: 'arlene.m@example.com', role: AdminRole.EDITOR, status: AccountStatus.ACTIVE },
  { fullName: 'Eleanor Pena', email: 'eleanor.p@example.com', role: AdminRole.VIEWER, status: AccountStatus.SUSPENDED },
  { fullName: 'Robert Fox', email: 'robert.f@example.com', role: AdminRole.VIEWER, status: AccountStatus.ACTIVE },
  { fullName: 'Leslie Alexander', email: 'leslie.a@example.com', role: AdminRole.EDITOR, status: AccountStatus.INACTIVE },
  { fullName: 'Guy Hawkins', email: 'guy.h@example.com', role: AdminRole.VIEWER, status: AccountStatus.ACTIVE },
  { fullName: 'Esther Howard', email: 'esther.h@example.com', role: AdminRole.EDITOR, status: AccountStatus.ACTIVE },
  { fullName: 'Jenny Wilson', email: 'jenny.w@example.com', role: AdminRole.VIEWER, status: AccountStatus.ACTIVE },
  { fullName: 'Kathryn Murphy', email: 'kathryn.m@example.com', role: AdminRole.VIEWER, status: AccountStatus.ACTIVE },
  { fullName: 'Cody Fisher', email: 'cody.f@example.com', role: AdminRole.EDITOR, status: AccountStatus.ACTIVE },
  { fullName: 'Albert Flores', email: 'albert.f@example.com', role: AdminRole.VIEWER, status: AccountStatus.ACTIVE },
  { fullName: 'Sarah Johnson', email: 'sarah.johnson@example.com', role: AdminRole.ADMIN, status: AccountStatus.ACTIVE },
  { fullName: 'Michael Brown', email: 'michael.b@example.com', role: AdminRole.VIEWER, status: AccountStatus.ACTIVE },
  { fullName: 'Emily Davis', email: 'emily.d@example.com', role: AdminRole.EDITOR, status: AccountStatus.ACTIVE },
  { fullName: 'David Wilson', email: 'david.w@example.com', role: AdminRole.VIEWER, status: AccountStatus.INACTIVE },
];

const SERVICE_TYPES = Object.values(ServiceType);
const DURATIONS = [60, 90, 120];
const PAYMENT_METHODS = [
  'Credit Card (Visa ending in 4582)',
  'Direct PayPal Link',
  'Bank Transfer',
  'Credit Card (Mastercard ending in 7781)',
];

async function main() {
  console.log('🌱 Seeding AdminHub database...');

  // Clean slate (respect FK order)
  await prisma.transactionEvent.deleteMany();
  await prisma.bookingEvent.deleteMany();
  await prisma.activityLog.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.transaction.deleteMany();
  await prisma.alert.deleteMany();
  await prisma.systemHealthSnapshot.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.adminUser.deleteMany();

  // ─── Admin users ───
  const adminHash = await bcrypt.hash(ADMIN_PASSWORD, SALT_ROUNDS);
  const staffHash = await bcrypt.hash('Password@123', SALT_ROUNDS);

  await prisma.adminUser.create({
    data: {
      displayId: pad('ADM', 1),
      fullName: 'System Administrator',
      email: ADMIN_EMAIL,
      passwordHash: adminHash,
      role: AdminRole.SUPER_ADMIN,
      status: AccountStatus.ACTIVE,
      phone: '+1 555-0100',
      twoFactorEnabled: true,
      joinedAt: new Date('2026-01-01'),
      lastActiveAt: new Date(),
    },
  });

  for (let i = 0; i < ADMIN_SEED.length; i++) {
    const a = ADMIN_SEED[i];
    await prisma.adminUser.create({
      data: {
        displayId: pad('ADM', i + 2),
        fullName: a.fullName,
        email: a.email,
        passwordHash: staffHash,
        role: a.role,
        status: AccountStatus.ACTIVE,
        twoFactorEnabled: Math.random() > 0.5,
        joinedAt: new Date(2026, randInt(0, 5), randInt(1, 28)),
        lastActiveAt: new Date(Date.now() - randInt(0, 5) * 86400000),
      },
    });
  }

  // ─── Customers ───
  const customers = [];
  for (let i = 0; i < CUSTOMER_SEED.length; i++) {
    const c = CUSTOMER_SEED[i];
    const customer = await prisma.customer.create({
      data: {
        displayId: pad('USR', i + 1000),
        fullName: c.fullName,
        email: c.email,
        role: c.role,
        status: c.status,
        phone: `+1 555-${pad('', randInt(100, 999)).slice(1)}`,
        dateOfBirth: new Date(randInt(1985, 1998), randInt(0, 11), randInt(1, 28)),
        mailingAddress: `${randInt(1, 999)} Business Rd, New York, NY`,
        twoFactorEnabled: Math.random() > 0.5,
        joinedAt: new Date(2026, randInt(0, 8), randInt(1, 28)),
        lastActiveAt: new Date(Date.now() - randInt(0, 7) * 86400000),
      },
    });
    customers.push(customer);

    await prisma.activityLog.createMany({
      data: [
        { customerId: customer.id, title: 'Created booking', description: 'Service reservation' },
        { customerId: customer.id, title: 'Logged in from new device', description: 'MacOS Chrome, Brooklyn, NY' },
      ],
    });
  }

  // ─── Transactions (spread across 12 months for chart data) ───
  const txnStatuses = [
    TransactionStatus.COMPLETED,
    TransactionStatus.COMPLETED,
    TransactionStatus.COMPLETED,
    TransactionStatus.PENDING,
    TransactionStatus.FAILED,
    TransactionStatus.REFUNDED,
  ];
  let txnCounter = 1000;
  const now = new Date();

  for (let m = 11; m >= 0; m--) {
    const perMonth = randInt(15, 30);
    for (let k = 0; k < perMonth; k++) {
      const occurredAt = new Date(now.getFullYear(), now.getMonth() - m, randInt(1, 28), randInt(8, 18), randInt(0, 59));
      const type = pick([
        TransactionType.PAYMENT,
        TransactionType.PAYMENT,
        TransactionType.PAYMENT,
        TransactionType.REFUND,
        TransactionType.TRANSFER,
      ]);
      const status = type === TransactionType.REFUND ? TransactionStatus.REFUNDED : pick(txnStatuses);
      const base = money(50, 2500);
      const amount = type === TransactionType.REFUND ? -base : base;
      const gatewayFee = money(1, 10);
      const customer = pick(customers);
      txnCounter++;

      await prisma.transaction.create({
        data: {
          displayId: pad('TXN', txnCounter),
          reference: pad('REF', randInt(10000000, 99999999)),
          customerId: customer.id,
          type,
          amount: new Prisma.Decimal(amount),
          status,
          paymentMethod: pick(PAYMENT_METHODS),
          gatewayFee: new Prisma.Decimal(gatewayFee),
          subtotal: new Prisma.Decimal(Math.abs(amount) - gatewayFee),
          grandTotal: new Prisma.Decimal(Math.abs(amount)),
          occurredAt,
          settledAt: status === TransactionStatus.COMPLETED ? occurredAt : null,
          events: {
            create: [
              { label: 'Initiated', description: 'Checkout session initialized', occurredAt },
              ...(status === TransactionStatus.COMPLETED
                ? [{ label: 'Completed & Disbursed', description: 'Settled in merchant bank account', occurredAt }]
                : []),
            ],
          },
        },
      });
    }
  }

  // ─── Bookings ───
  const bookingStatuses = [
    BookingStatus.CONFIRMED,
    BookingStatus.COMPLETED,
    BookingStatus.COMPLETED,
    BookingStatus.PENDING,
    BookingStatus.CANCELLED,
  ];
  let bkgCounter = 2300;
  for (let i = 0; i < 40; i++) {
    const scheduledAt = new Date(now.getFullYear(), now.getMonth(), randInt(-20, 25), pick([9, 10, 11, 14, 15, 16]), pick([0, 30]));
    const status = pick(bookingStatuses);
    const customer = pick(customers);
    const amount = money(90, 1200);
    bkgCounter++;

    await prisma.booking.create({
      data: {
        displayId: pad('BKG', bkgCounter),
        customerId: customer.id,
        serviceType: pick(SERVICE_TYPES),
        scheduledAt,
        durationMinutes: pick(DURATIONS),
        status,
        amount: new Prisma.Decimal(amount),
        location: pick(['Virtual - Zoom Link Provided', 'HQ Meeting Room A', 'Client Office']),
        meetingTimeSlot: '2:00 PM - 3:30 PM (EST)',
        clientNotes: 'Need assistance with expanding payment gateway options.',
        paymentStatus: status === BookingStatus.COMPLETED ? PaymentStatus.PAID : pick([PaymentStatus.PAID, PaymentStatus.UNPAID]),
        invoiceRef: pad('INV', randInt(10000, 99999)),
        events: {
          create: [
            { label: 'Booking Created', description: 'Client self-service reservation', occurredAt: new Date(scheduledAt.getTime() - 3 * 86400000) },
            { label: 'Status Set to Confirmed', description: 'Consultant assigned automatically', occurredAt: new Date(scheduledAt.getTime() - 2 * 86400000) },
          ],
        },
      },
    });
  }

  // ─── Alerts ───
  await prisma.alert.createMany({
    data: [
      { title: 'Server capacity at 92%', description: 'Scale resources', severity: AlertSeverity.CRITICAL, createdAt: new Date(Date.now() - 2 * 3600000) },
      { title: '15 transactions pending', description: 'Pending review', severity: AlertSeverity.WARNING, createdAt: new Date(Date.now() - 5 * 3600000) },
      { title: 'System maintenance scheduled', description: 'Scheduled for Oct 5', severity: AlertSeverity.INFO, createdAt: new Date(Date.now() - 86400000) },
      { title: 'Backup completed successfully', description: 'Nightly backup finished', severity: AlertSeverity.SUCCESS, createdAt: new Date(Date.now() - 90000000) },
    ],
  });

  // ─── System health snapshot ───
  await prisma.systemHealthSnapshot.create({
    data: {
      uptimePercent: new Prisma.Decimal(99.8),
      avgResponseTimeMs: 142,
      activeSessions: 3241,
    },
  });

  const [aCount, cCount, tCount, bCount] = await Promise.all([
    prisma.adminUser.count(),
    prisma.customer.count(),
    prisma.transaction.count(),
    prisma.booking.count(),
  ]);

  console.log('✅ Seed complete');
  console.log(`   Admin users:  ${aCount}`);
  console.log(`   Customers:    ${cCount}`);
  console.log(`   Transactions: ${tCount}`);
  console.log(`   Bookings:     ${bCount}`);
  console.log(`\n   Admin login → ${ADMIN_EMAIL} / ${ADMIN_PASSWORD}`);
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
