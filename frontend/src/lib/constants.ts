import {
  LayoutDashboard,
  PlusCircle,
  Ticket,
  Users,
  FileBarChart,
  MessageSquare,
  Info,
  UserCircle,
  Settings,
  Monitor,
  HardDrive,
  ArrowLeftRight,
  Wrench,
  type LucideIcon,
} from "lucide-react";

// ── Roles ──
export type UserRole = "SuperAdmin" | "Admin" | "User" | "ITStorekeeper";

export const USER_ROLE_LABELS: Record<UserRole, string> = {
  SuperAdmin: "Супер админ",
  Admin: "Админ",
  User: "Хэрэглэгч",
  ITStorekeeper: "МТ-ийн нярав",
};

// ── Ticket Status ──
export type TicketStatus = "New" | "Accepted" | "InProgress" | "Closed";

export const TICKET_STATUS_LABELS: Record<TicketStatus, string> = {
  New: "Шинэ",
  Accepted: "Хүлээн авсан",
  InProgress: "Шийдвэрлэж байна",
  Closed: "Хаагдсан",
};

export const TICKET_STATUS_COLORS: Record<TicketStatus, string> = {
  New: "bg-blue-50 text-blue-700 border-blue-200",
  Accepted: "bg-amber-50 text-amber-700 border-amber-200",
  InProgress: "bg-purple-50 text-purple-700 border-purple-200",
  Closed: "bg-green-50 text-green-700 border-green-200",
};

// ── Ticket Priority ──
export type TicketPriority = "Low" | "Medium" | "High" | "Urgent";

export const TICKET_PRIORITY_LABELS: Record<TicketPriority, string> = {
  Low: "Бага",
  Medium: "Дунд",
  High: "Өндөр",
  Urgent: "Яаралтай",
};

export const TICKET_PRIORITY_COLORS: Record<TicketPriority, string> = {
  Low: "bg-gray-50 text-gray-600 border-gray-200",
  Medium: "bg-yellow-50 text-yellow-700 border-yellow-200",
  High: "bg-orange-50 text-orange-700 border-orange-200",
  Urgent: "bg-red-50 text-red-700 border-red-200",
};

// ── Computer Status ──
export type ComputerStatus = "Active" | "InRepair" | "InTransfer" | "Retired";

export const COMPUTER_STATUS_LABELS: Record<ComputerStatus, string> = {
  Active: "Идэвхтэй",
  InRepair: "Засварт",
  InTransfer: "Шилжиж буй",
  Retired: "Хасагдсан",
};

export const COMPUTER_STATUS_COLORS: Record<ComputerStatus, string> = {
  Active: "bg-green-50 text-green-700 border-green-200",
  InRepair: "bg-amber-50 text-amber-700 border-amber-200",
  InTransfer: "bg-purple-50 text-purple-700 border-purple-200",
  Retired: "bg-gray-50 text-gray-600 border-gray-200",
};

// ── Computer Kind ──
export type ComputerKind = "Desktop" | "Laptop";

export const COMPUTER_KIND_LABELS: Record<ComputerKind, string> = {
  Desktop: "Суурин",
  Laptop: "Зөөврийн",
};

export const COMPUTER_KIND_COLORS: Record<ComputerKind, string> = {
  Desktop: "bg-blue-50 text-blue-700 border-blue-200",
  Laptop: "bg-purple-50 text-purple-700 border-purple-200",
};

// ── Storage Type ──
export type StorageType = "HDD" | "SSD" | "M2";

export const STORAGE_TYPE_LABELS: Record<StorageType, string> = {
  HDD: "HDD",
  SSD: "SSD",
  M2: "M.2 NVMe",
};

// ── MAC Address Type ──
export type MacAddressType = "Lan" | "Wifi" | "Bluetooth" | "Other";

export const MAC_TYPE_LABELS: Record<MacAddressType, string> = {
  Lan: "LAN",
  Wifi: "Wi-Fi",
  Bluetooth: "Bluetooth",
  Other: "Бусад",
};

export const MAC_TYPE_COLORS: Record<MacAddressType, string> = {
  Lan: "bg-blue-50 text-blue-700 border-blue-200",
  Wifi: "bg-green-50 text-green-700 border-green-200",
  Bluetooth: "bg-purple-50 text-purple-700 border-purple-200",
  Other: "bg-gray-50 text-gray-600 border-gray-200",
};

