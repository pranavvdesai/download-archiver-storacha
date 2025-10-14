import React, { useState, useMemo, useEffect } from 'react';
import { Menu, Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { FileGrid } from './FileGrid';
import { MobileFileCard } from './MobileFileCard';
import { MobileNavigation } from './MobileNavigation';
import { MobileUpload } from './MobileUpload';
import { BulkOperationsToolbar } from './BulkOperationsToolbar';
import { OCRSettings } from './OCRSettings';
import { FilterState, ViewMode, StorachaFile } from '../types';
import { getClient, useAuth } from '../hooks/useAuth';
import { decodeCidToString } from '../utils/decodeCidToString';
import { useOCR } from '../hooks/useOCR';
import toast from 'react-hot-toast';

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const [files, setFiles] = useState<StorachaFile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const { settings, updateSettings, processFile } = useOCR();
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [showSearch, setShowSearch] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    search: "",
    fileType: "all",
    dateRange: "all",
    tags: [],
    sortBy: "date",
    sortOrder: "desc",
  });

  // Map upload API response to StorachaFile[]
  function mapUploadsToFiles(uploadResponse: any[]): StorachaFile[] {
    return uploadResponse.map((upload, index) => ({
      id: upload.root['/'],
      cid: upload.root['/'],
      name: `File ${index + 1}`,
      size: 0,
      type: 'unknown',
      mimeType: 'application/octet-stream',
      created: new Date(upload.insertedAt),
      updated: new Date(upload.updatedAt),
      shards: upload.shards.map((shard: any) => shard['/']),
      tags: [],
      isPublic: false,
      downloadCount: 0,
      ocrStatus: 'not_processed',
    }));
  }

  // Call client upload list once on mount
  async function listFiles() {
    setIsLoading(true);
    try {
      const client = await getClient();
      const response = await client.capability.upload.list({ cursor: '', size: 25 });
      const mappedFiles = mapUploadsToFiles(response.results);
      setFiles(mappedFiles);

      if (settings.ocrEnabled && processFile) {
        mappedFiles.forEach((file, index) => {
          setTimeout(() => {
            processFile(file, (updatedFile) => {
              setFiles(prev => prev.map(f => f.id === file.id ? updatedFile : f));
            });
          }, 100 * index);
        });
      }
    } catch (error: any) {
      console.error("Failed to list files: ", error);

      // Handle session expiration
      if (error?.message?.includes('Session expired') || error?.message?.includes('Space not found') || error?.message?.includes('missing current space')) {
        toast.error('Session expired. Please login again.');
        signOut();
        navigate('/login');
      }
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    listFiles();
  }, []);

  const filteredFiles = useMemo(() => {
    return files.filter(file => {
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const cidStr = decodeCidToString(file.cid).toLowerCase();
        const ocrText = file.ocrText?.toLowerCase() || '';
        const extractedText = file.extractedText?.toLowerCase() || '';

        const nameMatch = file.name.toLowerCase().includes(searchLower);
        const cidMatch = cidStr.includes(searchLower);
        const ocrTextMatch = ocrText.includes(searchLower);
        const extractedTextMatch = extractedText.includes(searchLower);

        return nameMatch || cidMatch || ocrTextMatch || extractedTextMatch;
      }
      return true;
    });
  }, [files, filters]);

  const handleSearchChange = (search: string) => {
    setFilters({ ...filters, search: search.trim() });
  };
  

  const handleSelectionChange = (fileId: string, selected: boolean) => {
    setSelectedFiles((prev) =>
      selected ? [...prev, fileId] : prev.filter((id) => id !== fileId)
    );
  };

  const handleClearSelection = () => {
    setSelectedFiles([]);
  };

  const handleUpload = async (uploadFiles: File[]) => {
    console.log('Uploading files:', uploadFiles);
  };

  const handleRetryOCR = async (fileId: string) => {
    const file = files.find(f => f.id === fileId);
    if (!file) return;

    await processFile(file, (updatedFile) => {
      setFiles(prev => prev.map(f => f.id === fileId ? updatedFile : f));
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="hidden lg:block">
        <Header 
          searchQuery={filters.search}
          onSearchChange={handleSearchChange}
        />
      </div>

      <div className="lg:hidden">
        <MobileNavigation
          onSearchToggle={() => setShowSearch(!showSearch)}
          onFilterToggle={() => setSidebarOpen(true)}
          onViewModeChange={setViewMode}
          viewMode={viewMode}
          searchQuery={filters.search}
          onSearchChange={handleSearchChange}
          showSearch={showSearch}
        />
      </div>
      
      <div className="flex">
        <Sidebar
          files={files}
          filters={filters}
          onFiltersChange={setFilters}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />

        <main className="flex-1 lg:ml-0">
          <div className="p-4 lg:p-6">
            <div className="lg:hidden mb-4 flex justify-between items-center">
              <div className="flex space-x-2">
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <Menu className="w-5 h-5" />
                  <span>Filters</span>
                </button>
              </div>
              <button
                onClick={() => setShowSettings(!showSettings)}
                className={`flex items-center space-x-2 px-4 py-2 border rounded-lg transition-colors ${
                  showSettings
                    ? "bg-red-100 border-red-300 text-red-700"
                    : "bg-white border-gray-300 hover:bg-gray-50"
                }`}
              >
                <Settings className="w-5 h-5" />
                <span>OCR Settings</span>
              </button>
            </div>
            <div className="hidden lg:block mb-4 flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-900">Files</h1>
              <button
                onClick={() => setShowSettings(!showSettings)}
                className={`flex items-center space-x-2 px-4 py-2 border rounded-lg transition-colors ${
                  showSettings
                    ? "bg-red-100 border-red-300 text-red-700"
                    : "bg-white border-gray-300 hover:bg-gray-50"
                }`}
              >
                <Settings className="w-5 h-5" />
                <span>OCR Settings</span>
              </button>
            </div>

            <BulkOperationsToolbar
              selectedFiles={selectedFiles}
              onAddTags={() => {}}
              onRemoveTags={() => {}}
              onClearSelection={handleClearSelection}
            />

            {showSettings && (
              <div className="mb-6">
                <OCRSettings
                  settings={settings}
                  onUpdateSettings={updateSettings}
                />
              </div>
            )}

            <div className="hidden lg:block">
              <FileGrid
                files={filteredFiles}
                viewMode={viewMode}
                onViewModeChange={setViewMode}
                onAddTag={() => {}}
                onRemoveTag={() => {}}
                isLoading={isLoading}
                selectedFiles={selectedFiles}
                onSelectionChange={handleSelectionChange}
                showSelection={true}
                onRetryOCR={handleRetryOCR}
              />
            </div>

            <div className="lg:hidden">
              {isLoading ? (
                <div className="flex items-center justify-center h-64">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
                </div>
              ) : filteredFiles.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">📂</div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No files found</h3>
                  <p className="text-gray-500">Try adjusting your search or filters</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredFiles.map((file) => (
                    <MobileFileCard
                      key={file.id}
                      file={file}
                      onAddTag={() => {}}
                      onRemoveTag={() => {}}
                      isSelected={selectedFiles.includes(file.id)}
                      onSelectionChange={handleSelectionChange}
                      showSelection={true}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </main>
      </div>

      <MobileUpload
        isOpen={showUpload}
        onClose={() => setShowUpload(false)}
        onUpload={handleUpload}
      />
    </div>
  );
};