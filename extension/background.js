self.process = { env: {} };

import { create } from "@web3-storage/w3up-client";
import * as DID from "@ipld/dag-ucan/did";
import * as Delegation from "@ucanto/core/delegation";

let client;
let spaceDid;

const SESSION_TIMEOUT = 15 * 60 * 1000; // 15 minutes in milliseconds
let lastActivity = Date.now();
let sessionExpiry = Date.now() + SESSION_TIMEOUT;
let isSessionValid = true;

// Enhanced Rule Engine v3 - With categorization, folders, and tagging
class RuleEngine {
  constructor() {
    this.mimeTypeMap = {
      pdf: "application/pdf",
      jpg: "image/jpeg",
      jpeg: "image/jpeg",
      png: "image/png",
      gif: "image/gif",
      webp: "image/webp",
      svg: "image/svg+xml",
      txt: "text/plain",
      doc: "application/msword",
      docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      xls: "application/vnd.ms-excel",
      xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      ppt: "application/vnd.ms-powerpoint",
      pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      zip: "application/zip",
      rar: "application/x-rar-compressed",
      "7z": "application/x-7z-compressed",
      tar: "application/x-tar",
      gz: "application/gzip",
      mp4: "video/mp4",
      avi: "video/x-msvideo",
      mov: "video/quicktime",
      mkv: "video/x-matroska",
      mp3: "audio/mpeg",
      wav: "audio/wav",
      flac: "audio/flac",
      exe: "application/x-executable",
      msi: "application/x-msi",
      dmg: "application/x-apple-diskimage",
      bat: "application/x-bat",
      sh: "application/x-sh",
      tmp: "application/x-temp",
      json: "application/json",
      xml: "application/xml",
      csv: "text/csv",
      js: "text/javascript",
      css: "text/css",
      html: "text/html",
      py: "text/x-python",
      java: "text/x-java-source",
      cpp: "text/x-c++src",
      c: "text/x-csrc",
    };

    this.categoryMap = {
      document: ["pdf", "doc", "docx", "txt", "rtf", "odt", "pages"],
      spreadsheet: ["xls", "xlsx", "csv", "ods", "numbers"],
      presentation: ["ppt", "pptx", "odp", "key"],
      image: ["jpg", "jpeg", "png", "gif", "webp", "svg", "bmp", "tiff", "ico"],
      video: ["mp4", "avi", "mov", "mkv", "wmv", "flv", "webm", "m4v"],
      audio: ["mp3", "wav", "flac", "aac", "ogg", "wma", "m4a"],
      archive: ["zip", "rar", "7z", "tar", "gz", "bz2", "xz"],
      executable: ["exe", "msi", "dmg", "deb", "rpm", "app"],
      code: [
        "js",
        "ts",
        "py",
        "java",
        "cpp",
        "c",
        "cs",
        "php",
        "rb",
        "go",
        "rs",
      ],
      web: ["html", "css", "js", "json", "xml", "svg"],
      data: ["json", "xml", "csv", "sql", "db", "sqlite"],
      font: ["ttf", "otf", "woff", "woff2", "eot"],
      other: [],
    };
  }

  getExtension(filePath) {
    const match = filePath.match(/\.([^.]+)$/);
    return match ? match[1].toLowerCase() : "";
  }

  getMimeType(extension) {
    return this.mimeTypeMap[extension] || "application/octet-stream";
  }

  matchesPattern(text, pattern) {
    if (!pattern) return false;
    const regexPattern = pattern
      .replace(/\*/g, ".*")
      .replace(/\?/g, ".")
      .replace(/\./g, "\\.");
    try {
      const regex = new RegExp(regexPattern, "i");
      return regex.test(text);
    } catch (e) {
      return text.toLowerCase().includes(pattern.toLowerCase());
    }
  }

  matchesExtensionList(extension, patterns) {
    if (!patterns || patterns.length === 0) return false;
    return patterns.some((pattern) => {
      pattern = pattern.trim().toLowerCase();
      if (pattern.startsWith("*.")) {
        return this.matchesPattern(extension, pattern.substring(2));
      }
      return extension === pattern || this.matchesPattern(extension, pattern);
    });
  }

  matchesMimeTypeList(mimeType, patterns) {
    if (!patterns || patterns.length === 0) return false;
    return patterns.some((pattern) => {
      pattern = pattern.trim().toLowerCase();
      if (pattern.endsWith("/*")) {
        const baseType = pattern.substring(0, pattern.length - 2);
        return mimeType.toLowerCase().startsWith(baseType);
      }
      return mimeType.toLowerCase() === pattern;
    });
  }

