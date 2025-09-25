import React, { useState, useMemo, useEffect } from 'react';
import { Menu } from 'lucide-react';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { FileGrid } from './FileGrid';
import { MobileFileCard } from './MobileFileCard';
import { MobileNavigation } from './MobileNavigation';
import { MobileUpload } from './MobileUpload';
import { BulkOperationsToolbar } from './BulkOperationsToolbar';
import { FilterState, ViewMode, StorachaFile } from '../types';
import { getClient } from '../hooks/useAuth';
import { decodeCidToString } from '../utils/decodeCidToString';


export const Dashboard: React.FC = () => {
  const [files, setFiles] = useState<StorachaFile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [showSearch, setShowSearch] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    fileType: 'all',
    dateRange: 'all',
    tags: [],
    sortBy: 'date',
    sortOrder: 'desc'
  });

  // Map upload API response to StorachaFile[]
  function mapUploadsToFiles(uploadResponse: any[]): any[] {
    return uploadResponse.map((upload, index) => ({
      id: upload.root['/'],            // use root CID as ID
      cid: upload.root['/'],
      name: `File ${index + 1}`,       // fabricate name as no name in response
      size: 0,                        // no size info in response, default to 0 or fetch if available
      created: new Date(upload.insertedAt).getTime(),
      updated: new Date(upload.updatedAt).getTime(),
      shards: upload.shards.map((shard: any) => shard['/']),
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
    } catch (error) {
      console.error("Failed to list files: ", error);
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
        if (!file.name.toLowerCase().includes(searchLower) && !cidStr.includes(searchLower)) {
          return false;
        }
      }
      return true;
    });
  }, [files, filters]);
  

  const handleSearchChange = (search: string) => {
    console.log("Search changed: ", search);
    setFilters({ ...filters, search: search.trim() });
  };
  

  const handleSelectionChange = (fileId: string, selected: boolean) => {
    setSelectedFiles(prev => 
      selected 
        ? [...prev, fileId]
        : prev.filter(id => id !== fileId)
    );
  };

  const handleClearSelection = () => {
    setSelectedFiles([]);
  };

  const handleUpload = async (uploadFiles: File[]) => {
    console.log('Uploading files:', uploadFiles);
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
            <div className="lg:hidden mb-4">
              <button
                onClick={() => setSidebarOpen(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Menu className="w-5 h-5" />
                <span>Filters</span>
              </button>
            </div>

            <BulkOperationsToolbar
              selectedFiles={selectedFiles}
              onAddTags={() => {}}
              onRemoveTags={() => {}}
              onClearSelection={handleClearSelection}
            />

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
