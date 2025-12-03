#!/bin/bash

echo "========================================="
echo "PREPARING SAFE PUSH TO GITHUB"
echo "========================================="
echo ""
echo "This will exclude sensitive files from Git"
echo "Your local system will continue working exactly as before"
echo ""

# Files with secrets that should not be pushed
SENSITIVE_FILES="
check-whisper-alternative.py
openai-processor.py
test-whisper-api.py
test-api-org.py
test-github-push.sh
backend/add-gmail-token.js
backend/add-gmail-token-web.js
backend/setup-gmail-auth.js
backup_gmail_20251024_020633/add-gmail-token.js
backup_gmail_20251024_020633/add-gmail-token-web.js
backup_gmail_20251024_020633/setup-gmail-auth.js
save-gmail-token.js
"

echo "Removing sensitive files from Git (keeping local copies)..."
echo ""

for file in $SENSITIVE_FILES; do
    if [ -f "$file" ]; then
        # Remove from git but keep the file locally
        git rm --cached "$file" 2>/dev/null
        echo "✅ Removed $file from Git (kept local copy)"

        # Add to gitignore
        echo "$file" >> .gitignore-sensitive
    fi
done

# Merge sensitive gitignore with main gitignore
cat .gitignore-sensitive >> .gitignore 2>/dev/null
rm .gitignore-sensitive 2>/dev/null

# Also ensure these patterns are ignored
echo "" >> .gitignore
echo "# Sensitive files" >> .gitignore
echo "*.env" >> .gitignore
echo "*credentials*.json" >> .gitignore
echo "*token*.json" >> .gitignore
echo "*.pem" >> .gitignore
echo "*.key" >> .gitignore

# Remove duplicates from gitignore
sort -u .gitignore -o .gitignore

echo ""
echo "========================================="
echo "✅ READY FOR SAFE PUSH!"
echo "========================================="
echo ""
echo "Sensitive files removed from Git but kept locally"
echo "Your system will continue working exactly as before"
echo ""
echo "To complete the push:"
echo "1. git add .gitignore"
echo "2. git commit -m 'Remove sensitive files from repository'"
echo "3. git push -u origin main"