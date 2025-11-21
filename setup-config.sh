#!/bin/bash
# Configuration for automated setup
export DOMAIN="162.220.14.239"  # Using IP address for now
export EMAIL="admin@example.com"  # Placeholder email
export GMAIL_CLIENT_ID="your-client-id-here"
export GMAIL_CLIENT_SECRET="your-client-secret-here"
export DB_DOWNLOAD_URL="skip"  # Will upload manually

echo "Configuration set:"
echo "Domain/IP: $DOMAIN"
echo "Email: $EMAIL"
echo "Database: Will upload manually"
