#!/bin/bash
# ============================================================
# Vanguard Insurance VPS Automated Setup Script
# Version: 1.0
# Date: September 2025
# ============================================================

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration variables
DOMAIN=""
EMAIL=""
GMAIL_CLIENT_ID=""
GMAIL_CLIENT_SECRET=""
DB_DOWNLOAD_URL=""

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Header
clear
echo "============================================================"
echo "   Vanguard Insurance System - VPS Deployment Script"
echo "============================================================"
echo ""

# Collect configuration
read -p "Enter your domain name (e.g., api.example.com): " DOMAIN
read -p "Enter your email for SSL certificate: " EMAIL
read -p "Enter Gmail Client ID: " GMAIL_CLIENT_ID
read -p "Enter Gmail Client Secret: " GMAIL_CLIENT_SECRET
read -p "Enter database download URL (or 'skip' to upload later): " DB_DOWNLOAD_URL

echo ""
print_status "Starting deployment with domain: $DOMAIN"
echo ""

# Update system
print_status "Updating system packages..."
sudo apt update && sudo apt upgrade -y
print_success "System updated"

# Install required packages
print_status "Installing required packages..."
sudo apt install -y \
    curl \
    git \
    wget \
    unzip \
    nginx \
    certbot \
    python3-certbot-nginx \
    build-essential \
    sqlite3 \
    htop \
    fail2ban \
    ufw
print_success "Packages installed"

# Install Node.js
print_status "Installing Node.js 20.x..."
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
print_success "Node.js installed: $(node --version)"

# Install Python dependencies
print_status "Installing Python dependencies..."
sudo apt install -y python3 python3-pip python3-venv
print_success "Python installed: $(python3 --version)"

# Install PM2
print_status "Installing PM2 process manager..."
sudo npm install -g pm2
print_success "PM2 installed"

# Setup firewall
print_status "Configuring firewall..."
sudo ufw --force reset
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow 22
sudo ufw allow 80
sudo ufw allow 443
sudo ufw --force enable
print_success "Firewall configured"

# Create application directory
print_status "Creating application directory..."
sudo mkdir -p /var/www/vanguard
sudo chown -R $USER:$USER /var/www/vanguard
cd /var/www/vanguard
print_success "Directory created"

# Clone repository
print_status "Cloning Vanguard Insurance repository..."
git clone https://github.com/Corptech02/vanguard-insurance.git .
print_success "Repository cloned"

# Setup Node.js backend
print_status "Setting up Node.js backend..."
cd backend
npm install
cd ..
print_success "Node.js dependencies installed"

# Setup Python environment
print_status "Setting up Python environment..."
python3 -m venv venv
source venv/bin/activate
pip install flask flask-cors werkzeug
deactivate
print_success "Python environment created"

# Create data directory
print_status "Creating data directory..."
mkdir -p data logs
print_success "Directories created"

# Download or prepare databases
if [ "$DB_DOWNLOAD_URL" != "skip" ]; then
    print_status "Downloading database..."
    wget -O data/fmcsa_complete.db "$DB_DOWNLOAD_URL"
    print_success "Database downloaded"
else
    print_warning "Database download skipped. Please upload manually to /var/www/vanguard/data/"
fi

# Copy existing databases
if [ -f "backend/vanguard.db" ]; then
    cp backend/vanguard.db data/
    print_success "Copied vanguard.db"
fi

# Create environment file
print_status "Creating environment configuration..."
cat > .env << EOF
# Node.js Backend
PORT=3001
NODE_ENV=production
DATABASE_PATH=./data/vanguard.db
SESSION_SECRET=$(openssl rand -hex 32)

# Gmail OAuth
GMAIL_CLIENT_ID=$GMAIL_CLIENT_ID
GMAIL_CLIENT_SECRET=$GMAIL_CLIENT_SECRET
GMAIL_REDIRECT_URI=https://$DOMAIN/api/gmail/callback

# Python API
FLASK_ENV=production
FLASK_PORT=8897
FMCSA_DB_PATH=./data/fmcsa_complete.db
SYSTEM_DB_PATH=./data/vanguard_system.db

# Frontend API URL
API_URL=https://$DOMAIN
EOF
print_success "Environment file created"

# Create PM2 ecosystem file
print_status "Creating PM2 ecosystem configuration..."
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [
    {
      name: 'vanguard-backend',
      script: './backend/server.js',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        PORT: 3001,
        NODE_ENV: 'production'
      },
      error_file: './logs/backend-error.log',
      out_file: './logs/backend-out.log',
      log_file: './logs/backend-combined.log',
      time: true
    },
    {
      name: 'vanguard-api',
      script: './venv/bin/python',
      args: 'api_complete.py',
      interpreter: '',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        FLASK_ENV: 'production'
      },
      error_file: './logs/api-error.log',
      out_file: './logs/api-out.log',
      log_file: './logs/api-combined.log',
      time: true
    }
  ]
};
EOF
print_success "PM2 configuration created"

