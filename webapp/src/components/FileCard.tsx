import React, { useState } from 'react';
import { Copy, Download, Tag, Globe, Lock, MoreVertical, Check, X } from 'lucide-react';
import { StorachaFile } from '../types';
import { formatFileSize, formatDate, getFileTypeIcon, copyToClipboard } from '../utils/fileUtils';
import { decodeCidToString } from '../utils/decodeCidToString';

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

  if (viewMode === 'list') {
    return (
      <div className={`bg-white dark:bg-gray-800 border rounded-lg p-4 hover:shadow-md transition-all duration-200 group ${
        isSelected ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' : 'border-gray-200 dark:border-gray-700'
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
            <div className="text-2xl">{!previewUrl ? getFileTypeIcon(file.type) : 
        <img src={previewUrl} className='h-10 w-10' />}</div>
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-gray-900 dark:text-white truncate">{cidStr}</h3>
              <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400 mt-1">
                <span>{formatFileSize(file.size)}</span>
                <span>{formatDate(file.created)}</span>
                <span className="flex items-center space-x-1">
                  {file.isPublic ? <Globe className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
                  <span>{file.isPublic ? 'Public' : 'Private'}</span>
                </span>
                <span>{file.downloadCount ?? 0} downloads</span>
                <a href={previewUrl} target="_blank" rel="noopener noreferrer"
                  className="text-primary-600 dark:text-primary-400 hover:underline ml-2"
                >
                  Preview
                </a>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <div className="flex flex-wrap gap-1">
              {(file.tags ?? []).map(tag => (
                <span
                  key={tag}
                  className="inline-flex items-center px-2 py-1 text-xs bg-primary-100 dark:bg-primary-900/30 text-primary-800 dark:text-primary-300 rounded-full group-hover:bg-primary-200 dark:group-hover:bg-primary-900/50 transition-colors"
                >
                  {tag}
                  <button onClick={() => onRemoveTag(file.id, tag)} className="ml-1 hover:text-primary-900 dark:hover:text-primary-100">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>

            <div className="relative">
              <button
                onClick={() => setShowActions(!showActions)}
                className="p-2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-all duration-200"
                aria-label="More actions"
              >
                <MoreVertical className="w-4 h-4" />
              </button>

              {showActions && (
                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-10">
                  <button
                    onClick={handleCopyCID}
                    className="w-full flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    {copySuccess ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                    <span>{copySuccess ? 'Copied!' : 'Copy CID'}</span>
                  </button>
                  <button
                    onClick={() => setIsAddingTag(true)}
                    className="w-full flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <Tag className="w-4 h-4" />
                    <span>Add Tag</span>
                  </button>
                  <button
                    onClick={handleDownload}
                    className="w-full flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
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
            <button onClick={handleAddTag} className="p-1 text-green-600 hover:text-green-700">
              <Check className="w-4 h-4" />
            </button>
            <button onClick={() => setIsAddingTag(false)} className="p-1 text-gray-400 hover:text-gray-600">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    );
  }

  // Grid View Card
  return (
    <div className={`bg-white dark:bg-gray-800 border rounded-lg overflow-hidden hover:shadow-lg transition-all duration-200 group ${
      isSelected ? 'border-primary-500' : 'border-gray-200 dark:border-gray-700'
    }`}>
      <div className="aspect-square bg-gray-50 dark:bg-gray-700 flex items-center justify-center text-4xl relative">
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
        {!previewUrl ? getFileTypeIcon(file.type) : 
        <img src={previewUrl} className='h-full w-full py-20 p-10' />}
        <div className="absolute top-2 right-2">
          {file.isPublic ? (
            <Globe className="w-4 h-4 text-gray-400 dark:text-gray-500" />
          ) : (
            <Lock className="w-4 h-4 text-gray-400 dark:text-gray-500" />
          )}
        </div>

        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100 space-x-4">
          <a href={previewUrl} target="_blank" rel="noopener noreferrer"
            className="p-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-full text-sm shadow-md hover:shadow-lg transition-all duration-200"
            title="Preview file"
          >
            Preview
          </a>
          <button
            onClick={handleCopyCID}
            className="p-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-full shadow-md hover:shadow-lg transition-all duration-200"
            title="Copy CID"
          >
            {copySuccess ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
          </button>
          <button
            onClick={handleDownload}
            className="p-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-full shadow-md hover:shadow-lg transition-all duration-200"
            title="Download"
          >
            <Download className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="p-4">
        <h3 className="font-medium text-gray-900 dark:text-white truncate mb-2">{cidStr}</h3>

        <div className="space-y-2 text-sm text-gray-500 dark:text-gray-400">
          <div className="flex justify-between">
            <span>Size</span>
            <span>{formatFileSize(file.size)}</span>
          </div>
          <div className="flex justify-between">
            <span>Uploaded</span>
            <span>{formatDate(file.created)}</span>
          </div>
          <div className="flex justify-between">
            <span>Downloads</span>
            <span>{file.downloadCount ?? 0}</span>
          </div>
        </div>

        <div className="mt-3">
          <div className="flex flex-wrap gap-1 mb-2">
            {(file.tags ?? []).map(tag => (
              <span key={tag} className="inline-flex items-center px-2 py-1 text-xs bg-primary-100 dark:bg-primary-900/30 text-primary-800 dark:text-primary-300 rounded-full">
                {tag}
                <button onClick={() => onRemoveTag(file.id, tag)} className="ml-1 hover:text-primary-900 dark:hover:text-primary-100">
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
                className="flex-1 px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded focus:ring-1 focus:ring-primary-500 focus:border-transparent"
                onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
                autoFocus
              />
              <button onClick={handleAddTag} className="p-1 text-green-600 hover:text-green-700">
                <Check className="w-4 h-4" />
              </button>
              <button onClick={() => setIsAddingTag(false)} className="p-1 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300">
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button onClick={() => setIsAddingTag(true)} className="flex items-center space-x-1 text-xs text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors">
              <Tag className="w-3 h-3" />
              <span>Add tag</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
