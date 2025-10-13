import React, { useState } from 'react';
import {
  FileText,
  Image,
  Video,
  Music,
  Archive,
  Database,
  Download,
  Copy,
  Eye,
  EyeOff,
  Tag,
  Calendar,
  User,
  TrendingUp,
  Brain,
  Search,
  Bookmark,
  Layers,
  Star,
  Clock,
  File
} from 'lucide-react';
import { SearchResult } from '../services/searchService';
import { StorachaFile } from '../types';
import { formatFileSize, formatDate } from '../utils/fileUtils';

interface SearchResultsProps {
  results: SearchResult[];
  onFileSelect?: (file: StorachaFile) => void;
  onFileAction?: (file: StorachaFile, action: string) => void;
  className?: string;
}

export const SearchResults: React.FC<SearchResultsProps> = ({
  results,
  onFileSelect,
  onFileAction,
  className = ""
}) => {
  const [expandedResults, setExpandedResults] = useState<Set<string>>(new Set());
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());

  const getFileTypeIcon = (file: StorachaFile) => {
    const mimeType = file.mimeType.toLowerCase();
    const fileName = file.name.toLowerCase();
    
    if (mimeType.startsWith('image/') || /\.(jpg|jpeg|png|gif|bmp|svg|webp)$/i.test(fileName)) {
      return Image;
    } else if (mimeType.startsWith('video/') || /\.(mp4|avi|mov|wmv|flv|webm)$/i.test(fileName)) {
      return Video;
    } else if (mimeType.startsWith('audio/') || /\.(mp3|wav|flac|aac|ogg)$/i.test(fileName)) {
      return Music;
    } else if (mimeType.includes('zip') || mimeType.includes('rar') || mimeType.includes('7z') || /\.(zip|rar|7z|tar|gz)$/i.test(fileName)) {
      return Archive;
    } else if (mimeType.includes('json') || mimeType.includes('xml') || mimeType.includes('csv') || /\.(json|xml|csv|sql|db)$/i.test(fileName)) {
      return Database;
    } else {
      return FileText;
    }
  };

  const getMatchTypeInfo = (matchType: SearchResult['matchType']) => {
    switch (matchType) {
      case 'filename':
        return { icon: File, color: 'text-blue-600 bg-blue-100', label: 'Filename' };
      case 'content':
        return { icon: Search, color: 'text-green-600 bg-green-100', label: 'Content' };
      case 'tags':
        return { icon: Tag, color: 'text-purple-600 bg-purple-100', label: 'Tags' };
      case 'semantic':
        return { icon: Brain, color: 'text-orange-600 bg-orange-100', label: 'Semantic' };
      default:
        return { icon: Search, color: 'text-gray-600 bg-gray-100', label: 'Match' };
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 0.8) return 'text-green-600';
    if (score >= 0.6) return 'text-yellow-600';
    if (score >= 0.4) return 'text-orange-600';
    return 'text-red-600';
  };

  const toggleExpansion = (fileId: string) => {
    setExpandedResults(prev => {
      const newSet = new Set(prev);
      if (newSet.has(fileId)) {
        newSet.delete(fileId);
      } else {
        newSet.add(fileId);
      }
      return newSet;
    });
  };

  const toggleSelection = (fileId: string) => {
    setSelectedFiles(prev => {
      const newSet = new Set(prev);
      if (newSet.has(fileId)) {
        newSet.delete(fileId);
      } else {
        newSet.add(fileId);
      }
      return newSet;
    });
  };

  const handleFileAction = (file: StorachaFile, action: string) => {
    onFileAction?.(file, action);
  };

  const handleFileSelect = (file: StorachaFile) => {
    onFileSelect?.(file);
  };

  const copyCid = async (cid: string) => {
    try {
      await navigator.clipboard.writeText(cid);
      
    } catch (error) {
      console.error('Failed to copy CID:', error);
    }
  };

  if (results.length === 0) {
    return (
      <div className={`text-center py-12 ${className}`}>
        <Search className="w-12 h-12 mx-auto text-gray-300 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No results found</h3>
        <p className="text-gray-500">Try adjusting your search terms or filters</p>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h2 className="text-lg font-medium text-gray-900">
            Search Results ({results.length})
          </h2>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-500">Sort by relevance</span>
            <TrendingUp className="w-4 h-4 text-gray-400" />
          </div>
        </div>
        
        {selectedFiles.size > 0 && (
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">
              {selectedFiles.size} selected
            </span>
            <button
              onClick={() => setSelectedFiles(new Set())}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Clear
            </button>
          </div>
        )}
      </div>

      <div className="space-y-3">
        {results.map((result) => {
          const file = result.file;
          const FileIcon = getFileTypeIcon(file);
          const matchInfo = getMatchTypeInfo(result.matchType);
          const MatchIcon = matchInfo.icon;
          const isExpanded = expandedResults.has(file.id);
          const isSelected = selectedFiles.has(file.id);

          return (
            <div
              key={file.id}
              className={`bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow ${
                isSelected ? 'ring-2 ring-red-500' : ''
              }`}
            >
              <div className="p-4">
                <div className="flex items-start space-x-4">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleSelection(file.id)}
                    className="mt-1 h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                  />

                  <div className="flex-shrink-0">
                    <div className="p-2 bg-gray-100 rounded-lg">
                      <FileIcon className="w-6 h-6 text-gray-600" />
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-medium text-gray-900 truncate">
                          {file.name}
                        </h3>
                        
                        <div className="flex items-center space-x-4 mt-1 text-sm text-gray-500">
                          <span className="flex items-center space-x-1">
                            <Calendar className="w-4 h-4" />
                            <span>{formatDate(file.created)}</span>
                          </span>
                          <span>{formatFileSize(file.size)}</span>
                          <span className="flex items-center space-x-1">
                            <Download className="w-4 h-4" />
                            <span>{file.downloadCount} downloads</span>
                          </span>
                        </div>

                        <div className="flex items-center space-x-2 mt-2">
                          <span className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${matchInfo.color}`}>
                            <MatchIcon className="w-3 h-3" />
                            <span>{matchInfo.label}</span>
                          </span>
                          <span className={`text-xs font-medium ${getScoreColor(result.score)}`}>
                            {Math.round(result.score * 100)}% match
                          </span>
                          {file.tags.length > 0 && (
                            <span className="flex items-center space-x-1 text-xs text-gray-500">
                              <Tag className="w-3 h-3" />
                              <span>{file.tags.length} tags</span>
                            </span>
                          )}
                        </div>

                        {result.highlights.length > 0 && (
                          <div className="mt-2">
                            <div className="text-sm text-gray-600">
                              {result.highlights[0]}
                            </div>
                            {result.highlights.length > 1 && (
                              <button
                                onClick={() => toggleExpansion(file.id)}
                                className="text-xs text-red-600 hover:text-red-700 mt-1"
                              >
                                {isExpanded ? 'Show less' : `Show ${result.highlights.length - 1} more highlights`}
                              </button>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center space-x-2 ml-4">
                        <button
                          onClick={() => copyCid(file.cid)}
                          className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
                          title="Copy CID"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleFileAction(file, 'download')}
                          className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
                          title="Download"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleFileSelect(file)}
                          className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {isExpanded && result.highlights.length > 1 && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <h4 className="text-sm font-medium text-gray-900 mb-2">All Highlights</h4>
                    <div className="space-y-2">
                      {result.highlights.slice(1).map((highlight, index) => (
                        <div
                          key={index}
                          className="text-sm text-gray-600 p-2 bg-gray-50 rounded-md"
                          dangerouslySetInnerHTML={{ __html: highlight }}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {result.matchType === 'content' && file.extractedText && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Content Preview</h4>
                    <div className="text-sm text-gray-600 max-h-32 overflow-y-auto">
                      {file.extractedText.substring(0, 300)}
                      {file.extractedText.length > 300 && '...'}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {selectedFiles.size > 0 && (
        <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-white border border-gray-200 rounded-lg shadow-lg p-4">
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-600">
              {selectedFiles.size} files selected
            </span>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => {
                  console.log('Bulk download:', Array.from(selectedFiles));
                }}
                className="px-3 py-1 text-sm bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                Download
              </button>
              <button
                onClick={() => {
                  console.log('Bulk tag:', Array.from(selectedFiles));
                }}
                className="px-3 py-1 text-sm border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
              >
                Add Tags
              </button>
              <button
                onClick={() => setSelectedFiles(new Set())}
                className="px-3 py-1 text-sm text-gray-500 hover:text-gray-700"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
