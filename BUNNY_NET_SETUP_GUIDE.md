# Bunny.net Integration Setup Guide

## Required Information from Your Bunny.net Account

To connect the VegaPilot Video Management Portal to your actual Bunny.net account, you'll need the following credentials:

### 1. **API Key (Access Key)**
- **Where to find it**: Bunny.net Dashboard → Account → API
- **Format**: A long alphanumeric string (e.g., `a1b2c3d4-e5f6-7890-abcd-ef1234567890`)
- **Purpose**: Authenticates all API requests to Bunny.net

### 2. **Video Library ID**
- **Where to find it**: Bunny.net Dashboard → Stream → Video Libraries → Select your library
- **Format**: Numeric ID (e.g., `12345`)
- **Purpose**: Identifies which video library to manage

### 3. **Pull Zone / CDN Hostname** (Optional)
- **Where to find it**: Your Video Library settings
- **Format**: `vz-xxxxxx.b-cdn.net`
- **Purpose**: For streaming/playing videos

---

## Step-by-Step Setup Instructions

### Step 1: Get Your Bunny.net Credentials

1. **Login to Bunny.net**
   - Go to https://dash.bunny.net/
   - Login with your credentials

2. **Get API Key**
   - Click your profile (top right)
   - Go to **Account Settings**
   - Navigate to **API** section
   - Copy your **API Key** (also called Access Key)
   - ⚠️ **Keep this secret!** Never commit it to git or share publicly

3. **Get Video Library ID**
   - Go to **Stream** in the left sidebar
   - Click **Video Libraries**
   - Select your video library (or create one if you don't have one)
   - The Library ID is shown in the URL or library details
   - Example URL: `https://dash.bunny.net/stream/library/12345` → Library ID is `12345`

4. **Get CDN Hostname** (if needed for streaming)
   - In your video library settings
   - Look for "Pull Zone" or "CDN Hostname"
   - Copy the hostname (e.g., `vz-abc123.b-cdn.net`)

---

## Step 2: Create Backend API Proxy

You **must** create a backend server to proxy API calls. **Never** put credentials in frontend code!

### Option A: Node.js/Express Backend (Recommended)

**1. Install Dependencies**
```bash
npm install express axios dotenv cors multer
```

**2. Create `.env` file** (in your project root)
```bash
# Bunny.net Credentials
BUNNY_API_KEY=your-api-key-here
BUNNY_LIBRARY_ID=your-library-id-here
BUNNY_CDN_HOSTNAME=vz-xxxxxx.b-cdn.net

# Server Config
PORT=3000
```

**3. Create `bunny-proxy-server.js`**
```javascript
const express = require('express');
const axios = require('axios');
const cors = require('cors');
const multer = require('multer');
require('dotenv').config();

const app = express();
const upload = multer({ dest: 'uploads/' });

// Middleware
app.use(cors());
app.use(express.json());

// Bunny.net Configuration
const BUNNY_API_KEY = process.env.BUNNY_API_KEY;
const BUNNY_LIBRARY_ID = process.env.BUNNY_LIBRARY_ID;
const BUNNY_CDN_HOSTNAME = process.env.BUNNY_CDN_HOSTNAME;
const BUNNY_API_BASE = 'https://video.bunnycdn.com';

// ===== 1. Get Folders (Collections) =====
app.get('/api/bunny/folders', async (req, res) => {
  try {
    const response = await axios.get(
      `${BUNNY_API_BASE}/library/${BUNNY_LIBRARY_ID}/collections`,
      {
        headers: { 'AccessKey': BUNNY_API_KEY }
      }
    );

    // Transform Bunny.net response to match our format
    const folders = response.data.items.map(collection => ({
      id: collection.guid,
      name: collection.name,
      videoCount: collection.videoCount || 0
    }));

    res.json(folders);
  } catch (error) {
    console.error('Error fetching folders:', error.response?.data || error.message);
    res.status(500).json({ error: error.message });
  }
});

// ===== 2. Create Folder =====
app.post('/api/bunny/folders', async (req, res) => {
  const { name, description } = req.body;

  if (!name) {
    return res.status(400).json({ error: 'Folder name is required' });
  }

  try {
    const response = await axios.post(
      `${BUNNY_API_BASE}/library/${BUNNY_LIBRARY_ID}/collections`,
      {
        name: name,
        description: description || ''
      },
      {
        headers: {
          'AccessKey': BUNNY_API_KEY,
          'Content-Type': 'application/json'
        }
      }
    );

    res.json({
      folderId: response.data.guid,
      success: true
    });
  } catch (error) {
    console.error('Error creating folder:', error.response?.data || error.message);
    res.status(500).json({ error: error.message });
  }
});

// ===== 3. Get Videos =====
app.get('/api/bunny/videos', async (req, res) => {
  const { folderId } = req.query;

  try {
    const params = {};
    if (folderId) {
      params.collection = folderId;
    }

    const response = await axios.get(
      `${BUNNY_API_BASE}/library/${BUNNY_LIBRARY_ID}/videos`,
      {
        headers: { 'AccessKey': BUNNY_API_KEY },
        params: params
      }
    );

    // Transform Bunny.net response to match our format
    const videos = response.data.items.map(video => ({
      id: video.guid,
      name: video.title,
      folderId: video.collectionId,
      uploadDate: video.dateUploaded,
      duration: formatDuration(video.length),
      size: video.storageSize,
      thumbnail: video.thumbnailFileName
        ? `https://${BUNNY_CDN_HOSTNAME}/${video.guid}/${video.thumbnailFileName}`
        : null
    }));

    res.json(videos);
  } catch (error) {
    console.error('Error fetching videos:', error.response?.data || error.message);
    res.status(500).json({ error: error.message });
  }
});

