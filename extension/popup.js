// popup.js
document.getElementById("openOptions").addEventListener("click", () => {
  chrome.runtime.openOptionsPage();
});

document.getElementById("clearHistory").addEventListener("click", async () => {
  await chrome.storage.local.set({ uploadHistory: [] });
  loadUploadHistory();
});

function formatFileSize(sizeMB) {
  if (sizeMB < 1) {
    return `${(sizeMB * 1024).toFixed(1)} KB`;
  }
  return `${sizeMB.toFixed(1)} MB`;
}

function formatTimestamp(timestamp) {
  const date = new Date(timestamp);
  return date.toLocaleString();
}

async function loadUploadHistory() {
  const { uploadHistory = [] } = await chrome.storage.local.get([
    "uploadHistory",
  ]);
  const historyDiv = document.getElementById("uploadHistory");

  if (uploadHistory.length === 0) {
    historyDiv.innerHTML = '<div class="no-history">No uploads yet</div>';
    return;
  }

  historyDiv.innerHTML = uploadHistory
    .slice(0, 10)
    .map(
      (upload) => `
    <div class="upload-item">
      <div class="upload-filename">${upload.filename}</div>
      <div class="upload-cid">CID: ${upload.cid}</div>
      <div class="upload-meta">
        ${formatFileSize(upload.size)} • ${formatTimestamp(
        upload.timestamp
      )} • ${upload.source}
      </div>
    </div>
  `
    )
    .join("");
}

(async () => {
  const { email, spaceDid } = await chrome.storage.local.get([
    "email",
    "spaceDid",
  ]);
  const status = document.getElementById("status");
  if (!email) {
    status.textContent = "Not configured yet.";
  } else {
    status.textContent = `User: ${email}\nSpace: ${spaceDid || "pending…"}`;
  }

  // Load upload history
  await loadUploadHistory();
})();
