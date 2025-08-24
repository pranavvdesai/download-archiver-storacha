import React, { useState } from 'react';
import { Copy, Download, Tag, Globe, Lock, MoreVertical, Check, X } from 'lucide-react';
import { StorachaFile } from '../types';
import { formatFileSize, formatDate, getFileTypeIcon, copyToClipboard } from '../utils/fileUtils';

interface FileCardProps {
  file: StorachaFile;
  viewMode: 'grid' | 'list';
  onAddTag: (fileId: string, tag: string) => void;
  onRemoveTag: (fileId: string, tag: string) => void;
  isSelected?: boolean;
  onSelectionChange?: (fileId: string, selected: boolean) => void;
  showSelection?: boolean;
}

export const FileCard: React.FC<FileCardProps> = ({
  file,
  viewMode,
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

  const handleCopyCID = async () => {
    const success = await copyToClipboard(file.cid);
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
    // Simulate download
    console.log(`Downloading file: ${file.name} with CID: ${file.cid}`);
  };

  if (viewMode === 'list') {
    return (
      <div className={`bg-white border rounded-lg p-4 hover:shadow-md transition-all duration-200 group ${
        isSelected ? 'border-red-500 bg-red-50' : 'border-gray-200'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4 flex-1 min-w-0">
            {showSelection && (
              <input
                type="checkbox"
                checked={isSelected}
                onChange={(e) => onSelectionChange?.(file.id, e.target.checked)}
                className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
              />
            )}
            <div className="text-2xl">{getFileTypeIcon(file.type)}</div>
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-gray-900 truncate">{file.name}</h3>
              <div className="flex items-center space-x-4 text-sm text-gray-500 mt-1">
                <span>{formatFileSize(file.size)}</span>
                <span>{formatDate(file.uploadedAt)}</span>
                <span className="flex items-center space-x-1">
                  {file.isPublic ? <Globe className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
                  <span>{file.isPublic ? 'Public' : 'Private'}</span>
                </span>
                <span>{file.downloadCount} downloads</span>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <div className="flex flex-wrap gap-1">
              {file.tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center px-2 py-1 text-xs bg-red-100 text-red-800 rounded-full group-hover:bg-red-200 transition-colors"
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

            <div className="relative">
              <button
                onClick={() => setShowActions(!showActions)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all duration-200"
              >
                <MoreVertical className="w-4 h-4" />
              </button>

              {showActions && (
                <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                  <button
                    onClick={handleCopyCID}
                    className="w-full flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    {copySuccess ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                    <span>{copySuccess ? 'Copied!' : 'Copy CID'}</span>
                  </button>
                  <button
                    onClick={() => setIsAddingTag(true)}
                    className="w-full flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <Tag className="w-4 h-4" />
                    <span>Add Tag</span>
                  </button>
                  <button
                    onClick={handleDownload}
                    className="w-full flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {isAddingTag && (
          <div className="mt-3 flex items-center space-x-2">
            <input
              type="text"
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              placeholder="Enter tag name"
              className="flex-1 px-3 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-red-500 focus:border-transparent"
              onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
              autoFocus
            />
            <button
              onClick={handleAddTag}
              className="p-1 text-green-600 hover:text-green-700"
            >
              <Check className="w-4 h-4" />
            </button>
            <button
              onClick={() => setIsAddingTag(false)}
              className="p-1 text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`bg-white border rounded-lg overflow-hidden hover:shadow-lg transition-all duration-200 group ${
      isSelected ? 'border-red-500' : 'border-gray-200'
    }`}>
      <div className="aspect-square bg-gray-50 flex items-center justify-center text-4xl relative">
        {showSelection && (
          <div className="absolute top-2 left-2 z-10">
            <input
              type="checkbox"
              checked={isSelected}
              onChange={(e) => onSelectionChange?.(file.id, e.target.checked)}
              className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500 bg-white"
            />
          </div>
        )}
        {getFileTypeIcon(file.type)}
        <div className="absolute top-2 right-2">
          {file.isPublic ? (
            <Globe className="w-4 h-4 text-gray-400" />
          ) : (
            <Lock className="w-4 h-4 text-gray-400" />
          )}
        </div>
        
        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100">
          <div className="flex space-x-2">
            <button
              onClick={handleCopyCID}
              className="p-2 bg-white rounded-full shadow-md hover:shadow-lg transition-all duration-200"
              title="Copy CID"
            >
              {copySuccess ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
            </button>
            <button
              onClick={handleDownload}
              className="p-2 bg-white rounded-full shadow-md hover:shadow-lg transition-all duration-200"
              title="Download"
            >
              <Download className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="p-4">
        <h3 className="font-medium text-gray-900 truncate mb-2">{file.name}</h3>
        
        <div className="space-y-2 text-sm text-gray-500">
          <div className="flex justify-between">
            <span>Size</span>
            <span>{formatFileSize(file.size)}</span>
          </div>
          <div className="flex justify-between">
            <span>Uploaded</span>
            <span>{formatDate(file.uploadedAt)}</span>
          </div>
          <div className="flex justify-between">
            <span>Downloads</span>
            <span>{file.downloadCount}</span>
          </div>
        </div>

        <div className="mt-3">
          <div className="flex flex-wrap gap-1 mb-2">
            {file.tags.map((tag) => (
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

          {isAddingTag ? (
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                placeholder="Enter tag"
                className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-red-500 focus:border-transparent"
                onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
                autoFocus
              />
              <button
                onClick={handleAddTag}
                className="p-1 text-green-600 hover:text-green-700"
              >
                <Check className="w-3 h-3" />
              </button>
              <button
                onClick={() => setIsAddingTag(false)}
                className="p-1 text-gray-400 hover:text-gray-600"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setIsAddingTag(true)}
              className="flex items-center space-x-1 text-xs text-red-600 hover:text-red-700 transition-colors"
            >
              <Tag className="w-3 h-3" />
              <span>Add tag</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};