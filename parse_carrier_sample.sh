#!/bin/bash

# Extract first few carrier records to understand structure
echo "Extracting sample carrier records..."

# Get first valid JSON object (skip the opening bracket)
sed -n '2,10p' dot_carriers_full.json | head -1 | sed 's/^,//' > sample_carrier.json

echo "Sample carrier record:"
cat sample_carrier.json | tr ',' '\n' | head -20

echo ""
echo "Key fields we need:"
grep -o '"[^"]*":"[^"]*"' sample_carrier.json | head -15

