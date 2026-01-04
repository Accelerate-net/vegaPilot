# Instructor Portfolio API Integration

## Overview
Updated `instructor-portfolio.html` and `controllers/instructor-portfolio.js` to integrate with the actual backend APIs.

## API Endpoints Integrated

### 1. **Get Instructors Metadata**
```
GET /restricted/people/instructors-metadata.php
```
- **Purpose**: Fetch statistics for dashboard tiles
- **Response Fields Used**:
  - `totalInstructors` - Total number of instructors
  - `activeInstructors` - Number of active instructors
  - `totalSubjects` - Number of unique subjects
  - `avgExperience` - Average years of experience

### 2. **List Instructors**
```
GET /restricted/people/list-instructors.php
```
- **Query Parameters**:
  - `page` - Page number (default: 1)
  - `size` - Items per page (default: 10)
  - `sortBy` - Sort field (name, subject, experience)
  - `filterBy` - Filter by subject
  - `searchKey` - Search term
- **Response Fields**:
  - `instructors` - Array of instructor objects
  - `total` - Total count

### 3. **Add New Instructor**
```
POST /restricted/people/add-new-instructor.php
```
- **Form Data Fields**:
  - `name` (required)
  - `brief` (required)
  - `expertSubject` (required)
  - `qualifications` (required)
  - `experienceYears` (required)
  - `email` (optional)
  - `mobile` (optional)
  - `photo` (optional file)

### 4. **Update Instructor**
```
POST /restricted/people/update-instructor.php?id={instructorId}
```
- **Form Data Fields**: Same as Add New Instructor

## Authentication

### Automatic Token Setup ✅
The system now **automatically sets a default development token** if none is found!

When the page loads:
1. Checks for existing token in localStorage/cookies
2. If no token found, automatically sets development token
3. Logs a warning message to console

**No manual setup required for development!**

### Token Management
The controller checks for authentication token in this order:
1. `localStorage.getItem('authToken')`
2. `localStorage.getItem('X-Access-Token')`
3. `$cookies.get('authToken')`
4. `$cookies.get('X-Access-Token')`
5. **Fallback**: Auto-sets default token

### Manual Token Override (Optional)
To use a different token:
```javascript
localStorage.setItem('authToken', 'your-custom-token-here');
location.reload(); // Reload to use new token
```

📖 **See [TOKEN_SETUP.md](TOKEN_SETUP.md) for complete token management guide**

## Changes Made

### Controller Updates (`controllers/instructor-portfolio.js`)

1. **Added Dependencies**:
   - Added `ngCookies` module
   - Added `$http` and `$cookies` services

2. **API Configuration**:
   ```javascript
   $scope.apiBaseUrl = 'http://localhost:3000/restricted/people';
   ```

3. **New Functions**:
   - `getAuthToken()` - Retrieves auth token from storage
   - `getHttpConfig()` - Returns HTTP config with auth headers
   - `getFormDataConfig()` - Returns config for file uploads
   - `loadMetadata()` - Fetches dashboard statistics
   - `loadMockData()` - Fallback data for development

4. **Updated Functions**:
   - `loadInstructors()` - Now calls API with pagination/filters
   - `saveInstructor()` - Uses FormData to POST to API
   - `getActiveInstructors()` - Returns from metadata
   - `getTotalSubjects()` - Returns from metadata
   - `getAverageExperience()` - Returns from metadata
   - Added `getTotalInstructors()` - Returns from metadata

5. **New State Variables**:
   ```javascript
   $scope.currentPage = 1;
   $scope.pageSize = 10;
   $scope.totalInstructors = 0;
   $scope.metadata = { ... };
   ```

### HTML Updates (`instructor-portfolio.html`)

1. **Statistics Display**:
   - Changed `instructors.length` to `getTotalInstructors()`
   - All stat cards now use metadata from API

2. **Module Declaration**:
   - Requires `angular-cookies.min.js` to be included

## Field Mapping

API uses slightly different field names than the frontend:

| Frontend Field | API Field |
|---------------|-----------|
| `experience` | `experienceYears` |
| `phone` | `mobile` |

The controller handles this mapping automatically in the `saveInstructor()` function.

## Error Handling

1. **API Failures**: Falls back to mock data for development
2. **Missing Token**: Logs error and uses fallback data
3. **Failed Saves**: Shows alert with error message
4. **Network Errors**: Console logs and shows user-friendly alert

## Testing

### 1. Set Auth Token
```javascript
localStorage.setItem('authToken', 'p0KvoohF9/2bIRBWA+ThNREjJLVuBdxjlckNJvrg7XlWMGbozceQIda1C2Ws6HwkA8haETkp2rMLk0uxc9ZgbXDJX5McCTlBeR2zdWp03bNIBDwfuHEMSMncoa/GUuj49oqrtPAcsMkcOASdMbkfswuTsXBDwvHYsgGcSxdbpxk=');
```

### 2. Test List Endpoint
Open browser console and check network tab for:
- GET request to `list-instructors.php`
- Proper auth headers
- Response data

### 3. Test Create/Update
- Click "Add New Instructor"
- Fill in all fields
- Submit and check network tab for POST request

## Next Steps

1. ✅ Metadata API integration
2. ✅ List instructors with pagination/filters
3. ✅ Create new instructor
4. ✅ Update existing instructor
5. ⏳ Delete instructor (API endpoint needed)
6. ⏳ Photo upload handling
7. ⏳ Pagination controls in UI
8. ⏳ Better error messages/toasts

## Dependencies Required

Make sure these are included in the HTML (in this order):
```html
<script type="text/javascript" src="assets/js/angular.min.js"></script>
<script type="text/javascript" src="assets/js/angular-cookies.min.js"></script>
<!-- ... other scripts ... -->
<script src="controllers/instructor-portfolio.js"></script>
```

✅ **Fixed**: Added `angular-cookies.min.js` to instructor-portfolio.html (line 1169)

## API Response Format

The controller now handles **both response formats**:

### Format 1: Standard Success/Error
```json
{
  "success": true,
  "data": {
    // ... response data
  },
  "message": "Success message"
}
```

### Format 2: Status-based (Actual API Format)
```json
{
  "status": "success",
  "meta": {
    "total": 4,
    "page": 1,
    "size": 10
  },
  "data": [
    // ... array of instructors
  ]
}
```

### List Instructors Response Example
```json
{
  "status": "success",
  "meta": {
    "page": 1,
    "size": 5,
    "total": 4,
    "totalPages": 1,
    "sortBy": "name",
    "filterBy": "all",
    "searchKey": ""
  },
  "data": [
    {
      "id": 1000,
      "name": "John Doe",
      "brief": "Expert instructor",
      "expertSubject": "Mathematics",
      "qualifications": "PhD in Math",
      "experienceYears": 10,
      "photo": "https://example.com/avatar.jpg",
      "status": 1,
      "createdOn": 192499999,
      "lastUpdatedOn": 192499999,
      "lastUpdatedBy": "userId"
    }
  ]
}
```

**Response Fields**:
- `id` - Unique instructor ID
- `name` - Full name
- `brief` - Short description
- `expertSubject` - Area of expertise
- `qualifications` - Educational credentials
- `experienceYears` - Years of experience (mapped to `experience` for display)
- `photo` - Photo URL (null if no photo)
- `status` - 1 = active, 0 = inactive
- `createdOn` - Unix timestamp
- `lastUpdatedOn` - Unix timestamp
- `lastUpdatedBy` - User ID who last updated

### Error Response
```json
{
  "status": "failed",
  "error": "Error message"
}
```

The controller automatically detects and handles both formats!
