# 📞 Vanguard CRM SIP Softphone Setup Guide

## 🎯 What This Solves
- ✅ **No more phone loops** - Direct SIP audio connection
- ✅ **Professional call handling** - Built-in hold, transfer, mute
- ✅ **Integrated with CRM** - Automatic contact lookup on incoming calls
- ✅ **Cost effective** - SIP rates typically lower than Twilio voice minutes

## 🛠️ SIP Provider Options

### Option 1: FreeSWITCH (Self-hosted) - FREE
**Best for:** Complete control, no monthly fees
```bash
# Install FreeSWITCH on Ubuntu/Debian
sudo apt update
sudo apt install -y freeswitch freeswitch-meta-codecs freeswitch-mod-commands

# Configure WebRTC support
sudo freeswitch -conf /etc/freeswitch/autoload_configs/switch.conf.xml
```

### Option 2: VoIP.ms - $0.85/month per extension
**Best for:** Reliable, easy setup, good rates
1. Sign up at https://voip.ms
2. Create SIP extension
3. Enable WebRTC in account settings

### Option 3: Twilio SIP Interface - Pay per use
**Best for:** Existing Twilio customers
1. Go to Twilio Console → Voice → SIP
2. Create SIP Domain
3. Configure WebRTC credentials

### Option 4: 3CX Phone System - Free for 4 users
**Best for:** Small teams, feature-rich
1. Sign up at https://www.3cx.com
2. Install 3CX system
3. Create extensions with WebRTC

## 📋 Setup Steps

### 1. Choose Your SIP Provider
Pick one option above and get:
- **SIP Server**: (e.g., `toronto.voip.ms`)
- **Extension Number**: (e.g., `1001`)
- **Password**: Your SIP password

### 2. Configure in CRM
1. Refresh your CRM page at https://162-220-14-239.nip.io
2. Look for the **📞 SIP Phone** button in the top right
3. Click it to open the softphone
4. Enter your SIP credentials:
   - **SIP Server**: Your provider's server
   - **Extension**: Your extension number
   - **Password**: Your SIP password
5. Click **Register**

### 3. Test the Setup
1. **Registration**: Should show green "Registered" status
2. **Outbound**: Try dialing a test number
3. **Inbound**: Have someone call your SIP number

## 🔧 Recommended Provider: VoIP.ms Setup

### Step 1: Create VoIP.ms Account
1. Go to https://voip.ms/en/residential-hosted-pbx
2. Sign up for account
3. Add credit ($10 minimum)

### Step 2: Configure Extension
1. Go to **PBX → Extensions**
2. Create new extension (e.g., 1001)
3. Set extension password
4. **Enable WebRTC**: Under "Phones" tab

### Step 3: Configure Server Settings
1. Go to **Account → Servers**
2. Note your server (e.g., `toronto.voip.ms`)
3. Ensure WebRTC is enabled

### Step 4: Enter in CRM
```
SIP Server: toronto.voip.ms
Extension: 1001
Password: [your extension password]
```

## 📞 Call Flow

### Incoming Calls
1. **Call arrives** → SIP softphone rings
2. **CRM popup appears** → Shows caller info
3. **Click "Answer"** → Direct audio connection
4. **No loops** → Clean, professional experience

### Outgoing Calls
1. **Enter number** in softphone dialpad
2. **Click "Call"** → Direct connection
3. **Use controls** → Mute, Hold, Transfer

## 🎛️ Softphone Features

- **📱 Dialpad**: Click-to-dial numbers
- **🔇 Mute**: Toggle microphone on/off
- **⏸️ Hold**: Put calls on hold
- **📞 Transfer**: Forward calls (advanced)
- **📊 Status**: See registration and call status
- **🔔 Ringtones**: Custom incoming call sounds

## 🔍 Troubleshooting

### "Registration Failed"
- ✅ Check server address (include full domain)
- ✅ Verify extension number and password
- ✅ Ensure WebRTC is enabled on provider
- ✅ Check firewall allows WebSocket connections

### "No Audio"
- ✅ Allow microphone permissions in browser
- ✅ Check audio device settings
- ✅ Test with different browser

### "Can't Receive Calls"
- ✅ Verify SIP registration is green
- ✅ Check provider's inbound routing
- ✅ Test with provider's softphone first

## 🆚 Comparison: SIP vs Current Twilio

| Feature | Current Twilio | SIP Softphone |
|---------|---------------|---------------|
| **Call Loops** | ❌ Yes, problematic | ✅ None |
| **Audio Quality** | ⚠️ Hold music issues | ✅ Direct connection |
| **Cost** | 💰 Higher per minute | 💰 Lower rates |
| **Features** | ❌ Basic | ✅ Hold, transfer, mute |
| **Integration** | ✅ Built-in | ✅ Enhanced |
| **Setup** | ✅ Already done | ⚠️ Initial setup needed |

## 🎯 Quick Start (5 Minutes)

1. **Get VoIP.ms trial account** (free)
2. **Create extension 1001**
3. **Open CRM → Click "📞 SIP Phone"**
4. **Enter credentials → Click Register**
5. **Test call** 🎉

Your new SIP softphone will:
- ✅ Replace problematic Twilio phone loops
- ✅ Provide professional call features
- ✅ Integrate seamlessly with CRM
- ✅ Save money on call costs

## 📞 Support
Need help? The softphone logs all events to browser console (F12).

Ready to upgrade your phone system? Start with VoIP.ms for the easiest setup!