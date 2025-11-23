/**
 * Bunny.net API Proxy Server
 * Connects VegaPilot Video Management to your Bunny.net account
 */

const express = require('express');
const axios = require('axios');
const cors = require('cors');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const app = express();
const upload = multer({ dest: 'uploads/' });

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname)); // Serve static files from vegaPilot directory

// Bunny.net Configuration
const BUNNY_API_KEY = process.env.BUNNY_API_KEY;
const BUNNY_LIBRARY_ID = process.env.BUNNY_LIBRARY_ID;
const BUNNY_CDN_HOSTNAME = process.env.BUNNY_CDN_HOSTNAME;
const BUNNY_API_BASE = 'https://video.bunnycdn.com';

// Validate configuration
if (!BUNNY_API_KEY || !BUNNY_LIBRARY_ID || !BUNNY_CDN_HOSTNAME) {
    console.error('❌ Error: Missing Bunny.net configuration!');
    console.error('Please check your .env file has:');
    console.error('- BUNNY_API_KEY');
    console.error('- BUNNY_LIBRARY_ID');
    console.error('- BUNNY_CDN_HOSTNAME');
    process.exit(1);
}

// ===== 1. Get Folders (Collections) =====
app.get('/api/bunny/folders', async (req, res) => {
    console.log('📂 Fetching folders...');
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

        console.log(`✅ Found ${folders.length} folders`);
        res.json(folders);
    } catch (error) {
        console.error('❌ Error fetching folders:', error.response?.data || error.message);
        res.status(500).json({
            error: error.message,
            details: error.response?.data
        });
    }
});

// ===== 2. Create Folder =====
app.post('/api/bunny/folders', async (req, res) => {
    const { name, description } = req.body;

    if (!name) {
        return res.status(400).json({ error: 'Folder name is required' });
    }

    console.log(`📁 Creating folder: ${name}`);
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

        console.log(`✅ Folder created: ${name} (ID: ${response.data.guid})`);
        res.json({
            folderId: response.data.guid,
            success: true
        });
    } catch (error) {
        console.error('❌ Error creating folder:', error.response?.data || error.message);
        res.status(500).json({
            error: error.message,
            details: error.response?.data
        });
    }
});

// ===== 3. Rename Folder =====
app.put('/api/bunny/folders/:id', async (req, res) => {
    const { id } = req.params;
    const { name } = req.body;

    if (!name) {
        return res.status(400).json({ error: 'Folder name is required' });
    }

    console.log(`✏️  Renaming folder ${id} to: ${name}`);
    try {
        await axios.post(
            `${BUNNY_API_BASE}/library/${BUNNY_LIBRARY_ID}/collections/${id}`,
            {
                name: name
            },
            {
                headers: {
                    'AccessKey': BUNNY_API_KEY,
                    'Content-Type': 'application/json'
                }
            }
        );

        console.log(`✅ Folder renamed successfully`);
        res.json({ success: true });
    } catch (error) {
        console.error('❌ Error renaming folder:', error.response?.data || error.message);
        res.status(500).json({
            error: error.message,
            details: error.response?.data
        });
    }
});

