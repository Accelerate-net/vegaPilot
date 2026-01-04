# Authentication Token Setup

## Automatic Token Setup

The instructor-portfolio page now automatically sets a default development token if none is found in localStorage.

**Default Token**:
```
p0KvoohF9/2bIRBWA+ThNREjJLVuBdxjlckNJvrg7XlWMGbozceQIda1C2Ws6HwkA8haETkp2rMLk0uxc9ZgbXDJX5McCTlBeR2zdWp03bNIBDwfuHEMSMncoa/GUuj49oqrtPAcsMkcOASdMbkfswuTsXBDwvHYsgGcSxdbpxk=
```

## Manual Token Management

### View Current Token
Open browser console and run:
```javascript
console.log('Current token:', localStorage.getItem('authToken'));
```

### Set a New Token
To use a different token:
```javascript
localStorage.setItem('authToken', 'your-new-token-here');
```

### Remove Token
To clear the token:
```javascript
localStorage.removeItem('authToken');
```

### Alternative: Use Cookie
If you prefer cookies:
```javascript
document.cookie = "authToken=your-token-here; path=/";
```

## Token Priority

The system checks for tokens in this order:
1. `localStorage.getItem('authToken')`
2. `localStorage.getItem('X-Access-Token')`
3. Cookie: `authToken`
4. Cookie: `X-Access-Token`
5. **Fallback**: Auto-sets default development token

## How It Works

When `instructor-portfolio.html` loads:
1. The controller checks for an existing token
2. If no token is found, it automatically sets the default development token
3. All API calls use this token in the `X-Access-Token` header

## Testing

1. **Open instructor-portfolio.html in browser**
2. **Open browser console (F12)**
3. **Check for token setup message**:
   ```
   No auth token found. Setting default token for development.
   ```
4. **Verify token is set**:
   ```javascript
   localStorage.getItem('authToken')
   ```

## Production Setup

For production, implement a proper login flow:

1. **Login Page**: User enters credentials
2. **API Call**: Backend validates and returns token
3. **Store Token**: Save to localStorage
4. **Redirect**: Send user to main application
5. **Auto-logout**: Clear token on logout

Example login flow:
```javascript
// Login function
function login(username, password) {
    fetch('/api/login', {
        method: 'POST',
        body: JSON.stringify({ username, password })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            localStorage.setItem('authToken', data.token);
            window.location.href = 'instructor-portfolio.html';
        }
    });
}

// Logout function
function logout() {
    localStorage.removeItem('authToken');
    window.location.href = 'login.html';
}
```

## Security Notes

⚠️ **Important**:
- Default token is for DEVELOPMENT ONLY
- Never commit production tokens to git
- Use environment variables for production tokens
- Implement proper authentication in production
- Consider token expiration and refresh mechanisms
- Use HTTPS in production to protect tokens in transit

## Troubleshooting

### API Returns "Access Token missing"
1. Check browser console for token setup message
2. Verify token in localStorage: `localStorage.getItem('authToken')`
3. Check Network tab for `X-Access-Token` header in requests
4. Try manually setting the token (see above)

### Token Not Being Sent
1. Clear browser cache and reload
2. Check that angular-cookies.min.js is loaded
3. Verify no JavaScript errors in console
4. Check Network tab to see actual headers being sent

### Need to Switch Tokens
```javascript
// Quick token switch
localStorage.setItem('authToken', 'new-token-here');
location.reload(); // Reload page to use new token
```