// ===== 4. Upload Video =====
app.post('/api/bunny/upload', upload.single('file'), async (req, res) => {
  const { folderId } = req.body;
  const file = req.file;

  if (!file) {
    return res.status(400).json({ error: 'No file provided' });
  }

  try {
    // Step 1: Create video entry
    const createResponse = await axios.post(
      `${BUNNY_API_BASE}/library/${BUNNY_LIBRARY_ID}/videos`,
      {
        title: file.originalname.replace(/\.[^/.]+$/, ''),
        collectionId: folderId || ''
      },
      {
        headers: {
          'AccessKey': BUNNY_API_KEY,
          'Content-Type': 'application/json'
        }
      }
    );

    const videoId = createResponse.data.guid;

    // Step 2: Upload video file
    const fs = require('fs');
    const videoData = fs.readFileSync(file.path);

    await axios.put(
      `${BUNNY_API_BASE}/library/${BUNNY_LIBRARY_ID}/videos/${videoId}`,
      videoData,
      {
        headers: {
          'AccessKey': BUNNY_API_KEY,
          'Content-Type': 'application/octet-stream'
        }
      }
    );

    // Clean up uploaded file
    fs.unlinkSync(file.path);

    res.json({
      videoId: videoId,
      success: true
    });
  } catch (error) {
    console.error('Error uploading video:', error.response?.data || error.message);
    res.status(500).json({ error: error.message });
  }
});

// ===== 5. Rename Video =====
app.post('/api/bunny/rename', async (req, res) => {
  const { videoId, newName } = req.body;

  if (!videoId || !newName) {
    return res.status(400).json({ error: 'videoId and newName are required' });
  }

  try {
    await axios.post(
      `${BUNNY_API_BASE}/library/${BUNNY_LIBRARY_ID}/videos/${videoId}`,
      {
        title: newName
      },
      {
        headers: {
          'AccessKey': BUNNY_API_KEY,
          'Content-Type': 'application/json'
        }
      }
    );

    res.json({ success: true });
  } catch (error) {
    console.error('Error renaming video:', error.response?.data || error.message);
    res.status(500).json({ error: error.message });
  }
});

// ===== 6. Delete Video =====
app.post('/api/bunny/delete', async (req, res) => {
  const { videoId } = req.body;

  if (!videoId) {
    return res.status(400).json({ error: 'videoId is required' });
  }

  try {
    await axios.delete(
      `${BUNNY_API_BASE}/library/${BUNNY_LIBRARY_ID}/videos/${videoId}`,
      {
        headers: { 'AccessKey': BUNNY_API_KEY }
      }
    );

    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting video:', error.response?.data || error.message);
    res.status(500).json({ error: error.message });
  }
});

// ===== 7. Stream Video =====
app.get('/api/bunny/stream', async (req, res) => {
  const { id } = req.query;

  if (!id) {
    return res.status(400).json({ error: 'Video id is required' });
  }

  // Redirect to Bunny.net CDN URL
  const streamUrl = `https://${BUNNY_CDN_HOSTNAME}/${id}/playlist.m3u8`;
  res.redirect(streamUrl);
});

