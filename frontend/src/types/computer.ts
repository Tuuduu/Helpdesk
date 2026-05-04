import type {
  ComputerKind,
  ComputerStatus,
  MacAddressType,
  StorageType,
  TransferRequestStatus,
} from "@/lib/constants";
import type { PagedRequest } from "./api";

// ── Computer ──

export interface ComputerStorageInput {
  type: StorageType;
  capacityGb: number;
  modelName?: string;
}

export interface ComputerStorageDto {
  id: string;
  type: StorageType;
  capacityGb: number;
  modelName?: string;
}

export interface ComputerImageDto {
  id: string;
  imageUrl: string;
  isPrimary: boolean;
  uploadedAt: string;
}

export interface ComputerAccessoryInput {
  name: string;
  note?: string;
}

export interface ComputerAccessoryDto {
  id: string;
  name: string;
  note?: string;
}

export interface ComputerMacAddressInput {
  type: MacAddressType;
  address: string;
  label?: string;
  isPrimary: boolean;
}

export interface ComputerMacAddressDto {
  id: string;
  type: MacAddressType;
  address: string;
  label?: string;
  isPrimary: boolean;
}

export interface CreateComputerRequest {
  kind: ComputerKind;
  brand: string;
  model: string;
  monitor?: string;
  cpu: string;
  ramGb: number;
  gpu?: string;
  domainName?: string;
  ownerUserId: string;
  position: string;
  department?: string;
  companyId: string;
  storages: ComputerStorageInput[];
  macAddresses: ComputerMacAddressInput[];
  accessories: ComputerAccessoryInput[];
}

export interface UpdateComputerRequest {
  kind: ComputerKind;
  brand: string;
  model: string;
  monitor?: string;
  cpu: string;
  ramGb: number;
  gpu?: string;
  domainName?: string;
  position: string;
  department?: string;
  status: ComputerStatus;
  storages: ComputerStorageInput[];
  macAddresses: ComputerMacAddressInput[];
  accessories: ComputerAccessoryInput[];
}

export interface ComputerListItem {
  id: string;
  assetCode: string;
  kind: ComputerKind;
  brand: string;
  model: string;
  cpu: string;
  ramGb: number;
  macAddress: string;
  domainName?: string;
  ownerName: string;
  position: string;
  companyName: string;
  status: ComputerStatus;
  primaryImageUrl?: string;
  createdAt: string;
}

export interface ComputerResponse extends ComputerListItem {
  ownerUserId: string;
  companyId: string;
  monitor?: string;
  gpu?: string;
  department?: string;
  updatedAt: string;
  storages: ComputerStorageDto[];
  images: ComputerImageDto[];
  macAddresses: ComputerMacAddressDto[];
  accessories: ComputerAccessoryDto[];
}

export interface ComputerFilterRequest extends PagedRequest {
  status?: ComputerStatus;
  companyId?: string;
  ownerUserId?: string;
  brand?: string;
  search?: string;
}

export interface ComputerDashboardResponse {
  totalCount: number;
  activeCount: number;
  inRepairCount: number;
  inTransferCount: number;
  retiredCount: number;
  averageRamGb: number;
  averageAgeDays: number;
  transfersLast30Days: number;
  byCompany: NameCountPair[];
  byBrand: NameCountPair[];
}

export interface NameCountPair {
  name: string;
  count: number;
}

export interface ComputerReportFilterRequest {
  dateFrom?: string;
  dateTo?: string;
  companyId?: string;
  status?: ComputerStatus;
  kind?: ComputerKind;
  brand?: string;
  department?: string;
}

export interface ComputerReportSummary {
  totalCount: number;
  activeCount: number;
  inRepairCount: number;
  inTransferCount: number;
  retiredCount: number;
  averageRamGb: number;
  averageAgeDays: number;
  rows: ComputerReportRow[];
}

export interface ComputerReportRow {
  assetCode: string;
  kind: ComputerKind;
  brand: string;
  model: string;
  monitor?: string;
  cpu: string;
  ramGb: number;
  gpu?: string;
  storages: string;
  macAddress: string;
  domainName?: string;
  ownerName: string;
  position: string;
  department?: string;
  companyName: string;
  accessories: string;
  status: ComputerStatus;
  createdAt: string;
}

// ── Transfer ──

export interface CreateTransferRequestRequest {
  computerId: string;
  toUserId: string;
  reason: string;
}

export interface StorekeeperActionRequest {
  note?: string;
}

export interface ReceiverActionRequest {
  note?: string;
}

export interface TransferRequestListItem {
  id: string;
  computerId: string;
  assetCode: string;
  computerLabel: string;
  fromUserName: string;
  toUserName: string;
  status: TransferRequestStatus;
  reason: string;
  createdAt: string;
}

export interface TransferRequestResponse extends TransferRequestListItem {
  fromUserId: string;
  toUserId: string;
  requestedByUserId: string;
  requestedByName: string;
  currentStepIndex: number;
  workflowSteps: WorkflowStepProgress[];
  receiverActionAt?: string;
  receiverNote?: string;
}

export interface WorkflowStepProgress {
  order: number;
  name: string;
  approverNames: string[];
  approverUserIds: string[];
  isCompleted: boolean;
  isCurrent: boolean;
  approvedByUserId?: string;
  approvedByName?: string;
  approvedAt?: string;
  note?: string;
}

export interface TransferHistoryItem {
  id: string;
  requestId: string;
  fromUserName?: string;
  toUserName: string;
  approvedByStorekeeperName: string;
  transferredAt: string;
  note?: string;
}
