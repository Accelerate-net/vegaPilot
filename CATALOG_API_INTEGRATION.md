# Catalog API Integration Documentation

## Overview
This document describes the API integration for the catalog management system in catalog.html and catalog.js.

## API Endpoints

### 1. List Catalog Items
**Endpoint:** `GET /restricted/catalog/list-catalog.php`

**Parameters:**
- `page` (number): Page number for pagination
- `size` (number): Items per page
- `sortBy` (string): Field to sort by (e.g., "createdOn", "name")
- `searchKey` (string, optional): Search query
- `filterBy` (string, optional): Filter field (e.g., "type")
- `filterValue` (string, optional): Filter value

**Headers:**
- `X-Access-Token`: Authentication token
- `Content-Type`: application/json

**Sample Response:**
```json
{
    "status": "success",
    "page": 1,
    "size": 15,
    "total": 4,
    "totalPages": 1,
    "sortBy": "createdOn",
    "sortOrder": "DESC",
    "data": [
        {
            "id": 7,
            "code": "CR0006",
            "type": 1,
            "typeText": "Course",
            "originalPrice": 599000,
            "sellingPrice": 499000,
            "displayImage": "https://cdn.example.com/image.jpeg",
            "taxDetails": [...],
            "otherDetails": {...},
            "title": "Dream IISER - IAT 2025 Crash Course",
            "brief": "Course brief",
            "coursePage": "url-1",
            "isDiscountApplicable": 1,
            "createdBy": "...",
            "createdOn": 1767372701,
            "status": 1,
            "statusText": "Active"
        }
    ]
}
```

### 2. Add New Catalog Item
**Endpoint:** `POST /restricted/catalog/add-new-catalog-item.php`

**Content-Type:** `multipart/form-data`

**Headers:**
- `X-Access-Token`: Authentication token

**Form Fields:**
- `code` (string): Catalog item code (e.g., "CR0006")
- `type` (string): "COURSE" or "TEST_SERIES"
- `originalPrice` (number): Original price in paise
- `sellingPrice` (number): Selling price in paise
- `title` (string): Item title
- `brief` (string): Brief description
- `coursePage` (string): Course page URL
- `isDiscountApplicable` (string): "true" or "false"
- `taxDetails` (JSON string): Tax information array
- `otherDetails` (JSON string): Additional details object
- `displayImage` (file): Image file upload

**Example cURL:**
```bash
curl --location 'localhost:3000/restricted/catalog/add-new-catalog-item.php' \
--header 'X-Access-Token: TOKEN_HERE' \
--form 'code="CR0006"' \
--form 'type="COURSE"' \
--form 'originalPrice="599000"' \
--form 'sellingPrice="499000"' \
--form 'title="Dream IISER - IAT 2025 Crash Course"' \
--form 'brief="Course description"' \
--form 'coursePage="url-1"' \
--form 'isDiscountApplicable="true"' \
--form 'taxDetails="[{\"type\":\"TAX\",\"mode\":\"PERCENTAGE\",\"code\":\"GST\",\"label\":\"Total GST\",\"value\":\"1800\"}]"' \
--form 'otherDetails="{\"commencement\":\"5 April, 2025\",\"conclusion\":\"25 May, 2025\"}"' \
--form 'displayImage=@"/path/to/image.jpg"'
```

### 3. Update Catalog Item
**Endpoint:** `POST /restricted/catalog/update-catalog-item.php?id={id}`

**Content-Type:** `multipart/form-data`

**Headers:**
- `X-Access-Token`: Authentication token

**Form Fields:** (Same as Add New Catalog Item)

**URL Parameters:**
- `id` (number): Catalog item ID to update

## Implementation Details

### Controller (catalog.js)

#### API Configuration
```javascript
$scope.apiBaseUrl = 'http://localhost:3000/restricted/catalog';
```

#### Authentication
Uses the same token management pattern as other controllers:
- Checks localStorage for 'authToken' or 'X-Access-Token'
- Falls back to default development token if not found
- Token is sent in X-Access-Token header

#### Key Functions

**loadCatalog()**
- Fetches catalog items from the API
- Handles pagination, search, and filtering
- Updates catalog display and metadata
- Shows loading state during fetch

**saveCatalog()**
- Creates or updates catalog items via API
- Validates required fields
- Prepares FormData for multipart upload
- Handles image file uploads
- Shows success/error messages

**applyFilters()**
- Resets pagination to page 1
- Triggers loadCatalog() with current filters
- Server-side filtering instead of client-side

#### Pagination
- `currentPage`: Current page number
- `itemsPerPage`: Items per page (default: 15)
- `totalItems`: Total number of items
- `totalPages`: Total number of pages
- Functions: `previousPage()`, `nextPage()`, `goToPage(page)`, `getPageNumbers()`

#### Loading States
- `isLoading`: Boolean flag for loading overlay
- `loadingMessage`: Message to display during loading
- `showLoading(message)`: Show loading overlay
- `hideLoading()`: Hide loading overlay

### Data Mapping

**API Response → Local Structure:**
```javascript
{
    id: item.id,
    code: item.code,
    type: item.type,
    typeText: item.typeText,
    fk_id_exam_series: item.fk_id_exam_series,
    fk_id_course_bundle: item.fk_id_course_bundle,
    originalPrice: item.originalPrice,
    sellingPrice: item.sellingPrice,
    displayImage: item.displayImage || '',
    taxDetails: item.taxDetails,
    otherDetails: item.otherDetails,
    title: item.title,
    brief: item.brief,
    coursePage: item.coursePage,
    isDiscountApplicable: item.isDiscountApplicable,
    createdBy: item.createdBy,
    createdOn: item.createdOn,
    status: item.status,
    statusText: item.statusText
}
```

### HTML Updates

#### Loading Overlay
Added at the end of the body:
```html
<div class="loading-overlay" ng-class="{active: isLoading}">
   <div class="loading-content">
      <div class="spinner"></div>
      <div class="loading-text">{{loadingMessage}}</div>
   </div>
</div>
```

#### Pagination Controls
Should be added where catalog items are displayed (implementation depends on existing HTML structure)

## Testing

### Setup Token
1. Open browser console on catalog.html
2. Run:
```javascript
localStorage.setItem('authToken', 'YOUR_TOKEN_HERE');
```

### Test Scenarios
1. **Load Catalog**: Page should load catalog items from API
2. **Search**: Enter search query, should filter results via API
3. **Filter by Type**: Select Course/Test Series, should filter via API
4. **Add New Item**: Fill form and submit, should create new catalog item
5. **Edit Item**: Click edit, modify, and save, should update via API
6. **Pagination**: Navigate between pages, should load different pages

## Error Handling

- API errors are logged to console
- User-friendly error messages shown via toaster
- Loading overlay hides on error
- Failed requests don't break the UI

## Notes

- All prices are stored in paise (1/100th of rupee)
- Type 1 = Course, Type 2 = Test Series
- Image uploads use multipart/form-data
- Tax details and other details are JSON strings
- Server handles pagination, sorting, and filtering
