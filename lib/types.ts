export type UserRole = "user" | "admin" | "developer";

export type AppUser = {
  uid: string;
  email: string;
  displayName: string;
  username: string;
  role: UserRole;
  bio?: string;
  location?: string;
  trustPoints?: number;
  reportsCount?: number;
  confirmationsCount?: number;
  commentsCount?: number;
  banned?: boolean;
  createdAt?: unknown;
};

export type ReportCategory =
  | "Verkehrskontrolle"
  | "Blitzer"
  | "Unfall"
  | "Stau"
  | "Baustelle"
  | "Feuerwehr"
  | "Rettungsdienst"
  | "Sonstiges";

export type ReportStatus = "new" | "confirmed" | "expired" | "hidden";

export type Report = {
  id: string;
  category: ReportCategory;
  location: string;
  description: string;
  authorId: string;
  authorName: string;
  authorRole: UserRole;
  confirmations: string[];
  reports: string[];
  commentsCount: number;
  status: ReportStatus;
  pinned?: boolean;
  createdAt?: unknown;
  updatedAt?: unknown;
};
