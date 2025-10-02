import React from 'react';
import { FileText, Download, HardDrive, TrendingUp, File, Archive, Image, Music } from 'lucide-react';
import { StorageAnalytics, FileTypeDistribution } from '../types';

interface FileStatisticsProps {
  analytics: StorageAnalytics;
  fileTypeDistribution: FileTypeDistribution[];
  formatBytes: (bytes: number) => string;
}

export const FileStatistics: React.FC<FileStatisticsProps> = ({
  analytics,
  fileTypeDistribution,
  formatBytes
}) => {
  const getFileTypeIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'document':
        return <FileText className="w-4 h-4" />;
      case 'archive':
        return <Archive className="w-4 h-4" />;
      case 'image':
        return <Image className="w-4 h-4" />;
      case 'music':
        return <Music className="w-4 h-4" />;
      default:
        return <File className="w-4 h-4" />;
    }
  };

  const getFileTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'document':
        return 'text-blue-600 bg-blue-100';
      case 'archive':
        return 'text-purple-600 bg-purple-100';
      case 'image':
        return 'text-green-600 bg-green-100';
      case 'music':
        return 'text-pink-600 bg-pink-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="space-y-6">
      {/* Main Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <FileText className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Total Files</p>
              <p className="text-2xl font-bold text-gray-900">
                {analytics.fileStats.totalFiles.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Download className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Total Downloads</p>
              <p className="text-2xl font-bold text-gray-900">
                {analytics.fileStats.totalDownloads.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <HardDrive className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Average Size</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatBytes(analytics.fileStats.averageFileSize)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <TrendingUp className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Storage Used</p>
              <p className="text-2xl font-bold text-gray-900">
                {analytics.storageUsage.percentageUsed.toFixed(1)}%
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* File Size Extremes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Largest Files</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-red-100 rounded-lg">
                  <File className="w-4 h-4 text-red-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">{analytics.fileStats.largestFile.name}</p>
                  <p className="text-sm text-gray-600">Largest file</p>
                </div>
              </div>
              <span className="text-sm font-semibold text-red-600">
                {formatBytes(analytics.fileStats.largestFile.size)}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <File className="w-4 h-4 text-green-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">{analytics.fileStats.smallestFile.name}</p>
                  <p className="text-sm text-gray-600">Smallest file</p>
                </div>
              </div>
              <span className="text-sm font-semibold text-green-600">
                {formatBytes(analytics.fileStats.smallestFile.size)}
              </span>
            </div>
          </div>
        </div>

        {/* File Type Distribution */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">File Types</h3>
          <div className="space-y-3">
            {fileTypeDistribution.slice(0, 5).map((item, index) => (
              <div key={item.type} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-lg ${getFileTypeColor(item.type)}`}>
                    {getFileTypeIcon(item.type)}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 capitalize">{item.type}</p>
                    <p className="text-sm text-gray-600">{item.count} files</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-gray-900">
                    {formatBytes(item.size)}
                  </p>
                  <p className="text-xs text-gray-500">
                    {item.percentage.toFixed(1)}%
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Storage Breakdown */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Storage Breakdown</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">
              {formatBytes(analytics.storageUsage.used)}
            </div>
            <div className="text-sm text-blue-600 font-medium">Used Storage</div>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">
              {formatBytes(analytics.storageUsage.available)}
            </div>
            <div className="text-sm text-green-600 font-medium">Available Storage</div>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-gray-600">
              {formatBytes(analytics.storageUsage.total)}
            </div>
            <div className="text-sm text-gray-600 font-medium">Total Storage</div>
          </div>
        </div>
      </div>

      {/* Activity Summary */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Upload Activity</h4>
            <div className="space-y-2">
              {analytics.trends.dailyUploads.slice(-5).map((day, index) => (
                <div key={index} className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">
                    {new Date(day.date).toLocaleDateString('en-US', { 
                      month: 'short', 
                      day: 'numeric' 
                    })}
                  </span>
                  <div className="flex items-center space-x-2">
                    <span className="text-gray-900">{day.count} files</span>
                    <span className="text-gray-500">({formatBytes(day.size)})</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Storage Growth</h4>
            <div className="space-y-2">
              {analytics.trends.storageGrowth.slice(-5).map((day, index) => (
                <div key={index} className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">
                    {new Date(day.date).toLocaleDateString('en-US', { 
                      month: 'short', 
                      day: 'numeric' 
                    })}
                  </span>
                  <span className="text-gray-900">{formatBytes(day.used)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
