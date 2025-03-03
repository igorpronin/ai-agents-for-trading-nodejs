#!/bin/bash

# Ensure we're in the project root directory
cd "$(dirname "$0")/.."

# Check if node_modules exists, if not install dependencies
if [ ! -d "node_modules" ]; then
  echo "Installing dependencies..."
  npm install
fi

# Run the technical analysis example
echo "Running technical analysis example..."
npx ts-node examples/simple-technical-analysis.ts

echo "Done!" 