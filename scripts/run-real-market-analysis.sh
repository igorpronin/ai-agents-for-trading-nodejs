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
  echo "Error: .env file not found. Please run 'npm run init-env' first and add your Alpha Vantage API key."
  exit 1
fi

# Check if ALPHAVANTAGE_API_KEY is set in .env
if ! grep -q "ALPHAVANTAGE_API_KEY=" .env || grep -q "ALPHAVANTAGE_API_KEY=your_alphavantage_api_key" .env; then
  echo "Error: ALPHAVANTAGE_API_KEY is not properly set in .env file."
  echo "Please edit your .env file and add a valid Alpha Vantage API key."
  echo "You can get a free API key from: https://www.alphavantage.co/support/#api-key"
  exit 1
fi

# Run the technical analysis example with real market data
echo "Running technical analysis with real market data from Alpha Vantage..."
npx ts-node examples/technical-analysis-example.ts

echo "Done!" 