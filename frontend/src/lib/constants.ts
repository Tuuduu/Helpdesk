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
  type LucideIcon,
} from "lucide-react";

// ── Roles ──
export type UserRole = "SuperAdmin" | "Admin" | "User";

export const USER_ROLE_LABELS: Record<UserRole, string> = {
  SuperAdmin: "Супер админ",
  Admin: "Админ",
  User: "Хэрэглэгч",
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
    label: "Хэрэглэгчид",
    path: "/users",
    icon: Users,
    roles: ["SuperAdmin", "Admin"],
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
