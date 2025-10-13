import React, { useState, useRef, useEffect } from 'react';
import {
  Search,
  Filter,
  Clock,
  Bookmark,
  BookmarkCheck,
  History,
  X,
  ChevronDown,
  Sparkles,
  FileText,
  Brain,
  Layers,
  Settings,
  Trash2,
  Star,
  TrendingUp
} from 'lucide-react';
import { useSearch } from '../hooks/useSearch';
import { SearchResult, SearchSuggestion } from '../services/searchService';
import { StorachaFile } from '../types';

interface AdvancedSearchProps {
  onResultsChange?: (results: SearchResult[]) => void;
  onFileSelect?: (file: StorachaFile) => void;
  placeholder?: string;
  className?: string;
}

export const AdvancedSearch: React.FC<AdvancedSearchProps> = ({
  onResultsChange,
  onFileSelect,
  placeholder = "Search files, content, and more...",
  className = ""
}) => {
  const [showFilters, setShowFilters] = useState(false);
  const [showSavedSearches, setShowSavedSearches] = useState(false);
  const [showSearchHistory, setShowSearchHistory] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [saveSearchName, setSaveSearchName] = useState('');
  const [selectedFileType, setSelectedFileType] = useState<string>('all');
  const [selectedDateRange, setSelectedDateRange] = useState<string>('all');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [hasOcrFilter, setHasOcrFilter] = useState<boolean | undefined>(undefined);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  const {
    query,
    results,
    suggestions,
    isSearching,
    isLoadingSuggestions,
    searchType,
    filters,
    savedSearches,
    searchHistory,
    selectedSuggestionIndex,
    handleQueryChange,
    search,
    selectSuggestion,
    handleKeyDown,
    saveSearch,
    loadSavedSearch,
    deleteSavedSearch,
    clearSearch,
    clearSearchHistory,
    updateFilters,
    updateSearchType,
    toggleSuggestions,
    hasResults,
    hasSuggestions,
    canSaveSearch,
    totalResults
  } = useSearch();

  useEffect(() => {
    onResultsChange?.(results);
  }, [results, onResultsChange]);

  const handleFileSelect = (file: StorachaFile) => {
    onFileSelect?.(file);
  };

  const handleSaveSearch = () => {
    if (saveSearchName.trim() && canSaveSearch) {
      saveSearch(saveSearchName.trim());
      setSaveSearchName('');
      setShowSaveDialog(false);
    }
  };

  const handleLoadSavedSearch = (savedSearchId: string) => {
    loadSavedSearch(savedSearchId);
    setShowSavedSearches(false);
  };

  const handleFilterChange = () => {
    const newFilters = {
      fileTypes: selectedFileType !== 'all' ? [selectedFileType] : undefined,
      dateRange: selectedDateRange !== 'all' ? selectedDateRange : undefined,
      tags: selectedTags.length > 0 ? selectedTags : undefined,
      hasOcr: hasOcrFilter
    };
    updateFilters(newFilters);
  };

  useEffect(() => {
    handleFilterChange();
  }, [selectedFileType, selectedDateRange, selectedTags, hasOcrFilter]);

  const getSearchTypeIcon = (type: string) => {
    switch (type) {
      case 'fulltext': return FileText;
      case 'semantic': return Brain;
      case 'hybrid': return Layers;
      default: return Search;
    }
  };

  const getSearchTypeLabel = (type: string) => {
    switch (type) {
      case 'fulltext': return 'Full Text';
      case 'semantic': return 'Semantic';
      case 'hybrid': return 'Hybrid';
      default: return 'Search';
    }
  };

  const getSuggestionIcon = (type: SearchSuggestion['type']) => {
    switch (type) {
      case 'filename': return FileText;
      case 'tag': return Bookmark;
      case 'content': return Search;
      case 'recent': return History;
      default: return Search;
    }
  };

  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        <div className="flex items-center bg-white border border-gray-300 rounded-lg shadow-sm focus-within:ring-2 focus-within:ring-red-500 focus-within:border-transparent">
          <div className="pl-3 pr-2">
            <Search className="w-5 h-5 text-gray-400" />
          </div>

          <input
            ref={searchInputRef}
            type="text"
            value={query}
            onChange={(e) => handleQueryChange(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => setShowSuggestions(true)}
            placeholder={placeholder}
            className="flex-1 px-2 py-3 text-gray-900 placeholder-gray-500 bg-transparent border-0 focus:ring-0 focus:outline-none"
          />

          <div className="relative">
            <button
              onClick={() => {
                const types: Array<'fulltext' | 'semantic' | 'hybrid'> = ['hybrid', 'fulltext', 'semantic'];
                const currentIndex = types.indexOf(searchType);
                const nextType = types[(currentIndex + 1) % types.length];
                updateSearchType(nextType);
              }}
              className="flex items-center space-x-1 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-md transition-colors"
              title={`Current: ${getSearchTypeLabel(searchType)}`}
            >
              {React.createElement(getSearchTypeIcon(searchType), { className: "w-4 h-4" })}
              <span className="hidden sm:inline">{getSearchTypeLabel(searchType)}</span>
              <ChevronDown className="w-3 h-3" />
            </button>
          </div>

          <div className="flex items-center space-x-1 pr-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`p-2 rounded-md transition-colors ${
                showFilters || (filters && Object.keys(filters).length > 0)
                  ? 'text-red-600 bg-red-50'
                  : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
              }`}
              title="Filters"
            >
              <Filter className="w-4 h-4" />
            </button>

            <button
              onClick={() => setShowSavedSearches(!showSavedSearches)}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-md transition-colors"
              title="Saved Searches"
            >
              <Bookmark className="w-4 h-4" />
            </button>

            <button
              onClick={() => setShowSearchHistory(!showSearchHistory)}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-md transition-colors"
              title="Search History"
            >
              <History className="w-4 h-4" />
            </button>

            {query && (
              <button
                onClick={clearSearch}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-md transition-colors"
                title="Clear Search"
              >
                <X className="w-4 h-4" />
              </button>
            )}

            <button
              onClick={() => search()}
              disabled={!query.trim() || isSearching}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSearching ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Search className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>

        {showSuggestions && hasSuggestions && (
          <div
            ref={suggestionsRef}
            className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-80 overflow-y-auto"
          >
            {suggestions.map((suggestion, index) => {
              const Icon = getSuggestionIcon(suggestion.type);
              return (
                <button
                  key={`${suggestion.type}-${index}`}
                  onClick={() => selectSuggestion(suggestion)}
                  className={`w-full flex items-center space-x-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors ${
                    index === selectedSuggestionIndex ? 'bg-red-50 text-red-600' : 'text-gray-900'
                  }`}
                >
                  <Icon className="w-4 h-4 text-gray-400" />
                  <span className="flex-1 truncate">{suggestion.text}</span>
                  <span className="text-xs text-gray-500 capitalize">{suggestion.type}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {showFilters && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-40 p-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-gray-900">Search Filters</h3>
              <button
                onClick={() => setShowFilters(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  File Type
                </label>
                <select
                  value={selectedFileType}
                  onChange={(e) => setSelectedFileType(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-transparent"
                >
                  <option value="all">All Types</option>
                  <option value="document">Documents</option>
                  <option value="image">Images</option>
                  <option value="video">Videos</option>
                  <option value="audio">Audio</option>
                  <option value="archive">Archives</option>
                  <option value="data">Data Files</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date Range
                </label>
                <select
                  value={selectedDateRange}
                  onChange={(e) => setSelectedDateRange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-transparent"
                >
                  <option value="all">All Time</option>
                  <option value="today">Today</option>
                  <option value="week">Past Week</option>
                  <option value="month">Past Month</option>
                  <option value="year">Past Year</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  OCR Content
                </label>
                <select
                  value={hasOcrFilter === undefined ? 'all' : hasOcrFilter ? 'yes' : 'no'}
                  onChange={(e) => {
                    const value = e.target.value;
                    setHasOcrFilter(value === 'all' ? undefined : value === 'yes');
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-transparent"
                >
                  <option value="all">All Files</option>
                  <option value="yes">With OCR Content</option>
                  <option value="no">Without OCR Content</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      )}

      {showSavedSearches && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-40 p-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-gray-900">Saved Searches</h3>
              <div className="flex items-center space-x-2">
                {canSaveSearch && (
                  <button
                    onClick={() => setShowSaveDialog(true)}
                    className="flex items-center space-x-1 px-3 py-1 text-sm text-red-600 hover:text-red-700"
                  >
                    <BookmarkCheck className="w-4 h-4" />
                    <span>Save Current</span>
                  </button>
                )}
                <button
                  onClick={() => setShowSavedSearches(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {savedSearches.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No saved searches yet</p>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {savedSearches.map((savedSearch) => (
                  <div
                    key={savedSearch.id}
                    className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <h4 className="font-medium text-gray-900">{savedSearch.name}</h4>
                        <span className="text-xs text-gray-500">
                          {getSearchTypeLabel(savedSearch.query.searchType)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 truncate">{savedSearch.query.query}</p>
                      <p className="text-xs text-gray-500">
                        Used {savedSearch.useCount} times • {savedSearch.lastUsed ? `Last used ${savedSearch.lastUsed.toLocaleDateString()}` : 'Never used'}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleLoadSavedSearch(savedSearch.id)}
                        className="p-1 text-gray-400 hover:text-gray-600"
                        title="Load Search"
                      >
                        <Search className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => deleteSavedSearch(savedSearch.id)}
                        className="p-1 text-gray-400 hover:text-red-600"
                        title="Delete Search"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {showSearchHistory && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-40 p-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-gray-900">Search History</h3>
              <div className="flex items-center space-x-2">
                <button
                  onClick={clearSearchHistory}
                  className="text-sm text-gray-500 hover:text-red-600"
                >
                  Clear All
                </button>
                <button
                  onClick={() => setShowSearchHistory(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {searchHistory.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No search history</p>
            ) : (
              <div className="space-y-1 max-h-60 overflow-y-auto">
                {searchHistory.map((historyItem, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      handleQueryChange(historyItem);
                      search(historyItem);
                      setShowSearchHistory(false);
                    }}
                    className="w-full flex items-center space-x-3 p-2 text-left hover:bg-gray-50 rounded-md transition-colors"
                  >
                    <Clock className="w-4 h-4 text-gray-400" />
                    <span className="flex-1 text-gray-900">{historyItem}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {showSaveDialog && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-40 p-4">
          <div className="space-y-4">
            <h3 className="font-medium text-gray-900">Save Search</h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Search Name
              </label>
              <input
                type="text"
                value={saveSearchName}
                onChange={(e) => setSaveSearchName(e.target.value)}
                placeholder="Enter a name for this search..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-transparent"
                autoFocus
              />
            </div>
            <div className="flex items-center justify-end space-x-2">
              <button
                onClick={() => {
                  setShowSaveDialog(false);
                  setSaveSearchName('');
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveSearch}
                disabled={!saveSearchName.trim()}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {hasResults && (
        <div className="mt-2 flex items-center justify-between text-sm text-gray-600">
          <div className="flex items-center space-x-4">
            <span>{totalResults} results found</span>
            <span className="flex items-center space-x-1">
              <Sparkles className="w-4 h-4" />
              <span>{getSearchTypeLabel(searchType)} search</span>
            </span>
          </div>
          {canSaveSearch && (
            <button
              onClick={() => setShowSaveDialog(true)}
              className="flex items-center space-x-1 text-red-600 hover:text-red-700"
            >
              <BookmarkCheck className="w-4 h-4" />
              <span>Save Search</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};
