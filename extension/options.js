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
    } catch {
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
    return patterns.some((pattern) =>
      this.matchesPattern(filePath, pattern.trim())
    );
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

  // UPDATED: No test size override. Uses actual file.size only.
  evaluateFile(file, rules) {
    const filePath = file.name;
    const extension = this.getExtension(filePath);
    const mimeType = this.getMimeType(extension);
    const sizeMB = file.size / (1024 * 1024);

    // DENY
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

    // INCLUDE
    let includeMatch = false;
    let includeReason = "";
    if (rules.include) {
      const hasInclude =
        rules.include.extensions?.length ||
        rules.include.mimeTypes?.length ||
        rules.include.folders?.length;

      if (hasInclude) {
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
        if (!includeMatch)
          return { allowed: false, reason: `Not included by any include rule` };
      } else {
        includeMatch = true;
        includeReason = "no include rules specified";
      }
    } else {
      includeMatch = true;
      includeReason = "no include rules specified";
    }

    // SIZE
    if (rules.size) {
      if (rules.size.min != null && sizeMB < rules.size.min) {
        return {
          allowed: false,
          reason: `File too small: ${sizeMB.toFixed(2)} MB < ${
            rules.size.min
          } MB`,
        };
      }
      if (rules.size.max != null && sizeMB > rules.size.max) {
        return {
          allowed: false,
          reason: `File too large: ${sizeMB.toFixed(2)} MB > ${
            rules.size.max
          } MB`,
        };
      }
    }

    // Generate metadata for allowed files
    const category = this.getFileCategory(extension);
    const autoTags = this.generateAutoTags(filePath, sizeMB);
    const suggestedFolder = this.suggestFolder(filePath, category, autoTags);

    return {
      allowed: true,
      reason: `Allowed: included by ${includeReason}, size ${sizeMB.toFixed(
        2
      )}MB is within limits`,
      metadata: {
        category,
        extension,
        mimeType,
        autoTags,
        suggestedFolder,
        fileSizeMB: sizeMB,
      },
    };
  }
}

