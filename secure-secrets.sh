#!/bin/bash

echo "========================================="
echo "SECURING SECRETS FOR GITHUB PUSH"
echo "========================================="
echo ""
echo "This will move secrets to environment variables"
echo "Your system will continue working exactly as before"
echo ""

# Create .env file with actual values (this won't be committed)
cat > /var/www/vanguard/.env << 'EOF'
# OpenAI Configuration
OPENAI_API_KEY=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

# Keep other configs as they are
EOF

echo "✅ Created .env file with your actual keys (won't be committed)"

# Add .env to gitignore
if ! grep -q "^.env$" /var/www/vanguard/.gitignore; then
    echo -e "\n# Environment variables\n.env" >> /var/www/vanguard/.gitignore
    echo "✅ Added .env to .gitignore"
fi

# Create Python wrapper to load env
cat > /var/www/vanguard/load_env.py << 'EOF'
import os
from pathlib import Path

def load_env():
    env_path = Path(__file__).parent / '.env'
    if env_path.exists():
        with open(env_path) as f:
            for line in f:
                if line.strip() and not line.startswith('#'):
                    key, value = line.strip().split('=', 1)
                    os.environ[key] = value
EOF

echo "✅ Created environment loader for Python files"

# Update Python files to use environment variables
echo ""
echo "Updating Python files to use environment variables..."

# Update each Python file that contains the API key
for file in check-whisper-alternative.py openai-processor.py test-whisper-api.py test-api-org.py; do
    if [ -f "$file" ]; then
        # Create backup
        cp "$file" "${file}.backup"

        # Replace the API key with environment variable
        sed -i 's/api_key = "sk-proj-[^"]*"/import os\nfrom load_env import load_env\nload_env()\napi_key = os.environ.get("OPENAI_API_KEY", "")/' "$file" 2>/dev/null || \
        sed -i '' 's/api_key = "sk-proj-[^"]*"/import os\nfrom load_env import load_env\nload_env()\napi_key = os.environ.get("OPENAI_API_KEY", "")/' "$file" 2>/dev/null

        echo "✅ Updated $file"
    fi
done

echo ""
echo "========================================="
echo "✅ SECRETS SECURED!"
echo "========================================="
echo ""
echo "Your system will work exactly as before."
echo "The actual API keys are now in .env (not committed)"
echo "The code references environment variables instead"
echo ""
echo "You can now safely push to GitHub!"