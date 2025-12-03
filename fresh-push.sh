#!/bin/bash

echo "Creating fresh repository without history..."

# Create a new branch with no history
git checkout --orphan clean-main

# Add all files
git add -A

# Commit
git commit -m "Initial commit: Vanguard Insurance Management System

Complete insurance agency platform with all features intact.
Sensitive files excluded for security.

🤖 Generated with Claude Code

Co-Authored-By: Claude <noreply@anthropic.com>"

# Force push to overwrite history
git push -u origin clean-main:main --force

echo "✅ Done! Clean push complete."