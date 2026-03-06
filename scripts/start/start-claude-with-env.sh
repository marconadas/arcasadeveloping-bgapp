#!/bin/bash

# Ensure Cloudflare API token is set
export CLOUDFLARE_API_TOKEN="F31omHgQku19VAG52njqV9T5TZ2CEeMFjfnlPeEZ"

echo "🔑 Cloudflare API Token set: ${CLOUDFLARE_API_TOKEN:0:10}..."

# Start Claude with the environment variable
echo "🚀 Starting Claude with Cloudflare authentication..."
claude "$@"