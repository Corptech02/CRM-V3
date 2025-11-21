#!/bin/bash

echo "==================================="
echo "Fix Nginx for Vicidial API Routing"
echo "==================================="
echo ""
echo "The issue: /api/vicidial/ endpoints are not routed to port 8897"
echo ""
echo "To fix this, run these commands as root/sudo:"
echo ""
echo "1. Edit nginx config:"
echo "   sudo nano /etc/nginx/sites-available/vanguard"
echo ""
echo "2. Add this BEFORE the 'location /api/' block (around line 13):"
echo ""
cat << 'EOF'
    # Vicidial API endpoints - MUST BE BEFORE /api/
    location /api/vicidial/ {
        proxy_pass http://127.0.0.1:8897/api/vicidial/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

EOF
echo ""
echo "3. Test and reload nginx:"
echo "   sudo nginx -t"
echo "   sudo systemctl reload nginx"
echo ""
echo "==================================="
echo "Alternative Quick Fix:"
echo "==================================="
echo ""
echo "Or copy this command and run as one line:"
echo ""
echo 'sudo sed -i "/location \/api\//i\    # Vicidial API endpoints\n    location /api/vicidial/ {\n        proxy_pass http://127.0.0.1:8897/api/vicidial/;\n        proxy_http_version 1.1;\n        proxy_set_header Host \$host;\n        proxy_set_header X-Real-IP \$remote_addr;\n        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;\n        proxy_set_header X-Forwarded-Proto \$scheme;\n        proxy_connect_timeout 60s;\n        proxy_send_timeout 60s;\n        proxy_read_timeout 60s;\n    }\n" /etc/nginx/sites-available/vanguard && sudo nginx -t && sudo systemctl reload nginx'