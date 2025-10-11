// FileGrid.tsx
import React from 'react';
import { Grid, List } from 'lucide-react';
import { StorachaFile, ViewMode } from '../types';
import { FileCard } from './FileCard';
import { FileCardSkeleton, FileListSkeleton } from './skeletons';

interface FileGridProps {
  files: StorachaFile[];
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  onAddTag: (fileId: string, tag: string) => void;
  onRemoveTag: (fileId: string, tag: string) => void;
  isLoading: boolean;
  selectedFiles?: string[];
  onSelectionChange?: (fileId: string, selected: boolean) => void;
  showSelection?: boolean;
}

export const FileGrid: React.FC<FileGridProps> = ({
  files,
  viewMode,
  onViewModeChange,
  onAddTag,
  onRemoveTag,
  isLoading,
  selectedFiles = [],
  onSelectionChange,
  showSelection = false
}) => {
  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="h-6 skeleton-shimmer rounded w-32 mb-2"></div>
            <div className="h-4 skeleton-shimmer rounded w-24"></div>
          </div>

          <div className="flex items-center space-x-2">
            <div className="w-10 h-10 skeleton-shimmer rounded-lg"></div>
            <div className="w-10 h-10 skeleton-shimmer rounded-lg"></div>
          </div>
        </div>

        <div className={
          viewMode === 'grid'
            ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
            : 'space-y-3'
        }>
          {Array.from({ length: viewMode === 'grid' ? 8 : 5 }).map((_, index) => (
            viewMode === 'grid' ? (
              <FileCardSkeleton key={index} />
            ) : (
              <FileListSkeleton key={index} />
            )
          ))}
        </div>
      </div>
    );
  }

  const totalSize = files.reduce((sum, file) => sum + (file.size || 0), 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            {files.length} {files.length === 1 ? 'file' : 'files'}
          </h2>
          <p className="text-sm text-gray-500">
            Total size: {totalSize > 0 && formatFileSize(totalSize)}
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => onViewModeChange('grid')}
            className={`p-2 rounded-lg transition-all duration-200 ${
              viewMode === 'grid'
                ? 'bg-red-100 text-red-600'
                : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
            }`}
            aria-label="Grid View"
          >
            <Grid className="w-5 h-5" />
          </button>
          <button
            onClick={() => onViewModeChange('list')}
            className={`p-2 rounded-lg transition-all duration-200 ${
              viewMode === 'list'
                ? 'bg-red-100 text-red-600'
                : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
            }`}
            aria-label="List View"
          >
            <List className="w-5 h-5" />
          </button>
        </div>
      </div>

      {files.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📂</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No files found</h3>
          <p className="text-gray-500">Try adjusting your search or filters</p>
        </div>
      ) : (
        <div className={
          viewMode === 'grid'
            ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
            : 'space-y-3'
        }>
          {files.map((file) => (
            <FileCard
              key={file.id}
              file={file}
              viewMode={viewMode}
              onAddTag={onAddTag}
              onRemoveTag={onRemoveTag}
              isSelected={selectedFiles.includes(file.id)}
              onSelectionChange={onSelectionChange}
              showSelection={showSelection}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// formatFileSize helper function
const formatFileSize = (bytes: number): string => {
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  if (bytes === 0) return '0 B';
  
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${Math.round(bytes / Math.pow(1024, i) * 100) / 100} ${sizes[i]}`;
};
