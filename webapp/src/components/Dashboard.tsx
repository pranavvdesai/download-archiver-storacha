import React, { useState, useMemo, useEffect } from 'react';
import { Menu, Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { FileGrid } from './FileGrid';
import { BulkOperationsToolbar } from './BulkOperationsToolbar';
import { OCRSettings } from './OCRSettings';
import { FilterState, ViewMode, StorachaFile } from '../types';
import { getClient, useAuth } from '../hooks/useAuth';
import { decodeCidToString } from '../utils/decodeCidToString';
import { useOCR } from '../hooks/useOCR';
import toast from 'react-hot-toast';
import { fileService, fileTagService, getFileKind } from '../services/database';

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { signOut, user } = useAuth();
  const [files, setFiles] = useState<StorachaFile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const { settings, updateSettings, processFile } = useOCR();
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
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
    return uploadResponse.map((upload, index) => {
      const cidString = decodeCidToString(upload.root['/']);
      return {
        id: cidString,
        cid: cidString,
        name: `File ${index + 1}`,
        size: 0,
        type: 'unknown',
        mimeType: 'application/octet-stream',
        created: new Date(upload.insertedAt),
        updated: new Date(upload.updatedAt),
        shards: upload.shards.map((shard: any) => decodeCidToString(shard['/'])),
        tags: [],
        isPublic: false,
        downloadCount: 0,
        ocrStatus: 'not_processed',
      };
    });
  }

  // Call client upload list once on mount
  async function listFiles() {
    setIsLoading(true);
    try {
      const client = await getClient();
      const response = await client.capability.upload.list({ cursor: '', size: 25 });
      const mappedFiles = mapUploadsToFiles(response.results);

      // Sync files from Storacha to database
      if (user?.email && user?.spaceDid) {
        try {
          // Load existing files from database
          const dbFiles = await fileService.getFilesBySpace(user.spaceDid);
          const dbFilesMap = new Map(dbFiles.map(f => [f.cid, f]));

          // Sync each file to database
          for (const file of mappedFiles) {
            const existingFile = dbFilesMap.get(file.cid);

            if (!existingFile) {
              // New file - insert into database
              const newDbFile = await fileService.createFile({
                cid: file.cid,
                space_id: user.spaceDid,
                uploader_email: user.email,
                name: file.name,
                mime_type: file.mimeType,
                size_bytes: file.size,
                file_kind: getFileKind(file.mimeType),
                visibility: file.isPublic ? 'public' : 'private',
                source: 'webapp',
                ocr_status: 'not_processed',
              });
              // Add newly created file to the map so tags can be loaded
              dbFilesMap.set(file.cid, newDbFile);
            }
          }

          // Load enriched data from database (tags, metadata, etc.)
          const enrichedFiles = await Promise.all(
            mappedFiles.map(async (file) => {
              const dbFile = dbFilesMap.get(file.cid);
              if (dbFile) {
                // Load tags
                const tags = await fileTagService.getFileTags(file.cid);
                return {
                  ...file,
                  name: dbFile.name,
                  downloadCount: dbFile.download_count,
                  tags: tags.map(t => t.tag),
                  ocrStatus: dbFile.ocr_status as any,
                  ocrText: dbFile.ocr_text || undefined,
                  extractedText: dbFile.ocr_text || undefined,
                  textExtractionMethod: dbFile.text_extraction_method as any,
                };
              }
              return file;
            })
          );

          setFiles(enrichedFiles);

          // Run OCR processing on enriched files (after tags are loaded)
          if (settings.ocrEnabled && processFile) {
            enrichedFiles.forEach((file, index) => {
              setTimeout(() => {
                processFile(file, async (updatedFile) => {
                  setFiles(prev => prev.map(f =>
                    f.id === file.id
                      ? { ...updatedFile, tags: f.tags } // Preserve existing tags
                      : f
                  ));

                  // Update OCR status in database
                  if (user?.email) {
                    try {
                      await fileService.updateFile(file.cid, {
                        ocr_status: updatedFile.ocrStatus,
                        ocr_text: updatedFile.ocrText,
                        text_extraction_method: updatedFile.textExtractionMethod,
                        processing_completed_at: updatedFile.processingCompletedAt?.toISOString(),
                      });
                    } catch (err) {
                      console.error('Failed to update OCR in database:', err);
                    }
                  }
                });
              }, 100 * index);
            });
          }
        } catch (dbError) {
          console.error('Database sync error:', dbError);
          setFiles(mappedFiles);
        }
      } else {
        setFiles(mappedFiles);
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

  const handleRetryOCR = async (fileId: string) => {
    const file = files.find(f => f.id === fileId);
    if (!file) return;

    await processFile(file, async (updatedFile) => {
      setFiles(prev => prev.map(f =>
        f.id === fileId
          ? { ...updatedFile, tags: f.tags } // Preserve existing tags
          : f
      ));

      // Update OCR status in database
      if (user?.email) {
        try {
          await fileService.updateFile(file.cid, {
            ocr_status: updatedFile.ocrStatus,
            ocr_text: updatedFile.ocrText,
            text_extraction_method: updatedFile.textExtractionMethod,
            processing_started_at: updatedFile.processingStartedAt?.toISOString(),
            processing_completed_at: updatedFile.processingCompletedAt?.toISOString(),
          });
        } catch (err) {
          console.error('Failed to update OCR in database:', err);
        }
      }
    });
  };

  const handleAddTag = async (fileId: string, tag: string) => {
    const file = files.find(f => f.id === fileId);
    if (!file || !user?.email) return;

    try {
      await fileTagService.addTag({
        file_cid: file.cid,
        tag,
        added_by_email: user.email,
      });

      // Update local state
      setFiles(prev => prev.map(f =>
        f.id === fileId ? { ...f, tags: [...f.tags, tag] } : f
      ));

      toast.success(`Tag "${tag}" added`);
    } catch (err: any) {
      console.error('Failed to add tag:', err);
      if (!err.message?.includes('already exist')) {
        toast.error(`Failed to add tag: ${err.message}`);
      }
    }
  };

  const handleRemoveTag = async (fileId: string, tag: string) => {
    const file = files.find(f => f.id === fileId);
    if (!file) return;

    try {
      await fileTagService.removeTag(file.cid, tag);

      // Update local state
      setFiles(prev => prev.map(f =>
        f.id === fileId ? { ...f, tags: f.tags.filter(t => t !== tag) } : f
      ));

      toast.success(`Tag "${tag}" removed`);
    } catch (err: any) {
      console.error('Failed to remove tag:', err);
      toast.error(`Failed to remove tag: ${err.message}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header
        searchQuery={filters.search}
        onSearchChange={handleSearchChange}
      />

      <div className="flex">
        <Sidebar
          files={files}
          filters={filters}
          onFiltersChange={setFilters}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />

        <main className="flex-1 lg:ml-0">
          <div className="p-6">
            <div className="mb-4 flex justify-between items-center">
              <div className="lg:hidden flex space-x-2">
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <Menu className="w-5 h-5" />
                  <span>Filters</span>
                </button>
              </div>
              <div className="hidden lg:block">
                <h1 className="text-2xl font-bold text-gray-900">Files</h1>
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

            <FileGrid
              files={filteredFiles}
              viewMode={viewMode}
              onViewModeChange={setViewMode}
              onAddTag={handleAddTag}
              onRemoveTag={handleRemoveTag}
              isLoading={isLoading}
              selectedFiles={selectedFiles}
              onSelectionChange={handleSelectionChange}
              showSelection={true}
              onRetryOCR={handleRetryOCR}
            />
          </div>
        </main>
      </div>
    </div>
  );
};
