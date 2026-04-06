import type { PagedRequest } from "./api";

export interface CreateFeedbackRequest {
  ticketId: string;
  rating: number;
  comment?: string;
  guestName?: string;
}

export interface FeedbackResponse {
  id: string;
  ticketId: string;
  ticketNumber: string;
  ticketTitle: string;
  submittedByName?: string;
  guestName?: string;
  rating: number;
  comment?: string;
  createdAt: string;
}

export interface FeedbackFilterRequest extends PagedRequest {
  search?: string;
  rating?: number;
}
