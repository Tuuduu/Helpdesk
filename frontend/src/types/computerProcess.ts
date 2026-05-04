import type { WorkflowStepProgress } from "./computer";

export type ProcessType = "Repair" | "Retirement";

export const PROCESS_TYPE_LABELS: Record<ProcessType, string> = {
  Repair: "Засвар",
  Retirement: "Акт хасагдалт",
};

export type ProcessRequestStatus =
  | "PendingApproval"
  | "Completed"
  | "Rejected"
  | "Cancelled";

export const PROCESS_STATUS_LABELS: Record<ProcessRequestStatus, string> = {
  PendingApproval: "Зөвшөөрөл хүлээж буй",
  Completed: "Дууссан",
  Rejected: "Татгалзсан",
  Cancelled: "Цуцлагдсан",
};

export const PROCESS_STATUS_COLORS: Record<ProcessRequestStatus, string> = {
  PendingApproval: "bg-amber-50 text-amber-700 border-amber-200",
  Completed: "bg-green-50 text-green-700 border-green-200",
  Rejected: "bg-red-50 text-red-700 border-red-200",
  Cancelled: "bg-gray-50 text-gray-600 border-gray-200",
};

export interface CreateProcessRequestRequest {
  computerId: string;
  description: string;
}

export interface ProcessRequestListItem {
  id: string;
  type: ProcessType;
  computerId: string;
  assetCode: string;
  computerLabel: string;
  requestedByName: string;
  status: ProcessRequestStatus;
  description: string;
  createdAt: string;
}

export interface ProcessRequestResponse extends ProcessRequestListItem {
  requestedByUserId: string;
  currentStepIndex: number;
  workflowSteps: WorkflowStepProgress[];
  completedAt?: string;
  completionNote?: string;
}

export interface ProcessHistoryItem {
  id: string;
  type: ProcessType;
  requestId: string;
  actedByName: string;
  completedAt: string;
  description?: string;
  note?: string;
}
