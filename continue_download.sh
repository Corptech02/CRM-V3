#!/bin/bash

# Continue download from where we left off
API_URL="https://data.transportation.gov/resource/az4n-8mr2.json"
BATCH_SIZE=50000
TOTAL_RECORDS=2202255
OUTPUT_FILE="dot_carriers_full.json"

# Calculate where we left off (around batch 32, offset 1550000)
START_OFFSET=1600000
BATCH_NUM=33

echo "Continuing download from offset $START_OFFSET (batch $BATCH_NUM)..."

OFFSET=$START_OFFSET

while [ $OFFSET -lt $TOTAL_RECORDS ]; do
    echo "Downloading batch $BATCH_NUM (offset: $OFFSET)..."
    
    # Calculate remaining records
    REMAINING=$((TOTAL_RECORDS - OFFSET))
    if [ $REMAINING -gt $BATCH_SIZE ]; then
        LIMIT=$BATCH_SIZE
    else
        LIMIT=$REMAINING
    fi
    
    # Download batch and append
    BATCH_DATA=$(curl -s "${API_URL}?\$limit=${LIMIT}&\$offset=${OFFSET}")
    
    # Add comma and append data (remove surrounding brackets)
    echo "," >> "$OUTPUT_FILE"
    echo "$BATCH_DATA" | sed 's/^\[//' | sed 's/\]$//' >> "$OUTPUT_FILE"
    
    OFFSET=$((OFFSET + BATCH_SIZE))
    BATCH_NUM=$((BATCH_NUM + 1))
    
    # Show progress
    echo "Progress: $((OFFSET * 100 / TOTAL_RECORDS))% complete"
    
    sleep 0.5
done

# Close JSON array
echo "]" >> "$OUTPUT_FILE"

echo "Download complete!"
echo "File size: $(du -h $OUTPUT_FILE | cut -f1)"

