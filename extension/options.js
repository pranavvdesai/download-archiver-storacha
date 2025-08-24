// Rule Engine v2 - Enhanced rule system with deny/include/size/type precedence
class RuleEngine {
  constructor() {
    this.mimeTypeMap = {
      // Common extensions to MIME types
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

  // Convert file path to extension
  getExtension(filePath) {
    const match = filePath.match(/\.([^.]+)$/);
    return match ? match[1].toLowerCase() : "";
  }

  // Get MIME type from extension
  getMimeType(extension) {
    return this.mimeTypeMap[extension] || "application/octet-stream";
  }

  // Check if pattern matches using simple glob-like matching
  matchesPattern(text, pattern) {
    if (!pattern) return false;

    // Convert glob pattern to regex
    const regexPattern = pattern
      .replace(/\*/g, ".*")
      .replace(/\?/g, ".")
      .replace(/\./g, "\\.");

    try {
      const regex = new RegExp(regexPattern, "i");
      return regex.test(text);
    } catch (e) {
      // Fallback to simple string matching
      return text.toLowerCase().includes(pattern.toLowerCase());
    }
  }

  // Check if extension matches any pattern in list
  matchesExtensionList(extension, patterns) {
    if (!patterns || patterns.length === 0) return false;

    return patterns.some((pattern) => {
      pattern = pattern.trim().toLowerCase();
      if (pattern.startsWith("*.")) {
        // Handle *.ext patterns
        return this.matchesPattern(extension, pattern.substring(2));
      }
      return extension === pattern || this.matchesPattern(extension, pattern);
    });
  }

  // Check if MIME type matches any pattern in list
  matchesMimeTypeList(mimeType, patterns) {
    if (!patterns || patterns.length === 0) return false;

    return patterns.some((pattern) => {
      pattern = pattern.trim().toLowerCase();
      if (pattern.endsWith("/*")) {
        // Handle type/* patterns like image/*
        const baseType = pattern.substring(0, pattern.length - 2);
        return mimeType.toLowerCase().startsWith(baseType);
      }
      return mimeType.toLowerCase() === pattern;
    });
  }

  // Check if folder path matches any pattern in list
  matchesFolderList(filePath, patterns) {
    if (!patterns || patterns.length === 0) return false;

    return patterns.some((pattern) => {
      pattern = pattern.trim();
      return this.matchesPattern(filePath, pattern);
    });
  }

  // Main rule evaluation function
  // Returns { allowed: boolean, reason: string }
  evaluateFile(file, testSizeMB, rules) {
    // Extract info
    const filePath = file.name;
    const extension = this.getExtension(filePath);
    const mimeType = this.getMimeType(extension);

    // If no override is passed, use the file's real size in MB
    const actualSizeMB = file.size / (1024 * 1024);

    // Step 1: Check DENY rules (highest priority)
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
        } else if (this.matchesMimeTypeList(mimeType, rules.include.mimeTypes)) {
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
        // No include rules means include everything (that's not denied)
        includeMatch = true;
        includeReason = "no include rules specified";
      }
    } else {
      includeMatch = true;
      includeReason = "no include rules specified";
    }

    // Step 3: Check SIZE rules
    if (rules.size) {
      if (rules.size.min && actualSizeMB < rules.size.min) {
        return {
          allowed: false,
          reason: `File too small: ${actualSizeMB.toFixed(2)} MB < ${rules.size.min} MB`,
        };
      }
      if (rules.size.max && actualSizeMB > rules.size.max) {
        return {
          allowed: false,
          reason: `File too large: ${actualSizeMB.toFixed(2)} MB > ${rules.size.max} MB`,
        };
      }
    }

    // Step 4: All checks passed
    return {
      allowed: true,
      reason: `Allowed: included by ${includeReason}, size ${actualSizeMB.toFixed(
        2
      )}MB is within limits`,
    };
  }

}

