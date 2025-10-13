import React, { useState } from 'react';
import { Search, Sparkles, Bookmark, History, Filter } from 'lucide-react';
import { AdvancedSearch } from './AdvancedSearch';
import { SearchResults } from './SearchResults';
import { SearchResult } from '../services/searchService';
import { StorachaFile } from '../types';

export const SearchDemo: React.FC = () => {
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearchMode, setIsSearchMode] = useState(false);

  const handleSearchResults = (results: SearchResult[]) => {
    setSearchResults(results);
    setIsSearchMode(results.length > 0);
  };

  const handleFileSelect = (file: StorachaFile) => {
    console.log('Selected file:', file);
  };

  const handleFileAction = (file: StorachaFile, action: string) => {
    console.log('File action:', action, 'on file:', file);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <div className="w-12 h-12 bg-red-600 rounded-lg flex items-center justify-center">
              <Search className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">Advanced Search Demo</h1>
          </div>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Experience the power of full-text search, semantic search, and intelligent file discovery
            with our advanced search capabilities.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <div className="flex items-center space-x-3 mb-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Search className="w-5 h-5 text-blue-600" />
              </div>
              <h3 className="font-medium text-gray-900">Full-Text Search</h3>
            </div>
            <p className="text-sm text-gray-600">
              Search through filenames, tags, and OCR-extracted content with intelligent ranking.
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <div className="flex items-center space-x-3 mb-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Sparkles className="w-5 h-5 text-purple-600" />
              </div>
              <h3 className="font-medium text-gray-900">Semantic Search</h3>
            </div>
            <p className="text-sm text-gray-600">
              Find conceptually similar files using AI-powered embeddings and similarity matching.
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <div className="flex items-center space-x-3 mb-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Bookmark className="w-5 h-5 text-green-600" />
              </div>
              <h3 className="font-medium text-gray-900">Saved Searches</h3>
            </div>
            <p className="text-sm text-gray-600">
              Bookmark complex search queries and reuse them with a single click.
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <div className="flex items-center space-x-3 mb-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <History className="w-5 h-5 text-orange-600" />
              </div>
              <h3 className="font-medium text-gray-900">Search History</h3>
            </div>
            <p className="text-sm text-gray-600">
              Track and revisit your previous searches for quick access to recent queries.
            </p>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8">
          <div className="mb-4">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Try the Advanced Search</h2>
            <p className="text-gray-600">
              Search for files using different methods. Try searching for "project", "meeting", or "screenshot" 
              to see the demo results.
            </p>
          </div>
          
          <AdvancedSearch
            onResultsChange={handleSearchResults}
            onFileSelect={handleFileSelect}
            placeholder="Search files, content, and more..."
            className="w-full"
          />
        </div>

        {isSearchMode && (
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <SearchResults
              results={searchResults}
              onFileSelect={handleFileSelect}
              onFileAction={handleFileAction}
            />
          </div>
        )}

        {!isSearchMode && (
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Demo Instructions</h3>
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-medium text-red-600">1</span>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">Try Different Search Types</h4>
                  <p className="text-sm text-gray-600">
                    Click the search type button to switch between Full Text, Semantic, and Hybrid search modes.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-medium text-red-600">2</span>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">Use Filters</h4>
                  <p className="text-sm text-gray-600">
                    Click the filter button to narrow down results by file type, date range, or OCR content.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-medium text-red-600">3</span>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">Save Your Searches</h4>
                  <p className="text-sm text-gray-600">
                    After performing a search, click "Save Search" to bookmark it for future use.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-medium text-red-600">4</span>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">Explore Search History</h4>
                  <p className="text-sm text-gray-600">
                    Click the history button to see and reuse your previous searches.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