  matchesFolderList(filePath, patterns) {
    if (!patterns || patterns.length === 0) return false;
    return patterns.some((pattern) => {
      pattern = pattern.trim();
      return this.matchesPattern(filePath, pattern);
    });
  }

  getFileCategory(extension) {
    for (const [category, extensions] of Object.entries(this.categoryMap)) {
      if (extensions.includes(extension.toLowerCase())) {
        return category;
      }
    }
    return "other";
  }

  generateAutoTags(filePath, fileSizeMB, metadata = {}) {
    const extension = this.getExtension(filePath);
    const category = this.getFileCategory(extension);
    const fileName = filePath.split("/").pop().toLowerCase();
    const tags = new Set();

    // Category-based tags
    tags.add(category);

    // Size-based tags
    if (fileSizeMB < 1) tags.add("small");
    else if (fileSizeMB < 10) tags.add("medium");
    else if (fileSizeMB < 100) tags.add("large");
    else tags.add("huge");

    // Extension tag
    if (extension) tags.add(extension);

    // Content-based tags from filename
    const contentKeywords = {
      screenshot: ["screenshot", "screen", "capture"],
      download: ["download", "dl"],
      backup: ["backup", "bak", "copy"],
      temp: ["temp", "tmp", "temporary"],
      draft: ["draft", "wip", "work-in-progress"],
      final: ["final", "finished", "complete"],
      invoice: ["invoice", "bill", "receipt"],
      report: ["report", "summary", "analysis"],
      presentation: ["presentation", "slides", "deck"],
      tutorial: ["tutorial", "guide", "howto", "instructions"],
      personal: ["personal", "private"],
      work: ["work", "business", "office"],
    };

    for (const [tag, keywords] of Object.entries(contentKeywords)) {
      if (keywords.some((keyword) => fileName.includes(keyword))) {
        tags.add(tag);
      }
    }

    // Date-based tags
    const now = new Date();
    const year = now.getFullYear();
    const month = now
      .toLocaleString("default", { month: "long" })
      .toLowerCase();
    tags.add(year.toString());
    tags.add(month);

    return Array.from(tags);
  }

  suggestFolder(filePath, category, tags) {
    const fileName = filePath.split("/").pop().toLowerCase();

    // Priority-based folder suggestions
    if (tags.includes("work") || tags.includes("business")) return "Work";
    if (tags.includes("personal") || tags.includes("private"))
      return "Personal";
    if (tags.includes("screenshot")) return "Screenshots";
    if (tags.includes("download")) return "Downloads";
    if (tags.includes("backup")) return "Backups";
    if (tags.includes("temp") || tags.includes("temporary")) return "Temporary";

    // Category-based folders
    switch (category) {
      case "document":
        return "Documents";
      case "image":
        return "Images";
      case "video":
        return "Videos";
      case "audio":
        return "Audio";
      case "archive":
        return "Archives";
      case "code":
        return "Code";
      case "executable":
        return "Software";
      default:
        return "Miscellaneous";
    }
  }

