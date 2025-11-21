# 🚀 Complete VPS Deployment Guide for Vanguard Insurance System
**Last Updated:** September 18, 2025

## 📋 Table of Contents
1. [System Overview](#system-overview)
2. [VPS Requirements](#vps-requirements)
3. [Complete Component List](#complete-component-list)
4. [Step-by-Step Deployment](#step-by-step-deployment)
5. [Configuration Files](#configuration-files)
6. [Security Setup](#security-setup)
7. [Monitoring & Maintenance](#monitoring-maintenance)
8. [Troubleshooting](#troubleshooting)

---

## 🎯 System Overview

The Vanguard Insurance System is a comprehensive insurance management platform with:
- **2.2 Million** FMCSA carriers with real-time insurance tracking
- **COI Management** with Gmail integration
- **Lead Generation** and client management
- **Policy tracking** with expiration monitoring
- **Real-time API** for carrier searches
- **Multi-user support** with authentication

### Architecture Components:
```
┌──────────────────────────────────────────┐
│           Frontend (GitHub Pages)         │
│     https://corptech02.github.io/...      │
└────────────────┬─────────────────────────┘
                 │ HTTPS
┌────────────────▼─────────────────────────┐
│            VPS Server                     │
│                                          │
│  ┌─────────────────────────────────┐    │
│  │  Node.js Backend (Port 3001)     │    │
│  │  - Gmail Integration             │    │
│  │  - Client/Policy Management      │    │
│  └─────────────────────────────────┘    │
│                                          │
│  ┌─────────────────────────────────┐    │
│  │  Python API (Port 8897)          │    │
│  │  - FMCSA Carrier Search         │    │
│  │  - Insurance Verification       │    │
│  └─────────────────────────────────┘    │
│                                          │
│  ┌─────────────────────────────────┐    │
│  │  SQLite Databases                │    │
│  │  - fmcsa_complete.db (558MB)    │    │
│  │  - vanguard.db (82KB)           │    │
│  │  - vanguard_system.db (116KB)   │    │
│  └─────────────────────────────────┘    │
└──────────────────────────────────────────┘
```

---

## 💻 VPS Requirements

### Minimum Specifications:
- **OS:** Ubuntu 22.04 LTS or Debian 11+
- **RAM:** 4GB minimum (8GB recommended)
- **CPU:** 2 vCPUs minimum
- **Storage:** 20GB SSD minimum
- **Bandwidth:** Unlimited preferred
- **Ports:** 22 (SSH), 80 (HTTP), 443 (HTTPS), 3001, 8897

### Recommended VPS Providers:
- **DigitalOcean:** $24/mo (4GB RAM, 2 vCPUs, 80GB SSD)
- **Linode:** $20/mo (4GB RAM, 2 vCPUs, 80GB SSD)
- **Vultr:** $20/mo (4GB RAM, 2 vCPUs, 80GB SSD)
- **AWS EC2:** t3.medium instance
- **Google Cloud:** e2-medium instance

---

## 📦 Complete Component List

### 1. Backend Services
- **Node.js Backend** (`backend/server.js`) - Port 3001
  - Gmail OAuth integration
  - Client/Policy CRUD operations
  - SQLite database management

- **Python API** (`api_complete.py`) - Port 8897
  - FMCSA carrier search
  - Insurance verification
  - Lead management
  - Statistics API

### 2. Databases
- **fmcsa_complete.db** - 558MB
  - 2.2M carriers
  - 1.4M insurance records
  - Vehicle inspection data

- **vanguard.db** - 82KB
  - Gmail tokens
  - COI emails
  - Settings

- **vanguard_system.db** - 116KB
  - Users
  - Leads
  - Policies
  - Activity logs

### 3. Frontend Files
- Main application: `index.html`
- JavaScript modules in `js/` directory
- CSS styles in `css/` directory
- Configuration files

### 4. Dependencies
```json
{
  "node": {
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "sqlite3": "^5.1.6",
    "googleapis": "^144.0.0",
    "body-parser": "^1.20.2"
  },
  "python": {
    "flask": "3.0.0",
    "flask-cors": "4.0.0",
    "sqlite3": "builtin",
    "werkzeug": "3.0.1"
  }
}
```

---

## 🚀 Step-by-Step Deployment

### Step 1: VPS Initial Setup
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install essential packages
sudo apt install -y curl git wget unzip nginx certbot python3-certbot-nginx

# Create deployment user
sudo useradd -m -s /bin/bash vanguard
sudo usermod -aG sudo vanguard
sudo passwd vanguard

# Setup firewall
sudo ufw allow 22
sudo ufw allow 80
sudo ufw allow 443
sudo ufw allow 3001
sudo ufw allow 8897
sudo ufw enable
```

### Step 2: Install Node.js & Python
```bash
# Install Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install Python and pip
sudo apt install -y python3 python3-pip python3-venv

# Install PM2 for process management
sudo npm install -g pm2
```

### Step 3: Clone Repository
```bash
# Switch to vanguard user
sudo su - vanguard

# Clone repository
git clone https://github.com/Corptech02/vanguard-insurance.git
cd vanguard-insurance
```

### Step 4: Setup Backend Services
```bash
# Setup Node.js backend
cd backend
npm install

# Setup Python environment
cd ..
python3 -m venv venv
source venv/bin/activate
pip install flask flask-cors werkzeug
```

### Step 5: Download Databases
Create download script:
```bash
cat > download_databases.sh << 'EOF'
#!/bin/bash
# Download database files from transfer.sh or your storage

# Create data directory
mkdir -p data

# Download FMCSA database (you'll need to upload and get URL)
echo "Downloading FMCSA database..."
wget -O data/fmcsa_complete.db "YOUR_FMCSA_DB_URL"

# Copy other databases
cp backend/vanguard.db data/
cp vanguard_system.db data/

echo "Databases downloaded successfully!"
EOF

chmod +x download_databases.sh
```

### Step 6: Create PM2 Ecosystem File
```bash
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [
    {
      name: 'vanguard-backend',
      script: './backend/server.js',
      instances: 1,
      env: {
        PORT: 3001,
        NODE_ENV: 'production',
        DATABASE_PATH: './data/vanguard.db'
      }
    },
    {
      name: 'vanguard-api',
      script: './venv/bin/python',
      args: 'api_complete.py',
      interpreter: '',
      instances: 1,
      env: {
        FLASK_ENV: 'production',
        DATABASE_PATH: './data/fmcsa_complete.db'
      }
    }
  ]
};
EOF
```

### Step 7: Configure Nginx
```bash
sudo nano /etc/nginx/sites-available/vanguard
```

Add this configuration:
```nginx
server {
    listen 80;
    server_name your-domain.com;

    # Frontend proxy
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Backend API
    location /api/ {
        proxy_pass http://127.0.0.1:3001/api/;
        proxy_http_version 1.1;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header Host $host;
    }

    # Python API
    location /api/search {
        proxy_pass http://127.0.0.1:8897/api/search;
        proxy_http_version 1.1;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header Host $host;
    }

    # Gmail OAuth callback
    location /api/gmail/callback {
        proxy_pass http://127.0.0.1:3001/api/gmail/callback;
        proxy_http_version 1.1;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header Host $host;
    }
}
```

Enable site:
```bash
sudo ln -s /etc/nginx/sites-available/vanguard /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### Step 8: Setup SSL Certificate
```bash
sudo certbot --nginx -d your-domain.com
```

### Step 9: Environment Variables
Create `.env` file:
```bash
cat > .env << 'EOF'
# Node.js Backend
PORT=3001
NODE_ENV=production
DATABASE_PATH=./data/vanguard.db
SESSION_SECRET=your-random-secret-here

# Gmail OAuth
GMAIL_CLIENT_ID=your-client-id
GMAIL_CLIENT_SECRET=your-client-secret
GMAIL_REDIRECT_URI=https://your-domain.com/api/gmail/callback

# Python API
FLASK_ENV=production
FLASK_PORT=8897
FMCSA_DB_PATH=./data/fmcsa_complete.db
SYSTEM_DB_PATH=./data/vanguard_system.db

# Frontend API URL
API_URL=https://your-domain.com
EOF
```

### Step 10: Start Services
```bash
# Start with PM2
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup systemd
# Copy and run the command it provides

# Check status
pm2 status
pm2 logs
```

---

## ⚙️ Configuration Files

### 1. Update Frontend Configuration
Edit `js/api-config.js`:
```javascript
const API_URL = 'https://your-domain.com';
window.VANGUARD_API_URL = API_URL;
```

### 2. Update Gmail OAuth
In Google Cloud Console:
- Add `https://your-domain.com/api/gmail/callback` to authorized redirect URIs
- Update credentials in `.env`

### 3. Database Paths
Update all database references:
```python
# In api_complete.py
DB_PATH = os.environ.get('FMCSA_DB_PATH', './data/fmcsa_complete.db')
SYSTEM_DB = os.environ.get('SYSTEM_DB_PATH', './data/vanguard_system.db')
```

```javascript
// In backend/server.js
const dbPath = process.env.DATABASE_PATH || './data/vanguard.db';
```

---

## 🔒 Security Setup

### 1. Secure Database Files
```bash
# Set proper permissions
chmod 600 data/*.db
chown vanguard:vanguard data/*.db
```

### 2. Setup Fail2ban
```bash
sudo apt install fail2ban
sudo cp /etc/fail2ban/jail.conf /etc/fail2ban/jail.local
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
```

### 3. Regular Backups
Create backup script:
```bash
cat > backup.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/home/vanguard/backups"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

# Backup databases
tar -czf $BACKUP_DIR/databases_$DATE.tar.gz data/*.db

# Backup configuration
tar -czf $BACKUP_DIR/config_$DATE.tar.gz .env *.json *.js

# Keep only last 7 days of backups
find $BACKUP_DIR -type f -mtime +7 -delete

echo "Backup completed: $DATE"
EOF

chmod +x backup.sh

# Add to crontab (daily at 2 AM)
(crontab -l 2>/dev/null; echo "0 2 * * * /home/vanguard/vanguard-insurance/backup.sh") | crontab -
```

---

## 📊 Monitoring & Maintenance

### 1. Setup Monitoring
```bash
# Install monitoring tools
sudo apt install htop nethogs iotop

# PM2 monitoring
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
```

### 2. Health Check Script
```bash
cat > health_check.sh << 'EOF'
#!/bin/bash

# Check Node.js backend
curl -f http://localhost:3001/api/health || echo "Backend down!"

# Check Python API
curl -f http://localhost:8897/ || echo "API down!"

# Check database size
du -h data/*.db

# Check disk usage
df -h /

# Check memory
free -h
EOF

chmod +x health_check.sh
```

### 3. Log Rotation
```bash
cat > /etc/logrotate.d/vanguard << 'EOF'
/home/vanguard/vanguard-insurance/logs/*.log {
    daily
    rotate 7
    compress
    delaycompress
    missingok
    notifempty
    create 644 vanguard vanguard
}
EOF
```

---

## 🔧 Troubleshooting

### Common Issues and Solutions

#### 1. Database Lock Error
```bash
# Solution: Ensure single instance
pm2 stop all
pm2 start ecosystem.config.js
```

#### 2. Port Already in Use
```bash
# Find and kill process
sudo lsof -i :3001
sudo kill -9 [PID]
```

#### 3. Gmail OAuth Error
```bash
# Clear tokens and re-authenticate
sqlite3 data/vanguard.db "DELETE FROM settings WHERE key='gmail_tokens';"
# Re-visit /api/gmail/auth-url
```

#### 4. High Memory Usage
```bash
# Restart services
pm2 restart all

# Clear PM2 logs
pm2 flush
```

#### 5. Slow Database Queries
```bash
# Optimize database
sqlite3 data/fmcsa_complete.db "VACUUM;"
sqlite3 data/fmcsa_complete.db "ANALYZE;"
```

---

## 📝 Post-Deployment Checklist

- [ ] All services running (`pm2 status`)
- [ ] SSL certificate installed (`https://your-domain.com`)
- [ ] Gmail OAuth working
- [ ] Carrier search returning real data
- [ ] Database backups scheduled
- [ ] Firewall configured
- [ ] Monitoring setup
- [ ] Frontend connecting to API
- [ ] Insurance expiration dates accurate
- [ ] Log rotation configured
- [ ] Health checks passing
- [ ] Documentation updated

---

## 🆘 Support & Maintenance Commands

```bash
# View all logs
pm2 logs

# Restart services
pm2 restart all

# Check service status
pm2 status

# Monitor in real-time
pm2 monit

# Database backup
./backup.sh

# Health check
./health_check.sh

# Update from Git
git pull
pm2 restart all

# Check disk usage
df -h

# Check memory
free -h

# View nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

---

## 📞 Contact & Resources

- **GitHub Repository:** https://github.com/Corptech02/vanguard-insurance
- **Frontend URL:** https://corptech02.github.io/vanguard-insurance/
- **API Documentation:** Available at `/api/docs` after deployment

---

**Note:** This deployment guide includes EVERYTHING needed to get the Vanguard Insurance System running on a VPS. Follow each step carefully and ensure all services are properly configured before going live.