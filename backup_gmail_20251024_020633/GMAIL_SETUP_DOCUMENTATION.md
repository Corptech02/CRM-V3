# Gmail Integration Backup Documentation
Date: 2024-10-24

## Current Gmail Setup

### Files Backed Up
- All Gmail integration JavaScript files
- Gmail authentication files
- Server configuration with Gmail routes
- Environment variables (.env)

### Key Components
1. **Backend Gmail Service**: gmail-service.js, gmail-imap-service.js
2. **Frontend Integration**: coi-gmail-integration.js, coi-gmail-override.js
3. **Authentication**: gmail-auth.html, gmail auth setup files
4. **Server Routes**: gmail-routes.js integrated in server.js

### Current Configuration
- Gmail OAuth2 authentication
- IMAP access for reading emails
- API endpoints for COI Management integration
- Token storage in backend

### Restoration Instructions
To restore Gmail functionality:
1. Copy all files from this backup directory to their original locations
2. Restart the backend server: `pm2 restart vanguard-backend`
3. Check .env file for Gmail credentials
4. Re-authenticate if needed through /gmail-auth.html

## API Endpoints
- GET /api/gmail/emails - Fetch emails
- POST /api/gmail/send - Send email
- GET /api/gmail/auth/status - Check auth status
- GET /auth/gmail - OAuth callback

## Important Notes
- Gmail tokens stored in backend
- Refresh token mechanism implemented
- COI Management tab uses these endpoints for inbox functionality