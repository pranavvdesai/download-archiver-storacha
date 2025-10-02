import { useState, useEffect, useCallback } from 'react';
import { ActivityEvent, ActivityAnalytics, ActivityFilters } from '../types';
import { useCache } from './useCache';
import { useAuth } from './useAuth';

const MOCK_ACTIVITIES: ActivityEvent[] = [
  {
    id: '1',
    type: 'upload',
    fileName: 'project-proposal.pdf',
    fileId: '1',
    userId: 'user1',
    timestamp: Date.now() - 1000 * 60 * 30, // 30 minutes ago
    details: { fileSize: 2048576 },
    metadata: { ipAddress: '192.168.1.1', userAgent: 'Mozilla/5.0...' }
  },
  {
    id: '2',
    type: 'download',
    fileName: 'vacation-photos.zip',
    fileId: '2',
    userId: 'user1',
    timestamp: Date.now() - 1000 * 60 * 60 * 2, 
    details: { fileSize: 52428800 },
    metadata: { ipAddress: '192.168.1.1', userAgent: 'Mozilla/5.0...' }
  },
  {
    id: '3',
    type: 'share',
    fileName: 'presentation.pptx',
    fileId: '3',
    userId: 'user1',
    timestamp: Date.now() - 1000 * 60 * 60 * 4, 
    details: { shareLink: 'https://storacha.com/share/abc123' },
    metadata: { ipAddress: '192.168.1.1', userAgent: 'Mozilla/5.0...' }
  },
  {
    id: '4',
    type: 'modify',
    fileName: 'database-backup.sql',
    fileId: '5',
    userId: 'user1',
    timestamp: Date.now() - 1000 * 60 * 60 * 6, 
    details: { previousVersion: 'v1.0' },
    metadata: { ipAddress: '192.168.1.1', userAgent: 'Mozilla/5.0...' }
  },
  {
    id: '5',
    type: 'delete',
    fileName: 'old-document.txt',
    fileId: '6',
    userId: 'user1',
    timestamp: Date.now() - 1000 * 60 * 60 * 8, 
    details: { reason: 'No longer needed' },
    metadata: { ipAddress: '192.168.1.1', userAgent: 'Mozilla/5.0...' }
  },
  {
    id: '6',
    type: 'upload',
    fileName: 'website-assets.zip',
    fileId: '6',
    userId: 'user1',
    timestamp: Date.now() - 1000 * 60 * 60 * 12, 
    details: { fileSize: 25165824 },
    metadata: { ipAddress: '192.168.1.1', userAgent: 'Mozilla/5.0...' }
  },
  {
    id: '7',
    type: 'download',
    fileName: 'music-collection.tar.gz',
    fileId: '4',
    userId: 'user1',
    timestamp: Date.now() - 1000 * 60 * 60 * 24, 
    details: { fileSize: 134217728 },
    metadata: { ipAddress: '192.168.1.1', userAgent: 'Mozilla/5.0...' }
  }
];

