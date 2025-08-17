import React from 'react';
import { Calendar, Tag, FileText, Archive, Image, Video, Music, Database, Filter, X } from 'lucide-react';
import { FilterState } from '../types';
import { getAllTags } from '../utils/fileUtils';
import { StorachaFile } from '../types';

interface SidebarProps {
  files: StorachaFile[];
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  files,
  filters,
  onFiltersChange,
  isOpen,
  onClose
}) => {
  const allTags = getAllTags(files);

  const fileTypes = [
    { value: 'all', label: 'All Files', icon: FileText, count: files.length },
    { value: 'document', label: 'Documents', icon: FileText, count: files.filter(f => f.type === 'document').length },
    { value: 'archive', label: 'Archives', icon: Archive, count: files.filter(f => f.type === 'archive').length },
    { value: 'image', label: 'Images', icon: Image, count: files.filter(f => f.type === 'image').length },
    { value: 'video', label: 'Videos', icon: Video, count: files.filter(f => f.type === 'video').length },
    { value: 'audio', label: 'Audio', icon: Music, count: files.filter(f => f.type === 'audio').length },
    { value: 'data', label: 'Data', icon: Database, count: files.filter(f => f.type === 'data').length }
  ];

  const dateRanges = [
    { value: 'all', label: 'All Time' },
    { value: 'today', label: 'Today' },
    { value: 'week', label: 'Past Week' },
    { value: 'month', label: 'Past Month' }
  ];

  const toggleTag = (tag: string) => {
    const newTags = filters.tags.includes(tag)
      ? filters.tags.filter(t => t !== tag)
      : [...filters.tags, tag];
    
    onFiltersChange({ ...filters, tags: newTags });
  };

  const clearFilters = () => {
    onFiltersChange({
      search: '',
      fileType: 'all',
      dateRange: 'all',
      tags: [],
      sortBy: 'date',
      sortOrder: 'desc'
    });
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={onClose}
        />
      )}

      <aside className={`
        fixed lg:static inset-y-0 left-0 z-50 lg:z-0
        w-80 bg-white border-r border-gray-200 
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Filter className="w-5 h-5 text-gray-600" />
              <h2 className="font-semibold text-gray-900">Filters</h2>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={clearFilters}
                className="text-sm text-red-600 hover:text-red-700 transition-colors"
              >
                Clear all
              </button>
              <button
                onClick={onClose}
                className="lg:hidden p-1 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6 overflow-y-auto h-full pb-20">
          {/* File Types */}
          <div>
            <h3 className="font-medium text-gray-900 mb-3">File Types</h3>
            <div className="space-y-2">
              {fileTypes.map(({ value, label, icon: Icon, count }) => (
                <button
                  key={value}
                  onClick={() => onFiltersChange({ ...filters, fileType: value })}
                  className={`w-full flex items-center justify-between p-2 rounded-lg text-left transition-all duration-200 ${
                    filters.fileType === value
                      ? 'bg-red-50 text-red-700 border border-red-200'
                      : 'hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <Icon className="w-4 h-4" />
                    <span className="text-sm">{label}</span>
                  </div>
                  <span className="text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded-full">
                    {count}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Date Range */}
          <div>
            <h3 className="font-medium text-gray-900 mb-3">Date Range</h3>
            <div className="space-y-2">
              {dateRanges.map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => onFiltersChange({ ...filters, dateRange: value })}
                  className={`w-full flex items-center space-x-3 p-2 rounded-lg text-left transition-all duration-200 ${
                    filters.dateRange === value
                      ? 'bg-red-50 text-red-700 border border-red-200'
                      : 'hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  <Calendar className="w-4 h-4" />
                  <span className="text-sm">{label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Tags */}
          <div>
            <h3 className="font-medium text-gray-900 mb-3">Tags</h3>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {allTags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => toggleTag(tag)}
                  className={`w-full flex items-center justify-between p-2 rounded-lg text-left transition-all duration-200 ${
                    filters.tags.includes(tag)
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <Tag className="w-4 h-4" />
                    <span className="text-sm">{tag}</span>
                  </div>
                  <span className="text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded-full">
                    {files.filter(f => f.tags.includes(tag)).length}
                  </span>
                </button>
              ))}
              {allTags.length === 0 && (
                <p className="text-sm text-gray-500">No tags available</p>
              )}
            </div>
          </div>

          {/* Sort Options */}
          <div>
            <h3 className="font-medium text-gray-900 mb-3">Sort By</h3>
            <select
              value={`${filters.sortBy}-${filters.sortOrder}`}
              onChange={(e) => {
                const [sortBy, sortOrder] = e.target.value.split('-') as [typeof filters.sortBy, typeof filters.sortOrder];
                onFiltersChange({ ...filters, sortBy, sortOrder });
              }}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm"
            >
              <option value="date-desc">Newest First</option>
              <option value="date-asc">Oldest First</option>
              <option value="name-asc">Name A-Z</option>
              <option value="name-desc">Name Z-A</option>
              <option value="size-desc">Largest First</option>
              <option value="size-asc">Smallest First</option>
              <option value="downloads-desc">Most Downloaded</option>
              <option value="downloads-asc">Least Downloaded</option>
            </select>
          </div>
        </div>
      </aside>
    </>
  );
};