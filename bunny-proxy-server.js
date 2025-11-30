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

// ===== Web Content Manager Endpoints =====

const WEB_CONTENT_CONFIG_PATH = path.join(__dirname, 'data', 'web-content-config.json');

// Helper to read config
function readWebContentConfig() {
    try {
        if (!fs.existsSync(WEB_CONTENT_CONFIG_PATH)) {
            return { autoEnroll: { courses: [], validity: { type: 'duration', value: 365, unit: 'days' } }, discounts: [] };
        }
        const data = fs.readFileSync(WEB_CONTENT_CONFIG_PATH, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Error reading web content config:', error);
        return { autoEnroll: { courses: [], validity: {} }, discounts: [] };
    }
}

// Helper to write config
function writeWebContentConfig(config) {
    try {
        fs.writeFileSync(WEB_CONTENT_CONFIG_PATH, JSON.stringify(config, null, 2));
        return true;
    } catch (error) {
        console.error('Error writing web content config:', error);
        return false;
    }
}

// Get Web Content Config
app.get('/api/web-content/config', (req, res) => {
    const config = readWebContentConfig();
    res.json(config);
});

// Save Auto-Enroll Config
app.post('/api/web-content/auto-enroll', (req, res) => {
    const config = readWebContentConfig();
    config.autoEnroll = req.body;

    if (writeWebContentConfig(config)) {
        res.json({ success: true, message: 'Auto-enroll configuration saved' });
    } else {
        res.status(500).json({ error: 'Failed to save configuration' });
    }
});

// Save Discount Codes
app.post('/api/web-content/discounts', (req, res) => {
    const config = readWebContentConfig();
    config.discounts = req.body;

    if (writeWebContentConfig(config)) {
        res.json({ success: true, message: 'Discount codes saved' });
    } else {
        res.status(500).json({ error: 'Failed to save configuration' });
    }
});

// Get All Courses (Mock implementation - synced with courses-list.js)
app.get('/api/courses', (req, res) => {
    // This data matches the hardcoded list in controllers/courses-list.js
    const courses = [
        {
            code: 'CR004',
            title: 'IAT 2026 – Exclusive 1 Year Course',
            category: 'Science',
            description: 'Comprehensive preparation for IISER Aptitude Test 2026',
            modulesList: ['Biology', 'Chemistry', 'Physics', 'Mathematics'],
            totalModules: 4,
            totalChapters: 57,
            totalDuration: '201h 45m',
            status: 'Active',
            totalStudents: 450,
            instructor: 'Expert Faculty Team',
            rating: '4.9'
        },
        {
            code: 'CR001',
            title: 'Advanced Web Development Masterclass',
            category: 'Web Development',
            description: 'Master modern web development with hands-on projects',
            modulesList: ['HTML5', 'CSS3', 'JavaScript', 'React', 'Node.js'],
            totalModules: 5,
            totalChapters: 45,
            totalDuration: '85h 30m',
            status: 'Active',
            totalStudents: 1250,
            instructor: 'John Smith',
            rating: '4.8'
        },
        {
            code: 'CR002',
            title: 'Data Science and Machine Learning',
            category: 'Data Science',
            description: 'Complete guide to data science and ML algorithms',
            modulesList: ['Python', 'Statistics', 'ML Algorithms', 'Deep Learning'],
            totalModules: 4,
            totalChapters: 52,
            totalDuration: '95h 15m',
            status: 'Active',
            totalStudents: 890,
            instructor: 'Dr. Sarah Williams',
            rating: '4.9'
        },
        {
            code: 'CR003',
            title: 'Digital Marketing Fundamentals',
            category: 'Marketing',
            description: 'Learn digital marketing strategies and tools',
            modulesList: ['SEO', 'Social Media', 'Content Marketing', 'Analytics'],
            totalModules: 4,
            totalChapters: 32,
            totalDuration: '48h 20m',
            status: 'Active',
            totalStudents: 675,
            instructor: 'Mark Thompson',
            rating: '4.7'
        },
        {
            code: 'CR005',
            title: 'Python Programming Bootcamp',
            category: 'Programming',
            description: 'From beginner to advanced Python programming',
            modulesList: ['Basics', 'OOP', 'Data Structures', 'Web Development'],
            totalModules: 4,
            totalChapters: 38,
            totalDuration: '62h 45m',
            status: 'Active',
            totalStudents: 1120,
            instructor: 'James Anderson',
            rating: '4.8'
        },
        {
            code: 'CR006',
            title: 'UI/UX Design Masterclass',
            category: 'Design',
            description: 'Master user interface and user experience design',
            modulesList: ['Design Principles', 'Wireframing', 'Prototyping', 'Testing'],
            totalModules: 4,
            totalChapters: 28,
            totalDuration: '42h 30m',
            status: 'Draft',
            totalStudents: 0,
            instructor: 'Emily Chen',
            rating: '4.6'
        },
        {
            code: 'CR007',
            title: 'Cloud Computing with AWS',
            category: 'Cloud Computing',
            description: 'Comprehensive AWS cloud services and architecture',
            modulesList: ['EC2', 'S3', 'Lambda', 'Database Services'],
            totalModules: 4,
            totalChapters: 35,
            totalDuration: '55h 15m',
            status: 'Active',
            totalStudents: 540,
            instructor: 'Michael Brown',
            rating: '4.8'
        }
    ];
    res.json(courses);
});

// Get All Exams (Mock implementation - synced with exam-listing.js)
app.get('/api/exams', (req, res) => {
    const exams = [
        {
            id: 50000,
            displayKey: '4df33c6e-9282-48dc-b8ee-d70e5d2304ef',
            title: 'IAT Mock Test - 1',
            brief: 'Boost your IISER Aptitude Test 2025 preparation with our specially curated mock test',
            photo: 'data:image/png;base64,sample',
            specialTerms: '<ol><li>There are 4 Sections in this exam, containing 15 questions each.</li><li>Sections will be in the order Biology, Chemistry, Mathematics, and Physics</li><li>You can switch between Sections anytime during the exam</li><li>Every question is an MCQ with only Single Right Answer. You may choose answers from A, B, C, D options.</li><li>Each correct answer awards +4 marks, while each incorrect answer results in a -1 mark penalty.</li><li>There is no mandatory question to attempt, and any unattempted questions receive 0 marks.</li></ol>',
            duration: 180,
            totalQuestions: 60,
            challengeQuestionAllowed: 1,
            numberOfSections: 4,
            switchSectionsAllowed: 1,
            markingSchemeOverall: 1,
            sectionsData: [
                {
                    order: 1,
                    name: 'Biology',
                    duration: 45,
                    totalQuestions: 15,
                    enableSectionWiseTimer: false,
                    sectionMarkingScheme: 0,
                    questions: [
                        { o: 1, qi: 1000, ms: 1 }, { o: 2, qi: 1001, ms: 1 }, { o: 3, qi: 1002, ms: 1 },
                        { o: 4, qi: 1003, ms: 1 }, { o: 5, qi: 1004, ms: 1 }, { o: 6, qi: 1005, ms: 1 },
                        { o: 7, qi: 1006, ms: 1 }, { o: 8, qi: 1007, ms: 1 }, { o: 9, qi: 1008, ms: 1 },
                        { o: 10, qi: 1009, ms: 1 }, { o: 11, qi: 1010, ms: 1 }, { o: 12, qi: 1011, ms: 1 },
                        { o: 13, qi: 1012, ms: 1 }, { o: 14, qi: 1013, ms: 1 }, { o: 15, qi: 1014, ms: 1 }
                    ]
                },
                {
                    order: 2,
                    name: 'Chemistry',
                    duration: 45,
                    totalQuestions: 15,
                    enableSectionWiseTimer: false,
                    sectionMarkingScheme: 0,
                    questions: [
                        { o: 1, qi: 1015, ms: 1 }, { o: 2, qi: 1016, ms: 1 }, { o: 3, qi: 1017, ms: 1 },
                        { o: 4, qi: 1018, ms: 1 }, { o: 5, qi: 1019, ms: 1 }, { o: 6, qi: 1020, ms: 1 },
                        { o: 7, qi: 1021, ms: 1 }, { o: 8, qi: 1022, ms: 1 }, { o: 9, qi: 1023, ms: 1 },
                        { o: 10, qi: 1024, ms: 1 }, { o: 11, qi: 1025, ms: 1 }, { o: 12, qi: 1026, ms: 1 },
                        { o: 13, qi: 1027, ms: 1 }, { o: 14, qi: 1028, ms: 1 }, { o: 15, qi: 1029, ms: 1 }
                    ]
                },
                {
                    order: 3,
                    name: 'Mathematics',
                    duration: 45,
                    totalQuestions: 15,
                    enableSectionWiseTimer: false,
                    sectionMarkingScheme: 0,
                    questions: [
                        { o: 1, qi: 1030, ms: 1 }, { o: 2, qi: 1031, ms: 1 }, { o: 3, qi: 1032, ms: 1 },
                        { o: 4, qi: 1033, ms: 1 }, { o: 5, qi: 1034, ms: 1 }, { o: 6, qi: 1035, ms: 1 },
                        { o: 7, qi: 1036, ms: 1 }, { o: 8, qi: 1037, ms: 1 }, { o: 9, qi: 1038, ms: 1 },
                        { o: 10, qi: 1039, ms: 1 }, { o: 11, qi: 1040, ms: 1 }, { o: 12, qi: 1041, ms: 1 },
                        { o: 13, qi: 1042, ms: 1 }, { o: 14, qi: 1043, ms: 1 }, { o: 15, qi: 1044, ms: 1 }
                    ]
                },
                {
                    order: 4,
                    name: 'Physics',
                    duration: 45,
                    totalQuestions: 15,
                    enableSectionWiseTimer: false,
                    sectionMarkingScheme: 0,
                    questions: [
                        { o: 1, qi: 1045, ms: 1 }, { o: 2, qi: 1046, ms: 1 }, { o: 3, qi: 1047, ms: 1 },
                        { o: 4, qi: 1048, ms: 1 }, { o: 5, qi: 1049, ms: 1 }, { o: 6, qi: 1050, ms: 1 },
                        { o: 7, qi: 1051, ms: 1 }, { o: 8, qi: 1052, ms: 1 }, { o: 9, qi: 1053, ms: 1 },
                        { o: 10, qi: 1054, ms: 1 }, { o: 11, qi: 1055, ms: 1 }, { o: 12, qi: 1056, ms: 1 },
                        { o: 13, qi: 1057, ms: 1 }, { o: 14, qi: 1058, ms: 1 }, { o: 15, qi: 1059, ms: 1 }
                    ]
                }
            ],
            status: 1,
            createdBy: '66599dd1-c984-4cd0-944d-72b3a1492552',
            createdOn: 1742333501,
            lastUpdatedBy: '66599dd1-c984-4cd0-944d-72b3a1492552',
            lastUpdatedOn: 1742333501
        },
        {
            id: 50001,
            displayKey: '5ef44d7f-0393-59ed-c9ff-e81f6e3415f0',
            title: 'JEE Main Practice Test - Physics',
            brief: 'Comprehensive physics practice test covering mechanics, thermodynamics, and modern physics',
            photo: 'data:image/png;base64,sample',
            specialTerms: '<ol><li>This test contains 25 questions from Physics</li><li>Each question carries 4 marks</li><li>Negative marking of 1 mark for wrong answers</li><li>Time limit: 100 minutes</li><li>Use of calculator is allowed</li></ol>',
            duration: 100,
            totalQuestions: 25,
            challengeQuestionAllowed: 0,
            numberOfSections: 1,
            switchSectionsAllowed: 0,
            markingSchemeOverall: 1,
            sectionsData: [
                {
                    order: 1,
                    name: 'Physics',
                    duration: 100,
                    totalQuestions: 25,
                    enableSectionWiseTimer: true,
                    sectionMarkingScheme: 0,
                    questions: [
                        { o: 1, qi: 2000, ms: 1 }, { o: 2, qi: 2001, ms: 1 }, { o: 3, qi: 2002, ms: 1 },
                        { o: 4, qi: 2003, ms: 1 }, { o: 5, qi: 2004, ms: 1 }, { o: 6, qi: 2005, ms: 1 },
                        { o: 7, qi: 2006, ms: 1 }, { o: 8, qi: 2007, ms: 1 }, { o: 9, qi: 2008, ms: 1 },
                        { o: 10, qi: 2009, ms: 1 }, { o: 11, qi: 2010, ms: 1 }, { o: 12, qi: 2011, ms: 1 },
                        { o: 13, qi: 2012, ms: 1 }, { o: 14, qi: 2013, ms: 1 }, { o: 15, qi: 2014, ms: 1 },
                        { o: 16, qi: 2015, ms: 1 }, { o: 17, qi: 2016, ms: 1 }, { o: 18, qi: 2017, ms: 1 },
                        { o: 19, qi: 2018, ms: 1 }, { o: 20, qi: 2019, ms: 1 }, { o: 21, qi: 2020, ms: 1 },
                        { o: 22, qi: 2021, ms: 1 }, { o: 23, qi: 2022, ms: 1 }, { o: 24, qi: 2023, ms: 1 },
                        { o: 25, qi: 2024, ms: 1 }
                    ]
                }
            ],
            status: 1,
            createdBy: '66599dd1-c984-4cd0-944d-72b3a1492552',
            createdOn: 1742333502,
            lastUpdatedBy: '66599dd1-c984-4cd0-944d-72b3a1492552',
            lastUpdatedOn: 1742333502
        },
        {
            id: 50002,
            displayKey: '6fg55e8g-14a4-6afe-da0g-f92g7f4526g1',
            title: 'NEET Biology Mock Test',
            brief: 'Complete biology mock test for NEET preparation covering botany and zoology',
            photo: 'data:image/png;base64,sample',
            specialTerms: '<ol><li>This test contains 90 questions from Biology</li><li>Questions are divided into Botany and Zoology sections</li><li>Each correct answer gives 4 marks</li><li>No negative marking</li><li>Time limit: 200 minutes</li></ol>',
            duration: 200,
            totalQuestions: 90,
            challengeQuestionAllowed: 1,
            numberOfSections: 2,
            switchSectionsAllowed: 1,
            markingSchemeOverall: 2,
            sectionsData: [
                {
                    order: 1,
                    name: 'Botany',
                    duration: 100,
                    totalQuestions: 45,
                    enableSectionWiseTimer: true,
                    sectionMarkingScheme: 1,
                    questions: [
                        { o: 1, qi: 3000, ms: 4 }, { o: 2, qi: 3001, ms: 4 }, { o: 3, qi: 3002, ms: 4 },
                        { o: 4, qi: 3003, ms: 4 }, { o: 5, qi: 3004, ms: 4 }, { o: 6, qi: 3005, ms: 4 },
                        { o: 7, qi: 3006, ms: 4 }, { o: 8, qi: 3007, ms: 4 }, { o: 9, qi: 3008, ms: 4 },
                        { o: 10, qi: 3009, ms: 4 }, { o: 11, qi: 3010, ms: 4 }, { o: 12, qi: 3011, ms: 4 },
                        { o: 13, qi: 3012, ms: 4 }, { o: 14, qi: 3013, ms: 4 }, { o: 15, qi: 3014, ms: 4 },
                        { o: 16, qi: 3015, ms: 4 }, { o: 17, qi: 3016, ms: 4 }, { o: 18, qi: 3017, ms: 4 },
                        { o: 19, qi: 3018, ms: 4 }, { o: 20, qi: 3019, ms: 4 }, { o: 21, qi: 3020, ms: 4 },
                        { o: 22, qi: 3021, ms: 4 }, { o: 23, qi: 3022, ms: 4 }, { o: 24, qi: 3023, ms: 4 },
                        { o: 25, qi: 3024, ms: 4 }, { o: 26, qi: 3025, ms: 4 }, { o: 27, qi: 3026, ms: 4 },
                        { o: 28, qi: 3027, ms: 4 }, { o: 29, qi: 3028, ms: 4 }, { o: 30, qi: 3029, ms: 4 },
                        { o: 31, qi: 3030, ms: 4 }, { o: 32, qi: 3031, ms: 4 }, { o: 33, qi: 3032, ms: 4 },
                        { o: 34, qi: 3033, ms: 4 }, { o: 35, qi: 3034, ms: 4 }, { o: 36, qi: 3035, ms: 4 },
                        { o: 37, qi: 3036, ms: 4 }, { o: 38, qi: 3037, ms: 4 }, { o: 39, qi: 3038, ms: 4 },
                        { o: 40, qi: 3039, ms: 4 }, { o: 41, qi: 3040, ms: 4 }, { o: 42, qi: 3041, ms: 4 },
                        { o: 43, qi: 3042, ms: 4 }, { o: 44, qi: 3043, ms: 4 }, { o: 45, qi: 3044, ms: 4 }
                    ]
                },
                {
                    order: 2,
                    name: 'Zoology',
                    duration: 100,
                    totalQuestions: 45,
                    enableSectionWiseTimer: true,
                    sectionMarkingScheme: 1,
                    questions: [
                        { o: 1, qi: 3045, ms: 4 }, { o: 2, qi: 3046, ms: 4 }, { o: 3, qi: 3047, ms: 4 },
                        { o: 4, qi: 3048, ms: 4 }, { o: 5, qi: 3049, ms: 4 }, { o: 6, qi: 3050, ms: 4 },
                        { o: 7, qi: 3051, ms: 4 }, { o: 8, qi: 3052, ms: 4 }, { o: 9, qi: 3053, ms: 4 },
                        { o: 10, qi: 3054, ms: 4 }, { o: 11, qi: 3055, ms: 4 }, { o: 12, qi: 3056, ms: 4 },
                        { o: 13, qi: 3057, ms: 4 }, { o: 14, qi: 3058, ms: 4 }, { o: 15, qi: 3059, ms: 4 },
                        { o: 16, qi: 3060, ms: 4 }, { o: 17, qi: 3061, ms: 4 }, { o: 18, qi: 3062, ms: 4 },
                        { o: 19, qi: 3063, ms: 4 }, { o: 20, qi: 3064, ms: 4 }, { o: 21, qi: 3065, ms: 4 },
                        { o: 22, qi: 3066, ms: 4 }, { o: 23, qi: 3067, ms: 4 }, { o: 24, qi: 3068, ms: 4 },
                        { o: 25, qi: 3069, ms: 4 }, { o: 26, qi: 3070, ms: 4 }, { o: 27, qi: 3071, ms: 4 },
                        { o: 28, qi: 3072, ms: 4 }, { o: 29, qi: 3073, ms: 4 }, { o: 30, qi: 3074, ms: 4 },
                        { o: 31, qi: 3075, ms: 4 }, { o: 32, qi: 3076, ms: 4 }, { o: 33, qi: 3077, ms: 4 },
                        { o: 34, qi: 3078, ms: 4 }, { o: 35, qi: 3079, ms: 4 }, { o: 36, qi: 3080, ms: 4 },
                        { o: 37, qi: 3081, ms: 4 }, { o: 38, qi: 3082, ms: 4 }, { o: 39, qi: 3083, ms: 4 },
                        { o: 40, qi: 3084, ms: 4 }, { o: 41, qi: 3085, ms: 4 }, { o: 42, qi: 3086, ms: 4 },
                        { o: 43, qi: 3087, ms: 4 }, { o: 44, qi: 3088, ms: 4 }, { o: 45, qi: 3089, ms: 4 }
                    ]
                }
            ],
            status: 0,
            createdBy: '66599dd1-c984-4cd0-944d-72b3a1492552',
            createdOn: 1742333503,
            lastUpdatedBy: '66599dd1-c984-4cd0-944d-72b3a1492552',
            lastUpdatedOn: 1742333503
        },
        {
            id: 50003,
            displayKey: '7gh66f9h-25b5-7bgf-eb1h-g03h8g5637h2',
            title: 'Chemistry Olympiad Qualifier',
            brief: 'Preliminary round for Chemistry Olympiad - covers all major chemistry topics',
            photo: 'data:image/png;base64,sample',
            specialTerms: '<ol><li>Duration: 120 minutes</li><li>30 Multiple Choice Questions</li><li>Each question carries 3 marks</li><li>No negative marking</li><li>Top scorers advance to next round</li></ol>',
            duration: 120,
            totalQuestions: 30,
            challengeQuestionAllowed: 0,
            numberOfSections: 3,
            switchSectionsAllowed: 1,
            markingSchemeOverall: 2,
            sectionsData: [
                {
                    order: 1,
                    name: 'Organic Chemistry',
                    duration: 40,
                    totalQuestions: 10,
                    enableSectionWiseTimer: false,
                    sectionMarkingScheme: 0,
                    questions: Array.from({ length: 10 }, function (_, i) { return { o: i + 1, qi: 4000 + i, ms: 3 }; })
                },
                {
                    order: 2,
                    name: 'Inorganic Chemistry',
                    duration: 40,
                    totalQuestions: 10,
                    enableSectionWiseTimer: false,
                    sectionMarkingScheme: 0,
                    questions: Array.from({ length: 10 }, function (_, i) { return { o: i + 1, qi: 4010 + i, ms: 3 }; })
                },
                {
                    order: 3,
                    name: 'Physical Chemistry',
                    duration: 40,
                    totalQuestions: 10,
                    enableSectionWiseTimer: false,
                    sectionMarkingScheme: 0,
                    questions: Array.from({ length: 10 }, function (_, i) { return { o: i + 1, qi: 4020 + i, ms: 3 }; })
                }
            ],
            status: 1,
            createdBy: '66599dd1-c984-4cd0-944d-72b3a1492552',
            createdOn: 1742220000,
            lastUpdatedBy: '66599dd1-c984-4cd0-944d-72b3a1492552',
            lastUpdatedOn: 1742300000
        },
        {
            id: 50004,
            displayKey: '8hi77g0i-36c6-8chi-fc2i-h14i9h6748i3',
            title: 'Mathematics Rapid Fire Quiz',
            brief: 'Quick math assessment covering algebra, geometry, and calculus basics',
            photo: 'data:image/png;base64,sample',
            specialTerms: '<ol><li>Speed test - 60 minutes only</li><li>20 questions</li><li>+5 for correct, -2 for incorrect</li><li>Calculator not allowed</li><li>All questions must be attempted</li></ol>',
            duration: 60,
            totalQuestions: 20,
            challengeQuestionAllowed: 1,
            numberOfSections: 1,
            switchSectionsAllowed: 0,
            markingSchemeOverall: 3,
            sectionsData: [
                {
                    order: 1,
                    name: 'Mathematics',
                    duration: 60,
                    totalQuestions: 20,
                    enableSectionWiseTimer: true,
                    sectionMarkingScheme: 1,
                    questions: Array.from({ length: 20 }, function (_, i) { return { o: i + 1, qi: 5000 + i, ms: 5 }; })
                }
            ],
            status: 1,
            createdBy: '66599dd1-c984-4cd0-944d-72b3a1492552',
            createdOn: 1742100000,
            lastUpdatedBy: '66599dd1-c984-4cd0-944d-72b3a1492552',
            lastUpdatedOn: 1742250000
        }
    ];
    res.json(exams);
});

// Get Test Series
app.get('/api/test-series', (req, res) => {
    const configPath = path.join(__dirname, 'data', 'test-series.json');
    if (fs.existsSync(configPath)) {
        const data = fs.readFileSync(configPath, 'utf8');
        res.json(JSON.parse(data));
    } else {
        res.json([]);
    }
});

// Save Test Series
app.post('/api/test-series', (req, res) => {
    const configPath = path.join(__dirname, 'data', 'test-series.json');
    fs.writeFileSync(configPath, JSON.stringify(req.body, null, 2));
    res.json({ success: true });
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
