self.process = { env: {} };

import { create } from "@web3-storage/w3up-client";
import * as DID from "@ipld/dag-ucan/did";
import * as Delegation from "@ucanto/core/delegation";

let client;
let spaceDid;

let uploadRules = { types: [], maxSize: Infinity, folders: [] };
chrome.storage.local.get("rules").then((r) => {
  if (r.rules) {
    uploadRules = r.rules;
    console.log("[DownloadArchiver] Initial rules:", uploadRules);
  }
});
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === "local" && changes.rules) {
    uploadRules = changes.rules.newValue;
    console.log("[DownloadArchiver] Rules updated:", uploadRules);
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

    const ext = item.filename.split(".").pop().toLowerCase();
    if (uploadRules.types.length && !uploadRules.types.includes(ext)) return;
    if (
      item.fileSize &&
      item.fileSize > uploadRules.maxSize * 1024 * 1024
    )
      return;
    if (
      uploadRules.folders.length &&
      !uploadRules.folders.some((f) => item.filename.includes(f))
    )
      return;

    const response = await fetch(item.url);
    const blob = await response.blob();
    const file = new File([blob], item.filename);

    console.log("[DownloadArchiver] Uploading:", item.filename);
    const cid = await client.uploadFile(file);
    console.log("[DownloadArchiver] Uploaded →", cid.toString());
    console.log('[DownloadArchiver] File uploaded →', `https://${cid}.ipfs.w3s.link`);

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
