#!/bin/bash
# Upload databases to transfer.sh for easy download on VPS

echo "Uploading databases to transfer.sh..."

# Upload FMCSA database
if [ -f "fmcsa_complete.db" ]; then
    echo "Uploading fmcsa_complete.db (this may take a while)..."
    curl --upload-file fmcsa_complete.db https://transfer.sh/fmcsa_complete.db
    echo ""
else
    echo "fmcsa_complete.db not found!"
fi

# Upload other databases
for db in vanguard.db vanguard_system.db; do
    if [ -f "$db" ]; then
        echo "Uploading $db..."
        curl --upload-file $db https://transfer.sh/$db
        echo ""
    fi
done

echo "Upload complete! Save these URLs for the VPS setup."
