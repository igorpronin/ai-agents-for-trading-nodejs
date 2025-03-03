#!/bin/bash

# Ensure we're in the project root directory
cd "$(dirname "$0")/.."

# Check if node_modules exists, if not install dependencies
if [ ! -d "node_modules" ]; then
  echo "Installing dependencies..."
  npm install
fi

# Check if .env file exists
if [ ! -f ".env" ]; then
  echo "Warning: .env file not found. Creating a default one..."
  cp .env.example .env
  echo "Please edit the .env file to add your API keys if needed."
fi

# Create data directory if it doesn't exist
mkdir -p data/provider-comparison

# Run the comparison script
echo "Comparing market data providers..."
npx ts-node examples/compare-data-providers.ts

echo "Done!" 