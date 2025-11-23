# Bunny.net Video Management - Admin Portal

A complete, production-ready Admin Portal for managing videos uploaded to Bunny.net via API integration. Built with HTML5, CSS3, and Angular 1.x.

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)

## Features

### 📁 Folder Management
- Display all Bunny.net folders in a responsive sidebar
- **Create New Folder**: Add folders directly to Bunny.net cloud
- Show video count per folder
- "All Videos" view for comprehensive overview
- Real-time folder statistics

### 🎬 Video Management
- **Upload**: Multi-file upload with drag-and-drop support
- **Rename**: Inline video renaming with live updates
- **Delete**: Safe deletion with confirmation dialogs
- **Preview**: Built-in HTML5 video player modal

### 🔍 Search & Filter
- Real-time search across:
  - Video names
  - Folder names
  - Tags (optional)
- Sort videos by:
  - Name (A-Z / Z-A)
  - Upload Date (Newest / Oldest)
  - Duration (Shortest / Longest)
  - File Size (Smallest / Largest)

### 📊 Dashboard Statistics
- Total video count
- Total folders
- Storage usage
- Total duration across all videos

### 🎨 User Experience
- Fully responsive design (mobile, tablet, desktop)
- Smooth CSS3 animations
- Loading states and progress indicators
- Empty state handling
- Beautiful gradient UI with modern design

## File Structure

```
vegaPilot/
├── bunny-admin.html          # Main HTML file
├── controllers/
│   └── bunny-admin.js        # Angular controller
├── assets/
│   └── js/
│       └── angular.min.js    # Angular 1.x library
└── BUNNY_ADMIN_README.md     # Documentation
```

## Installation

### 1. Prerequisites
- Web server (Apache, Nginx, or Node.js)
- Angular 1.x (already included via CDN in the HTML)
- Modern web browser (Chrome, Firefox, Safari, Edge)

### 2. Setup
1. Copy the files to your web server directory
2. Ensure `bunny-admin.html` and `controllers/bunny-admin.js` are in place
3. Configure API endpoints (see Configuration section)

### 3. Access
Open `bunny-admin.html` in your web browser:
```
http://localhost/bunny-admin.html
```

## Configuration

### API Endpoints

The portal uses proxy endpoints to communicate with Bunny.net API. Configure these on your backend:

#### Required Endpoints:

**1. Get Folders**
```
GET /api/bunny/folders
Response: [
  {
    "id": "folder_id",
    "name": "Folder Name",
    "videoCount": 10
  }
]
```

**2. Get Videos**
```
GET /api/bunny/videos?folderId={id}
Response: [
  {
    "id": "video_id",
    "name": "Video Name",
    "folderId": "folder_id",
    "uploadDate": "2024-01-15T10:30:00Z",
    "duration": "5:30",
    "size": 52428800,
    "thumbnail": "https://thumbnail-url.jpg"
  }
]
```

**3. Upload Video**
```
POST /api/bunny/upload
Body: FormData with 'file' and 'folderId'
Response: {
  "videoId": "new_video_id",
  "success": true
}
```

**4. Rename Video**
```
POST /api/bunny/rename
Body: {
  "videoId": "video_id",
  "newName": "New Video Name"
}
Response: {
  "success": true
}
```

**5. Delete Video**
```
POST /api/bunny/delete
Body: {
  "videoId": "video_id"
}
Response: {
  "success": true
}
```

**6. Stream Video**
```
GET /api/bunny/stream?id={video_id}
Response: Video stream (video/mp4)
```

**7. Create Folder**
```
POST /api/bunny/folders
Body: {
  "name": "Folder Name",
  "description": "Optional description"
}
Response: {
  "folderId": "new_folder_id",
  "success": true
}
```

### Backend Integration

Create a server-side proxy that:
1. Stores Bunny.net API credentials securely
2. Forwards requests from the frontend to Bunny.net API
3. Handles authentication and error handling

**Example Node.js/Express Backend:**

