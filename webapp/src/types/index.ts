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
  tags: string[];
  isPublic: boolean;
  downloadCount: number;
}

export interface FilterState {
  search: string;
  fileType: string;
  dateRange: string;
  tags: string[];
  sortBy: 'name' | 'date' | 'size' | 'downloads';
  sortOrder: 'asc' | 'desc';
}

export type ViewMode = 'grid' | 'list';

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

export interface ActivityEvent {
  id: string;
  type: 'upload' | 'download' | 'delete' | 'share' | 'modify' | 'restore';
  fileName: string;
  fileId: string;
  userId: string;
  timestamp: number;
  details: {
    fileSize?: number;
    shareLink?: string;
    previousVersion?: string;
    reason?: string;
  };
  metadata: {
    ipAddress?: string;
    userAgent?: string;
    location?: string;
  };
}

export interface ActivityAnalytics {
  timeline: ActivityEvent[];
  userStats: {
    mostActiveUser: string;
    totalUsers: number;
    activeUsers: number;
  };
  patterns: {
    peakHours: number[];
    weeklyPattern: Record<string, number>;
    monthlyTrend: Array<{ month: string; activities: number }>;
  };
  fileActivity: {
    mostAccessed: Array<{ fileName: string; accessCount: number }>;
    recentlyModified: ActivityEvent[];
    sharedFiles: Array<{ fileName: string; shareCount: number }>;
  };
}

export interface ActivityFilters {
  search: string;
  type: string;
  dateRange: string;
  userId: string;
  sortBy: 'timestamp' | 'type' | 'fileName';
  sortOrder: 'asc' | 'desc';
}