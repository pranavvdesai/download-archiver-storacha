export interface User {
  email: `${string}`;
  spaceDid?: `did:${string}:${string}`;
  avatar: string;
  name?: string;
  role?: SpaceRole;
}

export type SpaceRole = "owner" | "admin" | "member" | "viewer";

export interface SpaceMember {
  id: string;
  email: string;
  name?: string;
  avatar?: string;
  role: SpaceRole;
  joinedAt: Date;
  lastActive: Date;
}

export interface SpaceUsage {
  storageUsed: number;
  storageQuota: number;
  fileCount: number;
  fileQuota: number;
  bandwidthUsed: number;
  bandwidthQuota: number;
}

export interface SpaceSettings {
  name: string;
  description?: string;
  visibility: "private" | "public" | "team";
  allowMemberInvites: boolean;
  requireApproval: boolean;
  defaultFileVisibility: "private" | "public";
}

export interface SpaceBackup {
  id: string;
  name: string;
  createdAt: Date;
  size: number;
  fileCount: number;
  type: "manual" | "auto";
  status: "creating" | "ready" | "failed";
}

export interface ActivityLogEntry {
  id: string;
  userId: string;
  userName: string;
  action: string;
  target: string;
  details?: string;
  timestamp: Date;
  type: "file" | "member" | "settings" | "backup";
}

export interface StorachaFile {
  id: string;
  name: string;
  cid: string;
  size: number;
  type: string;
  mimeType: string;
  uploadedAt: Date;
  tags: string[];
  isPublic: boolean;
  downloadCount: number;
}

export interface FilterState {
  search: string;
  fileType: string;
  dateRange: string;
  tags: string[];
  sortBy: "name" | "date" | "size" | "downloads";
  sortOrder: "asc" | "desc";
}

export type ViewMode = "grid" | "list";

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}
