# Quick SendGrid Setup for Outlook (5 minutes)

## Step 1: Create SendGrid Account
1. Go to https://signup.sendgrid.com/
2. Sign up for free account (100 emails/day free)
3. Verify your email

## Step 2: Verify Your Domain
1. In SendGrid Dashboard, go to Settings > Sender Authentication
2. Click "Authenticate Your Domain"
3. Choose DNS host: "Cloudflare"
4. Enter domain: "vigagency.com"
5. SendGrid will give you DNS records to add

## Step 3: Add DNS Records in Cloudflare
Add these CNAME records to vigagency.com in Cloudflare:
```
CNAME    em1234    sendgrid.net
CNAME    s1._domainkey    s1.domainkey.u1234.wl.sendgrid.net
CNAME    s2._domainkey    s2.domainkey.u1234.wl.sendgrid.net
```
(The exact values will be provided by SendGrid)

## Step 4: Create API Key
1. In SendGrid: Settings > API Keys
2. Click "Create API Key"
3. Name: "Outlook SMTP"
4. Permission: "Restricted Access"
5. Enable: Mail Send (only)
6. Copy the API key (starts with SG.)

## Step 5: Configure Outlook

### Remove Current Account:
1. File > Account Settings > Account Settings
2. Select grant@vigagency.com
3. Click Remove

### Add New Account:
1. Click "New"
2. Choose "Manual setup or additional server types"
3. Choose "POP or IMAP"

### Enter These Settings:
**Account Information:**
- Your Name: Grant
- Email Address: grant@vigagency.com
- Account Type: IMAP

**Incoming Mail Server:**
- Server: imap.gmail.com (use your Gmail)
- Port: 993
- Encryption: SSL/TLS
- Username: your.gmail@gmail.com
- Password: [Your Gmail password]

**Outgoing Mail Server (SMTP):**
- Server: smtp.sendgrid.net
- Port: 587
- Encryption: STARTTLS
- Username: apikey (literally type "apikey")
- Password: [Your SendGrid API Key from Step 4]

### Important Settings:
1. Click "More Settings"
2. Go to "Outgoing Server" tab
3. Check "My outgoing server requires authentication"
4. Select "Use same settings as incoming" = NO
5. Select "Log on using"
6. Username: apikey
7. Password: [SendGrid API Key]

### Advanced Tab:
- Incoming: 993, SSL/TLS
- Outgoing: 587, STARTTLS

## Step 6: Test
1. Click "Test Account Settings"
2. Send a test email
3. Check that it shows "From: grant@vigagency.com" (no "on behalf of")

## Alternative: Use Outlook Web Add-in

If you prefer, you can use Outlook Web:
1. Go to outlook.com
2. Settings > Mail > Sync email
3. Add account
4. Use SendGrid SMTP details above

## Troubleshooting:

**If still showing "on behalf of":**
1. In Outlook, create new email
2. Click "Options" tab
3. Click "From" button
4. Make sure grant@vigagency.com is selected
5. In account settings, set this as default

**If authentication fails:**
1. Make sure username is literally "apikey"
2. Password is your SendGrid API key
3. Try port 465 with SSL/TLS instead

## Success Indicators:
✅ Emails show "From: grant@vigagency.com"
✅ No "on behalf of" text
✅ Recipients can reply directly to grant@vigagency.com
✅ Emails don't go to spam

## For Hunter and Maureen:
Repeat the same process with:
- hunter@vigagency.com
- maureen@vigagency.com

They can all use the same SendGrid account/API key.

Need help? The SendGrid support is excellent and free tier includes support.