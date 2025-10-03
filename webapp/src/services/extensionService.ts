import { Folder, BulkOperationResult, FileMetadata } from "../types";

export class ExtensionService {
  private static instance: ExtensionService;
  private extensionId: string | null = null;

  private constructor() {
    // Try to detect extension ID from various sources
    this.detectExtensionId();
  }

  public static getInstance(): ExtensionService {
    if (!ExtensionService.instance) {
      ExtensionService.instance = new ExtensionService();
    }
    return ExtensionService.instance;
  }

  private detectExtensionId(): void {
    // In a real implementation, you'd need to know the extension ID
    // For now, we'll use a placeholder or try to detect it
    this.extensionId = "your-extension-id-here";
  }

  private async sendMessage(message: any): Promise<any> {
    return new Promise((resolve, reject) => {
      if (!this.extensionId) {
        reject(new Error("Extension not found"));
        return;
      }

      // For development, we'll simulate the extension responses
      // In production, this would use chrome.runtime.sendMessage
      this.simulateExtensionResponse(message).then(resolve).catch(reject);
    });
  }

  // Simulate extension responses for development
  private async simulateExtensionResponse(message: any): Promise<any> {
    await new Promise((resolve) => setTimeout(resolve, 100)); // Simulate network delay

    switch (message.type) {
      case "GET_FOLDERS":
        return {
          ok: true,
          folders: this.getMockFolders(),
        };

      case "CREATE_FOLDER":
        return {
          ok: true,
          folder: {
            id: `folder_${Date.now()}`,
            name: message.name,
            description: message.description || "",
            color: message.color || "#3B82F6",
            created: Date.now(),
            fileCount: 0,
            totalSize: 0,
          },
        };

      case "GET_FILE_METADATA":
        return {
          ok: true,
          metadata: this.getMockFileMetadata(message.fileId),
        };

      case "SEARCH_FILES":
        return {
          ok: true,
          results: this.getMockSearchResults(message.query, message.filters),
        };

      case "BULK_MOVE_FILES":
        return {
          ok: true,
          result: {
            success: message.fileIds,
            failed: [],
          },
        };

      case "BULK_TAG_FILES":
        return {
          ok: true,
          result: {
            success: message.fileIds,
            failed: [],
          },
        };

      case "BULK_RECATEGORIZE_FILES":
        return {
          ok: true,
          result: {
            success: message.fileIds.map((id: string) => ({
              fileId: id,
              category: "document",
              autoTags: ["recategorized", "document"],
              suggestedFolder: "Documents",
            })),
            failed: [],
          },
        };

      default:
        throw new Error(`Unknown message type: ${message.type}`);
    }
  }

  // Mock data generators
  private getMockFolders(): Folder[] {
    return [
      {
        id: "documents",
        name: "Documents",
        description: "Text documents, PDFs, and office files",
        color: "#3B82F6",
        created: Date.now(),
        fileCount: 15,
        totalSize: 45.2,
      },
      {
        id: "images",
        name: "Images",
        description: "Photos, screenshots, and graphics",
        color: "#10B981",
        created: Date.now(),
        fileCount: 32,
        totalSize: 128.7,
      },
      {
        id: "videos",
        name: "Videos",
        description: "Video files and recordings",
        color: "#F59E0B",
        created: Date.now(),
        fileCount: 8,
        totalSize: 2048.3,
      },
      {
        id: "audio",
        name: "Audio",
        description: "Music and audio files",
        color: "#8B5CF6",
        created: Date.now(),
        fileCount: 12,
        totalSize: 156.8,
      },
      {
        id: "archives",
        name: "Archives",
        description: "Compressed files and archives",
        color: "#6B7280",
        created: Date.now(),
        fileCount: 5,
        totalSize: 89.4,
      },
      {
        id: "software",
        name: "Software",
        description: "Applications and executables",
        color: "#EF4444",
        created: Date.now(),
        fileCount: 3,
        totalSize: 234.1,
      },
      {
        id: "code",
        name: "Code",
        description: "Source code and development files",
        color: "#06B6D4",
        created: Date.now(),
        fileCount: 28,
        totalSize: 12.6,
      },
      {
        id: "miscellaneous",
        name: "Miscellaneous",
        description: "Other uncategorized files",
        color: "#84CC16",
        created: Date.now(),
        fileCount: 7,
        totalSize: 23.9,
      },
    ];
  }

