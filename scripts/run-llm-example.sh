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
  echo "Error: .env file not found. Please run 'npm run init-env' first and add your LLM API keys."
  exit 1
fi

# Check if at least one LLM API key is set in .env
if ! grep -q "OPENAI_API_KEY=" .env || grep -q "OPENAI_API_KEY=your_openai_api_key" .env; then
  if ! grep -q "ANTHROPIC_API_KEY=" .env || grep -q "ANTHROPIC_API_KEY=your_anthropic_api_key" .env; then
    echo "Warning: No valid LLM API keys found in .env file."
    echo "Please edit your .env file and add at least one of the following:"
    echo "- OPENAI_API_KEY (get from https://platform.openai.com/api-keys)"
    echo "- ANTHROPIC_API_KEY (get from https://console.anthropic.com/)"
    echo "The example will still run but may not be able to connect to any LLM providers."
  fi
fi

# Run the LLM connectors example
echo "Running LLM Connectors Example..."
npx ts-node examples/llm-connectors-example.ts

echo "Done!" 