// ===== 4. Get Videos =====
app.get('/api/bunny/videos', async (req, res) => {
    const { folderId } = req.query;

    console.log(`🎬 Fetching videos${folderId ? ` from folder ${folderId}` : ' (all)'}`);
    try {
        const params = {
            page: 1,
            itemsPerPage: 100
        };

        if (folderId && folderId !== 'null') {
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

        console.log(`✅ Found ${videos.length} videos`);
        res.json(videos);
    } catch (error) {
        console.error('❌ Error fetching videos:', error.response?.data || error.message);
        res.status(500).json({
            error: error.message,
            details: error.response?.data
        });
    }
});

// ===== 5. Upload Video =====
app.post('/api/bunny/upload', upload.single('file'), async (req, res) => {
    const { folderId } = req.body;
    const file = req.file;

    if (!file) {
        return res.status(400).json({ error: 'No file provided' });
    }

    console.log(`⬆️  Uploading video: ${file.originalname}`);
    try {
        // Step 1: Create video entry
        const videoTitle = file.originalname.replace(/\.[^/.]+$/, '');
        console.log(`   Creating video entry: ${videoTitle}`);

        const createResponse = await axios.post(
            `${BUNNY_API_BASE}/library/${BUNNY_LIBRARY_ID}/videos`,
            {
                title: videoTitle,
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
        console.log(`   Video entry created: ${videoId}`);

        // Step 2: Upload video file
        console.log(`   Uploading file data...`);
        const videoData = fs.readFileSync(file.path);

        await axios.put(
            `${BUNNY_API_BASE}/library/${BUNNY_LIBRARY_ID}/videos/${videoId}`,
            videoData,
            {
                headers: {
                    'AccessKey': BUNNY_API_KEY,
                    'Content-Type': 'application/octet-stream'
                },
                maxBodyLength: Infinity,
                maxContentLength: Infinity
            }
        );

        // Clean up uploaded file
        fs.unlinkSync(file.path);

        console.log(`✅ Video uploaded successfully: ${videoTitle}`);
        res.json({
            videoId: videoId,
            success: true
        });
    } catch (error) {
        // Clean up uploaded file on error
        if (file && fs.existsSync(file.path)) {
            fs.unlinkSync(file.path);
        }

        console.error('❌ Error uploading video:', error.response?.data || error.message);
        res.status(500).json({
            error: error.message,
            details: error.response?.data
        });
    }
});

// ===== 6. Rename Video =====
app.post('/api/bunny/rename', async (req, res) => {
    const { videoId, newName } = req.body;

    if (!videoId || !newName) {
        return res.status(400).json({ error: 'videoId and newName are required' });
    }

    console.log(`✏️  Renaming video ${videoId} to: ${newName}`);
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

        console.log(`✅ Video renamed successfully`);
        res.json({ success: true });
    } catch (error) {
        console.error('❌ Error renaming video:', error.response?.data || error.message);
        res.status(500).json({
            error: error.message,
            details: error.response?.data
        });
    }
});

// ===== 7. Delete Video =====
app.post('/api/bunny/delete', async (req, res) => {
    const { videoId } = req.body;

    if (!videoId) {
        return res.status(400).json({ error: 'videoId is required' });
    }

    console.log(`🗑️  Deleting video: ${videoId}`);
    try {
        await axios.delete(
            `${BUNNY_API_BASE}/library/${BUNNY_LIBRARY_ID}/videos/${videoId}`,
            {
                headers: { 'AccessKey': BUNNY_API_KEY }
            }
        );

        console.log(`✅ Video deleted successfully`);
        res.json({ success: true });
    } catch (error) {
        console.error('❌ Error deleting video:', error.response?.data || error.message);
        res.status(500).json({
            error: error.message,
            details: error.response?.data
        });
    }
});

// ===== 8. Stream Video =====
app.get('/api/bunny/stream', async (req, res) => {
    const { id } = req.query;

    if (!id) {
        return res.status(400).json({ error: 'Video id is required' });
    }

    // Redirect to Bunny.net CDN URL
    const streamUrl = `https://${BUNNY_CDN_HOSTNAME}/${id}/playlist.m3u8`;
    console.log(`▶️  Streaming video: ${id}`);
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

// ===== Root Route =====
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'bunny-admin.html'));
});

// ===== Health Check =====
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        bunnynet: {
            connected: true,
            libraryId: BUNNY_LIBRARY_ID,
            cdnHostname: BUNNY_CDN_HOSTNAME
        }
    });
});

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir);
}

// Start Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log('\n' + '='.repeat(70));
    console.log('🚀 Bunny.net Proxy Server Started!');
    console.log('='.repeat(70));
    console.log(`📡 Server running at: http://localhost:${PORT}`);
    console.log(`📹 Video Library ID: ${BUNNY_LIBRARY_ID}`);
    console.log(`🔗 CDN Hostname: ${BUNNY_CDN_HOSTNAME}`);
    console.log('='.repeat(70));
    console.log('\n📺 Available Pages:');
    console.log(`   🎬 Bunny Admin:       http://localhost:${PORT}/bunny-admin.html`);
    console.log(`   🎥 Video Content:     http://localhost:${PORT}/video-content.html`);
    console.log(`   📚 Course Management: http://localhost:${PORT}/course-management.html`);
    console.log('='.repeat(70) + '\n');
    console.log('✅ Ready to manage your Bunny.net videos!\n');
});
