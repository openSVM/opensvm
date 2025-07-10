#!/bin/bash

# Fix for Netlify build issue with missing package-lock.json
echo "Starting build fix script..."

# Check if package-lock.json exists
if [ ! -f "package-lock.json" ]; then
  echo "package-lock.json not found, generating it..."
  
  # Temporarily rename yarn.lock if it exists to allow npm to generate package-lock.json
  if [ -f "yarn.lock" ]; then
    echo "Temporarily moving yarn.lock..."
    mv yarn.lock yarn.lock.backup
  fi
  
  # Generate package-lock.json
  npm install --package-lock-only --no-audit
  
  # Restore yarn.lock if it was backed up
  if [ -f "yarn.lock.backup" ]; then
    echo "Restoring yarn.lock..."
    mv yarn.lock.backup yarn.lock
  fi
  
  echo "package-lock.json generated successfully"
else
  echo "package-lock.json already exists"
fi

# Run the optimized build
npm run build:optimized