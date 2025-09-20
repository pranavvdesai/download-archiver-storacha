// Rule Engine v2 - Enhanced rule system with deny/include/size/type precedence
class RuleEngine {
  constructor() {
    this.mimeTypeMap = {
      pdf: "application/pdf",
      jpg: "image/jpeg",
      jpeg: "image/jpeg",
      png: "image/png",
      gif: "image/gif",
      txt: "text/plain",
      doc: "application/msword",
      docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      xls: "application/vnd.ms-excel",
      xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      zip: "application/zip",
      mp4: "video/mp4",
      mp3: "audio/mpeg",
      exe: "application/x-executable",
      bat: "application/x-bat",
      tmp: "application/x-temp",
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

    return {
      allowed: true,
      reason: `Allowed: included by ${includeReason}, size ${sizeMB.toFixed(
        2
      )}MB is within limits`,
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
