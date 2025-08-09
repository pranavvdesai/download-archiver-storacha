// popup.js
document.getElementById('openOptions').addEventListener('click', () => {
  chrome.runtime.openOptionsPage();
});

(async () => {
  const { email, spaceDid } = await chrome.storage.local.get(['email','spaceDid']);
  const status = document.getElementById('status');
  if (!email) {
    status.textContent = 'Not configured yet.';
  } else {
    status.textContent = `User: ${email}\nSpace: ${spaceDid || 'pending…'}`;
  }
})();
