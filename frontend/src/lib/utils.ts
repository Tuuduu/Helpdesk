import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, formatDistanceToNow } from "date-fns";
import type { UserRole } from "./constants";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Role бүрийн анхдагч буух хуудас.
 * Login-ы дараа эсвэл "/" хандсан үед энд router.push хийнэ.
 */
export function getDefaultPathForRole(role: UserRole | null | undefined): string {
  switch (role) {
    case "SuperAdmin":
    case "Admin":
      return "/dashboard";
    case "ITStorekeeper":
      return "/transfers";
    case "User":
      return "/my-computers";
    default:
      return "/login";
  }
}

export function formatDate(date: string | Date): string {
  return format(new Date(date), "yyyy-MM-dd");
}

export function formatDateTime(date: string | Date): string {
  return format(new Date(date), "yyyy-MM-dd HH:mm");
}

export function formatRelativeTime(date: string | Date): string {
  return formatDistanceToNow(new Date(date), { addSuffix: true });
}

export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function truncate(str: string, length: number): string {
  if (str.length <= length) return str;
  return str.slice(0, length) + "...";
}

/**
 * Backend-ээс ирсэн харьцангуй зургийн URL-ыг бүрэн URL болгоно.
 * Backend нь `/uploads/...` гэж буцаадаг ч frontend өөр порт дээр ажилладаг
 * тул заавал API хостоор тэрхүү замыг угтуулах хэрэгтэй.
 *
 * Жишээ:
 *   "/uploads/computers/2026/05/abc.jpg"
 *   → "http://localhost:5050/uploads/computers/2026/05/abc.jpg"
 */
export function getImageUrl(
  relativeUrl?: string | null
): string | undefined {
  if (!relativeUrl) return undefined;
  if (
    relativeUrl.startsWith("http://") ||
    relativeUrl.startsWith("https://")
  ) {
    return relativeUrl;
  }
  const apiBase =
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:5050/api";
  const root = apiBase.replace(/\/api\/?$/, "");
  return `${root}${relativeUrl.startsWith("/") ? "" : "/"}${relativeUrl}`;
}

/**
 * MAC хаягийг автомат форматлана:
 * - Зөвхөн hex тэмдэгт үлдээх
 * - Том үсэг рүү хөрвүүлэх
 * - Хоёр тэмдэгт тутамд `:` тавих
 * - 12 hex-ээс хэтэрвэл хайчлах (XX:XX:XX:XX:XX:XX = 17 char)
 *
 * Жишээ:
 *   "aabbccddeeff" → "AA:BB:CC:DD:EE:FF"
 *   "AA-BB-CC-DD-EE-FF" → "AA:BB:CC:DD:EE:FF"
 *   "AA:BB:CC" → "AA:BB:CC"
 */
export function formatMacAddress(input: string): string {
  const cleaned = input
    .replace(/[^0-9A-Fa-f]/g, "")
    .toUpperCase()
    .slice(0, 12);
  const parts: string[] = [];
  for (let i = 0; i < cleaned.length; i += 2) {
    parts.push(cleaned.slice(i, i + 2));
  }
  return parts.join(":");
}