// Initialize the options page
(async () => {
  const ruleEngine = new RuleEngine();

  // Get DOM elements
  const emailInput = document.getElementById("email");
  const saveBtn = document.getElementById("save");
  const statusDiv = document.getElementById("status");
  const testBtn = document.getElementById("testRules");
  const testSizeInput = document.getElementById("testSize");
  const testResultDiv = document.getElementById("testResult");

  // Rule input elements
  const denyExtensionsInput = document.getElementById("denyExtensions");
  const denyMimeTypesInput = document.getElementById("denyMimeTypes");
  const denyFoldersInput = document.getElementById("denyFolders");

  const includeExtensionsInput = document.getElementById("includeExtensions");
  const includeMimeTypesInput = document.getElementById("includeMimeTypes");
  const includeFoldersInput = document.getElementById("includeFolders");

  const minSizeInput = document.getElementById("minSize");
  const maxSizeInput = document.getElementById("maxSize");

  // Load existing configuration
  const stored = await chrome.storage.local.get([
    "email",
    "spaceDid",
    "rulesV2",
  ]);
  if (stored.email) emailInput.value = stored.email;

  // Load rules (migrate from old format if needed)
  let rules = stored.rulesV2;
  if (!rules && stored.rules) {
    // Migrate from old format
    rules = {
      include: {
        extensions: stored.rules.types || [],
        mimeTypes: [],
        folders: stored.rules.folders || [],
      },
      deny: {
        extensions: [],
        mimeTypes: [],
        folders: [],
      },
      size: {
        min: null,
        max: stored.rules.maxSize === Infinity ? null : stored.rules.maxSize,
      },
    };
  } else if (!rules) {
    // Default rules
    rules = {
      include: { extensions: [], mimeTypes: [], folders: [] },
      deny: { extensions: [], mimeTypes: [], folders: [] },
      size: { min: null, max: null },
    };
  }

  // Populate form fields
  denyExtensionsInput.value = (rules.deny.extensions || []).join(",");
  denyMimeTypesInput.value = (rules.deny.mimeTypes || []).join(",");
  denyFoldersInput.value = (rules.deny.folders || []).join(",");

  includeExtensionsInput.value = (rules.include.extensions || []).join(",");
  includeMimeTypesInput.value = (rules.include.mimeTypes || []).join(",");
  includeFoldersInput.value = (rules.include.folders || []).join(",");

  minSizeInput.value = rules.size.min || "";
  maxSizeInput.value = rules.size.max || "";


  const toastContainer = document.getElementById("toast-container");

  function createToast(message, type = "info", duration = 3000) {
    if (!toastContainer) return;

    const toast = document.createElement("div");
    toast.textContent = message;

    // Base styles
    toast.style.padding = "12px 20px";
    toast.style.fontSize = "15px";
    toast.style.borderRadius = "8px";
    toast.style.color = "#fff";
    toast.style.boxShadow = "0 2px 8px rgba(0,0,0,0.15)";
    toast.style.opacity = "0";
    toast.style.transition = "opacity 0.3s ease";
    toast.style.pointerEvents = "auto";

    // Type based colors
    switch (type) {
      case "success":
        toast.style.backgroundColor = "#16a34a"; // green
        break;
      case "error":
        toast.style.backgroundColor = "#dc2626"; // red
        break;
      case "warning":
        toast.style.backgroundColor = "#b45309"; // amber
        break;
      default:
        toast.style.backgroundColor = "#2563eb"; // blue/info
    }

    toastContainer.appendChild(toast);

    // Show with fade in
    requestAnimationFrame(() => (toast.style.opacity = "1"));

    // Hide and remove after duration
    setTimeout(() => {
      toast.style.opacity = "0";
      toast.addEventListener(
        "transitionend",
        () => {
          toast.remove();
        },
        { once: true }
      );
    }, duration);
  }

  // Convenience wrappers:
  function toastSuccess(msg, duration) {
    createToast(msg, "success", duration);
  }
  function toastError(msg, duration) {
    createToast(msg, "error", duration);
  }
  function toastInfo(msg, duration) {
    createToast(msg, "info", duration);
  }
  function toastWarning(msg, duration) {
    createToast(msg, "warning", duration);
  }

  // Helper function to parse comma-separated values
  function parseList(value) {
    return value
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  }

  const testFileInput = document.getElementById("testFile");
  const uploadedPathDiv = document.getElementById("uploadedPath");

  testFileInput.addEventListener("change", () => {
    const file = testFileInput.files[0];
    uploadedPathDiv.textContent = file
      ? `Test file path: ${file.name}`
      : "";
  });


  // Test rules functionality
  testBtn.addEventListener("click", () => {
    const testSize = parseFloat(testSizeInput.value) || 0;
    const file = testFileInput.files[0];

    if (!file) {
      testResultDiv.textContent = "Please upload a file to test";
      testResultDiv.className = "mt-2 p-2 rounded test-fail";
      return;
    }

    const filePath = file.name; // file name only

    // Build current rules from form
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
        min: parseFloat(minSizeInput.value) || null,
        max: parseFloat(testSize) || null,
      },
    };

    const result = ruleEngine.evaluateFile(file, testSize, currentRules);

    testResultDiv.textContent = `${result.allowed ? "✅ WILL UPLOAD" : "❌ WILL NOT UPLOAD"
      }\n${result.reason}`;
    if(result.allowed) {
      toastSuccess("File size is within limit.");
    }else{
      toastWarning("File size is out of limit.");
    }
    testResultDiv.className = `mt-2 p-2 rounded ${result.allowed ? "test-pass" : "test-fail"
      }`;
  });

  // Save configuration
  saveBtn.addEventListener("click", () => {
    const email = emailInput.value.trim();
    if (!email.includes("@")) {
      statusDiv.textContent = "Please enter a valid email.";
      toastError("Please enter a valid email.")
      return;
    }

    // Build rules object
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
        min: parseFloat(minSizeInput.value) || null,
        max: parseFloat(maxSizeInput.value) || null,
      },
    };

    // Save rules to storage
    chrome.storage.local.set({ rulesV2: newRules });

    // Send configuration message
    chrome.runtime.sendMessage(
      { type: "CONFIG", email, spaceDid: stored.spaceDid || null },
      (resp) => {
        if (resp?.ok) {
          chrome.storage.local.set({ email, spaceDid: resp.spaceDid });
          statusDiv.textContent = "Configuration & rules saved!";
          toastSuccess("Configuration & rules saved successfully!");
        } else {
          statusDiv.textContent =
            "Failed to configure: " + (resp.error || "unknown");
          console.error("CONFIG error:", resp.error);
          toastError("CONFIG error:", resp.error);
        }
      }
    );

  });
})();
