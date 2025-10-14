import { supabase } from '../lib/supabase';
import type { Database } from '../types/database';

type Tables = Database['public']['Tables'];
type UserRow = Tables['users']['Row'];
type UserInsert = Tables['users']['Insert'];
type UserUpdate = Tables['users']['Update'];
type UserSettingsRow = Tables['user_settings']['Row'];
type UserSettingsInsert = Tables['user_settings']['Insert'];
type UserSettingsUpdate = Tables['user_settings']['Update'];
type SpaceRow = Tables['spaces']['Row'];
type SpaceInsert = Tables['spaces']['Insert'];
type FileRow = Tables['files']['Row'];
type FileInsert = Tables['files']['Insert'];
type FileUpdate = Tables['files']['Update'];
type FileTagRow = Tables['file_tags']['Row'];
type FileTagInsert = Tables['file_tags']['Insert'];
type EventInsert = Tables['events']['Insert'];
type SessionInsert = Tables['sessions']['Insert'];

export const userService = {
  /**
   * Create or update a user (upsert)
   */
  async upsertUser(user: UserInsert): Promise<UserRow> {
    const { data, error } = await supabase
      .from('users')
      .upsert(user)
      .select()
      .single();

    if (error) throw new Error(`Failed to upsert user: ${error.message}`);
    if (!data) throw new Error('No data returned from upsert');
    return data as UserRow;
  },

  /**
   * Get user by email
   */
  async getUserByEmail(email: string): Promise<UserRow | null> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = not found
      throw new Error(`Failed to get user: ${error.message}`);
    }
    return data as UserRow | null;
  },

  /**
   * Update user's last login timestamp
   */
  async updateLastLogin(email: string): Promise<void> {
    const { error } = await supabase
      .from('users')
      .update({ last_login_at: new Date().toISOString() })
      .eq('email', email);

    if (error) throw new Error(`Failed to update last login: ${error.message}`);
  },

  /**
   * Update user profile
   */
  async updateUser(email: string, updates: UserUpdate): Promise<UserRow> {
    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('email', email)
      .select()
      .single();

    if (error) throw new Error(`Failed to update user: ${error.message}`);
    if (!data) throw new Error('No data returned from update');
    return data as UserRow;
  },

  /**
   * Delete user
   */
  async deleteUser(email: string): Promise<void> {
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('email', email);

    if (error) throw new Error(`Failed to delete user: ${error.message}`);
  },
};


export const userSettingsService = {
  /**
   * Get user settings
   */
  async getUserSettings(email: string): Promise<UserSettingsRow | null> {
    const { data, error } = await supabase
      .from('user_settings')
      .select('*')
      .eq('email', email)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw new Error(`Failed to get user settings: ${error.message}`);
    }
    return data as UserSettingsRow | null;
  },

  /**
   * Create default user settings
   */
  async createUserSettings(settings: UserSettingsInsert): Promise<UserSettingsRow> {
    const { data, error } = await supabase
      .from('user_settings')
      .insert(settings)
      .select()
      .single();

    if (error) throw new Error(`Failed to create user settings: ${error.message}`);
    if (!data) throw new Error('No data returned from insert');
    return data as UserSettingsRow;
  },

  /**
   * Update user settings
   */
  async updateUserSettings(email: string, updates: UserSettingsUpdate): Promise<UserSettingsRow> {
    const { data, error } = await supabase
      .from('user_settings')
      .update(updates)
      .eq('email', email)
      .select()
      .single();

    if (error) throw new Error(`Failed to update user settings: ${error.message}`);
    if (!data) throw new Error('No data returned from update');
    return data as UserSettingsRow;
  },

  /**
   * Get or create user settings (ensures settings always exist)
   */
  async getOrCreateUserSettings(email: string): Promise<UserSettingsRow> {
    let settings = await userSettingsService.getUserSettings(email);

    if (!settings) {
      settings = await userSettingsService.createUserSettings({ email });
    }

    return settings;
  },
};


export const spaceService = {
  /**
   * Create a new space
   */
  async createSpace(space: SpaceInsert): Promise<SpaceRow> {
    const { data, error } = await supabase
      .from('spaces')
      .insert(space)
      .select()
      .single();

    if (error) throw new Error(`Failed to create space: ${error.message}`);
    if (!data) throw new Error('No data returned from insert');
    return data as SpaceRow;
  },

  /**
   * Get space by ID
   */
  async getSpaceById(spaceId: string): Promise<SpaceRow | null> {
    const { data, error } = await supabase
      .from('spaces')
      .select('*')
      .eq('space_id', spaceId)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw new Error(`Failed to get space: ${error.message}`);
    }
    return data as SpaceRow | null;
  },

  /**
   * Get all spaces for a user (as owner or member)
   */
  async getUserSpaces(userEmail: string): Promise<SpaceRow[]> {
    const { data, error } = await supabase
      .from('spaces')
      .select(`
        *,
        space_members!inner(user_email)
      `)
      .or(`owner_email.eq.${userEmail},space_members.user_email.eq.${userEmail}`);

    if (error) throw new Error(`Failed to get user spaces: ${error.message}`);
    return (data as SpaceRow[]) || [];
  },

  /**
   * Upsert a space (create or update)
   */
  async upsertSpace(space: SpaceInsert): Promise<SpaceRow> {
    const { data, error } = await supabase
      .from('spaces')
      .upsert(space)
      .select()
      .single();

    if (error) throw new Error(`Failed to upsert space: ${error.message}`);
    if (!data) throw new Error('No data returned from upsert');
    return data as SpaceRow;
  },
};


