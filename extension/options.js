(async () => {
  const emailInput   = document.getElementById('email');
  const saveBtn      = document.getElementById('save');
  const statusDiv    = document.getElementById('status');
  const typesInput   = document.getElementById('types');
  const sizeInput    = document.getElementById('maxSize');
  const foldersInput = document.getElementById('folders');

  const stored = await chrome.storage.local.get(['email','spaceDid','rules']);
  if (stored.email) emailInput.value = stored.email;
  const rules = stored.rules || { types: [], maxSize: '', folders: [] };
  typesInput.value   = rules.types.join(',');
  sizeInput.value    = rules.maxSize === Infinity ? '' : rules.maxSize;
  foldersInput.value = rules.folders.join(',');

  saveBtn.addEventListener('click', () => {
    const email = emailInput.value.trim();
    if (!email.includes('@')) {
      statusDiv.textContent = 'Please enter a valid email.';
      return;
    }

    const types   = typesInput.value.split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
    const maxSize = parseFloat(sizeInput.value) || Infinity; // MB
    const folders = foldersInput.value.split(',').map(s => s.trim()).filter(Boolean);

    chrome.storage.local.set({ rules: { types, maxSize, folders } });

    chrome.runtime.sendMessage(
      { type: 'CONFIG', email, spaceDid: stored.spaceDid || null },
      resp => {
        if (resp?.ok) {
          chrome.storage.local.set({ email, spaceDid: resp.spaceDid });
          statusDiv.textContent = 'Configuration & rules saved!';
        } else {
          statusDiv.textContent = 'Failed to configure: ' + (resp.error || 'unknown');
          console.error('CONFIG error:', resp.error);
        }
      }
    );
  });
})();
