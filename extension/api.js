// Extension API helper for webapp communication
// This file provides a bridge between the webapp and extension

class ExtensionAPI {
  constructor() {
    this.extensionId = chrome.runtime.id;
  }

  // Folder management
  async createFolder(name, description = "", color = "#3B82F6") {
    return new Promise((resolve) => {
      chrome.runtime.sendMessage(
        {
          type: "CREATE_FOLDER",
          name,
          description,
          color,
        },
        resolve
      );
    });
  }

  async getFolders() {
    return new Promise((resolve) => {
      chrome.runtime.sendMessage(
        {
          type: "GET_FOLDERS",
        },
        resolve
      );
    });
  }

  async updateFolder(folderId, updates) {
    return new Promise((resolve) => {
      chrome.runtime.sendMessage(
        {
          type: "UPDATE_FOLDER",
          folderId,
          updates,
        },
        resolve
      );
    });
  }

  async deleteFolder(folderId) {
    return new Promise((resolve) => {
      chrome.runtime.sendMessage(
        {
          type: "DELETE_FOLDER",
          folderId,
        },
        resolve
      );
    });
  }

  // File metadata management
  async getFileMetadata(fileId) {
    return new Promise((resolve) => {
      chrome.runtime.sendMessage(
        {
          type: "GET_FILE_METADATA",
          fileId,
        },
        resolve
      );
    });
  }

  async updateFileMetadata(fileId, updates) {
    return new Promise((resolve) => {
      chrome.runtime.sendMessage(
        {
          type: "UPDATE_FILE_METADATA",
          fileId,
          updates,
        },
        resolve
      );
    });
  }

  async searchFiles(query, filters = {}) {
    return new Promise((resolve) => {
      chrome.runtime.sendMessage(
        {
          type: "SEARCH_FILES",
          query,
          filters,
        },
        resolve
      );
    });
  }

  async getFilesByFolder(folderId) {
    return new Promise((resolve) => {
      chrome.runtime.sendMessage(
        {
          type: "GET_FILES_BY_FOLDER",
          folderId,
        },
        resolve
      );
    });
  }

  // Bulk operations
  async bulkMoveFiles(fileIds, targetFolderId) {
    return new Promise((resolve) => {
      chrome.runtime.sendMessage(
        {
          type: "BULK_MOVE_FILES",
          fileIds,
          targetFolderId,
        },
        resolve
      );
    });
  }

  async bulkTagFiles(fileIds, tags, action = "add") {
    return new Promise((resolve) => {
      chrome.runtime.sendMessage(
        {
          type: "BULK_TAG_FILES",
          fileIds,
          tags,
          action,
        },
        resolve
      );
    });
  }

  async bulkRecategorizeFiles(fileIds) {
    return new Promise((resolve) => {
      chrome.runtime.sendMessage(
        {
          type: "BULK_RECATEGORIZE_FILES",
          fileIds,
        },
        resolve
      );
    });
  }

  // Session management
  async checkSession() {
    return new Promise((resolve) => {
      chrome.runtime.sendMessage(
        {
          type: "CHECK_SESSION",
        },
        resolve
      );
    });
  }

  async reauth(email, spaceDid) {
    return new Promise((resolve) => {
      chrome.runtime.sendMessage(
        {
          type: "REAUTH",
          email,
          spaceDid,
        },
        resolve
      );
    });
  }
}

// Export for use in other files
if (typeof module !== "undefined" && module.exports) {
  module.exports = ExtensionAPI;
} else if (typeof window !== "undefined") {
  window.ExtensionAPI = ExtensionAPI;
}
