import React, { useState, useEffect } from 'react';
import { X, Link2, Clock, Download, Users, Copy, Trash2, Check, Eye, BarChart3 } from 'lucide-react';
import { shareLinkService, fileMetricsService, eventService } from '../services/database';
import { useAuth } from '../hooks/useAuth';
import toast from 'react-hot-toast';

interface ShareLink {
  share_id: string;
  share_token: string;
  expires_at: string | null;
  max_downloads: number | null;
  download_count: number;
  is_active: boolean;
  created_at: string;
  last_accessed_at: string | null;
}

interface ShareModalProps {
  fileId: string;
  fileCid: string;
  fileName: string;
  onClose: () => void;
}

export const ShareModal: React.FC<ShareModalProps> = ({ fileCid, fileName, onClose }) => {
  const { user } = useAuth();
  const [shareLinks, setShareLinks] = useState<ShareLink[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const [showMetrics, setShowMetrics] = useState(false);
  const [metrics, setMetrics] = useState<any>(null);

  const [expiryType, setExpiryType] = useState<'never' | '1hour' | '1day' | '7days' | '30days' | 'custom'>('never');
  const [customExpiry, setCustomExpiry] = useState('');
  const [maxDownloads, setMaxDownloads] = useState<number | ''>('');
  const [restrictedEmails, setRestrictedEmails] = useState('');

  useEffect(() => {
    loadShareLinks();
    if (showMetrics) {
      loadMetrics();
    }
  }, [fileCid, showMetrics]);

  const loadShareLinks = async () => {
    try {
      const links = await shareLinkService.getFileShareLinks(fileCid);
      setShareLinks(links as any);
    } catch (error: any) {
      console.error('Failed to load share links:', error);
      toast.error('Failed to load share links');
    }
  };

  const loadMetrics = async () => {
    try {
      const summary = await fileMetricsService.getFileMetricsSummary(fileCid);
      setMetrics(summary);
    } catch (error: any) {
      console.error('Failed to load metrics:', error);
    }
  };

  const generateShareToken = () => {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  };

  const calculateExpiryDate = (): string | null => {
    if (expiryType === 'never') return null;
    if (expiryType === 'custom') return customExpiry || null;

    const now = new Date();
    switch (expiryType) {
      case '1hour':
        now.setHours(now.getHours() + 1);
        break;
      case '1day':
        now.setDate(now.getDate() + 1);
        break;
      case '7days':
        now.setDate(now.getDate() + 7);
        break;
      case '30days':
        now.setDate(now.getDate() + 30);
        break;
    }
    return now.toISOString();
  };

  const handleCreateShareLink = async () => {
    if (!user?.email) {
      toast.error('You must be logged in to create share links');
      return;
    }

    setIsLoading(true);
    try {
      const expiresAt = calculateExpiryDate();
      const allowedEmails = restrictedEmails.trim() 
        ? restrictedEmails.split(',').map(e => e.trim()).filter(Boolean)
        : null;

      const shareLink = await shareLinkService.createShareLink({
        file_cid: fileCid,
        created_by_email: user.email,
        share_token: generateShareToken(),
        expires_at: expiresAt,
        max_downloads: maxDownloads || null,
        allowed_emails: allowedEmails,
      });

      await eventService.logEvent({
        event_type: 'file.shared',
        user_email: user.email,
        file_cid: fileCid,
        payload: {
          share_id: shareLink.share_id,
          expires_at: expiresAt,
          max_downloads: maxDownloads || null,
        },
      });

      await fileMetricsService.trackShare(fileCid);

      toast.success('Share link created successfully!');
      await loadShareLinks();

      setExpiryType('never');
      setMaxDownloads('');
      setRestrictedEmails('');
      setCustomExpiry('');
    } catch (error: any) {
      console.error('Failed to create share link:', error);
      toast.error(`Failed to create share link: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyLink = async (token: string) => {
    const shareUrl = `${window.location.origin}/share/${token}`;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopiedToken(token);
      toast.success('Link copied to clipboard!');
      setTimeout(() => setCopiedToken(null), 2000);
    } catch (error) {
      toast.error('Failed to copy link');
    }
  };

  const handleDeactivateLink = async (shareId: string) => {
    try {
      await shareLinkService.deactivateShareLink(shareId);
      toast.success('Share link deactivated');
      await loadShareLinks();
    } catch (error: any) {
      console.error('Failed to deactivate link:', error);
      toast.error(`Failed to deactivate link: ${error.message}`);
    }
  };

  const handleDeleteLink = async (shareId: string) => {
    if (!confirm('Are you sure you want to delete this share link?')) return;

    try {
      await shareLinkService.deleteShareLink(shareId);
      toast.success('Share link deleted');
      await loadShareLinks();
    } catch (error: any) {
      console.error('Failed to delete link:', error);
      toast.error(`Failed to delete link: ${error.message}`);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const isExpired = (expiresAt: string | null) => {
    if (!expiresAt) return false;
    return new Date(expiresAt) < new Date();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Link2 className="w-5 h-5" />
              Share: {fileName}
            </h2>
            <p className="text-sm text-gray-500 mt-1">Create and manage share links</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="border border-gray-200 rounded-lg p-4">
            <button
              onClick={() => setShowMetrics(!showMetrics)}
              className="w-full flex items-center justify-between text-left"
            >
              <div className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-gray-700" />
                <span className="font-semibold text-gray-900">Analytics</span>
              </div>
              <span className="text-sm text-gray-500">
                {showMetrics ? 'Hide' : 'Show'}
              </span>
            </button>
            
            {showMetrics && metrics && (
              <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <Eye className="w-5 h-5 text-blue-600 mx-auto mb-1" />
                  <div className="text-2xl font-bold text-gray-900">{metrics.totalViews}</div>
                  <div className="text-xs text-gray-500">Views</div>
                </div>
                <div className="text-center">
                  <Download className="w-5 h-5 text-green-600 mx-auto mb-1" />
                  <div className="text-2xl font-bold text-gray-900">{metrics.totalDownloads}</div>
                  <div className="text-xs text-gray-500">Downloads</div>
                </div>
                <div className="text-center">
                  <Link2 className="w-5 h-5 text-purple-600 mx-auto mb-1" />
                  <div className="text-2xl font-bold text-gray-900">{metrics.totalShares}</div>
                  <div className="text-xs text-gray-500">Shares</div>
                </div>
                <div className="text-center">
                  <BarChart3 className="w-5 h-5 text-orange-600 mx-auto mb-1" />
                  <div className="text-2xl font-bold text-gray-900">
                    {(metrics.totalBandwidth / (1024 * 1024)).toFixed(1)}MB
                  </div>
                  <div className="text-xs text-gray-500">Bandwidth</div>
                </div>
              </div>
            )}
          </div>

          <div className="border border-gray-200 rounded-lg p-4 space-y-4">
            <h3 className="font-semibold text-gray-900">Create New Share Link</h3>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Clock className="w-4 h-4 inline mr-1" />
                Expiration
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {(['never', '1hour', '1day', '7days', '30days', 'custom'] as const).map((type) => (
                  <button
                    key={type}
                    onClick={() => setExpiryType(type)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      expiryType === type
                        ? 'bg-red-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {type === 'never' && 'Never'}
                    {type === '1hour' && '1 Hour'}
                    {type === '1day' && '1 Day'}
                    {type === '7days' && '7 Days'}
                    {type === '30days' && '30 Days'}
                    {type === 'custom' && 'Custom'}
                  </button>
                ))}
              </div>
              {expiryType === 'custom' && (
                <input
                  type="datetime-local"
                  value={customExpiry}
                  onChange={(e) => setCustomExpiry(e.target.value)}
                  className="mt-2 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                />
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Download className="w-4 h-4 inline mr-1" />
                Max Downloads (optional)
              </label>
              <input
                type="number"
                min="1"
                placeholder="Unlimited"
                value={maxDownloads}
                onChange={(e) => setMaxDownloads(e.target.value ? parseInt(e.target.value) : '')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Users className="w-4 h-4 inline mr-1" />
                Restrict to Emails (optional)
              </label>
              <input
                type="text"
                placeholder="email1@example.com, email2@example.com"
                value={restrictedEmails}
                onChange={(e) => setRestrictedEmails(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
              />
              <p className="text-xs text-gray-500 mt-1">Comma-separated email addresses</p>
            </div>

            <button
              onClick={handleCreateShareLink}
              disabled={isLoading}
              className="w-full bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed font-medium"
            >
              {isLoading ? 'Creating...' : 'Create Share Link'}
            </button>
          </div>

          <div className="space-y-3">
            <h3 className="font-semibold text-gray-900">
              Existing Share Links ({shareLinks.length})
            </h3>

            {shareLinks.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Link2 className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No share links created yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {shareLinks.map((link) => {
                  const expired = isExpired(link.expires_at);
                  const limitReached = link.max_downloads && link.download_count >= link.max_downloads;
                  const inactive = !link.is_active || expired || limitReached;

                  return (
                    <div
                      key={link.share_id}
                      className={`border rounded-lg p-4 ${
                        inactive ? 'bg-gray-50 border-gray-300' : 'border-gray-200'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <code className="text-sm bg-gray-100 px-2 py-1 rounded font-mono truncate flex-1">
                              {`${window.location.origin}/share/${link.share_token}`}
                            </code>
                            <button
                              onClick={() => handleCopyLink(link.share_token)}
                              className="p-2 hover:bg-gray-200 rounded transition-colors flex-shrink-0"
                              title="Copy link"
                            >
                              {copiedToken === link.share_token ? (
                                <Check className="w-4 h-4 text-green-600" />
                              ) : (
                                <Copy className="w-4 h-4 text-gray-600" />
                              )}
                            </button>
                          </div>
                          
                          <div className="flex flex-wrap gap-3 text-xs text-gray-600">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {expired ? (
                                <span className="text-red-600 font-medium">Expired</span>
                              ) : (
                                <>Expires: {formatDate(link.expires_at)}</>
                              )}
                            </span>
                            <span className="flex items-center gap-1">
                              <Download className="w-3 h-3" />
                              Downloads: {link.download_count}
                              {link.max_downloads && ` / ${link.max_downloads}`}
                              {limitReached && (
                                <span className="text-red-600 font-medium ml-1">(Limit reached)</span>
                              )}
                            </span>
                            {link.last_accessed_at && (
                              <span className="flex items-center gap-1">
                                Last accessed: {formatDate(link.last_accessed_at)}
                              </span>
                            )}
                          </div>

                          {!link.is_active && (
                            <div className="mt-2">
                              <span className="inline-flex items-center px-2 py-1 bg-gray-200 text-gray-700 text-xs rounded">
                                Deactivated
                              </span>
                            </div>
                          )}
                        </div>

                        <div className="flex gap-1 flex-shrink-0">
                          {link.is_active && !expired && !limitReached && (
                            <button
                              onClick={() => handleDeactivateLink(link.share_id)}
                              className="p-2 hover:bg-yellow-100 rounded transition-colors text-yellow-600"
                              title="Deactivate link"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteLink(link.share_id)}
                            className="p-2 hover:bg-red-100 rounded transition-colors text-red-600"
                            title="Delete link"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