# Update frontend configuration
print_status "Updating frontend configuration..."
cat > js/api-config.js << EOF
// Centralized API Configuration
const API_URL = 'https://$DOMAIN';
window.VANGUARD_API_URL = API_URL;
console.log('Vanguard API configured:', API_URL);
EOF
print_success "Frontend configuration updated"

# Configure Nginx
print_status "Configuring Nginx..."
sudo tee /etc/nginx/sites-available/vanguard > /dev/null << EOF
server {
    listen 80;
    server_name $DOMAIN;

    client_max_body_size 100M;

    # Backend API
    location /api/ {
        proxy_pass http://127.0.0.1:3001/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }

    # Python Search API
    location /api/search {
        proxy_pass http://127.0.0.1:8897/api/search;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    # Python Stats API
    location /api/stats {
        proxy_pass http://127.0.0.1:8897/api/stats;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    # Health check
    location /health {
        access_log off;
        return 200 "healthy";
        add_header Content-Type text/plain;
    }
}
EOF

# Enable Nginx site
sudo ln -sf /etc/nginx/sites-available/vanguard /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx
print_success "Nginx configured"

# Setup SSL certificate
print_status "Setting up SSL certificate..."
sudo certbot --nginx -d $DOMAIN --non-interactive --agree-tos --email $EMAIL
print_success "SSL certificate installed"

# Create health check script
print_status "Creating health check script..."
cat > health_check.sh << 'EOF'
#!/bin/bash

echo "============================================"
echo "Vanguard Insurance System Health Check"
echo "============================================"
echo ""

# Check Node.js backend
echo -n "Backend API: "
if curl -f -s http://localhost:3001/api/health > /dev/null; then
    echo "✓ Running"
else
    echo "✗ Down"
fi

# Check Python API
echo -n "Search API: "
if curl -f -s http://localhost:8897/ > /dev/null; then
    echo "✓ Running"
else
    echo "✗ Down"
fi

# Check Nginx
echo -n "Nginx: "
if systemctl is-active --quiet nginx; then
    echo "✓ Running"
else
    echo "✗ Down"
fi

# Check databases
echo ""
echo "Databases:"
for db in data/*.db; do
    if [ -f "$db" ]; then
        size=$(du -h "$db" | cut -f1)
        echo "  $(basename $db): $size"
    fi
done

# System resources
echo ""
echo "System Resources:"
echo "  Memory: $(free -h | grep Mem | awk '{print $3 "/" $2}')"
echo "  Disk: $(df -h / | tail -1 | awk '{print $3 "/" $2 " (" $5 ")"}')"
echo "  Load: $(uptime | awk -F'load average:' '{print $2}')"

echo ""
echo "============================================"
EOF
chmod +x health_check.sh
print_success "Health check script created"

# Create backup script
print_status "Creating backup script..."
cat > backup.sh << 'EOF'
#!/bin/bash

BACKUP_DIR="/var/www/vanguard/backups"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

# Backup databases
echo "Backing up databases..."
tar -czf $BACKUP_DIR/databases_$DATE.tar.gz data/*.db

# Backup configuration
echo "Backing up configuration..."
tar -czf $BACKUP_DIR/config_$DATE.tar.gz .env ecosystem.config.js

# Keep only last 7 days of backups
find $BACKUP_DIR -type f -mtime +7 -delete

echo "Backup completed: $BACKUP_DIR/databases_$DATE.tar.gz"
EOF
chmod +x backup.sh
print_success "Backup script created"

# Setup cron for backups
print_status "Setting up automated backups..."
(crontab -l 2>/dev/null || true; echo "0 2 * * * /var/www/vanguard/backup.sh") | crontab -
print_success "Automated backups configured"

# Set permissions
print_status "Setting file permissions..."
chmod 600 data/*.db 2>/dev/null || true
chmod 600 .env
print_success "Permissions set"

# Start services with PM2
print_status "Starting services with PM2..."
pm2 start ecosystem.config.js
pm2 save
pm2 startup systemd -u $USER --hp /home/$USER
print_success "Services started"

# Setup log rotation
print_status "Setting up log rotation..."
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
print_success "Log rotation configured"

# Final status check
echo ""
echo "============================================================"
echo "   DEPLOYMENT COMPLETE!"
echo "============================================================"
echo ""
print_success "Vanguard Insurance System deployed successfully!"
echo ""
echo "Access your API at: https://$DOMAIN"
echo ""
echo "Important commands:"
echo "  Check status:  pm2 status"
echo "  View logs:     pm2 logs"
echo "  Health check:  ./health_check.sh"
echo "  Backup:        ./backup.sh"
echo ""

# Run health check
./health_check.sh

echo ""
print_warning "IMPORTANT: If you skipped database download, upload fmcsa_complete.db to /var/www/vanguard/data/"
echo ""
echo "Next steps:"
echo "1. Update Gmail OAuth redirect URI in Google Cloud Console to: https://$DOMAIN/api/gmail/callback"
echo "2. Test the API at: https://$DOMAIN/api/stats/summary"
echo "3. Update frontend to point to: https://$DOMAIN"
echo ""
print_success "Deployment script completed!"