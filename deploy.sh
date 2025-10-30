#!/bin/bash

# Deployment script for Danks!
# This script automates the deployment process

set -e  # Exit on any error

echo "🚀 Starting Danks! deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if .env.local exists
if [ ! -f .env.local ]; then
    echo -e "${RED}❌ Error: .env.local not found${NC}"
    echo "Please create .env.local with your Firebase credentials"
    exit 1
fi

echo -e "${GREEN}✓${NC} Environment file found"

# Install dependencies
echo -e "\n📦 Installing dependencies..."
npm install

echo -e "${GREEN}✓${NC} Dependencies installed"

# Build the application
echo -e "\n🔨 Building application..."
npm run build

echo -e "${GREEN}✓${NC} Build completed"

# Check if PM2 is installed
if ! command -v pm2 &> /dev/null; then
    echo -e "${YELLOW}⚠${NC}  PM2 not found. Install it with: sudo npm install -g pm2"
    echo "Starting with npm instead..."
    npm start
    exit 0
fi

# Stop existing PM2 process if it exists
if pm2 list | grep -q "danks"; then
    echo -e "\n🔄 Restarting existing PM2 process..."
    pm2 restart danks
else
    echo -e "\n🎮 Starting with PM2..."
    pm2 start npm --name "danks" -- start
    pm2 save
fi

echo -e "${GREEN}✓${NC} PM2 process started"

# Show status
echo -e "\n📊 Application Status:"
pm2 status

# Show logs
echo -e "\n📝 Recent logs:"
pm2 logs danks --lines 10 --nostream

echo -e "\n${GREEN}✅ Deployment complete!${NC}"
echo -e "\n🌐 Your app should be running at:"
echo -e "   http://localhost:3000"
echo -e "\n📝 Useful commands:"
echo -e "   pm2 status        - Check status"
echo -e "   pm2 logs danks    - View logs"
echo -e "   pm2 restart danks - Restart app"
echo -e "   pm2 stop danks    - Stop app"
