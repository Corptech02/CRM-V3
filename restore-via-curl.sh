#!/bin/bash

echo "🔄 Restoring missing leads via API..."

API_URL="http://localhost:3001/api/leads"

# Array of lead names that need to be restored
declare -a leads=(
    "RAMSDELL'S GARAGE INC"
    "JERNIGAN TRANSPORT LLC"
    "MID-OHIO TRANSPORT LLC"
    "FOF CARGO LLC"
    "DMA LOGISTICS INC"
    "DELUGUCCI ENTERPRISES INC"
    "KEPLINGER TRUCKING LLC"
    "MSY TRANSPORT LLC"
    "BLUE THUNDER INC"
    "DNJ KENDALL TRANSPORT LLC"
    "FAST ARROW TRANSPORT LLC"
    "D & D NYE TRUCKING LLC"
    "PINPOINT LOGISTICS LLC"
    "KAYA TRUCKING LLC"
    "MASTER TRUCKS ENTERPRISES LLC"
    "EXPRESS LANE INC"
    "KCH CONSTRUCTION LLC"
    "BMA CAPITAL LLC"
    "EMINENT CARGO INC"
    "STUBBLEFIELD TRANSPORT LLC"
    "JIB TRANSPORT INC"
)

# Status mappings
declare -A statuses=(
    ["RAMSDELL'S GARAGE INC"]="New"
    ["JERNIGAN TRANSPORT LLC"]="Info Requested"
    ["MID-OHIO TRANSPORT LLC"]="Quote Sent"
    ["FOF CARGO LLC"]="Info Requested"
    ["DMA LOGISTICS INC"]="New"
    ["DELUGUCCI ENTERPRISES INC"]="New"
    ["KEPLINGER TRUCKING LLC"]="New"
    ["MSY TRANSPORT LLC"]="New"
    ["BLUE THUNDER INC"]="New"
    ["DNJ KENDALL TRANSPORT LLC"]="Info Requested"
    ["FAST ARROW TRANSPORT LLC"]="Closed"
    ["D & D NYE TRUCKING LLC"]="New"
    ["PINPOINT LOGISTICS LLC"]="New"
    ["KAYA TRUCKING LLC"]="New"
    ["MASTER TRUCKS ENTERPRISES LLC"]="New"
    ["EXPRESS LANE INC"]="New"
    ["KCH CONSTRUCTION LLC"]="New"
    ["BMA CAPITAL LLC"]="New"
    ["EMINENT CARGO INC"]="New"
    ["STUBBLEFIELD TRANSPORT LLC"]="New"
    ["JIB TRANSPORT INC"]="New"
)

# Assigned to mappings
declare -A assignments=(
    ["RAMSDELL'S GARAGE INC"]="Hunter"
    ["JERNIGAN TRANSPORT LLC"]="Grant"
    ["MID-OHIO TRANSPORT LLC"]="Hunter"
    ["FOF CARGO LLC"]="Hunter"
    ["DMA LOGISTICS INC"]="Grant"
    ["DELUGUCCI ENTERPRISES INC"]="Grant"
    ["KEPLINGER TRUCKING LLC"]="Grant"
    ["MSY TRANSPORT LLC"]="Grant"
    ["BLUE THUNDER INC"]="Unassigned"
    ["DNJ KENDALL TRANSPORT LLC"]="Hunter"
    ["FAST ARROW TRANSPORT LLC"]="Unassigned"
    ["D & D NYE TRUCKING LLC"]="Unassigned"
    ["PINPOINT LOGISTICS LLC"]="Unassigned"
    ["KAYA TRUCKING LLC"]="Unassigned"
    ["MASTER TRUCKS ENTERPRISES LLC"]="Unassigned"
    ["EXPRESS LANE INC"]="Unassigned"
    ["KCH CONSTRUCTION LLC"]="Unassigned"
    ["BMA CAPITAL LLC"]="Unassigned"
    ["EMINENT CARGO INC"]="Unassigned"
    ["STUBBLEFIELD TRANSPORT LLC"]="Unassigned"
    ["JIB TRANSPORT INC"]="Unassigned"
)

saved_count=0
failed_count=0

for lead_name in "${leads[@]}"; do
    echo "📝 Restoring: $lead_name"

    # Generate unique ID
    lead_id="${lead_name// /_}_$(date +%s)_$(($RANDOM % 1000))"
    status="${statuses[$lead_name]}"
    assigned_to="${assignments[$lead_name]}"

    # Create JSON payload
    json_payload=$(cat <<EOF
{
    "id": "$lead_id",
    "name": "$lead_name",
    "product": "Commercial Auto",
    "premium": "\$0",
    "status": "$status",
    "stage": "new",
    "assignedTo": "$assigned_to",
    "created": "11/19/2025",
    "contact": "",
    "phone": "",
    "email": "",
    "notes": "Restored lead - original data lost due to sync issue on $(date)"
}
EOF
    )

    # Make API call
    response=$(curl -s -w "%{http_code}" -X POST "$API_URL" \
        -H "Content-Type: application/json" \
        -d "$json_payload" 2>/dev/null)

    http_code="${response: -3}"

    if [ "$http_code" -eq 200 ] || [ "$http_code" -eq 201 ]; then
        echo "✅ Successfully restored: $lead_name"
        ((saved_count++))
    else
        echo "❌ Failed to restore: $lead_name (HTTP $http_code)"
        echo "Response: ${response%???}"
        ((failed_count++))
    fi

    # Small delay to avoid overwhelming server
    sleep 0.1
done

echo ""
echo "📊 RESTORATION SUMMARY:"
echo "✅ Successfully restored: $saved_count/${#leads[@]} leads"
echo "❌ Failed: $failed_count leads"

# Check final count
echo ""
echo "📈 Checking final lead count..."
final_count=$(curl -s "$API_URL" 2>/dev/null | grep -o '"id"' | wc -l)
echo "Total leads in database: $final_count"

echo ""
echo "✅ Lead restoration complete!"