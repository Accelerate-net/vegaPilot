#!/bin/bash

echo "🚀 Starting Bunny.net Proxy Server..."
echo ""

# Check if .env file exists
if [ ! -f .env ]; then
    echo "❌ Error: .env file not found!"
    echo ""
    echo "Please create a .env file with your Bunny.net credentials:"
    echo "BUNNY_API_KEY=your-api-key-here"
    echo "BUNNY_LIBRARY_ID=your-library-id-here"
    echo "BUNNY_CDN_HOSTNAME=your-cdn-hostname.b-cdn.net"
    echo "PORT=3000"
    echo ""
    exit 1
fi

# Check if node_modules exists
if [ ! -d node_modules ]; then
    echo "📦 Installing dependencies..."
    npm install
    echo ""
fi

# Start the server
node bunny-proxy-server.js
