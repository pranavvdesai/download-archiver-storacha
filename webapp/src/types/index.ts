export interface User {
  email: `${string}`;
  spaceDid?: `did:${string}:${string}`;
  avatar: string;
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
  // OCR-related fields
  ocrStatus:
    | "not_processed"
    | "queued"
    | "processing"
    | "completed"
    | "failed"
    | "skipped";
  ocrError?: string;
  extractedText?: string;
  textExtractionMethod?: "embedded" | "ocr" | "none";
  processingStartedAt?: Date;
  processingCompletedAt?: Date;
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

export interface UserSettings {
  ocrEnabled: boolean;
  maxFileSizeForOcr: number; // in bytes
  ocrTimeout: number; // in milliseconds
}
