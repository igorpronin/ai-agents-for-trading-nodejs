#!/bin/bash

# Ensure we're in the project root directory
cd "$(dirname "$0")/.."

# Check if node_modules exists, if not install dependencies
if [ ! -d "node_modules" ]; then
  echo "Installing dependencies..."
  npm install
fi

# Create data directory if it doesn't exist
mkdir -p data/market-data-examples

# Run the data collection script
echo "Collecting Yahoo Finance data examples..."
npx ts-node examples/collect-yahoo-data.ts

echo "Done!"