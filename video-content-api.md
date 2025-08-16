# Video Content Management API Documentation

## Overview
This document outlines the backend API endpoints required for the Video Content Management system that uploads videos to Bunny.net and saves metadata to MySQL.

## Database Schema
Based on the provided MySQL table structure:

```sql
CREATE TABLE `video_content_library` (
  `videoId` int(11) NOT NULL,
  `videoDisplayKey` varchar(40) NOT NULL,
  `sourceDirectory` varchar(10) NOT NULL,
  `sourceKey` varchar(40) NOT NULL,
  `titleCode` int(11) NOT NULL,
  `titleName` varchar(80) NOT NULL,
  `durationInSeconds` int(11) NOT NULL,
  `classificationLevel1` smallint(6) NOT NULL,
  `classificationLevel2` smallint(6) NOT NULL,
  `createdBy` varchar(40) NOT NULL,
  `createdOn` int(11) NOT NULL,
  `lastUpdatedBy` varchar(40) NOT NULL,
  `lastUpdatedOn` int(11) NOT NULL,
  `status` tinyint(4) NOT NULL DEFAULT 1
);
```

## API Endpoints

### 1. Get Video List
**GET** `/api/videos`

**Query Parameters:**
- `page` (optional): Page number for pagination
- `filter` (optional): Filter by status (ALL, UPLOADING, COMPLETED)

**Response:**
```json
{
  "success": true,
  "videos": [
    {
      "videoId": 20000,
      "videoDisplayKey": "4a97f519-198e-4ddb-9cc0-46c019ba5875",
      "sourceDirectory": "475938",
      "sourceKey": "656a4f83-e567-4a34-ba21-236ffc54b6f3",
      "titleCode": 1,
      "titleName": "Introduction To Animal Kingdom",
      "durationInSeconds": 2310,
      "classificationLevel1": 1,
      "classificationLevel2": 1,
      "createdBy": "3c4f0321-7805-4110-a8a1-18790e9de023",
      "createdOn": 1754809057,
      "lastUpdatedBy": "3c4f0321-7805-4110-a8a1-18790e9de023",
      "lastUpdatedOn": 1754809057,
      "status": 1
    }
  ],
  "totalPages": 1
}
```

### 2. Get Video Summary
**GET** `/api/videos/summary`

**Response:**
```json
{
  "success": true,
  "summary": {
    "total": 150,
    "totalDuration": 4500,
    "totalUploading": 5,
    "totalCompleted": 145,
    "totalStorage": 25.5
  }
}
```

### 3. Get Single Video
**GET** `/api/videos/{videoId}`

**Response:**
```json
{
  "success": true,
  "video": {
    "videoId": 20000,
    "videoDisplayKey": "4a97f519-198e-4ddb-9cc0-46c019ba5875",
    "sourceDirectory": "475938",
    "sourceKey": "656a4f83-e567-4a34-ba21-236ffc54b6f3",
    "titleCode": 1,
    "titleName": "Introduction To Animal Kingdom",
    "durationInSeconds": 2310,
    "classificationLevel1": 1,
    "classificationLevel2": 1,
    "createdBy": "3c4f0321-7805-4110-a8a1-18790e9de023",
    "createdOn": 1754809057,
    "lastUpdatedBy": "3c4f0321-7805-4110-a8a1-18790e9de023",
    "lastUpdatedOn": 1754809057,
    "status": 1
  }
}
```

### 4. Upload Video
**POST** `/api/videos/upload`

**Request Body:** FormData with:
- `video`: Video file (MP4, AVI, MOV, etc.)
- `titleName`: Video title
- `titleCode`: Title code
- `sourceDirectory`: Source directory
- `sourceKey`: Source key
- `classificationLevel1`: Classification level 1
- `classificationLevel2`: Classification level 2
- `durationInSeconds`: Duration in seconds
- `status`: Status (1 for active, 0 for inactive)

**Response:**
```json
{
  "success": true,
  "message": "Video uploaded successfully",
  "videoId": 20001,
  "bunnyNetUrl": "https://cdn.bunny.net/video/uploaded-file.mp4"
}
```

### 5. Update Video
**PUT** `/api/videos/{videoId}`

**Request Body:**
```json
{
  "titleName": "Updated Video Title",
  "titleCode": 2,
  "classificationLevel1": 2,
  "classificationLevel2": 3,
  "status": 1
}
```

**Response:**
```json
{
  "success": true,
  "message": "Video updated successfully"
}
```

## Backend Implementation Notes

### 1. Video Upload Process
1. Receive video file via multipart/form-data
2. Validate file type and size
3. Generate unique `videoDisplayKey` (UUID)
4. Upload video to Bunny.net CDN
5. Extract video metadata (duration, etc.)
6. Save metadata to MySQL database
7. Return success response with video ID

### 2. Bunny.net Integration
- Use Bunny.net API for video uploads
- Store CDN URLs in database
- Handle upload progress and status updates
- Implement retry logic for failed uploads

### 3. Database Operations
- Use prepared statements for security
- Implement proper error handling
- Add transaction support for data consistency
- Include audit trail (createdBy, createdOn, etc.)

### 4. Security Considerations
- Validate file types and sizes
- Implement user authentication
- Sanitize input data
- Rate limiting for uploads
- Virus scanning for uploaded files

## Error Handling

### Common Error Responses
```json
{
  "success": false,
  "message": "Error description",
  "errorCode": "ERROR_CODE",
  "details": "Additional error details"
}
```

### Error Codes
- `INVALID_FILE_TYPE`: Unsupported video format
- `FILE_TOO_LARGE`: File exceeds size limit
- `UPLOAD_FAILED`: Bunny.net upload failed
- `DATABASE_ERROR`: Database operation failed
- `VALIDATION_ERROR`: Input validation failed

## Configuration

### Environment Variables
```bash
BUNNY_NET_API_KEY=your_bunny_net_api_key
BUNNY_NET_STORAGE_ZONE=your_storage_zone
BUNNY_NET_CDN_URL=https://cdn.bunny.net
MYSQL_HOST=localhost
MYSQL_DATABASE=your_database
MYSQL_USER=your_username
MYSQL_PASSWORD=your_password
MAX_FILE_SIZE=500MB
ALLOWED_VIDEO_TYPES=mp4,avi,mov,wmv,flv
```

## Testing

### Test Video Files
- Small video (1-5 MB) for quick testing
- Medium video (50-100 MB) for upload testing
- Large video (500+ MB) for performance testing

### API Testing Tools
- Postman for endpoint testing
- cURL for command-line testing
- Browser developer tools for frontend integration

## Monitoring and Logging

### Log Events
- Video upload attempts
- Upload success/failure
- Database operations
- API usage statistics
- Error occurrences

### Metrics to Track
- Upload success rate
- Average upload time
- Storage usage
- API response times
- Error rates by endpoint
