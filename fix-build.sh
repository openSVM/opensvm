#!/bin/bash

# Comprehensive script to resolve dependency conflicts between canvas and jest-environment-jsdom
# This script provides a multi-step approach to fix the build issues

echo "🚀 Starting OpenSVM dependency conflict resolution..."

# Step 1: Clean existing node_modules to ensure a fresh start
echo "🧹 Cleaning existing dependencies..."
rm -rf node_modules package-lock.json

# Step 2: Apply .npmrc settings to disable peer dependency checks
echo "⚙️  Applying npm configuration..."
if [ ! -f .npmrc ]; then
  echo "legacy-peer-deps=true" > .npmrc
  echo "strict-peer-dependencies=false" >> .npmrc
fi

# Step 3: Try Bun installation first (fastest and most reliable)
echo "📦 Attempting installation with Bun..."
if command -v bun &> /dev/null; then
  bun install --force
  if [ $? -eq 0 ]; then
    echo "✅ Bun installation successful!"
    echo "🔨 Building project with Bun..."
    bun run build
    exit 0
  else
    echo "⚠️  Bun installation failed, trying npm instead..."
  fi
else
  echo "⚠️  Bun not found, trying npm instead..."
fi

# Step 4: Try npm with legacy peer deps if Bun is not available
echo "📦 Attempting installation with npm --legacy-peer-deps..."
npm install --legacy-peer-deps
if [ $? -eq 0 ]; then
  echo "✅ NPM installation with legacy-peer-deps successful!"
  echo "🔨 Building project..."
  NODE_OPTIONS=--max_old_space_size=4096 npm run build
  exit 0
else
  echo "⚠️  Legacy peer deps installation failed, trying with force..."
fi

# Step 5: Try npm with force flag as a last resort
echo "📦 Attempting installation with npm --force..."
npm install --force
if [ $? -eq 0 ]; then
  echo "✅ NPM installation with force flag successful!"
  echo "🔨 Building project..."
  NODE_OPTIONS=--max_old_space_size=4096 npm run build
  exit 0
else
  echo "❌ All installation attempts failed."
  echo "Please check DEPENDENCY-FIX-README.md for manual troubleshooting steps."
  exit 1
fi