  evaluateFile(filePath, fileSizeMB, rules) {
    const extension = this.getExtension(filePath);
    const mimeType = this.getMimeType(extension);
    const category = this.getFileCategory(extension);
    const autoTags = this.generateAutoTags(filePath, fileSizeMB);
    const suggestedFolder = this.suggestFolder(filePath, category, autoTags);

    // Step 1: Check DENY rules
    if (rules.deny) {
      if (this.matchesExtensionList(extension, rules.deny.extensions)) {
        return {
          allowed: false,
          reason: `Denied by extension rule: ${extension}`,
        };
      }
      if (this.matchesMimeTypeList(mimeType, rules.deny.mimeTypes)) {
        return {
          allowed: false,
          reason: `Denied by MIME type rule: ${mimeType}`,
        };
      }
      if (this.matchesFolderList(filePath, rules.deny.folders)) {
        return {
          allowed: false,
          reason: `Denied by folder rule: path matches deny pattern`,
        };
      }
    }

    // Step 2: Check INCLUDE rules
    let includeMatch = false;
    let includeReason = "";

    if (rules.include) {
      const hasIncludeRules =
        (rules.include.extensions && rules.include.extensions.length > 0) ||
        (rules.include.mimeTypes && rules.include.mimeTypes.length > 0) ||
        (rules.include.folders && rules.include.folders.length > 0);

      if (hasIncludeRules) {
        if (this.matchesExtensionList(extension, rules.include.extensions)) {
          includeMatch = true;
          includeReason = `extension ${extension}`;
        } else if (
          this.matchesMimeTypeList(mimeType, rules.include.mimeTypes)
        ) {
          includeMatch = true;
          includeReason = `MIME type ${mimeType}`;
        } else if (this.matchesFolderList(filePath, rules.include.folders)) {
          includeMatch = true;
          includeReason = `folder pattern`;
        }

        if (!includeMatch) {
          return { allowed: false, reason: `Not included by any include rule` };
        }
      } else {
        includeMatch = true;
        includeReason = "no include rules specified";
      }
    } else {
      includeMatch = true;
      includeReason = "no include rules specified";
    }

    // Step 3: Check SIZE rules
    if (rules.size) {
      if (rules.size.min && fileSizeMB < rules.size.min) {
        return {
          allowed: false,
          reason: `File too small: ${fileSizeMB}MB < ${rules.size.min}MB`,
        };
      }
      if (rules.size.max && fileSizeMB > rules.size.max) {
        return {
          allowed: false,
          reason: `File too large: ${fileSizeMB}MB > ${rules.size.max}MB`,
        };
      }
    }

    return {
      allowed: true,
      reason: `Allowed: included by ${includeReason}, size ${fileSizeMB}MB is within limits`,
      metadata: {
        category,
        extension,
        mimeType,
        autoTags,
        suggestedFolder,
        fileSizeMB,
      },
    };
  }
}

const ruleEngine = new RuleEngine();
let uploadRules = {
  include: { extensions: [], mimeTypes: [], folders: [] },
  deny: { extensions: [], mimeTypes: [], folders: [] },
  size: { min: null, max: null },
};

// Folder and file metadata management
class FolderManager {
  constructor() {
    this.folders = new Map();
    this.fileMetadata = new Map();
    this.loadFromStorage();
  }

  async loadFromStorage() {
    const stored = await chrome.storage.local.get(["folders", "fileMetadata"]);
    if (stored.folders) {
      this.folders = new Map(Object.entries(stored.folders));
    } else {
      // Create default folders on first run
      this.createDefaultFolders();
    }
    if (stored.fileMetadata) {
      this.fileMetadata = new Map(Object.entries(stored.fileMetadata));
    }
  }

  createDefaultFolders() {
    const defaultFolders = [
      {
        name: "Documents",
        description: "Text documents, PDFs, and office files",
        color: "#3B82F6",
      },
      {
        name: "Images",
        description: "Photos, screenshots, and graphics",
        color: "#10B981",
      },
      {
        name: "Videos",
        description: "Video files and recordings",
        color: "#F59E0B",
      },
      { name: "Audio", description: "Music and audio files", color: "#8B5CF6" },
      {
        name: "Archives",
        description: "Compressed files and archives",
        color: "#6B7280",
      },
      {
        name: "Software",
        description: "Applications and executables",
        color: "#EF4444",
      },
      {
        name: "Code",
        description: "Source code and development files",
        color: "#06B6D4",
      },
      {
        name: "Miscellaneous",
        description: "Other uncategorized files",
        color: "#84CC16",
      },
    ];

    defaultFolders.forEach((folder) => {
      this.createFolder(folder.name, folder.description, folder.color);
    });
  }

  async saveToStorage() {
    await chrome.storage.local.set({
      folders: Object.fromEntries(this.folders),
      fileMetadata: Object.fromEntries(this.fileMetadata),
    });
  }

  createFolder(name, description = "", color = "#3B82F6") {
    const folderId = `folder_${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 9)}`;
    const folder = {
      id: folderId,
      name,
      description,
      color,
      created: Date.now(),
      fileCount: 0,
      totalSize: 0,
    };
    this.folders.set(folderId, folder);
    this.saveToStorage();
    return folder;
  }

  getFolder(folderId) {
    return this.folders.get(folderId);
  }

  getAllFolders() {
    return Array.from(this.folders.values());
  }

  updateFolder(folderId, updates) {
    const folder = this.folders.get(folderId);
    if (folder) {
      Object.assign(folder, updates);
      this.saveToStorage();
      return folder;
    }
    return null;
  }

