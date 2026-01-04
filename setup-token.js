/**
 * Token Setup Script for VegaPilot
 *
 * This script sets the authentication token in localStorage for API calls.
 *
 * Usage:
 * 1. Open candidate-profile.html in your browser
 * 2. Open the browser console (F12)
 * 3. Copy and paste this entire script into the console
 * 4. Press Enter
 * 5. Reload the page
 *
 * Note: The token contains special characters (+, /, =) which are URL-safe
 * and will be handled correctly by the browser.
 */

(function() {
    // Production token (from your CURL command)
    var prodToken = '0oR3KPgsC4DbHPT1JvO6tGpkEwSp40qVPViVAEYBFxluNZI+m6B0KxFHcrhG6tSWMK/x2nTVWnbBqXF3zeSxQPyDC+F6BeyIVlY7/2a9wmjpHDBB4/XmguOxICUP+Vgb82pSboxV3KpJJA4N77yk+xv9IVzejx6pyfNgQcsHS9Q=';

    // Development token (same as instructor-portfolio.js for compatibility)
    var devToken = 'p0KvoohF9/2bIRBWA+ThNREjJLVuBdxjlckNJvrg7XlWMGbozceQIda1C2Ws6HwkA8haETkp2rMLk0uxc9ZgbXDJX5McCTlBeR2zdWp03bNIBDwfuHEMSMncoa/GUuj49oqrtPAcsMkcOASdMbkfswuTsXBDwvHYsgGcSxdbpxk=';

    // Choose which token to use (set useProd to false to use dev token)
    var useProd = true;
    var token = useProd ? prodToken : devToken;

    // Set the token in localStorage using both keys for compatibility
    localStorage.setItem('authToken', token);
    localStorage.setItem('X-Access-Token', token);

    console.log('✅ Token has been set successfully!');
    console.log('📝 Using:', useProd ? 'Production token' : 'Development token');
    console.log('📝 Stored as: authToken (primary) and X-Access-Token (fallback)');
    console.log('📝 Token length:', token.length, 'characters');
    console.log('🔄 Please reload the page to start using the API.');
    console.log('');
    console.log('Token preview:', token.substring(0, 50) + '...');

    // Verify the token was saved
    var savedToken = localStorage.getItem('authToken');
    if (savedToken === token) {
        console.log('✓ Token verified in localStorage');
        console.log('✓ Token matches exactly');
    } else {
        console.error('✗ Token verification failed');
        console.error('Expected length:', token.length);
        console.error('Saved length:', savedToken ? savedToken.length : 0);
    }
})();