  private getMockFileMetadata(fileId: string): FileMetadata {
    return {
      fileName: `file-${fileId}.pdf`,
      filePath: `/downloads/file-${fileId}.pdf`,
      cid: fileId,
      url: `https://${fileId}.ipfs.w3s.link`,
      category: "document",
      extension: "pdf",
      mimeType: "application/pdf",
      fileSizeMB: 2.5,
      autoTags: ["document", "pdf", "medium", "2024", "march"],
      suggestedFolder: "Documents",
      folderId: "documents",
      uploadedAt: Date.now(),
    };
  }

  private getMockSearchResults(query: string, filters: any): FileMetadata[] {
    // Return mock search results
    return [
      this.getMockFileMetadata("search-result-1"),
      this.getMockFileMetadata("search-result-2"),
    ];
  }

  // Public API methods
  async getFolders(): Promise<Folder[]> {
    const response = await this.sendMessage({ type: "GET_FOLDERS" });
    if (!response.ok) throw new Error("Failed to get folders");
    return response.folders;
  }

  async createFolder(
    name: string,
    description = "",
    color = "#3B82F6"
  ): Promise<Folder> {
    const response = await this.sendMessage({
      type: "CREATE_FOLDER",
      name,
      description,
      color,
    });
    if (!response.ok) throw new Error("Failed to create folder");
    return response.folder;
  }

  async updateFolder(
    folderId: string,
    updates: Partial<Folder>
  ): Promise<Folder> {
    const response = await this.sendMessage({
      type: "UPDATE_FOLDER",
      folderId,
      updates,
    });
    if (!response.ok) throw new Error("Failed to update folder");
    return response.folder;
  }

  async deleteFolder(folderId: string): Promise<void> {
    const response = await this.sendMessage({
      type: "DELETE_FOLDER",
      folderId,
    });
    if (!response.ok) throw new Error("Failed to delete folder");
  }

  async getFileMetadata(fileId: string): Promise<FileMetadata> {
    const response = await this.sendMessage({
      type: "GET_FILE_METADATA",
      fileId,
    });
    if (!response.ok) throw new Error("Failed to get file metadata");
    return response.metadata;
  }

  async updateFileMetadata(
    fileId: string,
    updates: Partial<FileMetadata>
  ): Promise<FileMetadata> {
    const response = await this.sendMessage({
      type: "UPDATE_FILE_METADATA",
      fileId,
      updates,
    });
    if (!response.ok) throw new Error("Failed to update file metadata");
    return response.metadata;
  }

  async searchFiles(query: string, filters: any = {}): Promise<FileMetadata[]> {
    const response = await this.sendMessage({
      type: "SEARCH_FILES",
      query,
      filters,
    });
    if (!response.ok) throw new Error("Failed to search files");
    return response.results;
  }

  async getFilesByFolder(folderId: string): Promise<FileMetadata[]> {
    const response = await this.sendMessage({
      type: "GET_FILES_BY_FOLDER",
      folderId,
    });
    if (!response.ok) throw new Error("Failed to get files by folder");
    return response.files;
  }

  // Bulk operations
  async bulkMoveFiles(
    fileIds: string[],
    targetFolderId: string
  ): Promise<BulkOperationResult> {
    const response = await this.sendMessage({
      type: "BULK_MOVE_FILES",
      fileIds,
      targetFolderId,
    });
    if (!response.ok) throw new Error("Failed to move files");
    return response.result;
  }

  async bulkTagFiles(
    fileIds: string[],
    tags: string[],
    action: "add" | "remove" | "replace" = "add"
  ): Promise<BulkOperationResult> {
    const response = await this.sendMessage({
      type: "BULK_TAG_FILES",
      fileIds,
      tags,
      action,
    });
    if (!response.ok) throw new Error("Failed to tag files");
    return response.result;
  }

  async bulkRecategorizeFiles(fileIds: string[]): Promise<BulkOperationResult> {
    const response = await this.sendMessage({
      type: "BULK_RECATEGORIZE_FILES",
      fileIds,
    });
    if (!response.ok) throw new Error("Failed to recategorize files");
    return response.result;
  }
}

export const extensionService = ExtensionService.getInstance();
