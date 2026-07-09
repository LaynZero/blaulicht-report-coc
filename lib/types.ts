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
  notificationCategories?: ReportCategory[];
  rulesAcceptedAt?: unknown;
  notificationOfficial?: boolean;
  notificationEmergency?: boolean;
  notificationMentions?: boolean;
  reportsCount?: number;
  confirmationsCount?: number;
  commentsCount?: number;
  banned?: boolean;
  avatarDataUrl?: string;
  createdAt?: unknown;
  /** Server-set on every report creation; used to enforce the per-user rate limit. */
  lastReportAt?: unknown;
  /** Device IDs seen for this account (see lib/deviceId.ts). Used for device-level bans. */
  deviceIds?: string[];
  /** True if any of this account's known devices are currently on the ban list. */
  deviceBanned?: boolean;
};

export type ReportCategory =
  | "Verkehrskontrolle"
  | "Blitzer"
  | "Unfall"
  | "Stau"
  | "Baustelle"
  | "Sonstiges";

export type ReportStatus = "new" | "confirmed" | "expired" | "hidden";
export type ReportPostType = "report" | "official" | "voice" | "official_voice" | "emergency" | "emergency_voice";

export type Report = {
  id: string;
  category: ReportCategory;
  location: string;
  description: string;
  authorId: string;
  authorName: string;
  authorRole: UserRole;
  authorUsername?: string;
  authorAvatarDataUrl?: string;
  /** Legacy/compat: wird nicht mehr für neue Status-Aktionen genutzt. */
  confirmations?: string[];
  confirmedBy?: string[];
  outdatedBy?: string[];
  reports: string[];
  commentsCount: number;
  status: ReportStatus;
  pinned?: boolean;
  official?: boolean;
  emergency?: boolean;
  imageDataUrl?: string;
  mentions?: string[];
  postType?: ReportPostType;
  audioDataUrl?: string;
  audioMimeType?: string;
  audioDurationSeconds?: number;
  latitude?: number | null;
  longitude?: number | null;
  locationSource?: "manual" | "current_location";
  createdAt?: unknown;
  updatedAt?: unknown;
  /** Set at creation to createdAt + 24h. A Firestore TTL policy on this field auto-deletes the doc. */
  expiresAt?: unknown;
};

export type ReportComment = {
  id: string;
  reportId: string;
  text: string;
  authorId: string;
  authorName: string;
  authorRole: UserRole;
  authorUsername?: string;
  authorAvatarDataUrl?: string;
  mentions?: string[];
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
  authorUsername?: string;
  createdAt?: unknown;
};


export type CrashLog = {
  id: string;
  message: string;
  source?: string;
  stack?: string;
  userId?: string;
  userAgent?: string;
  url?: string;
  pathname?: string;
  filename?: string;
  line?: number;
  column?: number;
  reason?: string;
  browser?: string;
  platform?: string;
  language?: string;
  online?: boolean;
  viewport?: string;
  screen?: string;
  visibilityState?: string;
  lastAction?: string;
  createdAt?: unknown;
};

export type AppSettings = {
  maintenanceMode: boolean;
  allowAdminsDuringMaintenance: boolean;
  maintenanceMessage?: string;
  groupRules?: string;
  updatedAt?: unknown;
  updatedBy?: string;
};

export type AppNotification = {
  id: string;
  userId: string;
  type: "mention" | "admin" | "system" | "reply";
  title: string;
  body: string;
  reportId?: string;
  source?: "report" | "comment" | "support" | "system";
  actorId?: string;
  actorName?: string;
  read?: boolean;
  createdAt?: unknown;
};