// Initialize the options page
(async () => {
  const ruleEngine = new RuleEngine();

  const emailInput = document.getElementById("email");
  const saveBtn = document.getElementById("save");
  const statusDiv = document.getElementById("status");
  const testBtn = document.getElementById("testRules");
  const testResultDiv = document.getElementById("testResult");
  const testFileInput = document.getElementById("testFile");
  const uploadedPathDiv = document.getElementById("uploadedPath");

  // Rule input elements
  const denyExtensionsInput = document.getElementById("denyExtensions");
  const denyMimeTypesInput = document.getElementById("denyMimeTypes");
  const denyFoldersInput = document.getElementById("denyFolders");
  const includeExtensionsInput = document.getElementById("includeExtensions");
  const includeMimeTypesInput = document.getElementById("includeMimeTypes");
  const includeFoldersInput = document.getElementById("includeFolders");
  const minSizeInput = document.getElementById("minSize");
  const maxSizeInput = document.getElementById("maxSize");

  const stored = await chrome.storage.local.get([
    "email",
    "spaceDid",
    "rulesV2",
    "rules",
  ]);
  if (stored.email) emailInput.value = stored.email;

  // Load or migrate rules
  let rules = stored.rulesV2;
  if (!rules && stored.rules) {
    rules = {
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
  }
  if (!rules) {
    rules = {
      include: { extensions: [], mimeTypes: [], folders: [] },
      deny: { extensions: [], mimeTypes: [], folders: [] },
      size: { min: null, max: null },
    };
  }

  // Populate form
  denyExtensionsInput.value = (rules.deny.extensions || []).join(",");
  denyMimeTypesInput.value = (rules.deny.mimeTypes || []).join(",");
  denyFoldersInput.value = (rules.deny.folders || []).join(",");
  includeExtensionsInput.value = (rules.include.extensions || []).join(",");
  includeMimeTypesInput.value = (rules.include.mimeTypes || []).join(",");
  includeFoldersInput.value = (rules.include.folders || []).join(",");
  minSizeInput.value = rules.size.min ?? "";
  maxSizeInput.value = rules.size.max ?? "";

  // Toasts
  const toastContainer = document.getElementById("toast-container");
  function createToast(message, type = "info", duration = 3000) {
    if (!toastContainer) return;
    const toast = document.createElement("div");
    toast.textContent = message;
    toast.style.position = "fixed";
    toast.style.top = "20px";
    toast.style.right = "20px";
    toast.style.padding = "12px 20px";
    toast.style.fontSize = "15px";
    toast.style.borderRadius = "8px";
    toast.style.color = "#fff";
    toast.style.boxShadow = "0 2px 8px rgba(0,0,0,0.15)";
    toast.style.opacity = "0";
    toast.style.transition = "opacity 0.3s ease";
    toast.style.pointerEvents = "auto";
    toast.style.backgroundColor =
      type === "success"
        ? "#16a34a"
        : type === "error"
        ? "#dc2626"
        : type === "warning"
        ? "#b45309"
        : "#2563eb";
    toastContainer.appendChild(toast);
    requestAnimationFrame(() => (toast.style.opacity = "1"));
    setTimeout(() => {
      toast.style.opacity = "0";
      toast.addEventListener("transitionend", () => toast.remove(), {
        once: true,
      });
    }, duration);
  }
  const toastSuccess = (m, d) => createToast(m, "success", d);
  const toastError = (m, d) => createToast(m, "error", d);

  const parseList = (v) =>
    v
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

  testFileInput.addEventListener("change", () => {
    const file = testFileInput.files[0];
    uploadedPathDiv.textContent = file ? `Test file: ${file.name}` : "";
  });

  // UPDATED: no test size override; uses actual file size
  testBtn.addEventListener("click", () => {
    const file = testFileInput.files[0];
    if (!file) {
      testResultDiv.textContent = "Please upload a file to test";
      testResultDiv.className = "mt-2 p-2 rounded test-fail";
      return;
    }

    const currentRules = {
      deny: {
        extensions: parseList(denyExtensionsInput.value),
        mimeTypes: parseList(denyMimeTypesInput.value),
        folders: parseList(denyFoldersInput.value),
      },
      include: {
        extensions: parseList(includeExtensionsInput.value),
        mimeTypes: parseList(includeMimeTypesInput.value),
        folders: parseList(includeFoldersInput.value),
      },
      size: {
        min: minSizeInput.value === "" ? null : parseFloat(minSizeInput.value),
        max: maxSizeInput.value === "" ? null : parseFloat(maxSizeInput.value),
      },
    };

    const result = ruleEngine.evaluateFile(file, currentRules);
    testResultDiv.textContent = `${
      result.allowed ? "✅ WILL UPLOAD" : "❌ WILL NOT UPLOAD"
    }\n${result.reason}`;
    testResultDiv.className = `mt-2 p-2 rounded ${
      result.allowed ? "test-pass" : "test-fail"
    }`;
    if (result.allowed) toastSuccess("Rules pass for this file.");
  });

  // Save configuration
  document.getElementById("save").addEventListener("click", () => {
    const email = emailInput.value.trim();
    if (!email.includes("@")) {
      statusDiv.textContent = "Please enter a valid email.";
      statusDiv.className = "status-error";
      toastError("Please enter a valid email.");
      return;
    }

    const newRules = {
      deny: {
        extensions: parseList(denyExtensionsInput.value),
        mimeTypes: parseList(denyMimeTypesInput.value),
        folders: parseList(denyFoldersInput.value),
      },
      include: {
        extensions: parseList(includeExtensionsInput.value),
        mimeTypes: parseList(includeMimeTypesInput.value),
        folders: parseList(includeFoldersInput.value),
      },
      size: {
        min: minSizeInput.value === "" ? null : parseFloat(minSizeInput.value),
        max: maxSizeInput.value === "" ? null : parseFloat(maxSizeInput.value),
      },
    };

    chrome.storage.local.set({ rulesV2: newRules });

    chrome.runtime.sendMessage(
      { type: "CONFIG", email, spaceDid: stored.spaceDid || null },
      (resp) => {
        if (resp?.ok) {
          chrome.storage.local.set({ email, spaceDid: resp.spaceDid });
          statusDiv.textContent = "Configuration & rules saved!";
          statusDiv.className = "status-success";
          toastSuccess("Configuration & rules saved!");
        } else {
          statusDiv.textContent =
            "Failed to configure: " + (resp?.error || "unknown");
          statusDiv.className = "status-error";
        }
      }
    );
  });
})();
