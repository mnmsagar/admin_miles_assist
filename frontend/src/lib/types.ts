export interface PageMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}
export interface Paginated<T> {
  data: T[];
  meta: PageMeta;
}

export type AdminRole = 'SUPER_ADMIN' | 'ADMIN' | 'EDITOR' | 'VIEWER';
export type AccountStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
export type TransactionType = 'PAYMENT' | 'REFUND' | 'TRANSFER';
export type TransactionStatus = 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED';
export type BookingStatus = 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED';
export type PaymentStatus = 'PAID' | 'UNPAID';

export interface AdminUser {
  id: string;
  displayId: string;
  fullName: string;
  email: string;
  role: AdminRole;
  status: AccountStatus;
  twoFactorEnabled: boolean;
  lastActiveAt: string | null;
  joinedAt: string;
}

export interface User {
  id: string;
  displayId: string;
  fullName: string;
  email: string;
  phone: string | null;
  dateOfBirth: string | null;
  mailingAddress: string | null;
  role: AdminRole;
  status: AccountStatus;
  twoFactorEnabled: boolean;
  joinedAt: string;
  lastActiveAt: string | null;
  activityLogs?: ActivityLog[];
  transactions?: Transaction[];
  bookings?: Booking[];
}

export interface ActivityLog {
  id: string;
  title: string;
  description: string | null;
  createdAt: string;
}

export interface UserRef {
  id: string;
  fullName: string;
  email: string;
  displayId: string;
}

export interface Transaction {
  id: string;
  displayId: string;
  reference: string | null;
  type: TransactionType;
  amount: string;
  status: TransactionStatus;
  paymentMethod: string | null;
  gatewayFee: string | null;
  subtotal: string | null;
  grandTotal: string | null;
  occurredAt: string;
  settledAt: string | null;
  user?: UserRef;
  events?: EventLog[];
  ledger?: Transaction[];
}

export interface Booking {
  id: string;
  displayId: string;
  serviceType: string;
  scheduledAt: string;
  durationMinutes: number;
  status: BookingStatus;
  amount: string;
  location: string | null;
  meetingTimeSlot: string | null;
  clientNotes: string | null;
  paymentStatus: PaymentStatus;
  invoiceRef: string | null;
  user?: UserRef;
  events?: EventLog[];
  customerCompletedBookings?: number;
}

export interface EventLog {
  id: string;
  label: string;
  description: string | null;
  occurredAt: string;
}

export interface Kpi {
  value: number;
  changePercent: number;
  direction: 'up' | 'down' | 'neutral';
  total?: number;
}

export interface DashboardStats {
  totalUsers: Kpi;
  totalRevenue: Kpi;
  activeBookings: Kpi;
  pendingTransactions: Kpi;
}

export interface ChartSeries {
  range: string;
  series: { label: string; revenue: number }[];
}

export interface Alert {
  id: string;
  title: string;
  description: string | null;
  severity: 'CRITICAL' | 'WARNING' | 'INFO' | 'SUCCESS';
  createdAt: string;
}

export interface Health {
  uptimePercent: string | number;
  avgResponseTimeMs: number;
  activeSessions: number;
  capturedAt: string;
}
