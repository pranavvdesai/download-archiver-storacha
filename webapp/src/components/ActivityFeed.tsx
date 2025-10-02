import React from 'react';
import { 
  Upload, 
  Download, 
  Share2, 
  Edit, 
  Trash2, 
  RotateCcw,
  Clock,
  User,
  ExternalLink
} from 'lucide-react';
import { ActivityEvent } from '../types';

interface ActivityFeedProps {
  activities: ActivityEvent[];
}

export const ActivityFeed: React.FC<ActivityFeedProps> = ({ activities }) => {
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
      case 'upload': return 'text-green-600 bg-green-50 border-green-200';
      case 'download': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'share': return 'text-purple-600 bg-purple-50 border-purple-200';
      case 'modify': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'delete': return 'text-red-600 bg-red-50 border-red-200';
      case 'restore': return 'text-orange-600 bg-orange-50 border-orange-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
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

  const getActivityDetails = (activity: ActivityEvent) => {
    const { details, metadata } = activity;
    const detailsList = [];

    if (details.fileSize) {
      detailsList.push(`Size: ${formatFileSize(details.fileSize)}`);
    }
    if (details.shareLink) {
      detailsList.push(
        <a 
          href={details.shareLink} 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-blue-600 hover:text-blue-800 flex items-center space-x-1"
        >
          <span>View link</span>
          <ExternalLink className="w-3 h-3" />
        </a>
      );
    }
    if (details.previousVersion) {
      detailsList.push(`Previous: ${details.previousVersion}`);
    }
    if (details.reason) {
      detailsList.push(`Reason: ${details.reason}`);
    }
    if (metadata.ipAddress) {
      detailsList.push(`IP: ${metadata.ipAddress}`);
    }

    return detailsList;
  };

  return (
    <div className="space-y-4">
      {activities.map((activity, index) => (
        <div key={activity.id} className="flex items-start space-x-4 p-4 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
          {/* Activity Icon */}
          <div className={`flex-shrink-0 w-8 h-8 rounded-full border flex items-center justify-center ${getActivityColor(activity.type)}`}>
            {getActivityIcon(activity.type)}
          </div>

          {/* Activity Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <p className="text-sm font-medium text-gray-900">
                  {getActivityDescription(activity)}
                </p>
                <span className="text-xs text-gray-500">
                  {formatTimestamp(activity.timestamp)}
                </span>
              </div>
              <div className="flex items-center space-x-2 text-xs text-gray-500">
                <User className="w-3 h-3" />
                <span>{activity.userId}</span>
              </div>
            </div>

            {/* Activity Details */}
            {getActivityDetails(activity).length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {getActivityDetails(activity).map((detail, detailIndex) => (
                  <span 
                    key={detailIndex}
                    className="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded"
                  >
                    {detail}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};
