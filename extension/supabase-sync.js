/**
 * Sync upload to Supabase
 * @param {Object} uploadData - Upload data to sync
 * @param {string} uploadData.filename - File name
 * @param {string} uploadData.cid - Content ID
 * @param {string} uploadData.url - Original URL (optional)
 * @param {number} uploadData.size - File size in MB
 * @param {string} uploadData.timestamp - ISO timestamp
 * @param {string} uploadData.source - 'download' or 'context-menu'
 */
export async function syncUploadToSupabase(uploadData) {
  try {
    const { email, spaceDid, supabaseUrl, supabaseKey } = await chrome.storage.local.get([
      'email',
      'spaceDid',
      'supabaseUrl',
      'supabaseKey'
    ]);
    
    if (!email) {
      console.warn('[SupabaseSync] No email found, skipping sync');
      return;
    }

    if (!supabaseUrl || !supabaseKey) {
      console.log('[SupabaseSync] Supabase not configured, skipping sync');
      return;
    }

    const payload = {
      user_email: email,
      space_id: spaceDid || null,
      filename: uploadData.filename,
      cid: uploadData.cid,
      url: uploadData.url || null,
      size_mb: uploadData.size,
      source: uploadData.source,
      timestamp: uploadData.timestamp,
      metadata: {}
    };

    const response = await fetch(`${supabaseUrl}/rest/v1/upload_history`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Supabase sync failed: ${response.status} ${error}`);
    }

    console.log('[SupabaseSync] Upload synced successfully:', uploadData.filename);
  } catch (err) {
    console.error('[SupabaseSync] Failed to sync upload:', err);
  }
}
