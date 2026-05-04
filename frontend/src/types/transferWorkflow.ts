export type WorkflowTypeValue = "Transfer" | "Repair" | "Retirement";

export interface WorkflowApprover {
  userId: string;
  fullName: string;
  position?: string;
}

export interface TransferWorkflowStep {
  id: string;
  order: number;
  name: string;
  approvers: WorkflowApprover[];
}

export interface WorkflowStepInput {
  name: string;
  approverUserIds: string[];
}

export interface SaveWorkflowRequest {
  companyId: string;
  workflowType: WorkflowTypeValue;
  steps: WorkflowStepInput[];
}