// ── Transfer Request Status ──
export type TransferRequestStatus =
  | "PendingApproval"
  | "PendingReceiver"
  | "Approved"
  | "Rejected"
  | "Cancelled";

export const TRANSFER_STATUS_LABELS: Record<TransferRequestStatus, string> = {
  PendingApproval: "Зөвшөөрөл хүлээж буй",
  PendingReceiver: "Хүлээн авагч хүлээж буй",
  Approved: "Батлагдсан",
  Rejected: "Татгалзсан",
  Cancelled: "Цуцлагдсан",
};

export const TRANSFER_STATUS_COLORS: Record<TransferRequestStatus, string> = {
  PendingApproval: "bg-amber-50 text-amber-700 border-amber-200",
  PendingReceiver: "bg-blue-50 text-blue-700 border-blue-200",
  Approved: "bg-green-50 text-green-700 border-green-200",
  Rejected: "bg-red-50 text-red-700 border-red-200",
  Cancelled: "bg-gray-50 text-gray-600 border-gray-200",
};

// ── Call Type ──
export type CallType = "PhoneCall" | "Email" | "WalkIn" | "Remote";

export const CALL_TYPE_LABELS: Record<CallType, string> = {
  PhoneCall: "Утасны дуудлага",
  Email: "Имэйл",
  WalkIn: "Биечлэн",
  Remote: "Зайнаас",
};

// ── Navigation ──
export interface NavItem {
  label: string;
  path: string;
  icon: LucideIcon;
  roles: UserRole[];
}

export const SIDEBAR_NAV: NavItem[] = [
  {
    label: "Хянах самбар",
    path: "/dashboard",
    icon: LayoutDashboard,
    roles: ["SuperAdmin", "Admin"],
  },
  {
    label: "Тикет үүсгэх",
    path: "/tickets/create",
    icon: PlusCircle,
    roles: ["SuperAdmin", "Admin", "User"],
  },
  {
    label: "Тикетүүд",
    path: "/tickets",
    icon: Ticket,
    roles: ["SuperAdmin", "Admin"],
  },
  {
    label: "Миний тикетүүд",
    path: "/tickets",
    icon: Ticket,
    roles: ["User"],
  },
  {
    label: "Хэрэглэгчид",
    path: "/users",
    icon: Users,
    roles: ["SuperAdmin", "Admin"],
  },
  {
    label: "Компьютер",
    path: "/computers",
    icon: Monitor,
    roles: ["SuperAdmin", "Admin", "ITStorekeeper"],
  },
  {
    label: "Миний компьютер",
    path: "/my-computers",
    icon: HardDrive,
    roles: ["SuperAdmin", "Admin", "User", "ITStorekeeper"],
  },
  {
    label: "Шилжүүлэг",
    path: "/transfers",
    icon: ArrowLeftRight,
    roles: ["SuperAdmin", "ITStorekeeper", "User", "Admin"],
  },
  {
    label: "Засвар & Акт",
    path: "/processes",
    icon: Wrench,
    roles: ["SuperAdmin", "ITStorekeeper", "User", "Admin"],
  },
  {
    label: "Тайлан",
    path: "/reports",
    icon: FileBarChart,
    roles: ["SuperAdmin", "Admin"],
  },
  {
    label: "Санал хүсэлт",
    path: "/feedback",
    icon: MessageSquare,
    roles: ["SuperAdmin", "Admin", "User"],
  },
  {
    label: "Тохиргоо",
    path: "/settings",
    icon: Settings,
    roles: ["SuperAdmin", "Admin"],
  },
  {
    label: "Тухай",
    path: "/about",
    icon: Info,
    roles: ["SuperAdmin", "Admin", "User"],
  },
  {
    label: "Профайл",
    path: "/profile",
    icon: UserCircle,
    roles: ["SuperAdmin", "Admin", "User"],
  },
];

// ── Period Filters ──
export const PERIOD_OPTIONS = [
  { value: "today", label: "Өнөөдөр" },
  { value: "week", label: "7 хоног" },
  { value: "month", label: "Сар" },
  { value: "year", label: "Жил" },
] as const;