// ===== Helper Function =====
function formatDuration(seconds) {
  if (!seconds) return '0:00';

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

// Start Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Bunny.net Proxy Server running on port ${PORT}`);
  console.log(`📹 Video Library ID: ${BUNNY_LIBRARY_ID}`);
  console.log(`🔗 CDN Hostname: ${BUNNY_CDN_HOSTNAME}`);
});
```

**4. Run the server**
```bash
node bunny-proxy-server.js
```

You should see:
```
✅ Bunny.net Proxy Server running on port 3000
📹 Video Library ID: 12345
🔗 CDN Hostname: vz-xxxxxx.b-cdn.net
```

---

### Option B: PHP Backend

**Create `bunny-proxy.php`**
```php
<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, DELETE');
header('Access-Control-Allow-Headers: Content-Type');

// Configuration
$BUNNY_API_KEY = getenv('BUNNY_API_KEY');
$BUNNY_LIBRARY_ID = getenv('BUNNY_LIBRARY_ID');
$BUNNY_API_BASE = 'https://video.bunnycdn.com';

$request_uri = $_SERVER['REQUEST_URI'];
$method = $_SERVER['REQUEST_METHOD'];

// Route requests
if (strpos($request_uri, '/api/bunny/folders') !== false && $method === 'GET') {
    // Get folders
    $ch = curl_init("$BUNNY_API_BASE/library/$BUNNY_LIBRARY_ID/collections");
    curl_setopt($ch, CURLOPT_HTTPHEADER, ["AccessKey: $BUNNY_API_KEY"]);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    $response = curl_exec($ch);
    curl_close($ch);
    echo $response;
}
// Add more routes...
?>
```

---

## Step 3: Update Frontend Configuration

**No changes needed!** The frontend already uses `/api/bunny/*` endpoints. Just make sure your backend is running on the same domain or configure CORS properly.

If your backend is on a different domain:
```javascript
// In bunny-admin.js, change:
var API_BASE = '/api/bunny';

// To:
var API_BASE = 'http://localhost:3000/api/bunny';
```

---

## Step 4: Test the Connection

1. **Start your backend server**
   ```bash
   node bunny-proxy-server.js
   ```

2. **Open the admin portal**
   ```
   http://localhost/vegaPilot/bunny-admin.html
   ```

3. **Check if it loads your actual data**
   - You should see your real Bunny.net folders
   - Videos should load from your library
   - Try creating a new folder
   - Try uploading a video

---

## Security Checklist

✅ **DO:**
- Store credentials in `.env` file
- Add `.env` to `.gitignore`
- Use HTTPS in production
- Validate all user inputs on backend
- Implement rate limiting
- Add authentication to your admin portal

❌ **DON'T:**
- Put API keys in frontend code
- Commit `.env` to git
- Use HTTP in production
- Trust frontend validation alone

---

## Troubleshooting

### "CORS Error"
**Solution**: Add CORS headers in your backend
```javascript
app.use(cors({
  origin: 'http://localhost',
  credentials: true
}));
```

### "401 Unauthorized"
**Solution**: Check your API key is correct
- Verify it's copied correctly from Bunny.net dashboard
- Check for extra spaces or newlines
- Ensure it's in the `.env` file

### "Library not found"
**Solution**: Verify your Library ID
- Check the number matches your Bunny.net library
- Ensure you have access to that library

### Videos won't play
**Solution**: Check CDN hostname
- Ensure `BUNNY_CDN_HOSTNAME` is set correctly
- Videos need to be processed/encoded by Bunny.net first (takes a few minutes after upload)

---

## Summary - What You Need

1. ✅ **Bunny.net API Key** - From Account → API
2. ✅ **Video Library ID** - From Stream → Video Libraries
3. ✅ **CDN Hostname** (optional) - From your library settings
4. ✅ **Backend server** - Node.js, PHP, Python, etc.
5. ✅ **`.env` file** - To store credentials securely

Once you have these, the VegaPilot portal will connect to your actual Bunny.net account and manage your real video library!

---

**Need Help?**
- Bunny.net API Docs: https://docs.bunny.net/reference/video-library
- Check server logs for detailed error messages
- Verify credentials in Bunny.net dashboard
