# Database Setup Guide for Contributors

This guide will help you set up your own Supabase PostgreSQL database for the Download Archiver Storacha application.

## Quick Start

1. [Create Supabase project](#step-1-create-a-supabase-project) 
2. [Configure environment variables](#step-2-configure-environment-variables) 
3. [Run database schema](#step-3-run-database-schema) 
4. [Test the connection](#step-4-test-the-connection) 

---

## Prerequisites

- A GitHub account (for signing into Supabase)
- Node.js and npm installed
- This repository cloned locally

---

## Step 1: Create a Supabase Project

### 1.1 Sign up for Supabase

1. Go to [https://supabase.com](https://supabase.com)
2. Click **"Start your project"** or **"Sign In"**
3. Sign in with your GitHub account (recommended) or email

### 1.2 Create a New Project

1. Click **"New Project"** on the dashboard
2. Fill in the project details:
   - **Name**: `download-archiver` (or any name you prefer)
   - **Database Password**: Choose a password
   - **Region**: Select the region closest to you
3. Click **"Create new project"**
4. Wait 2-3 minutes for Supabase to provision your database

### 1.3 Get Your API Credentials

Once your project is ready:

1. Go to **Settings**
2. Click on **API** in the settings menu
3. You'll see two values:
   - **Project URL** (looks like: `https://xxxxxxxxxxxxx.supabase.co`)
   - **anon public** key (under "Project API keys")

**Keep these values handy** - you'll need them in the next step!

---

## Step 2: Configure Environment Variables

### 2.1 Create `.env` File

In the `webapp/` directory, create a file named `.env` (if it doesn't exist):

```bash
cd webapp
touch .env
```

### 2.2 Add Your Supabase Credentials

Open `webapp/.env` and add the following (replace with your actual values from Step 1.3):

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

**Example:**
```env
VITE_SUPABASE_URL=https://abcdefghijklmnop.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprbG1ub3AiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTYzMDAwMDAwMCwiZXhwIjoxOTQ1NTc2MDAwfQ.xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

> **Note**: The `.env` file is already in `.gitignore`, so your credentials won't be committed to git.

### 2.3 Verify Configuration

The file [webapp/src/lib/supabase.ts](webapp/src/lib/supabase.ts) is already configured to read these environment variables:

```typescript
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
```

---

## Step 3: Run Database Schema

### 3.1 Open Supabase SQL Editor

1. Go to your Supabase project dashboard
2. Click **"SQL Editor"** in the left sidebar
3. Click **"New Query"** button

### 3.2 Execute the Schema

1. Open the file [webapp/supabase-schema.sql](webapp/supabase-schema.sql) in your code editor
2. Copy the **entire contents** of the file (Ctrl+A, Ctrl+C)
3. Paste it into the Supabase SQL Editor
4. Click **"Run"** (or press `Ctrl+Enter` / `Cmd+Enter`)

### 3.3 Verify Success

You should see a success message like:
```
Success. No rows returned
```

If you see any errors, check the [Troubleshooting](#troubleshooting) section below.

### 3.4 Verify Tables Were Created

1. Go to **"Table Editor"** in the left sidebar
2. You should see these tables:
   - ✅ **users** - User account information
   - ✅ **user_settings** - User preferences
   - ✅ **spaces** - Storacha storage spaces
   - ✅ **space_members** - Space collaborators
   - ✅ **files** - File metadata and OCR data
   - ✅ **file_tags** - Tags associated with files
   - ✅ **events** - User activity audit log
   - ✅ **file_metrics_daily** - Daily analytics data
   - ✅ **sessions** - User session tracking

---

## Step 4: Test the Connection

### 4.1 Start the Development Server

```bash
cd webapp
npm install  # if you haven't already
npm run dev
```

### 4.2 Test Authentication & Database

1. Open the app in your browser (usually `http://localhost:5173`)
2. Log in with Storacha
3. Open the browser console (F12) and look for database-related logs
4. Check your Supabase dashboard → **Table Editor** → **users** table
5. You should see your user record created!

---

## Database Schema Overview

### Core Tables

| Table | Purpose | Key Fields |
|-------|---------|------------|
| **users** | User accounts | `email` (PK), `name`, `avatar_url`, `default_space_id` |
| **user_settings** | User preferences | `email` (FK), `ocr_enabled`, `rulesets` |
| **spaces** | Storage spaces | `space_id` (PK), `name`, `owner_email` |
| **files** | File metadata | `cid` (PK), `name`, `size_bytes`, `ocr_text`, `uploader_email` |
| **file_tags** | File tags | `file_cid` (FK), `tag`, `added_by_email` |
| **events** | Activity log | `event_type`, `user_email`, `payload` |
| **sessions** | User sessions | `session_id` (PK), `user_email`, `expires_at` |
| **file_metrics_daily** | Daily stats | `file_cid` (FK), `date`, `downloads`, `views` |

### Relationships

```
users
  ├─→ user_settings (1:1)
  ├─→ spaces (1:many, as owner)
  ├─→ files (1:many, as uploader)
  ├─→ sessions (1:many)
  └─→ events (1:many)

spaces
  ├─→ files (1:many)
  └─→ space_members (1:many)

files
  ├─→ file_tags (1:many)
  └─→ file_metrics_daily (1:many)
```

---

## Features Enabled by Database

### ✅ Currently Implemented
- User profile persistence
- File metadata storage
- Tag management with database sync
- OCR text storage and tracking
- Session management
- Event logging for analytics

### 🚧 Ready to Implement (Future)
- Full-text search on OCR content (`to_tsvector` already indexed!)
- Advanced analytics dashboard
- User activity timeline
- File sharing with permissions
- Collaborative spaces with multiple members
- Download/bandwidth tracking
- Data export functionality

---

## Useful Database Queries

### Get All Files for Current User
```sql
SELECT f.*, array_agg(ft.tag) as tags
FROM files f
LEFT JOIN file_tags ft ON f.cid = ft.file_cid
WHERE f.uploader_email = 'your-email@example.com'
  AND f.deleted_at IS NULL
GROUP BY f.cid
ORDER BY f.uploaded_at DESC;
```

### Search Files by OCR Text
```sql
SELECT *
FROM files
WHERE to_tsvector('english', ocr_text) @@ websearch_to_tsquery('english', 'search term')
  AND deleted_at IS NULL;
```

### Get User Storage Statistics
```sql
SELECT
  COUNT(*) as total_files,
  pg_size_pretty(SUM(size_bytes)::bigint) as total_storage,
  SUM(download_count) as total_downloads
FROM files
WHERE uploader_email = 'your-email@example.com'
  AND deleted_at IS NULL;
```

### Recent Activity
```sql
SELECT *
FROM events
WHERE user_email = 'your-email@example.com'
ORDER BY created_at DESC
LIMIT 20;
```

---

## Troubleshooting

### Issue: "Cannot find module '@supabase/supabase-js'"

**Solution:**
```bash
cd webapp
npm install @supabase/supabase-js
```

### Issue: "Invalid API key" or "Failed to connect to database"

**Solution:**
1. Check that `.env` file exists in `webapp/` directory
2. Verify the environment variables are correct (no extra spaces)
3. Restart your dev server (`npm run dev`)
4. Check Supabase project status: [https://status.supabase.com](https://status.supabase.com)

### Issue: SQL Schema Errors

**Common causes:**
- **"relation already exists"**: Tables are already created (safe to ignore, or drop tables first)
- **"permission denied"**: Make sure you're using the SQL Editor in Supabase dashboard, not a local client
- **Syntax error**: Make sure you copied the entire `supabase-schema.sql` file

**Solution:** Try running this first to drop all tables:
```sql
DROP TABLE IF EXISTS file_metrics_daily CASCADE;
DROP TABLE IF EXISTS events CASCADE;
DROP TABLE IF EXISTS file_tags CASCADE;
DROP TABLE IF EXISTS files CASCADE;
DROP TABLE IF EXISTS space_members CASCADE;
DROP TABLE IF EXISTS spaces CASCADE;
DROP TABLE IF EXISTS sessions CASCADE;
DROP TABLE IF EXISTS user_settings CASCADE;
DROP TABLE IF EXISTS users CASCADE;
```
Then run the schema again.

### Issue: "Failed to insert file" or "User not found"

**Solution:**
1. Make sure you've logged in at least once (this creates your user record)
2. Check the `users` table in Supabase dashboard - your email should be there
3. Check browser console for detailed error messages
4. Look at Supabase logs: Dashboard → Logs → Database

### Issue: Environment Variables Not Loading

**Solution:**
1. Make sure your `.env` file is in the `webapp/` directory (NOT the root)
2. Variable names must start with `VITE_` to be accessible in the browser
3. Restart the dev server after changing `.env`
4. Check in browser console:
   ```javascript
   console.log(import.meta.env.VITE_SUPABASE_URL);
   ```

---

## Next Steps

- ✅ Complete database setup (Steps 1-4 above)
- 🔄 Start the app and login to create your user
- 🔄 Upload some files to test database sync
- 🔄 Add tags to files and verify in Supabase dashboard
- 🔄 Check the `events` table to see activity logs
- 🔄 Explore the database schema in Table Editor

---

## Resources & Support

- **Supabase Documentation**: [https://supabase.com/docs](https://supabase.com/docs)
- **PostgreSQL Docs**: [https://www.postgresql.org/docs/](https://www.postgresql.org/docs/)
- **Supabase Discord**: [https://discord.supabase.com](https://discord.supabase.com)
- **Project Issues**: [GitHub Issues](../../issues)

---