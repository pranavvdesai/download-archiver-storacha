import React, { useState } from 'react';
import { 
  Clock, 
  Upload, 
  Download, 
  Share2, 
  Edit, 
  Trash2, 
  RotateCcw,
  Filter,
  Search,
  Download as DownloadIcon,
  RefreshCw
} from 'lucide-react';
import { ActivityEvent, ActivityFilters } from '../types';
import { useActivity } from '../hooks/useActivity';
import { ActivityFiltersComponent } from './ActivityFilters.tsx';
import { ActivityFeed } from './ActivityFeed.tsx';
import { UserAnalytics } from './UserAnalytics.tsx';

export const ActivityTimeline: React.FC = () => {
  const [showFilters, setShowFilters] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const {
    activities,
    isLoading,
    filters,
    analytics,
    updateFilters,
    clearFilters,
    exportActivities,
    refreshActivities
  } = useActivity();

  const getActivityIcon = (type: ActivityEvent['type']) => {
    switch (type) {
      case 'upload': return <Upload className="w-4 h-4" />;
      case 'download': return <Download className="w-4 h-4" />;
      case 'share': return <Share2 className="w-4 h-4" />;
      case 'modify': return <Edit className="w-4 h-4" />;
      case 'delete': return <Trash2 className="w-4 h-4" />;
      case 'restore': return <RotateCcw className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const getActivityColor = (type: ActivityEvent['type']) => {
    switch (type) {
      case 'upload': return 'text-green-600 bg-green-50';
      case 'download': return 'text-blue-600 bg-blue-50';
      case 'share': return 'text-purple-600 bg-purple-50';
      case 'modify': return 'text-yellow-600 bg-yellow-50';
      case 'delete': return 'text-red-600 bg-red-50';
      case 'restore': return 'text-orange-600 bg-orange-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const formatTimestamp = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    
    return new Date(timestamp).toLocaleDateString();
  };

  const getActivityDescription = (activity: ActivityEvent) => {
    const { type, fileName, details } = activity;
    
    switch (type) {
      case 'upload':
        return `Uploaded ${fileName}${details.fileSize ? ` (${formatFileSize(details.fileSize)})` : ''}`;
      case 'download':
        return `Downloaded ${fileName}`;
      case 'share':
        return `Shared ${fileName}${details.shareLink ? ' with link' : ''}`;
      case 'modify':
        return `Modified ${fileName}${details.previousVersion ? ` (was ${details.previousVersion})` : ''}`;
      case 'delete':
        return `Deleted ${fileName}${details.reason ? ` (${details.reason})` : ''}`;
      case 'restore':
        return `Restored ${fileName}`;
      default:
        return `${type} ${fileName}`;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Activity Timeline</h2>
            <p className="text-sm text-gray-500 mt-1">
              {activities.length} activities found
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowAnalytics(!showAnalytics)}
              className="px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Analytics
            </button>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors flex items-center space-x-1"
            >
              <Filter className="w-4 h-4" />
              <span>Filters</span>
            </button>
            <button
              onClick={exportActivities}
              className="px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors flex items-center space-x-1"
            >
              <DownloadIcon className="w-4 h-4" />
              <span>Export</span>
            </button>
            <button
              onClick={refreshActivities}
              disabled={isLoading}
              className="px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors flex items-center space-x-1 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>
        </div>
      </div>

      {showFilters && (
        <div className="p-6 border-b border-gray-200">
          <ActivityFiltersComponent
            filters={filters}
            onFiltersChange={updateFilters}
            onClearFilters={clearFilters}
          />
        </div>
      )}

      {showAnalytics && (
        <div className="p-6 border-b border-gray-200">
          <UserAnalytics analytics={analytics} />
        </div>
      )}

      <div className="p-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
            <span className="ml-3 text-gray-500">Loading activities...</span>
          </div>
        ) : activities.length === 0 ? (
          <div className="text-center py-12">
            <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No activities found</h3>
            <p className="text-gray-500">
              {filters.search || filters.type !== 'all' || filters.dateRange !== 'all'
                ? 'Try adjusting your filters to see more activities.'
                : 'No activities have been recorded yet.'}
            </p>
          </div>
        ) : (
          <ActivityFeed activities={activities} />
        )}
      </div>
    </div>
  );
};