```javascript
const express = require('express');
const axios = require('axios');
const app = express();

const BUNNY_API_KEY = process.env.BUNNY_API_KEY;
const BUNNY_LIBRARY_ID = process.env.BUNNY_LIBRARY_ID;

// Get folders
app.get('/api/bunny/folders', async (req, res) => {
  try {
    const response = await axios.get(
      `https://video.bunnycdn.com/library/${BUNNY_LIBRARY_ID}/collections`,
      {
        headers: { 'AccessKey': BUNNY_API_KEY }
      }
    );
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get videos
app.get('/api/bunny/videos', async (req, res) => {
  const { folderId } = req.query;
  try {
    const response = await axios.get(
      `https://video.bunnycdn.com/library/${BUNNY_LIBRARY_ID}/videos`,
      {
        headers: { 'AccessKey': BUNNY_API_KEY },
        params: { collection: folderId }
      }
    );
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Upload video
app.post('/api/bunny/upload', async (req, res) => {
  // Handle file upload to Bunny.net
  // Implementation depends on your upload strategy
});

// Create folder
app.post('/api/bunny/folders', async (req, res) => {
  const { name, description } = req.body;
  try {
    const response = await axios.post(
      `https://video.bunnycdn.com/library/${BUNNY_LIBRARY_ID}/collections`,
      {
        name: name,
        description: description
      },
      {
        headers: { 'AccessKey': BUNNY_API_KEY }
      }
    );
    res.json({
      folderId: response.data.guid,
      success: true
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// More endpoints...
```

## Usage Guide

### 1. Managing Folders
- View all folders in the left sidebar
- Click the **+** button next to "Video Folders" to create a new folder
- Enter folder name and optional description
- New folders are created directly in Bunny.net cloud
- Folder count updates automatically

### 2. Viewing Videos
- Click on any folder in the sidebar to view its videos
- Click "All Videos" to see all videos across folders
- Use the search bar to find specific videos
- Change sort order using the dropdown filters

### 2. Uploading Videos
1. Click "Upload Videos" button in the header
2. Select the destination folder
3. Either:
   - Click "Browse Files" to select videos from your computer
   - Drag and drop video files into the upload zone
4. Click "Upload" to start the upload process
5. Monitor progress bars for each file

### 3. Managing Videos
- **Play**: Click on any video card to open the player modal
- **Rename**: Click the "Rename" button on a video card
- **Delete**: Click the "Delete" button and confirm deletion

### 4. Search & Filter
- Enter keywords in the search bar
- Search works across video names, folder names, and tags
- Use sorting dropdowns to organize results

## Customization

### Styling
All styles are embedded in `bunny-admin.html`. Key customization points:

**Colors:**
```css
/* Primary gradient */
background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);

/* Change to your brand colors */
background: linear-gradient(135deg, #YOUR_COLOR_1 0%, #YOUR_COLOR_2 100%);
```

**Animations:**
```css
/* Adjust animation timing */
animation: slideInUp 0.6s ease-out;
```

### Functionality
Modify `controllers/bunny-admin.js`:

**Change API base URL:**
```javascript
var API_BASE = '/api/bunny'; // Change this to your API endpoint
```

**Add custom video properties:**
```javascript
// In generateMockVideos() or API response handling
video.customField = 'custom value';
```

## Demo Mode

The portal includes mock data for demonstration purposes. When API calls fail, it automatically falls back to:
- 5 sample folders (Marketing, Product Demos, Tutorials, Webinars, Testimonials)
- 50 sample videos with realistic metadata
- Simulated upload progress

To disable demo mode:
1. Remove the `.catch()` error handlers in `bunny-admin.js`
2. Ensure all API endpoints are properly configured

## Browser Support

- ✅ Chrome (latest)
- ✅ Firefox (latest)
- ✅ Safari (latest)
- ✅ Edge (latest)
- ⚠️ IE11 (partial support, requires polyfills)

## Performance

### Optimizations Included:
- CSS animations use hardware acceleration (`transform`, `opacity`)
- Lazy loading for video thumbnails
- Efficient Angular digest cycles
- Debounced search filtering
- Minimal DOM manipulation

### Recommendations:
- Enable gzip compression on your web server
- Use CDN for Angular library
- Implement pagination for large video libraries (500+ videos)
- Add virtual scrolling for very long lists

## Security Considerations

⚠️ **IMPORTANT**: Never expose Bunny.net API credentials in frontend code!

**Security Best Practices:**
1. ✅ Use server-side proxy for all API calls
2. ✅ Implement authentication/authorization
3. ✅ Validate file uploads (type, size, content)
4. ✅ Sanitize user inputs (video names, search queries)
5. ✅ Use HTTPS in production
6. ✅ Implement CORS properly on backend
7. ✅ Add rate limiting to API endpoints

## Troubleshooting

### Videos not loading
- Check browser console for API errors
- Verify API endpoints are accessible
- Check CORS configuration on backend

### Upload not working
- Verify file size limits on server
- Check supported video formats
- Ensure FormData is properly configured

### Styling issues
- Clear browser cache
- Check for CSS conflicts with existing stylesheets
- Verify Font Awesome CDN is loading

### Angular not initializing
- Check Angular library is loaded
- Verify `ng-app` directive is present
- Check browser console for JavaScript errors

## Future Enhancements

Potential features to add:
- [ ] Batch operations (multi-select delete/move)
- [ ] Video analytics integration
- [ ] Thumbnail generation
- [ ] Advanced filtering (by date range, duration range)
- [ ] Folder creation and management
- [ ] User permissions and roles
- [ ] Video transcoding status
- [ ] CDN statistics and bandwidth usage
- [ ] Export video list to CSV/Excel
- [ ] Dark mode toggle

## API Reference

### Angular Controller Methods

**Public Methods:**
- `$scope.init()` - Initialize the application
- `$scope.loadFolders()` - Fetch all folders
- `$scope.loadAllVideos()` - Fetch all videos
- `$scope.selectFolder(folderId)` - Filter videos by folder
- `$scope.filterVideos()` - Apply search and filters
- `$scope.sortVideos()` - Sort filtered videos
- `$scope.openUploadModal()` - Open upload dialog
- `$scope.startUpload()` - Begin upload process
- `$scope.openVideoPlayer(video)` - Play video
- `$scope.renameVideo()` - Rename selected video
- `$scope.deleteVideo()` - Delete selected video

**Utility Methods:**
- `$scope.getFolderName(folderId)` - Get folder name by ID
- `$scope.getTotalVideoCount()` - Count all videos
- `$scope.getTotalSize()` - Calculate total storage
- `$scope.getTotalDuration()` - Sum all video durations
- `$scope.formatFileSize(bytes)` - Format bytes to readable size

## License

MIT License - feel free to use in your projects!

## Support

For issues, questions, or contributions:
1. Check existing documentation
2. Search for similar issues
3. Create detailed bug reports with:
   - Browser version
   - Console errors
   - Steps to reproduce

## Credits

Built with:
- [Angular 1.x](https://angularjs.org/)
- [Font Awesome](https://fontawesome.com/)
- [Google Fonts](https://fonts.google.com/)

---

**Happy Video Managing! 🎬**