export const fileService = {
  /**
   * Create a new file record
   */
  async createFile(file: FileInsert): Promise<FileRow> {
    const { data, error } = await supabase
      .from('files')
      .insert(file)
      .select()
      .single();

    if (error) throw new Error(`Failed to create file: ${error.message}`);
    if (!data) throw new Error('No data returned from insert');
    return data as FileRow;
  },

  /**
   * Get file by CID
   */
  async getFileByCid(cid: string): Promise<FileRow | null> {
    const { data, error } = await supabase
      .from('files')
      .select('*')
      .eq('cid', cid)
      .is('deleted_at', null)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw new Error(`Failed to get file: ${error.message}`);
    }
    return data as FileRow | null;
  },

  /**
   * Get all files in a space
   */
  async getFilesBySpace(spaceId: string): Promise<FileRow[]> {
    const { data, error } = await supabase
      .from('files')
      .select('*')
      .eq('space_id', spaceId)
      .is('deleted_at', null)
      .order('uploaded_at', { ascending: false });

    if (error) throw new Error(`Failed to get files: ${error.message}`);
    return (data as FileRow[]) || [];
  },

  /**
   * Get files uploaded by a user
   */
  async getFilesByUser(userEmail: string): Promise<FileRow[]> {
    const { data, error } = await supabase
      .from('files')
      .select('*')
      .eq('uploader_email', userEmail)
      .is('deleted_at', null)
      .order('uploaded_at', { ascending: false });

    if (error) throw new Error(`Failed to get user files: ${error.message}`);
    return (data as FileRow[]) || [];
  },

  /**
   * Update file metadata
   */
  async updateFile(cid: string, updates: FileUpdate): Promise<FileRow> {
    const { data, error } = await supabase
      .from('files')
      .update(updates)
      .eq('cid', cid)
      .select()
      .single();

    if (error) throw new Error(`Failed to update file: ${error.message}`);
    if (!data) throw new Error('No data returned from update');
    return data as FileRow;
  },

  /**
   * Soft delete a file
   */
  async deleteFile(cid: string): Promise<void> {
    const { error } = await supabase
      .from('files')
      .update({ deleted_at: new Date().toISOString() })
      .eq('cid', cid);

    if (error) throw new Error(`Failed to delete file: ${error.message}`);
  },

  /**
   * Increment download count
   */
  async incrementDownloadCount(cid: string): Promise<void> {
    const { error } = await supabase.rpc('increment_download_count', {
      file_cid_param: cid
    } as any);

    if (error) {
      // Fallback if RPC doesn't work
      const file = await fileService.getFileByCid(cid);
      if (file) {
        await fileService.updateFile(cid, {
          download_count: (file.download_count || 0) + 1
        });
      }
    }
  },

  /**
   * Search files by OCR text
   */
  async searchFilesByText(searchQuery: string, spaceId?: string): Promise<FileRow[]> {
    let query = supabase
      .from('files')
      .select('*')
      .textSearch('ocr_text', searchQuery, {
        type: 'websearch',
        config: 'english'
      })
      .is('deleted_at', null);

    if (spaceId) {
      query = query.eq('space_id', spaceId);
    }

    const { data, error } = await query.order('uploaded_at', { ascending: false });

    if (error) throw new Error(`Failed to search files: ${error.message}`);
    return (data as FileRow[]) || [];
  },

  /**
   * Update OCR status and text
   */
  async updateOcrData(cid: string, ocrData: {
    ocr_status: string;
    ocr_text?: string;
    text_extraction_method?: string;
    processing_started_at?: string;
    processing_completed_at?: string;
  }): Promise<FileRow> {
    return fileService.updateFile(cid, ocrData);
  },
};