  deleteFolder(folderId) {
    // Move all files in this folder to 'Uncategorized'
    for (const [fileId, metadata] of this.fileMetadata) {
      if (metadata.folderId === folderId) {
        metadata.folderId = "uncategorized";
      }
    }
    this.folders.delete(folderId);
    this.saveToStorage();
  }

  addFileToFolder(fileId, folderId, metadata) {
    // Update folder stats
    const folder = this.folders.get(folderId);
    if (folder) {
      folder.fileCount++;
      folder.totalSize += metadata.fileSizeMB || 0;
    }

    // Store file metadata
    this.fileMetadata.set(fileId, {
      ...metadata,
      folderId,
      uploadedAt: Date.now(),
    });

    this.saveToStorage();
  }

  getFileMetadata(fileId) {
    return this.fileMetadata.get(fileId);
  }

  updateFileMetadata(fileId, updates) {
    const metadata = this.fileMetadata.get(fileId);
    if (metadata) {
      Object.assign(metadata, updates);
      this.saveToStorage();
      return metadata;
    }
    return null;
  }

  getFilesByFolder(folderId) {
    return Array.from(this.fileMetadata.entries())
      .filter(([_, metadata]) => metadata.folderId === folderId)
      .map(([fileId, metadata]) => ({ fileId, ...metadata }));
  }

  searchFiles(query, filters = {}) {
    const results = [];
    const queryLower = query.toLowerCase();

    for (const [fileId, metadata] of this.fileMetadata) {
      let matches = false;

      // Search in filename, tags, category
      if (
        metadata.fileName &&
        metadata.fileName.toLowerCase().includes(queryLower)
      ) {
        matches = true;
      }
      if (
        metadata.autoTags &&
        metadata.autoTags.some((tag) => tag.toLowerCase().includes(queryLower))
      ) {
        matches = true;
      }
      if (
        metadata.category &&
        metadata.category.toLowerCase().includes(queryLower)
      ) {
        matches = true;
      }

      // Apply filters
      if (matches) {
        if (filters.category && metadata.category !== filters.category)
          matches = false;
        if (filters.folderId && metadata.folderId !== filters.folderId)
          matches = false;
        if (
          filters.tags &&
          !filters.tags.every((tag) => metadata.autoTags?.includes(tag))
        )
          matches = false;
      }

      if (matches) {
        results.push({ fileId, ...metadata });
      }
    }

    return results;
  }
}

const folderManager = new FolderManager();

// Load rules from storage (support both v1 and v2 formats)
chrome.storage.local.get(["rules", "rulesV2"]).then((stored) => {
  if (stored.rulesV2) {
    uploadRules = stored.rulesV2;
    console.log("[DownloadArchiver] Initial rules v2:", uploadRules);
  } else if (stored.rules) {
    // Migrate from v1 format
    uploadRules = {
      include: {
        extensions: stored.rules.types || [],
        mimeTypes: [],
        folders: stored.rules.folders || [],
      },
      deny: { extensions: [], mimeTypes: [], folders: [] },
      size: {
        min: null,
        max: stored.rules.maxSize === Infinity ? null : stored.rules.maxSize,
      },
    };
    console.log("[DownloadArchiver] Migrated rules from v1:", uploadRules);
  }
});

chrome.storage.onChanged.addListener((changes, area) => {
  if (area === "local" && changes.rulesV2) {
    uploadRules = changes.rulesV2.newValue;
    console.log("[DownloadArchiver] Rules v2 updated:", uploadRules);
  }
});

