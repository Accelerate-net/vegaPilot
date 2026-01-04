# Candidate Profile API Integration

## Overview
The candidate-profile.html page has been integrated with the backend API to fetch real student data from the server.

## API Endpoint
**URL:** `http://localhost:3000/restricted/people/list-candidates.php`

**Method:** GET

**Headers:**
- `X-Access-Token`: Authentication token (stored in localStorage)

## Request Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| page | number | Yes | Page number (1-indexed) |
| size | number | Yes | Number of records per page |
| sortBy | string | No | Field to sort by (name, email, mobile, totalCourseEnrollments, joinedDate, status) |
| searchKey | string | No | Search term for filtering students by name, email, or mobile |
| status | string | No | Filter by status (active, inactive, blocked) |

## Response Format
```json
{
  "success": true,
  "data": [
    {
      "id": 123,
      "candidateKey": "CAND-2024-001",
      "name": "John Doe",
      "email": "john@example.com",
      "mobile": "+91 9876543210",
      "registeredMobile": "+91 9876543210",
      "communicationMobile": "+91 9876543210",
      "photo": "base64-encoded-string",
      "totalCourseEnrollments": 3,
      "totalTestSeriesEnrollments": 2,
      "status": "Active",
      "statusCode": 1,
      "blocked": false,
      "joinedDate": 1704067200,
      "lastUpdated": 1704153600,
      "dob": "2000-01-15",
      "gender": "Male",
      "place": "City Name",
      "fatherName": "Father Name",
      "motherName": "Mother Name",
      "aspiration": "Career Goal",
      "classOfStudy": "12th",
      "board": "CBSE",
      "yearOfPassing": "2024",
      "lastInstitution": "School Name"
    }
  ],
  "meta": {
    "page": 1,
    "size": 10,
    "total": 150,
    "totalPages": 15
  }
}
```

## Implementation Details

### Controller Changes (candidate-profile.js)
1. **Added $http dependency** for making API calls
2. **API Configuration**:
   - Base URL: `http://localhost:3000/restricted/people`
   - Token stored in `localStorage.getItem('X-Access-Token')`

3. **Data Mapping**:
   - API response fields are mapped to the existing data structure
   - `photo` field (base64) is converted to data URL format
   - `joinedDate` (timestamp) is converted to JavaScript Date object
   - Status is normalized to lowercase
   - Blocked status is handled separately

4. **Pagination**:
   - Changed from client-side to server-side pagination
   - Uses API metadata for total count and page numbers
   - Page navigation triggers new API calls

5. **Search & Filtering**:
   - Search input triggers API call with `searchKey` parameter
   - Status filter passes to API via `status` parameter
   - All filtering happens server-side

6. **Sorting**:
   - Column sorting triggers API call with `sortBy` parameter
   - Column names are mapped to API field names:
     - name → name
     - email → email
     - mobile → mobile
     - coursesCount → totalCourseEnrollments
     - enrollmentDate → joinedDate
     - status → status

### HTML Changes (candidate-profile.html)
1. **Statistics**:
   - Total Students now shows `totalStudents` from API metadata
   - Active Students calculated from current page data
   - Enrollments summed from `totalCourseEnrollments` field

2. **Table Display**:
   - Enrolled courses count uses `totalCourseEnrollments` instead of `enrolledCourses.length`
   - Avatar displays base64 photo from API

3. **Pagination**:
   - Shows total count from API metadata
   - Page numbers calculated from `totalPages`

## Authentication
The API requires authentication via the `X-Access-Token` header. The token should be:
1. Stored in localStorage with key `X-Access-Token`
2. Set during login process
3. Included in all API requests

## Error Handling
1. **401 Unauthorized**: Shows alert to login again
2. **Network Error**: Shows generic error message
3. **Empty Response**: Shows empty state in table
4. **API Error**: Logs to console and shows alert with error message

## Testing the Integration

### Prerequisites
1. Ensure the backend API is running on `localhost:3000`
2. Set the authentication token in localStorage

### Setting the Authentication Token
Open the browser console on candidate-profile.html and run:
```javascript
localStorage.setItem('X-Access-Token', 'your-token-here');
```
Then reload the page.

### Testing Features
1. Open candidate-profile.html in the browser
2. Check the browser console for API request/response logs
3. Test the following features:
   - Initial load (should fetch page 1)
   - Search functionality
   - Status filtering
   - Column sorting
   - Pagination (next, previous, page numbers)

## Troubleshooting

### Error: "Failed to load students: Please check console for details"
**Possible causes:**
1. **Authentication token not set**
   - Solution: Set the token in localStorage as shown above
   - Check: Open console and run `localStorage.getItem('X-Access-Token')`

2. **Backend API not running**
   - Solution: Start the backend server on localhost:3000
   - Check: Open `http://localhost:3000` in browser

3. **CORS issues**
   - Solution: Ensure the backend allows CORS from your frontend domain
   - Check: Look for CORS errors in browser console

4. **Wrong API response format**
   - Solution: Check the actual API response format in console logs
   - The code expects: `{success: true, data: [...], meta: {...}}`

### Error: "Authentication failed. Please login again."
**Cause:** The token is invalid or expired
**Solution:**
1. Login again to get a new token
2. Update localStorage with the new token

### No data showing
**Check:**
1. Open browser console (F12)
2. Look for the log: "Loading students from API:" - check the URL and params
3. Look for the log: "API Response:" - check what data is returned
4. Verify the API is returning data in the expected format

### Students showing but images not loading
**Cause:** Photo field might be empty or invalid base64
**Solution:** This is normal if students don't have photos uploaded

## Known Limitations
1. **Enrolled Courses Details**: The `enrolledCourses` array is set to empty. A separate API endpoint would be needed to fetch detailed course enrollment data for each student.
2. **Revenue Calculation**: Returns '0' as it requires a separate API endpoint.
3. **Course Filter**: The course filter dropdown would need an API to list all courses first.

## Future Enhancements
1. Add API endpoint for fetching student's enrolled courses
2. Add API endpoint for calculating total revenue
3. Add API endpoint for listing all available courses
4. Implement debouncing for search input to reduce API calls
5. Add loading states for better UX
6. Cache API responses for better performance
