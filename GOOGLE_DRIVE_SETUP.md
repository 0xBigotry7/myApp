# Google Drive Setup Guide

This guide will help you set up Google Drive integration for storing trip photos.

## Why Google Drive?

- **Your photos, your storage**: All photos are saved directly to YOUR personal Google Drive
- **Free & unlimited**: Use Google's free storage (15GB free, or unlimited with Google One)
- **Always accessible**: Access photos anytime via Google Drive, even outside the app
- **Automatically backed up**: Google handles backups and syncing across devices
- **You're in control**: Delete, share, or download photos anytime

## Setup Steps

### 1. Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click "Select a project" → "New Project"
3. Name it something like "Travel App" and click "Create"

### 2. Enable Google Drive API

1. In your project, go to "APIs & Services" → "Library"
2. Search for "Google Drive API"
3. Click on it and press "Enable"

### 3. Create OAuth 2.0 Credentials

1. Go to "APIs & Services" → "Credentials"
2. Click "Create Credentials" → "OAuth client ID"
3. If prompted, configure OAuth consent screen:
   - User Type: **External** (for personal use)
   - App name: "Travel App" (or any name)
   - User support email: Your email
   - Developer contact: Your email
   - Click "Save and Continue"
   - Scopes: Skip (click "Save and Continue")
   - Test users: Add your email and your wife's email
   - Click "Save and Continue"
4. Back to "Create OAuth client ID":
   - Application type: **Web application**
   - Name: "Travel App Web Client"
   - Authorized redirect URIs:
     - For development: `http://localhost:3002/api/auth/google-drive/callback`
     - For production: `https://my-app-psi-pink.vercel.app/api/auth/google-drive/callback`
   - Click "Create"
5. **Save the Client ID and Client Secret** - you'll need these!

### 4. Add Credentials to .env

Add these to your `.env` file (NOT `.env.example`):

```bash
GOOGLE_CLIENT_ID="your-actual-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your-actual-client-secret"
GOOGLE_REDIRECT_URI="http://localhost:3002/api/auth/google-drive/callback"
```

For production deployment on Vercel, add these environment variables:
```bash
GOOGLE_REDIRECT_URI="https://my-app-psi-pink.vercel.app/api/auth/google-drive/callback"
```

### 5. Connect Your Google Drive

1. Start the app: `npm run dev`
2. Log in to your account
3. Go to Settings (navigate to `/settings`)
4. Click "Connect Google Drive"
5. Sign in with your Google account
6. Grant permissions to the app
7. You'll be redirected back - you should see "Connected" status

### 6. Share with Your Wife

Once you've connected your Google Drive:
1. Both you and your wife should connect your own Google Drive accounts
2. Each person's photos will be saved to their own Drive
3. You can optionally create a shared Google Drive folder and move photos there later

## How It Works

1. **Upload Photos**: When you upload photos through the app, they're saved to a folder called "Travel App Photos" in your Google Drive
2. **Access Anytime**: You can access this folder anytime via [Google Drive](https://drive.google.com)
3. **View in App**: The app fetches photos from your Drive to display in the trip timeline
4. **Permanent Storage**: Photos stay in your Drive forever (unless you delete them)

## Troubleshooting

### "App isn't verified" Warning

If you see this warning when connecting:
1. Click "Advanced"
2. Click "Go to Travel App (unsafe)"
3. This happens because the app is in testing mode (which is fine for personal use)

### Can't Upload Photos

Make sure:
1. You've connected Google Drive in Settings
2. Your `.env` file has correct credentials
3. Google Drive API is enabled in Cloud Console

### Want to Share Photos with Your Wife

Option 1: **Shared Folder** (Recommended)
1. In Google Drive, create a shared folder
2. Move all trip photos to this folder
3. Share the folder with your wife's Google account
4. Both of you will see all photos

Option 2: **Each Upload to Own Drive**
- Each person uploads photos to their own Drive
- You'll see your photos, she'll see hers
- Still works great for the timeline!

## Security Notes

- OAuth tokens are stored securely in your database
- Photos are stored in YOUR Google Drive (not on our servers)
- You can revoke app access anytime via [Google Account Settings](https://myaccount.google.com/permissions)
- You can disconnect in Settings and reconnect anytime

## Cost

**FREE!** Google provides:
- 15 GB free storage with every Google account
- Google One plans available if you need more (100GB for $1.99/mo)
- High-quality photo storage via Google Photos (often free/unlimited)