chrome.runtime.onInstalled.addListener(() => {
  chrome.runtime.openOptionsPage();
});

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === "CONFIG") {
    initClient(msg.email, msg.spaceDid)
      .then((did) => {
        updateActivity();
        sendResponse({ ok: true, spaceDid: did });
      })
      .catch((err) => {
        console.error("CONFIG initClient failed:", err);
        sendResponse({ ok: false, error: err.message });
      });
    return true;
  }

  if (msg.type === "CHECK_SESSION") {
    const isValid = checkSessionValidity();
    if (isValid) {
      updateActivity();
    } else {
      handleSessionTimeout();
    }
    sendResponse({ isValid });
    return true;
  }

  if (msg.type === "REAUTH") {
    initClient(msg.email, msg.spaceDid)
      .then((did) => {
        updateActivity();
        sendResponse({ ok: true, spaceDid: did });
      })
      .catch((err) => {
        console.error("REAUTH initClient failed:", err);
        sendResponse({ ok: false, error: err.message });
      });
    return true;
  }

  // Folder management
  if (msg.type === "CREATE_FOLDER") {
    const folder = folderManager.createFolder(
      msg.name,
      msg.description,
      msg.color
    );
    sendResponse({ ok: true, folder });
    return true;
  }

  if (msg.type === "GET_FOLDERS") {
    const folders = folderManager.getAllFolders();
    sendResponse({ ok: true, folders });
    return true;
  }

  if (msg.type === "UPDATE_FOLDER") {
    const folder = folderManager.updateFolder(msg.folderId, msg.updates);
    sendResponse({ ok: true, folder });
    return true;
  }

  if (msg.type === "DELETE_FOLDER") {
    folderManager.deleteFolder(msg.folderId);
    sendResponse({ ok: true });
    return true;
  }

  // File metadata management
  if (msg.type === "GET_FILE_METADATA") {
    const metadata = folderManager.getFileMetadata(msg.fileId);
    sendResponse({ ok: true, metadata });
    return true;
  }

  if (msg.type === "UPDATE_FILE_METADATA") {
    const metadata = folderManager.updateFileMetadata(msg.fileId, msg.updates);
    sendResponse({ ok: true, metadata });
    return true;
  }

  if (msg.type === "SEARCH_FILES") {
    const results = folderManager.searchFiles(msg.query, msg.filters);
    sendResponse({ ok: true, results });
    return true;
  }

  if (msg.type === "GET_FILES_BY_FOLDER") {
    const files = folderManager.getFilesByFolder(msg.folderId);
    sendResponse({ ok: true, files });
    return true;
  }

  // Bulk operations
  if (msg.type === "BULK_MOVE_FILES") {
    handleBulkMoveFiles(msg.fileIds, msg.targetFolderId)
      .then((result) => sendResponse({ ok: true, result }))
      .catch((err) => sendResponse({ ok: false, error: err.message }));
    return true;
  }

  if (msg.type === "BULK_TAG_FILES") {
    handleBulkTagFiles(msg.fileIds, msg.tags, msg.action)
      .then((result) => sendResponse({ ok: true, result }))
      .catch((err) => sendResponse({ ok: false, error: err.message }));
    return true;
  }

  if (msg.type === "BULK_RECATEGORIZE_FILES") {
    handleBulkRecategorizeFiles(msg.fileIds)
      .then((result) => sendResponse({ ok: true, result }))
      .catch((err) => sendResponse({ ok: false, error: err.message }));
    return true;
  }
});

// Bulk operation handlers
async function handleBulkMoveFiles(fileIds, targetFolderId) {
  const results = { success: [], failed: [] };

  for (const fileId of fileIds) {
    try {
      const metadata = folderManager.getFileMetadata(fileId);
      if (metadata) {
        // Update old folder stats
        const oldFolder = folderManager.getFolder(metadata.folderId);
        if (oldFolder) {
          oldFolder.fileCount = Math.max(0, oldFolder.fileCount - 1);
          oldFolder.totalSize = Math.max(
            0,
            oldFolder.totalSize - (metadata.fileSizeMB || 0)
          );
        }

        // Update new folder stats
        const newFolder = folderManager.getFolder(targetFolderId);
        if (newFolder) {
          newFolder.fileCount++;
          newFolder.totalSize += metadata.fileSizeMB || 0;
        }

        // Update file metadata
        folderManager.updateFileMetadata(fileId, { folderId: targetFolderId });
        results.success.push(fileId);
      } else {
        results.failed.push({ fileId, error: "File metadata not found" });
      }
    } catch (error) {
      results.failed.push({ fileId, error: error.message });
    }
  }

  await folderManager.saveToStorage();
  return results;
}

async function handleBulkTagFiles(fileIds, tags, action = "add") {
  const results = { success: [], failed: [] };

  for (const fileId of fileIds) {
    try {
      const metadata = folderManager.getFileMetadata(fileId);
      if (metadata) {
        let currentTags = metadata.autoTags || [];

        if (action === "add") {
          // Add new tags, avoiding duplicates
          const newTags = [...new Set([...currentTags, ...tags])];
          folderManager.updateFileMetadata(fileId, { autoTags: newTags });
        } else if (action === "remove") {
          // Remove specified tags
          const filteredTags = currentTags.filter((tag) => !tags.includes(tag));
          folderManager.updateFileMetadata(fileId, { autoTags: filteredTags });
        } else if (action === "replace") {
          // Replace all tags
          folderManager.updateFileMetadata(fileId, { autoTags: tags });
        }

        results.success.push(fileId);
      } else {
        results.failed.push({ fileId, error: "File metadata not found" });
      }
    } catch (error) {
      results.failed.push({ fileId, error: error.message });
    }
  }

  await folderManager.saveToStorage();
  return results;
}

