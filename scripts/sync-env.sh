#!/bin/bash

# Ensure we're in the project root directory
cd "$(dirname "$0")/.."

# Check if .env and .env.example files exist
if [ ! -f ".env.example" ]; then
  echo "Error: .env.example file not found."
  exit 1
fi

if [ ! -f ".env" ]; then
  echo "Error: .env file not found. Please run 'npm run init-env' first."
  exit 1
fi

echo "Synchronizing environment variables from .env.example to .env..."

# Create a temporary file
TEMP_FILE=$(mktemp)

# Process each line in .env.example
while IFS= read -r line; do
  # Skip comments and empty lines
  if [[ $line =~ ^#.*$ || -z $line ]]; then
    continue
  fi
  
  # Extract variable name (everything before the = sign)
  if [[ $line =~ ^([A-Za-z0-9_]+)= ]]; then
    VAR_NAME="${BASH_REMATCH[1]}"
    
    # Check if the variable exists in .env
    if ! grep -q "^${VAR_NAME}=" .env; then
      echo "Adding missing variable: ${VAR_NAME}"
      echo "${VAR_NAME}=" >> "$TEMP_FILE"
    fi
  fi
done < .env.example

# If we found missing variables, append them to .env
if [ -s "$TEMP_FILE" ]; then
  echo "" >> .env  # Add a newline for cleaner separation
  echo "# Added by sync-env script" >> .env
  cat "$TEMP_FILE" >> .env
  echo "Environment variables synchronized successfully."
else
  echo "No missing environment variables found."
fi

# Clean up
rm "$TEMP_FILE"

echo "Done!" 