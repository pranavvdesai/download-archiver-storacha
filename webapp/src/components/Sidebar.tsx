import React from 'react';
import { Calendar, Tag, FileText, Archive, Image, Video, Music, Database, Filter, X, ArrowUpDown } from 'lucide-react';
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

  const handleRemoveFilter = (type: keyof FilterState, value?: string) => {
    if (type === 'tags' && value) {
      onFiltersChange({
        ...filters,
        tags: filters.tags.filter(tag => tag !== value)
      });
    } else if (type === 'search') {
      onFiltersChange({ ...filters, search: '' });
    } else if (type === 'fileType') {
      onFiltersChange({ ...filters, fileType: 'all' });
    } else if (type === 'dateRange') {
      onFiltersChange({ ...filters, dateRange: 'all' });
    }
  };

  const getDateRangeLabel = (range: string) => {
    switch (range) {
      case 'today': return 'Today';
      case 'week': return 'Past Week';
      case 'month': return 'Past Month';
      default: return 'All Time';
    }
  };

  const getFileTypeLabel = (type: string) => {
    switch (type) {
      case 'document': return 'Documents';
      case 'archive': return 'Archives';
      case 'image': return 'Images';
      case 'video': return 'Videos';
      case 'audio': return 'Audio';
      case 'data': return 'Data';
      default: return 'All Files';
    }
  };

  const getSortLabel = () => {
    const sortMap = {
      'date-desc': 'Newest First',
      'date-asc': 'Oldest First',
      'name-asc': 'Name A-Z',
      'name-desc': 'Name Z-A',
      'size-desc': 'Largest First',
      'size-asc': 'Smallest First',
      'downloads-desc': 'Most Downloaded',
      'downloads-asc': 'Least Downloaded',
    };
    return sortMap[`${filters.sortBy}-${filters.sortOrder}` as keyof typeof sortMap] || '';
  };

  const hasActiveFilters = 
    filters.fileType !== 'all' ||
    filters.dateRange !== 'all' ||
    filters.tags.length > 0 ||
    filters.search !== '';

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside className={`
        fixed lg:static inset-y-0 left-0 z-50 lg:z-0
        w-80 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        flex flex-col
      `} aria-label="Filters Sidebar">

        <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Filter className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            <h2 className="font-semibold text-gray-900 dark:text-white text-lg">Filters</h2>
          </div>
          <div className="flex items-center space-x-2">
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors"
                aria-label="Clear all filters"
              >
                Clear all
              </button>
            )}
            <button
              onClick={onClose}
              className="lg:hidden p-1 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              aria-label="Close filters"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-6 flex-1 overflow-y-auto space-y-6">
          {/* Active Filters */}
          {hasActiveFilters && (
            <section className="space-y-3 animate-in" aria-label="Active filters">
              <h3 className="font-medium text-gray-900 dark:text-white">Active Filters</h3>
              <div className="flex flex-wrap gap-2">
                {filters.search && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200">
                    <FileText className="w-4 h-4 mr-1" />
                    Search: {filters.search}
                    <button
                      onClick={() => handleRemoveFilter('search')}
                      className="ml-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                      aria-label={`Remove search filter: ${filters.search}`}
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </span>
                )}

                {filters.fileType !== 'all' && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300">
                    <FileText className="w-4 h-4 mr-1" />
                    {getFileTypeLabel(filters.fileType)}
                    <button
                      onClick={() => handleRemoveFilter('fileType')}
                      className="ml-2 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-200"
                      aria-label={`Remove file type filter: ${getFileTypeLabel(filters.fileType)}`}
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </span>
                )}

                {filters.dateRange !== 'all' && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300">
                    <Calendar className="w-4 h-4 mr-1" />
                    {getDateRangeLabel(filters.dateRange)}
                    <button
                      onClick={() => handleRemoveFilter('dateRange')}
                      className="ml-2 text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-200"
                      aria-label={`Remove date range filter: ${getDateRangeLabel(filters.dateRange)}`}
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </span>
                )}

                {filters.tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300"
                  >
                    <Tag className="w-4 h-4 mr-1" />
                    {tag}
                    <button
                      onClick={() => handleRemoveFilter('tags', tag)}
                      className="ml-2 text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-200"
                      aria-label={`Remove tag filter: ${tag}`}
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </span>
                ))}

                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300">
                  <ArrowUpDown className="w-4 h-4 mr-1" />
                  {getSortLabel()}
                </span>
              </div>
            </section>
          )}

          {/* File Types */}
          <section aria-label="File type filters">
            <h3 className="font-medium text-gray-900 dark:text-white mb-3">File Types</h3>
            <div className="space-y-2">
              {fileTypes.map(({ value, label, icon: Icon, count }) => (
                <button
                  key={value}
                  onClick={() => onFiltersChange({ ...filters, fileType: value })}
                  className={`w-full flex items-center justify-between p-2 rounded-lg text-left transition-all duration-200 ${
                    filters.fileType === value
                      ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 border border-primary-200 dark:border-primary-700'
                      : 'hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                  }`}
                  aria-pressed={filters.fileType === value}
                >
                  <div className="flex items-center space-x-3">
                    <Icon className="w-4 h-4" />
                    <span className="text-sm">{label}</span>
                  </div>
                  <span className="text-xs bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-300 px-2 py-1 rounded-full">
                    {count}
                  </span>
                </button>
              ))}
            </div>
          </section>

          {/* Date Range */}
          <section aria-label="Date range filters">
            <h3 className="font-medium text-gray-900 dark:text-white mb-3">Date Range</h3>
            <div className="space-y-2">
              {dateRanges.map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => onFiltersChange({ ...filters, dateRange: value })}
                  className={`w-full flex items-center space-x-3 p-2 rounded-lg text-left transition-all duration-200 ${
                    filters.dateRange === value
                      ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 border border-primary-200 dark:border-primary-700'
                      : 'hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                  }`}
                  aria-pressed={filters.dateRange === value}
                >
                  <Calendar className="w-4 h-4" />
                  <span className="text-sm">{label}</span>
                </button>
              ))}
            </div>
          </section>

          {/* Tags */}
          <section aria-label="Tag filters">
            <h3 className="font-medium text-gray-900 dark:text-white mb-3">Tags</h3>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {allTags.length > 0 ? (
                allTags.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => toggleTag(tag)}
                    className={`w-full flex items-center justify-between p-2 rounded-lg text-left transition-all duration-200 ${
                      filters.tags.includes(tag)
                        ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-700'
                        : 'hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                    }`}
                    aria-pressed={filters.tags.includes(tag)}
                  >
                    <div className="flex items-center space-x-3">
                      <Tag className="w-4 h-4" />
                      <span className="text-sm">{tag}</span>
                    </div>
                    <span className="text-xs bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-300 px-2 py-1 rounded-full">
                      {files.filter(f => f.tags.includes(tag)).length}
                    </span>
                  </button>
                ))
              ) : (
                <p className="text-sm text-gray-500 dark:text-gray-400">No tags available</p>
              )}
            </div>
          </section>

          {/* Sort Options */}
          <section aria-label="Sort options">
            <h3 className="font-medium text-gray-900 dark:text-white mb-3">Sort By</h3>
            <select
              value={`${filters.sortBy}-${filters.sortOrder}`}
              onChange={(e) => {
                const [sortBy, sortOrder] = e.target.value.split('-') as [typeof filters.sortBy, typeof filters.sortOrder];
                onFiltersChange({ ...filters, sortBy, sortOrder });
              }}
              className="w-full p-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
              aria-label="Sort files"
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
          </section>
        </div>
      </aside>
    </>
  );
};
