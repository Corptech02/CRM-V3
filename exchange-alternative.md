# Exchange Email Issue - Alternative Solutions

## The Problem
Your email **contact@vigagency.com** trunks through Exchange Server, which blocks standard IMAP authentication. This is why we're getting "LOGIN failed" errors.

## Current Status
✅ System is configured correctly
✅ Showing real authentication errors (NO mock data)
✅ Error messages explain the Exchange issue
❌ Cannot access emails due to Exchange IMAP restrictions

## Solutions

### Option 1: Enable IMAP on Exchange
Contact your IT administrator and request:
- Enable IMAP protocol for contact@vigagency.com
- Allow basic authentication for IMAP (if using Exchange Online)
- Or create an app password if 2FA is enabled

### Option 2: Use a Different Email Account
Set up the COI inbox with an email that supports IMAP:
- Personal Gmail account
- Personal Outlook.com account
- Any standard email provider

To switch emails:
1. Edit `/var/www/vanguard/backend/.env`
2. Update OUTLOOK_EMAIL and OUTLOOK_PASSWORD
3. Run: `pm2 restart vanguard-backend`

### Option 3: OAuth2 Integration (Complex)
Exchange Online requires OAuth2/Modern Authentication:
1. Register app in Azure AD
2. Get client ID and secret
3. Implement OAuth2 flow
4. Use Microsoft Graph API instead of IMAP

This requires significant code changes.

### Option 4: Manual Email Management
Continue using the COI system without email integration:
- Manually check emails in Outlook
- Upload COI certificates manually
- System still tracks and manages certificates

## Quick Test with Another Email
If you have access to another email account, we can test immediately:
```bash
# Edit the .env file
nano /var/www/vanguard/backend/.env

# Change these lines:
OUTLOOK_EMAIL=your-other-email@gmail.com
OUTLOOK_PASSWORD=your-password

# Restart
pm2 restart vanguard-backend
```

## Summary
Exchange Server environments typically block IMAP for security. The quickest solution is using a different email account that supports standard IMAP access.