async function handleBulkRecategorizeFiles(fileIds) {
  const results = { success: [], failed: [] };

  for (const fileId of fileIds) {
    try {
      const metadata = folderManager.getFileMetadata(fileId);
      if (metadata && metadata.fileName) {
        // Re-run categorization
        const extension = ruleEngine.getExtension(metadata.fileName);
        const category = ruleEngine.getFileCategory(extension);
        const autoTags = ruleEngine.generateAutoTags(
          metadata.fileName,
          metadata.fileSizeMB || 0
        );
        const suggestedFolder = ruleEngine.suggestFolder(
          metadata.fileName,
          category,
          autoTags
        );

        folderManager.updateFileMetadata(fileId, {
          category,
          autoTags,
          suggestedFolder,
        });

        results.success.push({ fileId, category, autoTags, suggestedFolder });
      } else {
        results.failed.push({
          fileId,
          error: "File metadata not found or incomplete",
        });
      }
    } catch (error) {
      results.failed.push({ fileId, error: error.message });
    }
  }

  await folderManager.saveToStorage();
  return results;
}

/**
 * Initialize the client, log in, and pick or create the "download-vault" space.
 * @param {string} email
 * @param {string|null} savedSpaceDid
 */
async function initClient(email, savedSpaceDid) {
  console.log("[DownloadArchiver] initClient start");

  client = await create();
  console.log("[DownloadArchiver] Client created");

  const account = await client.login(email);
  console.log("[DownloadArchiver] Logged in; waiting on plan...");
  await account.plan.wait();
  console.log("[DownloadArchiver] Plan ready");

  if (savedSpaceDid) {
    spaceDid = savedSpaceDid;
    console.log("[DownloadArchiver] Reusing saved spaceDid:", spaceDid);
    await client.setCurrentSpace(spaceDid);
    return spaceDid;
  }

  const existing = client.spaces();
  const vault = existing.find((s) => s.name === "download-vault");
  if (vault) {
    spaceDid = vault.did();
    console.log("[DownloadArchiver] Found existing space:", spaceDid);
    await client.setCurrentSpace(spaceDid);
  } else {
    console.log('[DownloadArchiver] Creating space "download-vault" …');
    const space = await client.createSpace("download-vault", { account });
    spaceDid = space.did();
    console.log("[DownloadArchiver] Created space:", spaceDid);
    await client.setCurrentSpace(spaceDid);
  }

  const agentDid = client.agent.did();
  console.log("[DownloadArchiver] Creating delegation for agent:", agentDid);
  const delegation = await client.createDelegation(
    DID.parse(agentDid),
    ["space/blob/add", "space/index/add", "upload/add", "store/add"],
    { expiration: Infinity }
  );
  console.log("[DownloadArchiver] Delegation CID:", delegation.cid);
  const { ok: archiveBytes } = await delegation.archive();
  const { ok: proof } = await Delegation.extract(new Uint8Array(archiveBytes));
  if (!proof) throw new Error("Failed to extract delegation proof");
  await client.addSpace(proof);
  console.log("[DownloadArchiver] Shared space with agent");

  await chrome.storage.local.set({ email, spaceDid });
  console.log("[DownloadArchiver] Saved spaceDid to local storage");

  return spaceDid;
}

function updateActivity() {
  lastActivity = Date.now();
  sessionExpiry = Date.now() + SESSION_TIMEOUT;
  isSessionValid = true;
  chrome.storage.local.set({ lastActivity, sessionExpiry });
}

function checkSessionValidity() {
  const now = Date.now();
  const isExpired = now >= sessionExpiry;
  const isInactive = now - lastActivity >= SESSION_TIMEOUT;
  isSessionValid = !isExpired && !isInactive;
  return isSessionValid;
}

async function handleSessionTimeout() {
  if (!isSessionValid) {
    client = null;

    chrome.notifications.create({
      type: "basic",
      iconUrl: chrome.runtime.getURL("icons/48.png"),
      title: "Session Expired",
      message:
        "Your session has expired. Please re-authenticate to continue using the extension.",
    });

    chrome.runtime.sendMessage({ type: "SESSION_EXPIRED" });
  }
}

