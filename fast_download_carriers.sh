#!/bin/bash

# Fast download approach - smaller batches, parallel processing
API_URL="https://data.transportation.gov/resource/az4n-8mr2.json"
BATCH_SIZE=10000
TOTAL_RECORDS=2202255
OUTPUT_FILE="dot_carriers_full.json"
TEMP_DIR="temp_carrier_batches"

echo "Fast download approach for $TOTAL_RECORDS carrier records..."
echo "Batch size: $BATCH_SIZE records"

# Create temp directory
mkdir -p "$TEMP_DIR"
rm -f "$TEMP_DIR"/*

# Download first few batches to test
for i in {0..4}; do
    OFFSET=$((i * BATCH_SIZE))
    echo "Downloading batch $((i+1)) (offset: $OFFSET)..."
    
    curl -s "${API_URL}?\$limit=${BATCH_SIZE}&\$offset=${OFFSET}" > "$TEMP_DIR/batch_$i.json" &
    
    # Limit concurrent downloads
    if [ $((i % 3)) -eq 2 ]; then
        wait
    fi
done

wait

echo "First 5 batches downloaded. Checking results..."
for i in {0..4}; do
    SIZE=$(wc -c < "$TEMP_DIR/batch_$i.json")
    echo "Batch $i: $SIZE bytes"
done

