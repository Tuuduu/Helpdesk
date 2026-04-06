import type { TicketStatus, TicketPriority, CallType } from "@/lib/constants";
import type { PagedRequest } from "./api";

export interface CreateTicketRequest {
  callType: CallType;
  companyId: string;
  fullName: string;
  position?: string;
  computerNumber?: string;
  title: string;
  description: string;
  phoneNumber: string;
  isGuest: boolean;
}

export interface UpdateTicketStatusRequest {
  newStatus: TicketStatus;
  note?: string;
}

export interface AssignTicketRequest {
  assignToId: string;
}

export interface TicketListItem {
  id: string;
  ticketNumber: string;
  title: string;
  companyName: string;
  fullName: string;
  status: TicketStatus;
  priority: TicketPriority;
  assignedToName?: string;
  createdAt: string;
}

export interface TicketResponse extends TicketListItem {
  callType: CallType;
  description: string;
  phoneNumber: string;
  position?: string;
  computerNumber?: string;
  isGuest: boolean;
  closedByName?: string;
  closedAt?: string;
  history: TicketHistoryItem[];
}

export interface TicketHistoryItem {
  id: string;
  action: string;
  fromValue?: string;
  toValue?: string;
  performedByName: string;
  note?: string;
  createdAt: string;
}

export interface TicketFilterRequest extends PagedRequest {
  status?: TicketStatus;
  companyId?: string;
  assignedToId?: string;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
}
