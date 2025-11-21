# Email Setup Guide for vigagency.com

Since installing a full mail server requires root privileges, I recommend one of these alternative solutions:

## Option 1: Email Forwarding Service (Recommended)
Use Cloudflare Email Routing (FREE) since you're already using Cloudflare:

### Steps:
1. **Log into Cloudflare Dashboard**
2. **Go to Email > Email Routing** for vigagency.com
3. **Enable Email Routing**
4. **Create custom addresses:**
   - info@vigagency.com → forwards to your personal Gmail
   - support@vigagency.com → forwards to your personal Gmail
   - sales@vigagency.com → forwards to your personal Gmail
   - [name]@vigagency.com → forwards to respective personal emails

### Required DNS Records in Cloudflare:
```
Type: MX
Name: @
Mail server: route1.mx.cloudflare.net
Priority: 1

Type: MX
Name: @
Mail server: route2.mx.cloudflare.net
Priority: 2

Type: MX
Name: @
Mail server: route3.mx.cloudflare.net
Priority: 3

Type: TXT
Name: @
Content: "v=spf1 include:_spf.mx.cloudflare.net ~all"
```

## Option 2: Google Workspace (Professional)
- $6/user/month for professional email
- Includes Gmail interface, 30GB storage
- Professional appearance with @vigagency.com

### Setup:
1. Sign up at workspace.google.com
2. Verify domain ownership
3. Add MX records to Cloudflare:
```
ASPMX.L.GOOGLE.COM - Priority 1
ALT1.ASPMX.L.GOOGLE.COM - Priority 5
ALT2.ASPMX.L.GOOGLE.COM - Priority 5
ALT3.ASPMX.L.GOOGLE.COM - Priority 10
ALT4.ASPMX.L.GOOGLE.COM - Priority 10
```

## Option 3: Zoho Mail (Budget-Friendly)
- Free for up to 5 users (with 5GB storage each)
- Professional interface
- Mobile apps available

### Setup:
1. Sign up at zoho.com/mail
2. Add domain and verify
3. Add MX records to Cloudflare:
```
mx.zoho.com - Priority 10
mx2.zoho.com - Priority 20
mx3.zoho.com - Priority 50
```

## Option 4: ForwardEmail.net (Developer-Friendly)
- Free email forwarding
- Can send emails via SMTP
- Privacy-focused

### Setup:
1. Go to forwardemail.net
2. Add domain vigagency.com
3. Add DNS records:
```
Type: MX
Name: @
Value: mx1.forwardemail.net
Priority: 10

Type: MX
Name: @
Value: mx2.forwardemail.net
Priority: 20

Type: TXT
Name: @
Value: "forward-email=user@gmail.com"
```

## Option 5: Self-Hosted (Requires Root Access)
If you get root access later, we can install:
- Postfix + Dovecot + Roundcube
- Mail-in-a-Box
- docker-mailserver

### Requirements:
- Root access to VPS
- Static IP (you have: 162.220.14.239)
- Proper PTR record (reverse DNS)
- Open ports: 25, 587, 993, 995

## Sending Emails from Your Application

For sending emails from your Vanguard application, you can use:

### 1. SMTP Service (SendGrid, Mailgun, etc.)
```javascript
// Example with Nodemailer + SendGrid
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: 'smtp.sendgrid.net',
  port: 587,
  auth: {
    user: 'apikey',
    pass: 'YOUR_SENDGRID_API_KEY'
  }
});

// Send email
await transporter.sendMail({
  from: 'info@vigagency.com',
  to: 'client@example.com',
  subject: 'Insurance Quote',
  html: '<p>Your quote is ready!</p>'
});
```

### 2. API-based (Recommended for your app)
```javascript
// Using SendGrid API directly
const sgMail = require('@sendgrid/mail');
sgMail.setApiKey('YOUR_SENDGRID_API_KEY');

const msg = {
  to: 'client@example.com',
  from: 'info@vigagency.com',
  subject: 'Insurance Quote',
  text: 'Your quote is ready!',
  html: '<strong>Your quote is ready!</strong>',
};

sgMail.send(msg);
```

## Immediate Recommendation

For your current needs, I recommend:

1. **Use Cloudflare Email Routing** for receiving emails (FREE)
2. **Use SendGrid or Mailgun** for sending emails from your app (Free tier available)
3. **Set up these addresses:**
   - info@vigagency.com
   - support@vigagency.com
   - sales@vigagency.com
   - hunter@vigagency.com
   - maureen@vigagency.com
   - grant@vigagency.com

This gives you professional email addresses without the complexity of running your own mail server.

## DNS Settings Summary for Cloudflare

Add these records to your Cloudflare DNS:

```
# For Cloudflare Email Routing
MX    @    route1.mx.cloudflare.net    1
MX    @    route2.mx.cloudflare.net    2
MX    @    route3.mx.cloudflare.net    3
TXT   @    "v=spf1 include:_spf.mx.cloudflare.net ~all"

# For sending authentication (if using SendGrid)
TXT   @    "v=spf1 include:sendgrid.net ~all"
TXT   m1._domainkey    [SendGrid will provide this]
TXT   _dmarc    "v=DMARC1; p=none; rua=mailto:info@vigagency.com"
```

## Next Steps

1. Choose your email solution (I recommend Cloudflare Email Routing)
2. Configure DNS records in Cloudflare
3. Set up email addresses/forwarding
4. Configure your application to send emails via SMTP service
5. Test everything works

Would you like me to help you set up the email sending functionality in your Vanguard application?