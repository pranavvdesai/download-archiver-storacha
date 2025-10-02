import { useState, useMemo } from 'react';
import { StorageAnalytics, StorageQuota, FileTypeDistribution, StorachaFile } from '../types';
import { useCache } from './useCache';

const generateMockStorageAnalytics = (files: StorachaFile[]): StorageAnalytics => {
  const totalSize = files.reduce((sum, file) => sum + file.size, 0);
  const fileTypeMap = files.reduce((acc, file) => {
    const type = file.type || 'unknown';
    if (!acc[type]) {
      acc[type] = { count: 0, size: 0 };
    }
    acc[type].count += 1;
    acc[type].size += file.size;
    return acc;
  }, {} as Record<string, { count: number; size: number }>);

  const totalDownloads = files.reduce((sum, file) => sum + file.downloadCount, 0);
  const averageFileSize = files.length > 0 ? totalSize / files.length : 0;
  
  const sortedBySize = [...files].sort((a, b) => b.size - a.size);
  const largestFile = sortedBySize[0] ? { name: sortedBySize[0].name, size: sortedBySize[0].size } : { name: 'N/A', size: 0 };
  const smallestFile = sortedBySize[sortedBySize.length - 1] ? { name: sortedBySize[sortedBySize.length - 1].name, size: sortedBySize[sortedBySize.length - 1].size } : { name: 'N/A', size: 0 };

  const duplicateFiles = [
    { files: ['file1.jpg', 'file1_copy.jpg'], totalSize: 2048000 },
    { files: ['document.pdf', 'document_backup.pdf'], totalSize: 1024000 }
  ];

  const largeFiles = files
    .filter(file => file.size > 10 * 1024 * 1024) 
    .map(file => ({ name: file.name, size: file.size }))
    .slice(0, 5);

  const oldFiles = files
    .filter(file => {
      const ageInDays = (Date.now() - file.created.getTime()) / (1000 * 60 * 60 * 24);
      return ageInDays > 90; 
    })
    .map(file => ({ 
      name: file.name, 
      age: Math.floor((Date.now() - file.created.getTime()) / (1000 * 60 * 60 * 24))
    }))
    .slice(0, 5);

  const recommendations = [
    'Consider archiving old files to free up space',
    'Remove duplicate files to optimize storage',
    'Compress large files to reduce storage usage',
    'Review and delete unused files regularly'
  ];

  const trends = {
    dailyUploads: Array.from({ length: 30 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (29 - i));
      return {
        date: date.toISOString().split('T')[0],
        count: Math.floor(Math.random() * 10) + 1,
        size: Math.floor(Math.random() * 50 * 1024 * 1024) + 1024 * 1024
      };
    }),
    storageGrowth: Array.from({ length: 30 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (29 - i));
      const baseSize = totalSize * 0.7;
      const growth = (i / 29) * totalSize * 0.3;
      return {
        date: date.toISOString().split('T')[0],
        used: Math.floor(baseSize + growth)
      };
    })
  };

  return {
    storageUsage: {
      total: 100 * 1024 * 1024 * 1024, 
      used: totalSize,
      available: (100 * 1024 * 1024 * 1024) - totalSize,
      percentageUsed: (totalSize / (100 * 1024 * 1024 * 1024)) * 100,
      byFileType: fileTypeMap
    },
    fileStats: {
      totalFiles: files.length,
      totalDownloads,
      averageFileSize,
      largestFile,
      smallestFile
    },
    insights: {
      duplicateFiles,
      largeFiles,
      oldFiles,
      recommendations
    },
    trends
  };
};

export const useStorageAnalytics = () => {
  const [analytics, setAnalytics] = useState<StorageAnalytics | null>(null);
  const [quota, setQuota] = useState<StorageQuota | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { get, set } = useCache();

  const loadAnalytics = async (files: StorachaFile[]) => {
    setIsLoading(true);
    
    
    const cachedAnalytics = get<StorageAnalytics>('storageAnalytics');
    if (cachedAnalytics) {
      setAnalytics(cachedAnalytics);
      setIsLoading(false);
      return;
    }

    
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const mockAnalytics = generateMockStorageAnalytics(files);
    setAnalytics(mockAnalytics);
    set('storageAnalytics', mockAnalytics, 5 * 60 * 1000); 
    
    const quotaData: StorageQuota = {
      total: 100 * 1024 * 1024 * 1024,
      used: mockAnalytics.storageUsage.used,
      available: mockAnalytics.storageUsage.available,
      percentageUsed: mockAnalytics.storageUsage.percentageUsed,
      warningThreshold: 80,
      criticalThreshold: 95
    };
    setQuota(quotaData);
    
    setIsLoading(false);
  };

  const fileTypeDistribution = useMemo((): FileTypeDistribution[] => {
    if (!analytics) return [];
    
    const totalSize = analytics.storageUsage.used;
    const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#84CC16', '#F97316'];
    
    return Object.entries(analytics.storageUsage.byFileType).map(([type, data], index) => ({
      type,
      count: data.count,
      size: data.size,
      percentage: totalSize > 0 ? (data.size / totalSize) * 100 : 0,
      color: colors[index % colors.length]
    }));
  }, [analytics]);

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const exportAnalytics = (format: 'csv' | 'json') => {
    if (!analytics) return;
    
    if (format === 'json') {
      const dataStr = JSON.stringify(analytics, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'storage-analytics.json';
      link.click();
      URL.revokeObjectURL(url);
    } else if (format === 'csv') {
      const csvData = [
        ['Metric', 'Value'],
        ['Total Storage', formatBytes(analytics.storageUsage.total)],
        ['Used Storage', formatBytes(analytics.storageUsage.used)],
        ['Available Storage', formatBytes(analytics.storageUsage.available)],
        ['Percentage Used', `${analytics.storageUsage.percentageUsed.toFixed(2)}%`],
        ['Total Files', analytics.fileStats.totalFiles.toString()],
        ['Total Downloads', analytics.fileStats.totalDownloads.toString()],
        ['Average File Size', formatBytes(analytics.fileStats.averageFileSize)],
        ['Largest File', `${analytics.fileStats.largestFile.name} (${formatBytes(analytics.fileStats.largestFile.size)})`],
        ['Smallest File', `${analytics.fileStats.smallestFile.name} (${formatBytes(analytics.fileStats.smallestFile.size)})`]
      ];
      
      const csvContent = csvData.map(row => row.join(',')).join('\n');
      const dataBlob = new Blob([csvContent], { type: 'text/csv' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'storage-analytics.csv';
      link.click();
      URL.revokeObjectURL(url);
    }
  };

  return {
    analytics,
    quota,
    fileTypeDistribution,
    isLoading,
    loadAnalytics,
    formatBytes,
    exportAnalytics,
    refreshAnalytics: () => {
      if (analytics) {
        set('storageAnalytics', null, 0);
        loadAnalytics([]);
      }
    }
  };
};
