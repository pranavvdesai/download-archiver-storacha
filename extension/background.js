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

import { RuleEngine } from "./rule-engine.js";

const ruleEngine = new RuleEngine();
let uploadRules = {
  include: { extensions: [], mimeTypes: [], folders: [] },
  deny: { extensions: [], mimeTypes: [], folders: [] },
  size: { min: null, max: null },
};

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

  // Create a single context menu item for all supported contexts
  chrome.contextMenus.create({
    id: "upload-to-storacha",
    title: "Upload to Storacha",
    contexts: ["link", "image", "video", "audio"],
  });
});

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
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
});

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
  const isInactive = (now - lastActivity) >= SESSION_TIMEOUT;
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
      message: "Your session has expired. Please re-authenticate to continue using the extension.",
    });

    chrome.runtime.sendMessage({ type: "SESSION_EXPIRED" });
  }
}

async function ensureClientReady() {
  const stored = await chrome.storage.local.get(["email", "spaceDid", "lastActivity", "sessionExpiry"]);
  const { email, spaceDid: storedDid, lastActivity: storedLastActivity, sessionExpiry: storedSessionExpiry } = stored;

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

// Context menu click handler
chrome.contextMenus.onClicked.addListener(async (info, _tab) => {
  console.log("[DownloadArchiver] Context menu clicked:", info);

  try {
    await ensureClientReady();

    let url = null;

    if (info.srcUrl && ["image", "video", "audio"].includes(info.mediaType)) {
      url = info.srcUrl;
    }

    if (!url && info.linkUrl) {
      url = info.linkUrl;
    }

    if (!url && info.srcUrl) {
      url = info.srcUrl;
    }

    if (url) {
      try {
        const parsed = new URL(url);
        const isGoogleRedirect =
          parsed.hostname.endsWith(".google.com") ||
          parsed.hostname === "google.com";

        if (isGoogleRedirect) {
          const redirectUrl =
            parsed.searchParams.get("imgurl") ||
            parsed.searchParams.get("url") ||
            parsed.searchParams.get("q");
          if (redirectUrl) {
            url = redirectUrl;
          }
        }
      } catch (parseErr) {
        console.warn("[DownloadArchiver] Failed to parse URL:", parseErr);
      }
    }

    if (!url) {
      throw new Error("No URL found for upload");
    }

    // Show initial notification
    const notificationId = `upload-${Date.now()}`;
    chrome.notifications.create(notificationId, {
      type: "basic",
      iconUrl: chrome.runtime.getURL("icons/48.png"),
      title: "DownloadArchiver",
      message: "Starting upload to Storacha Space...",
    });

    await uploadFromUrl(url, notificationId);
  } catch (err) {
    console.error("[DownloadArchiver] Context menu upload error:", err);
    chrome.notifications.create({
      type: "basic",
      iconUrl: chrome.runtime.getURL("icons/48.png"),
      title: "DownloadArchiver - Error",
      message: `Upload failed: ${err.message}`,
    });
  }
});

// Function to upload content from URL
async function uploadFromUrl(url, notificationId) {
  try {
    console.log("[DownloadArchiver] Fetching:", url);

    let response;
    let blob;

    // Try multiple approaches to fetch the content
    try {
      // First attempt: Standard fetch with browser-like headers
      response = await fetch(url, {
        method: "GET",
        headers: {
          Accept: "image/*,*/*;q=0.8",
          "Accept-Language": "en-US,en;q=0.5",
          "Accept-Encoding": "gzip, deflate, br",
          "User-Agent":
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          Referer: new URL(url).origin,
          "Sec-Fetch-Dest": "image",
          "Sec-Fetch-Mode": "cors",
          "Sec-Fetch-Site": "cross-site",
        },
        mode: "cors",
        credentials: "omit",
        cache: "no-cache",
      });
    } catch (corsError) {
      console.log(
        "[DownloadArchiver] CORS failed, trying no-cors mode:",
        corsError.message
      );

      // Second attempt: no-cors mode (limited but sometimes works)
      response = await fetch(url, {
        method: "GET",
        mode: "no-cors",
        credentials: "omit",
        cache: "no-cache",
      });
    }

    if (!response.ok && response.status !== 0) {
      // status 0 is expected in no-cors mode
      throw new Error(
        `Failed to fetch: ${response.status} ${response.statusText}`
      );
    }

    blob = await response.blob();

    // Validate that we actually got file content
    const contentType =
      response.headers.get("content-type") ||
      blob.type ||
      "application/octet-stream";
    console.log(
      "[DownloadArchiver] Content-Type:",
      contentType,
      "Blob size:",
      blob.size
    );

    // Check for common issues
    if (blob.size === 0) {
      throw new Error(
        "Received empty file. The server may be blocking direct access to this resource."
      );
    }

    if (blob.size < 100 && contentType.includes("text/html")) {
      const text = await blob.text();
      if (
        text.includes("<html") ||
        text.includes("<!DOCTYPE") ||
        text.includes("Access Denied") ||
        text.includes("Forbidden")
      ) {
        throw new Error(
          "Server returned an error page instead of the file. This resource may be protected against hotlinking."
        );
      }
    }

    // For very small files that might be error responses, do additional validation
    if (blob.size < 1000) {
      try {
        const text = await blob.slice(0, 500).text();
        if (
          text.includes("error") ||
          text.includes("denied") ||
          text.includes("forbidden") ||
          text.includes("not found") ||
          text.includes("unauthorized")
        ) {
          throw new Error(
            "Server returned an error response instead of the file content."
          );
        }
      } catch (textError) {
        // If we can't read as text, it's probably binary data (good)
        console.log("[DownloadArchiver] File appears to be binary data (good)");
      }
    }

    // Extract filename from URL or use generic name
    let filename =
      url.split("/").pop().split("?")[0].split("#")[0] || "downloaded-file";

    // Clean up filename and ensure it has an extension
    filename = filename.replace(/[^a-zA-Z0-9.-]/g, "_").replace(/_{2,}/g, "_");
    if (
      !filename.includes(".") ||
      filename.endsWith(".") ||
      filename.length < 3
    ) {
      // Add extension based on content type or URL pattern
      const extension =
        getExtensionFromMimeType(contentType) || guessExtensionFromUrl(url);
      if (extension) {
        filename = (filename.replace(/\.$/, "") || "file") + `.${extension}`;
      } else {
        filename = "downloaded-file.bin"; // fallback
      }
    }

    // Ensure filename is reasonable
    if (filename.length > 100) {
      const ext = filename.split(".").pop();
      filename = filename.substring(0, 90) + "." + ext;
    }

    const file = new File([blob], filename, { type: contentType });
    const fileSizeMB = file.size / (1024 * 1024);

    console.log("[DownloadArchiver] File details:", {
      filename,
      size: `${fileSizeMB.toFixed(2)}MB`,
      type: contentType,
      blobSize: blob.size,
      url: url.substring(0, 100) + (url.length > 100 ? "..." : ""),
    });

    // Check rules before uploading
    const evaluation = ruleEngine.evaluateFile(
      filename,
      fileSizeMB,
      uploadRules
    );

    if (!evaluation.allowed) {
      throw new Error(`Upload blocked: ${evaluation.reason}`);
    }

    console.log(
      "[DownloadArchiver] Uploading:",
      filename,
      `(${fileSizeMB.toFixed(2)}MB)`
    );
    const cid = await client.uploadFile(file);

    console.log("[DownloadArchiver] Upload complete →", cid.toString());

    // Update notification with success
    chrome.notifications.update(notificationId, {
      title: "DownloadArchiver - Success!",
      message: `${filename} uploaded!\nCID: ${cid.toString()}`,
    });

    // Log the upload
    await logUpload({
      filename,
      cid: cid.toString(),
      url,
      size: fileSizeMB,
      timestamp: new Date().toISOString(),
      source: "context-menu",
    });
  } catch (err) {
    console.error("[DownloadArchiver] Upload error:", err);

    // Update notification with error
    chrome.notifications.update(notificationId, {
      title: "DownloadArchiver - Error",
      message: `Upload failed: ${err.message}`,
    });

    throw err;
  }
}

// Helper function to guess extension from URL patterns
function guessExtensionFromUrl(url) {
  const urlLower = url.toLowerCase();
  if (urlLower.includes(".jpg") || urlLower.includes("jpeg")) return "jpg";
  if (urlLower.includes(".png")) return "png";
  if (urlLower.includes(".gif")) return "gif";
  if (urlLower.includes(".webp")) return "webp";
  if (urlLower.includes(".svg")) return "svg";
  if (urlLower.includes(".mp4")) return "mp4";
  if (urlLower.includes(".webm")) return "webm";
  if (urlLower.includes(".mp3")) return "mp3";
  if (urlLower.includes(".wav")) return "wav";
  if (urlLower.includes(".pdf")) return "pdf";
  return null;
}

// Helper function to get file extension from MIME type
function getExtensionFromMimeType(mimeType) {
  const mimeToExt = {
    // Images
    "image/jpeg": "jpg",
    "image/jpg": "jpg",
    "image/png": "png",
    "image/gif": "gif",
    "image/webp": "webp",
    "image/svg+xml": "svg",
    "image/bmp": "bmp",
    "image/tiff": "tiff",
    // Videos
    "video/mp4": "mp4",
    "video/webm": "webm",
    "video/avi": "avi",
    "video/mov": "mov",
    "video/wmv": "wmv",
    "video/flv": "flv",
    // Audio
    "audio/mpeg": "mp3",
    "audio/mp3": "mp3",
    "audio/wav": "wav",
    "audio/ogg": "ogg",
    "audio/aac": "aac",
    "audio/flac": "flac",
    // Documents
    "application/pdf": "pdf",
    "text/plain": "txt",
    "text/html": "html",
    "application/json": "json",
    "application/xml": "xml",
    // Archives
    "application/zip": "zip",
    "application/x-rar-compressed": "rar",
    "application/x-7z-compressed": "7z",
  };

  return mimeToExt[mimeType?.toLowerCase()] || null;
}

// Function to log uploads for history
async function logUpload(uploadData) {
  try {
    const { uploadHistory = [] } = await chrome.storage.local.get([
      "uploadHistory",
    ]);

    // Keep only last 100 uploads
    const newHistory = [uploadData, ...uploadHistory].slice(0, 100);

    await chrome.storage.local.set({ uploadHistory: newHistory });
    console.log("[DownloadArchiver] Upload logged:", uploadData.filename);
  } catch (err) {
    console.error("[DownloadArchiver] Failed to log upload:", err);
  }
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

    const notificationId = `upload-${Date.now()}`;
    chrome.notifications.create(notificationId, {
      type: "basic",
      iconUrl: chrome.runtime.getURL("icons/48.png"),
      title: "DownloadArchiver",
      message: `Starting upload for ${item.filename}...`,
    });

    await uploadFromUrl(item.url, notificationId);
  } catch (err) {
    console.error("[DownloadArchiver] Error uploading download:", err);
  }
});
