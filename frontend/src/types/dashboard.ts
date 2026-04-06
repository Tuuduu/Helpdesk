export interface DashboardStats {
  totalTickets: number;
  openTickets: number;
  closedTickets: number;
  avgResolutionHours: number;
}

export interface TicketChartItem {
  date: string;
  created: number;
  closed: number;
}

export interface EngineerPerformance {
  engineerId: string;
  engineerName: string;
  assignedCount: number;
  resolvedCount: number;
  avgResolutionHours: number;
}

export interface FeedbackSummary {
  averageRating: number;
  totalCount: number;
  distribution: Record<number, number>;
}