async function ensureClientReady() {
  const stored = await chrome.storage.local.get([
    "email",
    "spaceDid",
    "lastActivity",
    "sessionExpiry",
  ]);
  const {
    email,
    spaceDid: storedDid,
    lastActivity: storedLastActivity,
    sessionExpiry: storedSessionExpiry,
  } = stored;

  if (!email) throw new Error("Not configured");

  if (storedLastActivity && storedSessionExpiry) {
    lastActivity = storedLastActivity;
    sessionExpiry = storedSessionExpiry;
  }

  if (!checkSessionValidity()) {
    await handleSessionTimeout();
    throw new Error("Session expired");
  }

  if (!client || !client.currentSpace()) {
    console.log("[DownloadArchiver] ensureClientReady: re-initializing");
    await initClient(email, storedDid || null);
  }

  updateActivity();
}

chrome.downloads.onChanged.addListener(async (delta) => {
  console.log("[DownloadArchiver] download.onChanged:", delta);

  if (delta.state?.current !== "complete") return;
  console.log("[DownloadArchiver] Download complete, id=", delta.id);

  if (!checkSessionValidity()) {
    await handleSessionTimeout();
    return;
  }

  updateActivity();

  try {
    await ensureClientReady();

    const [item] = await chrome.downloads.search({ id: delta.id });
    if (!item || item.byExtension) return;

    // Use Rule Engine v2 for evaluation
    const fileSizeMB = item.fileSize ? item.fileSize / (1024 * 1024) : 0;
    const evaluation = ruleEngine.evaluateFile(
      item.filename,
      fileSizeMB,
      uploadRules
    );

    if (!evaluation.allowed) {
      console.log(
        `[DownloadArchiver] Skipping ${item.filename}: ${evaluation.reason}`
      );
      return;
    }

    console.log(
      `[DownloadArchiver] Processing ${item.filename}: ${evaluation.reason}`
    );

    const response = await fetch(item.url);
    const blob = await response.blob();
    const file = new File([blob], item.filename);

    console.log("[DownloadArchiver] Uploading:", item.filename);
    const cid = await client.uploadFile(file);
    console.log("[DownloadArchiver] Uploaded →", cid.toString());
    console.log(
      "[DownloadArchiver] File uploaded →",
      `https://${cid}.ipfs.w3s.link`
    );

    // Enhanced: Store file metadata with categorization
    if (evaluation.metadata) {
      const { category, autoTags, suggestedFolder } = evaluation.metadata;

      // Find or create the suggested folder
      let targetFolderId = "uncategorized";
      const existingFolder = folderManager
        .getAllFolders()
        .find((f) => f.name === suggestedFolder);

      if (existingFolder) {
        targetFolderId = existingFolder.id;
      } else {
        // Auto-create folder if it doesn't exist
        const newFolder = folderManager.createFolder(
          suggestedFolder,
          `Auto-created folder for ${category} files`
        );
        targetFolderId = newFolder.id;
      }

      // Store comprehensive file metadata
      folderManager.addFileToFolder(cid.toString(), targetFolderId, {
        fileName: item.filename,
        filePath: item.filename,
        cid: cid.toString(),
        url: `https://${cid}.ipfs.w3s.link`,
        category,
        extension: evaluation.metadata.extension,
        mimeType: evaluation.metadata.mimeType,
        fileSizeMB: evaluation.metadata.fileSizeMB,
        autoTags,
        suggestedFolder,
        downloadUrl: item.url,
        downloadId: item.id,
        uploadedAt: Date.now(),
      });

      console.log(
        `[DownloadArchiver] File categorized as '${category}' with tags: ${autoTags.join(
          ", "
        )}`
      );
      console.log(
        `[DownloadArchiver] File stored in folder: ${suggestedFolder}`
      );
    }

    chrome.notifications.create({
      type: "basic",
      iconUrl: chrome.runtime.getURL("icons/48.png"),
      title: "DownloadArchiver",
      message: `${item.filename} → ${
        evaluation.metadata?.category || "file"
      } (${
        evaluation.metadata?.autoTags?.slice(0, 2).join(", ") || "no tags"
      })`,
    });
  } catch (err) {
    console.error("[DownloadArchiver] Error uploading download:", err);
  }
});
