export interface DashboardUser {
  id: string;
  name: string;
  email: string;
  role: string;
  username?: string | null;
  createdAt?: string | Date | null;
  points?: number | null;
  level?: number | null;
  image?: string | null;
}

export interface ManagementStats {
  totalMembers?: number;
  activeEvents?: number;
  totalRegistrations?: number;
}

export interface ChartDataPoint {
  name: string;
  attendance?: number;
  newMembers?: number;
}

export interface ChartData {
  attendance: ChartDataPoint[];
  members: ChartDataPoint[];
}

export interface AIInsight {
  id: string;
  title: string;
  description: string;
  metricTrend?: string;
  isActionable?: boolean;
  actionLink?: string;
}

export interface AuditLog {
  id: string;
  action: string;
  entity: string;
  details?: string | null;
  timestamp: string | Date;
}

export interface FinanceSnapshot {
  budgetRemaining: number;
  pendingExpenses: any[];
}

export interface InventoryAlert {
  id: string;
  name: string;
  qtyAvailable: number;
}

export interface UpcomingEvent {
  id: string;
  title: string;
  startsAt: string | Date;
  type: string | null;
  slug: string;
  location?: string | null;
  coverImage?: string | null;
}

export interface UserRegistration {
  eventId: string;
  eventTitle: string;
}

export interface UserApplication {
  status: string | null;
}

export interface UserCertificate {
  id: string;
  verifyId: string;
  issuedAt: string | Date | null;
  data?: {
    eventName?: string;
  } | any;
}
