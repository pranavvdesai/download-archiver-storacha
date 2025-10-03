export interface User {
  id: string;
  name: string;
  avatar?: string;
  lastActivity: number;
  sessionExpiry: number;
  email: `${string}`;
  spaceDid?: `did:${string}:${string}`;
}

export interface StorachaFile {
  id: string;
  name: string;
  cid: string;
  size: number;
  type: string;
  mimeType: string;
  created: Date;
  updated?: Date;
  tags: string[];
  isPublic: boolean;
  downloadCount: number;
  // Enhanced categorization fields
  category?: string;
  extension?: string;
  autoTags?: string[];
  folderId?: string;
  filePath?: string;
  uploadedAt?: number;
}

export interface FilterState {
  search: string;
  fileType: string;
  dateRange: string;
  tags: string[];
  sortBy: "name" | "date" | "size" | "downloads";
  sortOrder: "asc" | "desc";
  // Enhanced filtering
  category?: string;
  folderId?: string;
}

export type ViewMode = "grid" | "list";

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

export interface Folder {
  id: string;
  name: string;
  description: string;
  color: string;
  created: number;
  fileCount: number;
  totalSize: number;
}

export interface BulkOperationResult {
  success: string[];
  failed: Array<{ fileId: string; error: string }>;
}

export interface FileMetadata {
  fileName: string;
  filePath: string;
  cid: string;
  url: string;
  category: string;
  extension: string;
  mimeType: string;
  fileSizeMB: number;
  autoTags: string[];
  suggestedFolder: string;
  folderId: string;
  downloadUrl?: string;
  downloadId?: number;
  uploadedAt: number;
}