export const fileTagService = {
  /**
   * Add a tag to a file
   */
  async addTag(tag: FileTagInsert): Promise<FileTagRow> {
    const { data, error } = await supabase
      .from('file_tags')
      .insert(tag)
      .select()
      .single();

    if (error) {
      // Tag might already exist
      if (error.code === '23505') { // unique violation
        const existing = await fileTagService.getFileTag(tag.file_cid, tag.tag);
        if (existing) return existing;
      }
      throw new Error(`Failed to add tag: ${error.message}`);
    }
    if (!data) throw new Error('No data returned from insert');
    return data as FileTagRow;
  },

  /**
   * Get a specific tag for a file
   */
  async getFileTag(fileCid: string, tag: string): Promise<FileTagRow | null> {
    const { data, error } = await supabase
      .from('file_tags')
      .select('*')
      .eq('file_cid', fileCid)
      .eq('tag', tag)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw new Error(`Failed to get file tag: ${error.message}`);
    }
    return data as FileTagRow | null;
  },

  /**
   * Get all tags for a file
   */
  async getFileTags(fileCid: string): Promise<FileTagRow[]> {
    const { data, error } = await supabase
      .from('file_tags')
      .select('*')
      .eq('file_cid', fileCid)
      .order('added_at', { ascending: false });

    if (error) throw new Error(`Failed to get file tags: ${error.message}`);
    return (data as FileTagRow[]) || [];
  },

  /**
   * Remove a tag from a file
   */
  async removeTag(fileCid: string, tag: string): Promise<void> {
    const { error } = await supabase
      .from('file_tags')
      .delete()
      .eq('file_cid', fileCid)
      .eq('tag', tag);

    if (error) throw new Error(`Failed to remove tag: ${error.message}`);
  },

  /**
   * Get all unique tags in a space
   */
  async getSpaceTags(spaceId: string): Promise<string[]> {
    const { data, error } = await supabase
      .from('file_tags')
      .select('tag, files!inner(space_id)')
      .eq('files.space_id', spaceId);

    if (error) throw new Error(`Failed to get space tags: ${error.message}`);

    // Extract unique tags
    const uniqueTags = [...new Set((data as Array<{ tag: string }>)?.map(item => item.tag) || [])];
    return uniqueTags;
  },
};


export const eventService = {
  /**
   * Log an event
   */
  async logEvent(event: EventInsert): Promise<void> {
    const { error } = await supabase
      .from('events')
      .insert(event);

    if (error) {
      console.error('Failed to log event:', error);
      // Don't throw - event logging should not break the app
    }
  },

  /**
   * Get events for a user
   */
  async getUserEvents(userEmail: string, limit = 50) {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('user_email', userEmail)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw new Error(`Failed to get user events: ${error.message}`);
    return (data as Tables['events']['Row'][]) || [];
  },

  /**
   * Get events for a file
   */
  async getFileEvents(fileCid: string, limit = 50) {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('file_cid', fileCid)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw new Error(`Failed to get file events: ${error.message}`);
    return (data as Tables['events']['Row'][]) || [];
  },
};


export const sessionService = {
  /**
   * Create a new session
   */
  async createSession(session: SessionInsert): Promise<Tables['sessions']['Row']> {
    const { data, error } = await supabase
      .from('sessions')
      .insert(session)
      .select()
      .single();

    if (error) throw new Error(`Failed to create session: ${error.message}`);
    if (!data) throw new Error('No data returned from insert');
    return data as Tables['sessions']['Row'];
  },

  /**
   * Update session activity
   */
  async updateSessionActivity(sessionId: string) {
    const { error } = await supabase
      .from('sessions')
      .update({ last_activity_at: new Date().toISOString() })
      .eq('session_id', sessionId);

    if (error) throw new Error(`Failed to update session: ${error.message}`);
  },

  /**
   * Invalidate a session
   */
  async invalidateSession(sessionId: string) {
    const { error } = await supabase
      .from('sessions')
      .update({ is_valid: false })
      .eq('session_id', sessionId);

    if (error) throw new Error(`Failed to invalidate session: ${error.message}`);
  },

  /**
   * Get active sessions for a user
   */
  async getUserActiveSessions(userEmail: string) {
    const { data, error } = await supabase
      .from('sessions')
      .select('*')
      .eq('user_email', userEmail)
      .eq('is_valid', true)
      .gt('expires_at', new Date().toISOString())
      .order('last_activity_at', { ascending: false });

    if (error) throw new Error(`Failed to get user sessions: ${error.message}`);
    return (data as Tables['sessions']['Row'][]) || [];
  },
};


export function getFileKind(mimeType: string): string {
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.startsWith('video/')) return 'video';
  if (mimeType.startsWith('audio/')) return 'audio';
  if (mimeType.includes('pdf') || mimeType.includes('document') || mimeType.includes('text')) {
    return 'document';
  }
  if (mimeType.includes('zip') || mimeType.includes('tar') || mimeType.includes('rar') || mimeType.includes('7z')) {
    return 'archive';
  }
  return 'other';
}
