export type AnnouncementLevel = "info" | "warning" | "success" | "danger";

export interface Announcement {
  id: string;
  title: string;
  body: string;
  level: AnnouncementLevel;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAnnouncementRequest {
  title: string;
  body: string;
  level: AnnouncementLevel;
  sortOrder: number;
}

export interface UpdateAnnouncementRequest extends CreateAnnouncementRequest {
  isActive: boolean;
}

export interface PublicAnnouncement {
  id: string;
  title: string;
  body: string;
  level: AnnouncementLevel;
  createdAt: string;
}
