import React, { useState, useRef } from 'react';
import { Copy, Download, Tag, Globe, Lock, MoreVertical, Check, X, Share2 } from 'lucide-react';
import { StorachaFile } from '../types';
import { formatFileSize, formatDate, getFileTypeIcon, copyToClipboard } from '../utils/fileUtils';
import { decodeCidToString } from '../utils/decodeCidToString';

interface MobileFileCardProps {
  file: StorachaFile;
  onAddTag: (fileId: string, tag: string) => void;
  onRemoveTag: (fileId: string, tag: string) => void;
  isSelected?: boolean;
  onSelectionChange?: (fileId: string, selected: boolean) => void;
  showSelection?: boolean;
}

export const MobileFileCard: React.FC<MobileFileCardProps> = ({
  file,
  onAddTag,
  onRemoveTag,
  isSelected = false,
  onSelectionChange,
  showSelection = false
}) => {
  const [showActions, setShowActions] = useState(false);
  const [isAddingTag, setIsAddingTag] = useState(false);
  const [newTag, setNewTag] = useState('');
  const [copySuccess, setCopySuccess] = useState(false);
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const startX = useRef(0);

  const cidStr = decodeCidToString(file.cid);
  const previewUrl = cidStr ? `https://${cidStr}.ipfs.w3s.link/` : '#';

  const handleCopyCID = async () => {
    const success = await copyToClipboard(cidStr);
    if (success) {
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    }
  };

  const handleAddTag = () => {
    if (newTag.trim()) {
      onAddTag(file.id, newTag.trim());
      setNewTag('');
      setIsAddingTag(false);
    }
  };

  const handleDownload = () => {
    const a = document.createElement('a');
    a.href = previewUrl;
    a.download = cidStr || 'file';
    a.click();
  };

  const handleShare = async () => {
    if (typeof navigator !== 'undefined' && 'share' in navigator) {
      try {
        await navigator.share({
          title: `File: ${cidStr}`,
          text: `Check out this file from Storacha`,
          url: previewUrl,
        });
      } catch (err) {
        console.log('Error sharing:', err);
      }
    } else {
      // Fallback to copying URL
      await copyToClipboard(previewUrl);
    }
  };

  // Touch gesture handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX;
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    
    const currentX = e.touches[0].clientX;
    const diff = startX.current - currentX;
    
    // Limit swipe distance
    const maxSwipe = 80;
    setSwipeOffset(Math.max(0, Math.min(maxSwipe, diff)));
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    
    // If swiped enough, show actions
    if (swipeOffset > 40) {
      setShowActions(true);
    }
    
    // Reset swipe position
    setSwipeOffset(0);
  };

  return (
    <div className="relative">
      {/* Swipe Actions Background */}
      <div className="absolute inset-0 bg-red-500 rounded-lg flex items-center justify-end pr-4">
        <div className="flex space-x-3">
          <button
            onClick={handleCopyCID}
            className="p-3 bg-white rounded-full shadow-lg"
            title="Copy CID"
          >
            {copySuccess ? <Check className="w-5 h-5 text-green-600" /> : <Copy className="w-5 h-5 text-gray-600" />}
          </button>
          <button
            onClick={handleDownload}
            className="p-3 bg-white rounded-full shadow-lg"
            title="Download"
          >
            <Download className="w-5 h-5 text-gray-600" />
          </button>
          <button
            onClick={handleShare}
            className="p-3 bg-white rounded-full shadow-lg"
            title="Share"
          >
            <Share2 className="w-5 h-5 text-gray-600" />
          </button>
        </div>
      </div>

      {/* Main Card */}
      <div
        ref={cardRef}
        className={`relative bg-white border rounded-lg overflow-hidden transition-transform duration-200 ${
          isSelected ? 'border-red-500 bg-red-50' : 'border-gray-200'
        }`}
        style={{ transform: `translateX(-${swipeOffset}px)` }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div className="p-4">
          <div className="flex items-start space-x-3">
            {/* Selection Checkbox */}
            {showSelection && (
              <div className="flex-shrink-0 pt-1">
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={(e) => onSelectionChange?.(file.id, e.target.checked)}
                  className="w-5 h-5 text-red-600 border-gray-300 rounded focus:ring-red-500"
                />
              </div>
            )}

            {/* File Icon/Preview */}
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center text-xl">
                {!previewUrl ? getFileTypeIcon(file.type) : 
                  <img src={previewUrl} className='w-full h-full object-cover rounded-lg' />}
              </div>
            </div>

            {/* File Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-gray-900 truncate text-sm">
                    {cidStr}
                  </h3>
                  <div className="flex items-center space-x-2 mt-1">
                    <span className="text-xs text-gray-500">
                      {formatFileSize(file.size)}
                    </span>
                    <span className="text-xs text-gray-400">•</span>
                    <span className="text-xs text-gray-500">
                      {formatDate(file.created)}
                    </span>
                  </div>
                </div>

                {/* Public/Private Indicator */}
                <div className="flex-shrink-0 ml-2">
                  {file.isPublic ? (
                    <Globe className="w-4 h-4 text-green-600" />
                  ) : (
                    <Lock className="w-4 h-4 text-gray-400" />
                  )}
                </div>
              </div>

              {/* Tags */}
              <div className="mt-2">
                <div className="flex flex-wrap gap-1">
                  {(file.tags ?? []).map(tag => (
                    <span
                      key={tag}
                      className="inline-flex items-center px-2 py-1 text-xs bg-red-100 text-red-800 rounded-full"
                    >
                      {tag}
                      <button 
                        onClick={() => onRemoveTag(file.id, tag)} 
                        className="ml-1 hover:text-red-900"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              {/* Quick Actions */}
              <div className="mt-3 flex items-center justify-between">
                <div className="flex space-x-3">
                  <button
                    onClick={handleCopyCID}
                    className="flex items-center space-x-1 text-xs text-gray-600 hover:text-gray-800"
                  >
                    {copySuccess ? <Check className="w-3 h-3 text-green-600" /> : <Copy className="w-3 h-3" />}
                    <span>{copySuccess ? 'Copied!' : 'Copy'}</span>
                  </button>
                  <button
                    onClick={handleDownload}
                    className="flex items-center space-x-1 text-xs text-gray-600 hover:text-gray-800"
                  >
                    <Download className="w-3 h-3" />
                    <span>Download</span>
                  </button>
                  {typeof navigator !== 'undefined' && 'share' in navigator && (
                    <button
                      onClick={handleShare}
                      className="flex items-center space-x-1 text-xs text-gray-600 hover:text-gray-800"
                    >
                      <Share2 className="w-3 h-3" />
                      <span>Share</span>
                    </button>
                  )}
                </div>

                <button
                  onClick={() => setShowActions(!showActions)}
                  className="p-1 text-gray-400 hover:text-gray-600"
                >
                  <MoreVertical className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Add Tag Section */}
          {isAddingTag && (
            <div className="mt-3 pt-3 border-t border-gray-100">
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  placeholder="Enter tag name"
                  className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
                  autoFocus
                />
                <button 
                  onClick={handleAddTag} 
                  className="p-2 text-green-600 hover:text-green-700"
                >
                  <Check className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => setIsAddingTag(false)} 
                  className="p-2 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Add Tag Button */}
          {!isAddingTag && (
            <div className="mt-3 pt-3 border-t border-gray-100">
              <button 
                onClick={() => setIsAddingTag(true)} 
                className="flex items-center space-x-1 text-xs text-red-600 hover:text-red-700"
              >
                <Tag className="w-3 h-3" />
                <span>Add tag</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
