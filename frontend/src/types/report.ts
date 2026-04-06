import type { TicketStatus } from "@/lib/constants";

export interface ReportFilterRequest {
  dateFrom?: string;
  dateTo?: string;
  engineerId?: string;
  companyId?: string;
  status?: TicketStatus;
}

export interface ReportRow {
  ticketNumber: string;
  title: string;
  companyName: string;
  requesterName: string;
  phoneNumber: string;
  callType: string;
  status: string;
  priority: string;
  assignedTo?: string;
  createdAt: string;
  closedAt?: string;
  resolutionHours?: number;
}

export interface ReportSummary {
  totalTickets: number;
  openTickets: number;
  closedTickets: number;
  avgResolutionHours: number;
  rows: ReportRow[];
}
