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
export type ReportPostType = "report" | "official" | "voice" | "official_voice";

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
  official?: boolean;
  postType?: ReportPostType;
  audioDataUrl?: string;
  audioMimeType?: string;
  audioDurationSeconds?: number;
  latitude?: number | null;
  longitude?: number | null;
  locationSource?: "manual" | "current_location";
  createdAt?: unknown;
  updatedAt?: unknown;
};

export type ReportComment = {
  id: string;
  reportId: string;
  text: string;
  authorId: string;
  authorName: string;
  authorRole: UserRole;
  createdAt?: unknown;
};

export type SupportTarget = "admin" | "developer";
export type SupportStatus = "open" | "answered" | "closed";
export type SupportCategory = "question" | "report_problem" | "bug" | "feedback" | "feature" | "other";

export type SupportTicket = {
  id: string;
  target: SupportTarget;
  category: SupportCategory;
  subject: string;
  initialMessage: string;
  status: SupportStatus;
  createdBy: string;
  createdByName: string;
  createdByRole: UserRole;
  assignedLabel: string;
  lastMessage: string;
  lastMessageBy: string;
  lastMessageAt?: unknown;
  createdAt?: unknown;
  updatedAt?: unknown;
};

export type SupportMessage = {
  id: string;
  ticketId: string;
  text: string;
  authorId: string;
  authorName: string;
  authorRole: UserRole;
  createdAt?: unknown;
};
