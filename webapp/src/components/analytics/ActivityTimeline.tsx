import React, { useState, useEffect } from 'react';
import { Upload, Download, Trash2, User, FileText, Clock } from 'lucide-react';
import { analyticsService } from '../../services/database';

interface ActivityTimelineProps {
  spaceId: string;
}

interface Event {
  event_id: string;
  event_type: string;
  user_email: string | null;
  file_cid: string | null;
  created_at: string;
  payload: any;
}

export const ActivityTimeline: React.FC<ActivityTimelineProps> = ({ spaceId }) => {
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [spaceId]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const data = await analyticsService.getActivityTimeline(spaceId, 20);
      setEvents(data);
    } catch (error) {
      console.error('Failed to load activity timeline:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getEventIcon = (eventType: string) => {
    if (eventType.includes('upload')) return <Upload className="w-4 h-4 text-green-600" />;
    if (eventType.includes('download')) return <Download className="w-4 h-4 text-blue-600" />;
    if (eventType.includes('delete')) return <Trash2 className="w-4 h-4 text-red-600" />;
    if (eventType.includes('user')) return <User className="w-4 h-4 text-purple-600" />;
    return <FileText className="w-4 h-4 text-gray-600" />;
  };

  const getEventColor = (eventType: string) => {
    if (eventType.includes('upload')) return 'bg-green-100 border-green-300';
    if (eventType.includes('download')) return 'bg-blue-100 border-blue-300';
    if (eventType.includes('delete')) return 'bg-red-100 border-red-300';
    if (eventType.includes('user')) return 'bg-purple-100 border-purple-300';
    return 'bg-gray-100 border-gray-300';
  };

  const formatEventType = (eventType: string) => {
    return eventType
      .split('.')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    return date.toLocaleDateString();
  };

  if (isLoading) {
    return (
      <div className="h-64 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-gray-500">
        No activity yet
      </div>
    );
  }

  return (
    <div className="space-y-4 max-h-96 overflow-y-auto">
      {events.map((event) => (
        <div key={event.event_id} className="flex items-start space-x-3">
          <div className={`p-2 rounded-lg border ${getEventColor(event.event_type)}`}>
            {getEventIcon(event.event_type)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-gray-900">
                {formatEventType(event.event_type)}
              </p>
              <div className="flex items-center space-x-1 text-xs text-gray-500">
                <Clock className="w-3 h-3" />
                <span>{getTimeAgo(event.created_at)}</span>
              </div>
            </div>
            {event.user_email && (
              <p className="text-xs text-gray-500 mt-1">
                by {event.user_email}
              </p>
            )}
            {event.file_cid && (
              <p className="text-xs text-gray-400 mt-1 font-mono truncate">
                {event.file_cid.substring(0, 30)}...
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};
