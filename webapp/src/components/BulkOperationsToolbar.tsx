import React, { useState } from 'react';
import { Tag, X, Check } from 'lucide-react';
import { showSuccess } from '../utils/toast';

interface BulkOperationsToolbarProps {
  selectedFiles: string[];
  onAddTags: (fileIds: string[], tag: string) => void;
  onRemoveTags: (fileIds: string[], tag: string) => void;
  onClearSelection: () => void;
}

export const BulkOperationsToolbar: React.FC<BulkOperationsToolbarProps> = ({
  selectedFiles,
  onAddTags,
  onRemoveTags,
  onClearSelection
}) => {
  const [newTag, setNewTag] = useState('');
  const [isAddingTag, setIsAddingTag] = useState(false);

  const handleAddTag = () => {
    if (newTag.trim()) {
      onAddTags(selectedFiles, newTag.trim());
      showSuccess(`Tag "${newTag.trim()}" added to ${selectedFiles.length} file(s)!`);
      setNewTag('');
      setIsAddingTag(false);
    }
  };

  const handleRemoveTag = (tag: string) => {
    onRemoveTags(selectedFiles, tag);
    showSuccess(`Tag "${tag}" removed from ${selectedFiles.length} file(s)!`);
  };

  if (selectedFiles.length === 0) {
    return null;
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <span className="text-sm font-medium text-gray-900">
            {selectedFiles.length} {selectedFiles.length === 1 ? 'file' : 'files'} selected
          </span>
          
          {isAddingTag ? (
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                placeholder="Enter tag name"
                className="px-3 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-red-500 focus:border-transparent"
                onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
                autoFocus
              />
              <button
                onClick={handleAddTag}
                className="p-1 text-green-600 hover:text-green-700"
                title="Add tag"
              >
                <Check className="w-4 h-4" />
              </button>
              <button
                onClick={() => setIsAddingTag(false)}
                className="p-1 text-gray-400 hover:text-gray-600"
                title="Cancel"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setIsAddingTag(true)}
              className="flex items-center space-x-1 px-3 py-1 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
            >
              <Tag className="w-4 h-4" />
              <span>Add tag</span>
            </button>
          )}
        </div>

        <button
          onClick={onClearSelection}
          className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
        >
          Clear selection
        </button>
      </div>
    </div>
  );
};
