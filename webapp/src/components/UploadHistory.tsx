import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { Clock, Download, MousePointer, Filter, Search, Calendar, FileText, ExternalLink } from 'lucide-react';
import { Header } from './Header';

interface UploadRecord {
  id: string;
  user_email: string;
  space_id: string | null;
  filename: string;
  cid: string;
  url: string | null;
  size_mb: number;
  source: 'download' | 'context-menu';
  timestamp: string;
  metadata: any;
}

type SourceFilter = 'all' | 'download' | 'context-menu';
type TimeFilter = 'all' | 'today' | 'week' | 'month';

export const UploadHistory: React.FC = () => {
  const { user } = useAuth();
  const [uploads, setUploads] = useState<UploadRecord[]>([]);
  const [filteredUploads, setFilteredUploads] = useState<UploadRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>('all');
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (user?.email) {
      fetchUploadHistory();
    }
  }, [user]);

  useEffect(() => {
    applyFilters();
  }, [uploads, sourceFilter, timeFilter, searchQuery]);

  const fetchUploadHistory = async () => {
    if (!user?.email) return;

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('upload_history')
        .select('*')
        .eq('user_email', user.email)
        .order('timestamp', { ascending: false })
        .limit(500);

      if (fetchError) throw fetchError;

      setUploads((data as UploadRecord[]) || []);
    } catch (err) {
      console.error('Failed to fetch upload history:', err);
      setError(err instanceof Error ? err.message : 'Failed to load upload history');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...uploads];

    if (sourceFilter !== 'all') {
      filtered = filtered.filter(upload => upload.source === sourceFilter);
    }

    if (timeFilter !== 'all') {
      const now = new Date();
      const filterDate = new Date();

      switch (timeFilter) {
        case 'today':
          filterDate.setHours(0, 0, 0, 0);
          break;
        case 'week':
          filterDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          filterDate.setMonth(now.getMonth() - 1);
          break;
      }

      filtered = filtered.filter(upload => new Date(upload.timestamp) >= filterDate);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(upload =>
        upload.filename.toLowerCase().includes(query) ||
        upload.cid.toLowerCase().includes(query)
      );
    }

    setFilteredUploads(filtered);
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getIPFSUrl = (cid: string) => `https://${cid}.ipfs.w3s.link`;

  const groupByDate = (uploads: UploadRecord[]) => {
    const groups: { [key: string]: UploadRecord[] } = {};

    uploads.forEach(upload => {
      const date = new Date(upload.timestamp).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });

      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(upload);
    });

    return groups;
  };

  const groupedUploads = groupByDate(filteredUploads);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header searchQuery="" onSearchChange={() => {}} />
      
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Upload History</h1>
          <p className="text-gray-600">
            View all uploads synced from your browser extension
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search by filename or CID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Filter className="text-gray-400 w-5 h-5" />
              <select
                value={sourceFilter}
                onChange={(e) => setSourceFilter(e.target.value as SourceFilter)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              >
                <option value="all">All Sources</option>
                <option value="download">Downloads</option>
                <option value="context-menu">Context Menu</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <Calendar className="text-gray-400 w-5 h-5" />
              <select
                value={timeFilter}
                onChange={(e) => setTimeFilter(e.target.value as TimeFilter)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              >
                <option value="all">All Time</option>
                <option value="today">Today</option>
                <option value="week">Last 7 Days</option>
                <option value="month">Last 30 Days</option>
              </select>
            </div>
          </div>

          {/* Stats */}
          <div className="mt-4 pt-4 border-t border-gray-200 flex gap-6 text-sm text-gray-600">
            <div>
              <span className="font-semibold text-gray-900">{filteredUploads.length}</span> uploads
            </div>
            <div>
              <span className="font-semibold text-gray-900">
                {filteredUploads.reduce((sum, u) => sum + u.size_mb, 0).toFixed(2)}
              </span> MB total
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {filteredUploads.length === 0 && !loading && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No uploads found</h3>
            <p className="text-gray-600">
              {searchQuery || sourceFilter !== 'all' || timeFilter !== 'all'
                ? 'Try adjusting your filters'
                : 'Start uploading files from your browser extension'}
            </p>
          </div>
        )}

        {Object.keys(groupedUploads).length > 0 && (
          <div className="space-y-8">
            {Object.entries(groupedUploads).map(([date, uploads]) => (
              <div key={date}>
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex-1 h-px bg-gray-200"></div>
                  <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
                    {date}
                  </h2>
                  <div className="flex-1 h-px bg-gray-200"></div>
                </div>

                <div className="space-y-3">
                  {uploads.map((upload) => (
                    <div
                      key={upload.id}
                      className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start gap-4">
                        <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                          upload.source === 'download' 
                            ? 'bg-blue-100 text-blue-600' 
                            : 'bg-purple-100 text-purple-600'
                        }`}>
                          {upload.source === 'download' ? (
                            <Download className="w-5 h-5" />
                          ) : (
                            <MousePointer className="w-5 h-5" />
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <h3 className="text-base font-semibold text-gray-900 truncate">
                                {upload.filename}
                              </h3>
                              <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                                <span className="flex items-center gap-1">
                                  <Clock className="w-4 h-4" />
                                  {formatTime(upload.timestamp)}
                                </span>
                                <span>{upload.size_mb.toFixed(2)} MB</span>
                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                  upload.source === 'download'
                                    ? 'bg-blue-100 text-blue-700'
                                    : 'bg-purple-100 text-purple-700'
                                }`}>
                                  {upload.source === 'download' ? 'Download' : 'Context Menu'}
                                </span>
                              </div>
                            </div>

                            <div className="flex-shrink-0">
                              <a
                                href={getIPFSUrl(upload.cid)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
                              >
                                <ExternalLink className="w-4 h-4" />
                                View
                              </a>
                            </div>
                          </div>

                          <div className="mt-2 flex items-center gap-2">
                            <code className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-600 font-mono">
                              {upload.cid}
                            </code>
                          </div>

                          {upload.url && (
                            <div className="mt-2 text-xs text-gray-500 truncate">
                              Source: <a href={upload.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{upload.url}</a>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