export const useActivity = () => {
  const [activities, setActivities] = useState<ActivityEvent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [filters, setFilters] = useState<ActivityFilters>({
    search: '',
    type: 'all',
    dateRange: 'all',
    userId: 'all',
    sortBy: 'timestamp',
    sortOrder: 'desc'
  });
  const { get, set } = useCache();
  const { user } = useAuth();

  const loadActivities = useCallback(async () => {
    setIsLoading(true);
    
    const cachedActivities = get<ActivityEvent[]>('activities');
    if (cachedActivities) {
      setActivities(cachedActivities);
      setIsLoading(false);
      return;
    }

    await new Promise(resolve => setTimeout(resolve, 500));
    
    setActivities(MOCK_ACTIVITIES);
    set('activities', MOCK_ACTIVITIES, 5 * 60 * 1000); 
    setIsLoading(false);
  }, [get, set]);

  const filteredActivities = useCallback(() => {
    let filtered = [...activities];

    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      filtered = filtered.filter(activity =>
        activity.fileName.toLowerCase().includes(searchTerm) ||
        activity.type.toLowerCase().includes(searchTerm)
      );
    }

    if (filters.type && filters.type !== 'all') {
      filtered = filtered.filter(activity => activity.type === filters.type);
    }

    if (filters.userId && filters.userId !== 'all') {
      filtered = filtered.filter(activity => activity.userId === filters.userId);
    }

    if (filters.dateRange && filters.dateRange !== 'all') {
      const now = Date.now();
      const filterDate = new Date();
      
      switch (filters.dateRange) {
        case 'today':
          filterDate.setHours(0, 0, 0, 0);
          break;
        case 'week':
          filterDate.setDate(new Date().getDate() - 7);
          break;
        case 'month':
          filterDate.setMonth(new Date().getMonth() - 1);
          break;
      }
      
      filtered = filtered.filter(activity => activity.timestamp >= filterDate.getTime());
    }

    filtered.sort((a, b) => {
      let compareValue = 0;
      
      switch (filters.sortBy) {
        case 'timestamp':
          compareValue = a.timestamp - b.timestamp;
          break;
        case 'type':
          compareValue = a.type.localeCompare(b.type);
          break;
        case 'fileName':
          compareValue = a.fileName.localeCompare(b.fileName);
          break;
      }
      
      return filters.sortOrder === 'desc' ? -compareValue : compareValue;
    });

    return filtered;
  }, [activities, filters]);

  const getAnalytics = useCallback((): ActivityAnalytics => {
    const now = Date.now();
    const oneWeekAgo = now - (7 * 24 * 60 * 60 * 1000);
    const oneMonthAgo = now - (30 * 24 * 60 * 60 * 1000);

    const uniqueUsers = new Set(activities.map(a => a.userId));
    const userActivityCounts = activities.reduce((acc, activity) => {
      acc[activity.userId] = (acc[activity.userId] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    const mostActiveUser = Object.entries(userActivityCounts)
      .sort(([,a], [,b]) => b - a)[0]?.[0] || '';

    const hourlyActivity = new Array(24).fill(0);
    const weeklyActivity: Record<string, number> = {};
    const monthlyActivity: Array<{ month: string; activities: number }> = [];

    activities.forEach(activity => {
      const date = new Date(activity.timestamp);
      const hour = date.getHours();
      const dayOfWeek = date.toLocaleDateString('en-US', { weekday: 'long' });
      
      hourlyActivity[hour]++;
      weeklyActivity[dayOfWeek] = (weeklyActivity[dayOfWeek] || 0) + 1;
    });

    const fileAccessCounts = activities.reduce((acc, activity) => {
      if (activity.type === 'download') {
        acc[activity.fileName] = (acc[activity.fileName] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    const mostAccessed = Object.entries(fileAccessCounts)
      .map(([fileName, accessCount]) => ({ fileName, accessCount }))
      .sort((a, b) => b.accessCount - a.accessCount)
      .slice(0, 10);

    const sharedFiles = activities
      .filter(a => a.type === 'share')
      .reduce((acc, activity) => {
        acc[activity.fileName] = (acc[activity.fileName] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

    const sharedFilesList = Object.entries(sharedFiles)
      .map(([fileName, shareCount]) => ({ fileName, shareCount }))
      .sort((a, b) => b.shareCount - a.shareCount);

    return {
      timeline: activities,
      userStats: {
        mostActiveUser,
        totalUsers: uniqueUsers.size,
        activeUsers: activities.filter(a => a.timestamp >= oneWeekAgo).length
      },
      patterns: {
        peakHours: hourlyActivity,
        weeklyPattern: weeklyActivity,
        monthlyTrend: monthlyActivity
      },
      fileActivity: {
        mostAccessed,
        recentlyModified: activities
          .filter(a => a.type === 'modify')
          .sort((a, b) => b.timestamp - a.timestamp)
          .slice(0, 10),
        sharedFiles: sharedFilesList
      }
    };
  }, [activities]);

  // Add new activity
  const addActivity = useCallback((activity: Omit<ActivityEvent, 'id' | 'timestamp'>) => {
    const newActivity: ActivityEvent = {
      ...activity,
      id: `activity_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      metadata: {
        ...activity.metadata,
        userAgent: navigator.userAgent,
        ipAddress: '127.0.0.1' 
      }
    };

    setActivities(prev => [newActivity, ...prev]);
    
    const updatedActivities = [newActivity, ...activities];
    set('activities', updatedActivities, 5 * 60 * 1000);
  }, [activities, set]);

  const updateFilters = useCallback((newFilters: Partial<ActivityFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({
      search: '',
      type: 'all',
      dateRange: 'all',
      userId: 'all',
      sortBy: 'timestamp',
      sortOrder: 'desc'
    });
  }, []);

  const exportActivities = useCallback(() => {
    const dataStr = JSON.stringify(filteredActivities(), null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `storacha-activities-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [filteredActivities]);

  useEffect(() => {
    loadActivities();
  }, [loadActivities]);

  return {
    activities: filteredActivities(),
    allActivities: activities,
    isLoading,
    filters,
    analytics: getAnalytics(),
    addActivity,
    updateFilters,
    clearFilters,
    exportActivities,
    refreshActivities: loadActivities
  };
};
