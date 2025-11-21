# Fix Outlook Email Sending for vigagency.com

The issue you're experiencing is because Outlook is using its own SMTP servers and showing the relay address. Here are several solutions:

## Solution 1: Use Cloudflare Email Workers (Best for Your Setup)
Since you're using Cloudflare Email Routing, add Email Workers for sending:

### Steps:
1. **In Cloudflare Dashboard:**
   - Go to Email > Email Routing
   - Click "Email Workers"
   - Create a new Email Worker

2. **Add this Email Worker code:**
```javascript
export default {
  async email(message, env, ctx) {
    // Allow sending from your domain
    const from = message.from;
    if (from.endsWith('@vigagency.com')) {
      // Process and forward the email
      await message.forward(message.to);
    }
  }
}
```

3. **Configure Outlook to use SMTP:**
   - Remove the current account setup
   - Add account as "Other Account" (not Outlook.com)
   - Use these settings:

## Solution 2: Configure Outlook Properly (Immediate Fix)

### Remove Current Setup:
1. In Outlook, go to File > Account Settings
2. Remove the current grant@vigagency.com account
3. Add it back with these settings:

### Add Account as IMAP/SMTP:
**Your Name:** Grant
**Email Address:** grant@vigagency.com

**Incoming mail (This won't work with just forwarding, skip):**
- Leave blank or use your Gmail IMAP

**Outgoing mail (SMTP) - Use a relay service:**

### Option A: Use Gmail SMTP (If you have Gmail)
```
SMTP Server: smtp.gmail.com
Port: 587
Encryption: STARTTLS
Username: your.gmail@gmail.com
Password: [Gmail App Password]
```
**Important:** In advanced settings, set "Reply-to" and "From" as grant@vigagency.com

### Option B: Use SendGrid SMTP (Recommended)
1. Sign up for SendGrid (free)
2. Verify vigagency.com domain
3. Create an API key
4. Use these settings:
```
SMTP Server: smtp.sendgrid.net
Port: 587
Encryption: STARTTLS
Username: apikey
Password: [Your SendGrid API Key]
From: grant@vigagency.com
```

### Option C: Use Brevo (formerly Sendinblue) - FREE
1. Sign up at brevo.com (free - 300 emails/day)
2. Verify vigagency.com
3. Get SMTP credentials
```
SMTP Server: smtp-relay.brevo.com
Port: 587
Username: [Your Brevo email]
Password: [Your Brevo password]
From: grant@vigagency.com
```

## Solution 3: Use a Professional Email Service

### Zoho Mail (Recommended for Small Teams)
**Free for up to 5 users!**

1. **Sign up at mail.zoho.com**
2. **Add domain vigagency.com**
3. **Update Cloudflare DNS:**
```
MX    @    mx.zoho.com     10
MX    @    mx2.zoho.com    20
MX    @    mx3.zoho.com    50
TXT   @    "v=spf1 include:zoho.com ~all"
```
4. **Create accounts:**
   - grant@vigagency.com
   - hunter@vigagency.com
   - maureen@vigagency.com

5. **Configure in Outlook:**
```
Email: grant@vigagency.com
Incoming (IMAP):
  Server: imap.zoho.com
  Port: 993
  SSL: Yes

Outgoing (SMTP):
  Server: smtp.zoho.com
  Port: 465
  SSL: Yes

Username: grant@vigagency.com
Password: [Your Zoho password]
```

## Solution 4: ImprovMX (Email Forwarding + SMTP)
**Free tier available - Good middle ground**

1. **Go to improvmx.com**
2. **Add domain vigagency.com**
3. **Update DNS in Cloudflare:**
```
MX    @    mx1.improvmx.com    10
MX    @    mx2.improvmx.com    20
TXT   @    "v=spf1 include:spf.improvmx.com ~all"
```
4. **Set up aliases:**
   - grant@vigagency.com → your personal email
5. **Get SMTP credentials (requires free account)**
6. **Configure Outlook with ImprovMX SMTP:**
```
SMTP Server: smtp.improvmx.com
Port: 587
Username: grant@vigagency.com
Password: [ImprovMX password]
```

## Immediate Action Plan:

### Step 1: Fix DNS Records in Cloudflare
Add these records if missing:
```
TXT   @    "v=spf1 include:spf.protection.outlook.com include:sendgrid.net include:_spf.mx.cloudflare.net ~all"
TXT   _dmarc    "v=DMARC1; p=quarantine; rua=mailto:admin@vigagency.com"
```

### Step 2: For Quick Fix with Current Setup
1. In Outlook, go to File > Options > Mail
2. Find "Send messages" section
3. Check "Always use the default account when composing new messages"
4. In account settings, set grant@vigagency.com as default "Reply-to" address

### Step 3: Best Long-term Solution
Use **Zoho Mail** (free) or **ImprovMX** for proper email hosting with SMTP access.

## Why This Happens:
- Cloudflare Email Routing only handles receiving (forwarding)
- When you send from Outlook, it uses Outlook's servers
- The "on behalf of" appears because Outlook is sending for an address it doesn't own
- You need proper SMTP authentication to send as grant@vigagency.com

## My Recommendation:
1. **Immediate:** Set up SendGrid or Brevo SMTP in Outlook
2. **Better:** Use Zoho Mail (free for 5 users, includes webmail and mobile apps)
3. **Keep:** Cloudflare Email Routing as backup

Would you like me to help you set up any of these solutions?