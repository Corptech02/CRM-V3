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
