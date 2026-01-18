#!/bin/bash

# Download all 2.2M carriers from DOT API
API_URL="https://data.transportation.gov/resource/az4n-8mr2.json"
BATCH_SIZE=50000
TOTAL_RECORDS=2202255
OUTPUT_FILE="dot_carriers_full.json"

echo "Starting download of $TOTAL_RECORDS carrier records..."
echo "Batch size: $BATCH_SIZE records"
echo "Estimated batches: $((TOTAL_RECORDS / BATCH_SIZE + 1))"

# Remove existing file
rm -f "$OUTPUT_FILE"

# Start JSON array
echo "[" > "$OUTPUT_FILE"

OFFSET=0
BATCH_NUM=1

while [ $OFFSET -lt $TOTAL_RECORDS ]; do
    echo "Downloading batch $BATCH_NUM (offset: $OFFSET)..."
    
    # Calculate remaining records
    REMAINING=$((TOTAL_RECORDS - OFFSET))
    if [ $REMAINING -gt $BATCH_SIZE ]; then
        LIMIT=$BATCH_SIZE
    else
        LIMIT=$REMAINING
    fi
    
    # Download batch
    BATCH_DATA=$(curl -s "${API_URL}?\$limit=${LIMIT}&\$offset=${OFFSET}")
    
    # Check if this is not the first batch, add comma
    if [ $OFFSET -ne 0 ]; then
        echo "," >> "$OUTPUT_FILE"
    fi
    
    # Remove surrounding brackets and add to file
    echo "$BATCH_DATA" | sed 's/^\[//' | sed 's/\]$//' >> "$OUTPUT_FILE"
    
    OFFSET=$((OFFSET + BATCH_SIZE))
    BATCH_NUM=$((BATCH_NUM + 1))
    
    # Show progress every 10 batches
    if [ $((BATCH_NUM % 10)) -eq 0 ]; then
        echo "Progress: $((OFFSET * 100 / TOTAL_RECORDS))% complete"
    fi
    
    # Small delay to be respectful to API
    sleep 1
done

# Close JSON array
echo "]" >> "$OUTPUT_FILE"

echo "Download complete! File saved as: $OUTPUT_FILE"
echo "File size: $(du -h $OUTPUT_FILE | cut -f1)"
echo "Total lines: $(wc -l < $OUTPUT_FILE)"

