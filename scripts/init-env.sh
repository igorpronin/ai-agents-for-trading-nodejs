#!/bin/bash

# Ensure we're in the project root directory
cd "$(dirname "$0")/.."

# Check if .env already exists
if [ -f ".env" ]; then
  echo "Error: .env file already exists. To prevent accidental overwriting, this script will not proceed."
  echo "If you want to recreate the .env file, please delete it first manually."
  exit 1
fi

# Create .env file from .env.example
if [ -f ".env.example" ]; then
  echo "Creating .env file from .env.example..."
  cp .env.example .env
  echo "Done! .env file has been created."
  echo "Please edit the .env file and fill in your API keys and other configuration values."
else
  echo "Error: .env.example file not found. Cannot create .env file."
  exit 1
fi

exit 0 