#!/bin/bash

# Gmail Setup and Testing Script
# This script helps configure and test Gmail OAuth integration

set -e

echo "================================"
echo "Gmail OAuth Setup & Test Script"
echo "================================"
echo ""

# Configuration
ENV_FILE="/var/www/vanguard/.env"
DOMAIN="http://162-220-14-239.nip.io"
API_URL="${DOMAIN}/api"

# Function to check if credentials are placeholder values
check_credentials() {
    if grep -q "GMAIL_CLIENT_ID=your-actual-client-id" "$ENV_FILE" 2>/dev/null || \
       grep -q "GMAIL_CLIENT_SECRET=your-actual-client-secret" "$ENV_FILE" 2>/dev/null || \
       grep -q "GMAIL_CLIENT_ID=$" "$ENV_FILE" 2>/dev/null || \
       grep -q "GMAIL_CLIENT_SECRET=$" "$ENV_FILE" 2>/dev/null; then
        return 1
    fi
    return 0
}

# Function to display current status
show_status() {
    echo "📍 Current Configuration:"
    echo "   Domain: $DOMAIN"
    echo "   Redirect URI: ${DOMAIN}/api/gmail/callback"
    echo ""

    if check_credentials; then
        echo "✅ Credentials appear to be configured"
    else
        echo "❌ Credentials need to be updated"
    fi
    echo ""
}

# Function to guide through setup
setup_guide() {
    echo "📋 Setup Instructions:"
    echo ""
    echo "1. Go to Google Cloud Console:"
    echo "   https://console.cloud.google.com/apis/credentials"
    echo ""
    echo "2. Create OAuth 2.0 Client ID with:"
    echo "   - Application type: Web application"
    echo "   - Authorized redirect URI: ${DOMAIN}/api/gmail/callback"
    echo ""
    echo "3. Copy your credentials and update them here"
    echo ""
}

# Function to update credentials
update_credentials() {
    echo "🔧 Update Gmail Credentials"
    echo ""

    read -p "Enter your Gmail Client ID: " client_id
    read -p "Enter your Gmail Client Secret: " client_secret

    if [ -z "$client_id" ] || [ -z "$client_secret" ]; then
        echo "❌ Error: Both Client ID and Secret are required"
        return 1
    fi

    # Backup current .env
    cp "$ENV_FILE" "${ENV_FILE}.backup.$(date +%Y%m%d_%H%M%S)"

    # Update credentials
    sed -i "s|GMAIL_CLIENT_ID=.*|GMAIL_CLIENT_ID=${client_id}|" "$ENV_FILE"
    sed -i "s|GMAIL_CLIENT_SECRET=.*|GMAIL_CLIENT_SECRET=${client_secret}|" "$ENV_FILE"
    sed -i "s|GMAIL_REDIRECT_URI=.*|GMAIL_REDIRECT_URI=${DOMAIN}/api/gmail/callback|" "$ENV_FILE"

    echo "✅ Credentials updated successfully"
    echo ""

    # Restart services
    echo "🔄 Restarting services..."
    pm2 restart all
    sleep 3
    pm2 status
}

# Function to test OAuth flow
test_oauth() {
    echo "🧪 Testing Gmail OAuth Flow"
    echo ""

    if ! check_credentials; then
        echo "❌ Please update credentials first"
        return 1
    fi

    # Get auth URL
    echo "📝 Generating authorization URL..."
    AUTH_URL="${API_URL}/gmail/auth"

    echo ""
    echo "To test the OAuth flow:"
    echo "1. Open this URL in your browser:"
    echo "   $AUTH_URL"
    echo ""
    echo "2. Sign in with your Google account"
    echo "3. Grant permissions"
    echo "4. You'll be redirected back to the application"
    echo ""

    # Check if the endpoint is accessible
    echo "🔍 Checking endpoint availability..."
    if curl -s -o /dev/null -w "%{http_code}" "$AUTH_URL" | grep -q "302\|200"; then
        echo "✅ Auth endpoint is accessible"
    else
        echo "⚠️  Auth endpoint may not be properly configured"
    fi
}

# Function to check service status
check_service() {
    echo "📊 Service Status Check"
    echo ""

    # Check if Node.js app is running
    if pm2 list | grep -q "vanguard.*online"; then
        echo "✅ Vanguard service is running"
    else
        echo "❌ Vanguard service is not running"
        echo "   Run: pm2 start /var/www/vanguard/server.js --name vanguard"
    fi

    # Check if port 3000 is listening
    if lsof -i:3000 | grep -q LISTEN; then
        echo "✅ Port 3000 is listening"
    else
        echo "❌ Port 3000 is not listening"
    fi

    # Check nginx
    if systemctl is-active --quiet nginx; then
        echo "✅ Nginx is running"
    else
        echo "❌ Nginx is not running"
    fi
    echo ""
}

# Main menu
main_menu() {
    while true; do
        echo ""
        echo "Choose an option:"
        echo "1. Show current status"
        echo "2. Setup guide"
        echo "3. Update credentials"
        echo "4. Test OAuth flow"
        echo "5. Check service status"
        echo "6. Full setup (guided)"
        echo "0. Exit"
        echo ""
        read -p "Enter your choice: " choice

        case $choice in
            1) show_status ;;
            2) setup_guide ;;
            3) update_credentials ;;
            4) test_oauth ;;
            5) check_service ;;
            6)
                setup_guide
                update_credentials
                test_oauth
                ;;
            0)
                echo "Goodbye!"
                exit 0
                ;;
            *)
                echo "Invalid choice. Please try again."
                ;;
        esac
    done
}

# Run the script
show_status
main_menu