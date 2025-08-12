#!/bin/bash

# Exit on error
set -e

# Install dependencies
npm install

# Build the application
npm run build

# Success message
echo "Build completed successfully!"