# Video Content Manager Setup Guide

## Prerequisites

1. **Node.js** installed on your system
2. **Bunny.net account** with video library configured
3. **.env file** with your Bunny.net credentials

## Setup Steps

### 1. Install Dependencies

```bash
cd /Users/abhijithcs/personal/vegaPilot
npm install
```

### 2. Configure Environment Variables

Create a `.env` file in the project root with your Bunny.net credentials:

```env
BUNNY_API_KEY=your-api-key-here
BUNNY_LIBRARY_ID=your-library-id-here
BUNNY_CDN_HOSTNAME=your-cdn-hostname.b-cdn.net
PORT=3000
```

### 3. Start the Proxy Server

```bash
node bunny-proxy-server.js
```

You should see:

```
============================================================
🚀 Bunny.net Proxy Server Started!
============================================================
📡 Server running at: http://localhost:3000
📹 Video Library ID: your-library-id
🔗 CDN Hostname: your-cdn-hostname.b-cdn.net
🌐 Admin Portal: http://localhost:3000/bunny-admin.html
============================================================

✅ Ready to manage your Bunny.net videos!
```

### 4. Access Video Content Manager

Open your browser and go to:

```
http://localhost:3000/video-content.html
```

**⚠️ IMPORTANT**: Do NOT open the file directly (file:///...). You MUST access it through the proxy server (http://localhost:3000/...) for the API calls to work.

## Features

- **Upload Videos**: Upload videos to Bunny.net collections
- **Manage Collections**: View and organize your video collections
- **Edit Videos**: Update video metadata (title, classification levels)
- **Video Preview**: Watch videos with embedded Bunny.net player
- **Progress Tracking**: Real-time upload progress indicator

## Troubleshooting

### CORS Errors

If you see CORS errors like:
```
Access to XMLHttpRequest at 'file:///api/bunny/folders' from origin 'null' has been blocked
```

**Solution**: You're opening the file directly. Access it through the proxy server at `http://localhost:3000/video-content.html`

### Missing Dependencies Errors

If you see errors about missing plugins (dropzone.css, dataTables, etc.):

**Solution**: These are non-critical. The video upload and management features will still work.

### API Connection Errors

If collections don't load:

1. Check that the proxy server is running
2. Verify your `.env` file has correct credentials
3. Check the terminal where the proxy server is running for error messages

## API Endpoints (via Proxy)

All API calls go through the proxy server:

- `GET /api/bunny/folders` - Get collections/folders
- `POST /api/bunny/upload` - Upload video
- `POST /api/bunny/folders` - Create new folder
- `GET /api/bunny/videos` - Get videos list

## Security

- API keys are stored server-side in `.env` file
- Never exposed to client-side code
- All Bunny.net API calls authenticated server-side
