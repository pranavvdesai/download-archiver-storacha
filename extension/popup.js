// popup.js
document.getElementById('openOptions').addEventListener('click', () => {
  chrome.runtime.openOptionsPage();
});

(async () => {
  const { email, spaceDid } = await chrome.storage.local.get(['email', 'spaceDid']);
  const status = document.getElementById('status');

  if (!email) {
    status.innerHTML = `
      <div class="not-configured">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="margin-bottom: 12px">
          <path d="M12 4a8 8 0 1 0 0 16 8 8 0 0 0 0-16zM2 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10S2 17.523 2 12z" fill="currentColor"/>
          <path d="M12 14a1 1 0 0 1-1-1V7a1 1 0 1 1 2 0v6a1 1 0 0 1-1 1zm-1.5 2.5a1.5 1.5 0 1 1 3 0 1.5 1.5 0 0 1-3 0z" fill="currentColor"/>
        </svg>
        <div>Not configured yet</div>
        <div style="font-size: 12px; margin-top: 4px">Click Configure Settings to get started</div>
      </div>
    `;
  } else {
    status.innerHTML = `
      <div class="status-label">Account</div>
      <div class="status-value">${email}</div>
      ${spaceDid ? `
        <div class="status-label" style="margin-top: 12px">Space</div>
        <div class="status-value">${spaceDid}</div>
      ` : `
        <div class="status-label" style="margin-top: 12px">Space</div>
        <div class="status-value" style="color: #868e96">Pending configuration...</div>
      `}
    `;
  }
})();
