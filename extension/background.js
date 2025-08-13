self.process = { env: {} };

import { create } from "@web3-storage/w3up-client";
import * as DID from "@ipld/dag-ucan/did";
import * as Delegation from "@ucanto/core/delegation";

let client;
let spaceDid;

// Rule Engine v2 - Same implementation as in options.js
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

  evaluateFile(filePath, fileSizeMB, rules) {
    const extension = this.getExtension(filePath);
    const mimeType = this.getMimeType(extension);

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
    };
  }
}

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
});

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === "CONFIG") {
    initClient(msg.email, msg.spaceDid)
      .then((did) => sendResponse({ ok: true, spaceDid: did }))
      .catch((err) => {
        console.error("CONFIG initClient failed:", err);
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

async function ensureClientReady() {
  const stored = await chrome.storage.local.get(["email", "spaceDid"]);
  const { email, spaceDid: storedDid } = stored;

  if (!email) throw new Error("Not configured");

  if (!client || !client.currentSpace()) {
    console.log("[DownloadArchiver] ensureClientReady: re-initializing");
    await initClient(email, storedDid || null);
  }
}

chrome.downloads.onChanged.addListener(async (delta) => {
  console.log("[DownloadArchiver] download.onChanged:", delta);

  if (delta.state?.current !== "complete") return;
  console.log("[DownloadArchiver] Download complete, id=", delta.id);

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

    chrome.notifications.create({
      type: "basic",
      iconUrl: chrome.runtime.getURL("icons/48.png"),
      title: "DownloadArchiver",
      message: `${item.filename} → https://${cid}.ipfs.w3s.link`,
    });
  } catch (err) {
    console.error("[DownloadArchiver] Error uploading download:", err);
  }
});
