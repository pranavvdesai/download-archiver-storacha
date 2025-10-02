import React from 'react';
import { Search, X, Filter } from 'lucide-react';
import { ActivityFilters } from '../types';

interface ActivityFiltersComponentProps {
  filters: ActivityFilters;
  onFiltersChange: (filters: Partial<ActivityFilters>) => void;
  onClearFilters: () => void;
}

export const ActivityFiltersComponent: React.FC<ActivityFiltersComponentProps> = ({
  filters,
  onFiltersChange,
  onClearFilters
}) => {
  const activityTypes = [
    { value: 'all', label: 'All Activities' },
    { value: 'upload', label: 'Uploads' },
    { value: 'download', label: 'Downloads' },
    { value: 'share', label: 'Shares' },
    { value: 'modify', label: 'Modifications' },
    { value: 'delete', label: 'Deletions' },
    { value: 'restore', label: 'Restorations' }
  ];

  const dateRanges = [
    { value: 'all', label: 'All Time' },
    { value: 'today', label: 'Today' },
    { value: 'week', label: 'Past Week' },
    { value: 'month', label: 'Past Month' }
  ];

  const sortOptions = [
    { value: 'timestamp', label: 'Date' },
    { value: 'type', label: 'Type' },
    { value: 'fileName', label: 'File Name' }
  ];

  const sortOrders = [
    { value: 'desc', label: 'Newest First' },
    { value: 'asc', label: 'Oldest First' }
  ];

  const hasActiveFilters = 
    filters.search !== '' ||
    filters.type !== 'all' ||
    filters.dateRange !== 'all' ||
    filters.userId !== 'all';

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900 flex items-center space-x-2">
          <Filter className="w-5 h-5" />
          <span>Filter Activities</span>
        </h3>
        {hasActiveFilters && (
          <button
            onClick={onClearFilters}
            className="text-sm text-red-600 hover:text-red-800 flex items-center space-x-1"
          >
            <X className="w-4 h-4" />
            <span>Clear All</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Search
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={filters.search}
              onChange={(e) => onFiltersChange({ search: e.target.value })}
              placeholder="Search activities..."
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Activity Type
          </label>
          <select
            value={filters.type}
            onChange={(e) => onFiltersChange({ type: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
          >
            {activityTypes.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Date Range
          </label>
          <select
            value={filters.dateRange}
            onChange={(e) => onFiltersChange({ dateRange: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
          >
            {dateRanges.map((range) => (
              <option key={range.value} value={range.value}>
                {range.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            User
          </label>
          <select
            value={filters.userId}
            onChange={(e) => onFiltersChange({ userId: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
          >
            <option value="all">All Users</option>
            <option value="user1">Current User</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Sort By
          </label>
          <select
            value={filters.sortBy}
            onChange={(e) => onFiltersChange({ sortBy: e.target.value as ActivityFilters['sortBy'] })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
          >
            {sortOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Sort Order
          </label>
          <select
            value={filters.sortOrder}
            onChange={(e) => onFiltersChange({ sortOrder: e.target.value as ActivityFilters['sortOrder'] })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
          >
            {sortOrders.map((order) => (
              <option key={order.value} value={order.value}>
                {order.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2">
          {filters.search && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              Search: {filters.search}
              <button
                onClick={() => onFiltersChange({ search: '' })}
                className="ml-1 hover:text-blue-600"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          {filters.type !== 'all' && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
              Type: {activityTypes.find(t => t.value === filters.type)?.label}
              <button
                onClick={() => onFiltersChange({ type: 'all' })}
                className="ml-1 hover:text-green-600"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          {filters.dateRange !== 'all' && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
              Date: {dateRanges.find(d => d.value === filters.dateRange)?.label}
              <button
                onClick={() => onFiltersChange({ dateRange: 'all' })}
                className="ml-1 hover:text-purple-600"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          {filters.userId !== 'all' && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
              User: {filters.userId}
              <button
                onClick={() => onFiltersChange({ userId: 'all' })}
                className="ml-1 hover:text-orange-600"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
        </div>
      )}
    </div>
  );
};
