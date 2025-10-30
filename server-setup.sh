#!/bin/bash

# Quick Server Setup Script for Danks!
# Run this on your fresh Ubuntu/Debian server

set -e

echo "🚀 Setting up server for Danks!..."

# Update system
echo "📦 Updating system packages..."
sudo apt update && sudo apt upgrade -y

# Install Node.js 20
echo "📦 Installing Node.js..."
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2
echo "📦 Installing PM2..."
sudo npm install -g pm2

# Install nginx (optional)
read -p "Install nginx for reverse proxy? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "📦 Installing nginx..."
    sudo apt install nginx -y
    sudo systemctl enable nginx
    sudo systemctl start nginx
fi

# Configure firewall
echo "🔒 Configuring firewall..."
sudo ufw allow 22    # SSH
sudo ufw allow 80    # HTTP
sudo ufw allow 443   # HTTPS
sudo ufw allow 3000  # Next.js (if not using nginx)
sudo ufw --force enable

echo "✅ Server setup complete!"
echo ""
echo "Next steps:"
echo "1. Upload your application files to /var/www/danks"
echo "2. Create .env.local with Firebase credentials"
echo "3. Run: cd /var/www/danks && ./deploy.sh"
echo ""
echo "Or use Docker:"
echo "  sudo apt install docker.io docker-compose -y"
echo "  cd /var/www/danks"
echo "  docker-compose up -d"
