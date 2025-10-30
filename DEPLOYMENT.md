# Self-Hosting Danks! on Your Own Server

This guide covers deploying Danks! to your own server (VPS, dedicated server, or local machine).

## Prerequisites

- A server with Node.js 18+ installed
- SSH access to your server
- A domain name (optional, but recommended)
- Basic knowledge of Linux command line

---

## Method 1: Traditional Node.js Deployment (Recommended)

This is the simplest approach for most servers.

### Step 1: Prepare Your Server

```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Install Node.js (if not already installed)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify installation
node --version
npm --version

# Install PM2 (process manager to keep your app running)
sudo npm install -g pm2
```

### Step 2: Upload Your Application

**Option A: Using Git (Recommended)**

```bash
# On your server
cd /var/www  # or wherever you want to host
sudo mkdir danks
sudo chown $USER:$USER danks
cd danks

# Clone your repository (or copy files)
# If you have a git repo:
git clone <your-repo-url> .

# Or use rsync/scp to copy files from local machine
```

**Option B: Using SCP/RSYNC from your local machine**

```bash
# From your local machine (in the project directory)
rsync -avz --exclude 'node_modules' --exclude '.next' \
  ./ user@your-server-ip:/var/www/danks/
```

### Step 3: Configure Environment Variables

```bash
# On your server, in the project directory
nano .env.local

# Paste your Firebase configuration:
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyCx9Y2raaOg-fdlcVNj4ZOOyXAdky23qpw
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=danks-bd4e1.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=danks-bd4e1
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=danks-bd4e1.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=909960745588
NEXT_PUBLIC_FIREBASE_APP_ID=1:909960745588:web:a7735d147af5cdf9cff721

# Save and exit (Ctrl+X, then Y, then Enter)
```

### Step 4: Install Dependencies and Build

```bash
# Install dependencies
npm install

# Build the production version
npm run build

# Test the build locally
npm start
# This starts the server on port 3000
# Press Ctrl+C to stop
```

### Step 5: Run with PM2 (keeps it running permanently)

```bash
# Start the app with PM2
pm2 start npm --name "danks" -- start

# Make PM2 start on system reboot
pm2 startup
pm2 save

# Check status
pm2 status

# View logs
pm2 logs danks

# Other useful commands:
# pm2 restart danks   # Restart the app
# pm2 stop danks      # Stop the app
# pm2 delete danks    # Remove from PM2
```

### Step 6: Configure Firewall

```bash
# Allow port 3000 (or whatever port you're using)
sudo ufw allow 3000
sudo ufw enable
```

Your app should now be running at `http://your-server-ip:3000`

---

## Method 2: Using Docker (Advanced)

Docker makes deployment more consistent and easier to manage.

### Step 1: Create Dockerfile

I'll create this file for you in the project.

### Step 2: Build and Run

```bash
# Build the Docker image
docker build -t danks-game .

# Run the container
docker run -d \
  --name danks \
  -p 3000:3000 \
  --env-file .env.local \
  --restart unless-stopped \
  danks-game

# View logs
docker logs danks

# Stop/start
docker stop danks
docker start danks
```

### Using Docker Compose (even easier)

I'll create a `docker-compose.yml` file for you.

Then just run:
```bash
docker-compose up -d
```

---

## Method 3: Using Nginx as Reverse Proxy (Production Setup)

This allows you to:
- Run on port 80/443 (standard web ports)
- Add SSL/HTTPS
- Use a custom domain
- Run multiple apps on same server

### Step 1: Install Nginx

```bash
sudo apt install nginx -y
sudo systemctl enable nginx
sudo systemctl start nginx
```

### Step 2: Configure Nginx

I'll create an nginx configuration file for you.

```bash
# Create nginx config
sudo nano /etc/nginx/sites-available/danks

# Paste the configuration (I'll create this file)

# Enable the site
sudo ln -s /etc/nginx/sites-available/danks /etc/nginx/sites-enabled/
sudo nginx -t  # Test configuration
sudo systemctl reload nginx
```

### Step 3: Add SSL with Let's Encrypt (Optional but Recommended)

```bash
# Install certbot
sudo apt install certbot python3-certbot-nginx -y

# Get SSL certificate
sudo certbot --nginx -d yourdomain.com

# Certbot will automatically configure nginx for HTTPS
```

Now your app will be accessible at `https://yourdomain.com`

---

## Quick Deployment Script

I'll create a deployment script that automates most of this process.

---

## Environment Variables for Production

Make sure to set these on your server:

```bash
# .env.local on server
NODE_ENV=production
NEXT_PUBLIC_FIREBASE_API_KEY=your-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id
```

---

## Updating Your Deployment

When you make changes:

```bash
# Pull latest code
git pull origin main

# Reinstall dependencies (if package.json changed)
npm install

# Rebuild
npm run build

# Restart with PM2
pm2 restart danks

# Or with Docker
docker-compose down
docker-compose up -d --build
```

---

## Troubleshooting

### Port 3000 already in use
```bash
# Find what's using the port
sudo lsof -i :3000

# Kill the process
sudo kill -9 <PID>
```

### Can't access from outside
- Check firewall: `sudo ufw status`
- Check if app is running: `pm2 status` or `docker ps`
- Check if listening on correct interface: `netstat -tuln | grep 3000`

### Build fails
- Make sure Node.js version is 18 or higher: `node --version`
- Clear cache: `rm -rf .next node_modules && npm install`

### Out of memory during build
```bash
# Increase Node.js memory limit
NODE_OPTIONS="--max-old-space-size=4096" npm run build
```

---

## Performance Tips

1. **Enable compression** (nginx handles this)
2. **Use a CDN** for static assets (optional)
3. **Monitor with PM2**: `pm2 monit`
4. **Set up log rotation**: PM2 does this automatically
5. **Use a smaller server**: Next.js is efficient, 1GB RAM is enough

---

## Security Checklist

- [ ] Firewall configured (`ufw`)
- [ ] SSH key authentication only (disable password auth)
- [ ] Keep system updated (`apt update && apt upgrade`)
- [ ] Use HTTPS with Let's Encrypt
- [ ] Don't commit `.env.local` to git
- [ ] Update Firestore security rules for production

---

## Monitoring

```bash
# Check PM2 status
pm2 status

# Monitor resources
pm2 monit

# View logs
pm2 logs danks

# Or with Docker
docker logs -f danks
```

---

## What method would you like to use?

1. **Simple Node.js + PM2** (easiest, recommended for beginners)
2. **Docker** (more portable, easier to replicate)
3. **Full production setup** (nginx + SSL + domain)

Let me know and I'll create the specific configuration files you need!
