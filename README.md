# 🎮 Danks!

A 2-player artillery tank game with both local and online multiplayer modes. Built with Next.js, TypeScript, and Firebase.

![Danks Game](https://img.shields.io/badge/status-ready-green) ![Next.js](https://img.shields.io/badge/Next.js-16-black) ![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)

## 🎯 Features

- **🎮 Local Multiplayer**: Play with a friend on the same device
- **🌐 Online Multiplayer**: Play over the internet with room codes
- **🎨 Procedural Terrain**: Random terrain generation every game
- **💥 Physics Engine**: Realistic projectile motion with gravity
- **🎪 Animations**: Explosion effects and shot feedback
- **📱 Responsive Design**: Works on desktop and tablets

## 🚀 Quick Start

### Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Open http://localhost:3000
```

Local play works immediately! For online multiplayer, see [Firebase Setup](#firebase-setup).

## 🔥 Firebase Setup

Online multiplayer requires Firebase. See [SETUP.md](./SETUP.md) for detailed instructions.

**Quick setup:**

1. Create a Firebase project at https://console.firebase.google.com/
2. Enable Firestore Database (test mode)
3. Copy `.env.local.example` to `.env.local`
4. Add your Firebase credentials
5. Restart dev server

## 🎮 How to Play

### Controls

- **← →** : Move tank left/right
- **↑ ↓** : Adjust gun angle
- **W / S** : Increase/decrease shot power
- **SPACE** : Fire!

### Game Modes

**Local Play**: Two players take turns on the same computer

**Online Multiplayer**:
1. Player 1 creates a room and shares the 4-letter code
2. Player 2 joins with the code
3. Game starts automatically when both players are ready

### Shot Feedback

- **"SO CLOSE!"** - Within 30 pixels
- **"CLOSE!"** - Within 50 pixels
- **"Getting Warm..."** - Within 80 pixels
- **"DIRECT HIT!"** - Explosion animation on successful hit

## 🚀 Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for complete self-hosting instructions.

### Quick Deploy Options

**Option 1: Traditional Server (PM2)**
```bash
./deploy.sh
```

**Option 2: Docker**
```bash
docker-compose up -d
```

**Option 3: Vercel (Free)**
```bash
vercel deploy
```

## 📁 Project Structure

```
├── src/
│   ├── app/
│   │   ├── components/
│   │   │   ├── TankGame.tsx          # Local multiplayer
│   │   │   └── MultiplayerTankGame.tsx  # Online multiplayer
│   │   ├── page.tsx                  # Main menu
│   │   └── layout.tsx
│   └── lib/
│       └── firebase.ts               # Firebase config
├── public/                           # Static assets
├── Dockerfile                        # Docker configuration
├── docker-compose.yml                # Docker Compose
├── deploy.sh                         # Deployment script
├── server-setup.sh                   # Server setup script
├── nginx.conf.example                # Nginx configuration
├── SETUP.md                          # Firebase setup guide
└── DEPLOYMENT.md                     # Deployment guide
```

## 🛠️ Tech Stack

- **Frontend**: Next.js 16, React 19, TypeScript
- **Styling**: Tailwind CSS 4
- **Canvas**: HTML5 Canvas API
- **Database**: Firebase Firestore
- **Deployment**: Docker, PM2, Nginx

## 📝 Environment Variables

Create `.env.local` with your Firebase credentials:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-bucket.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id
```

## 🔮 Future Features

The game architecture supports these features (ready to implement):

- **Wind system**: Physics engine already supports it!
- **Multiple rounds**: Track wins across games
- **Power-ups**: Terrain destruction, shields, etc.
- **Spectator mode**: Watch games in progress
- **Replay system**: Record and playback shots
- **Mobile controls**: Touch-based controls
- **Sound effects**: Explosions and impacts

## 🐛 Troubleshooting

**"Firebase is not configured"**
- Create `.env.local` with Firebase credentials
- Restart dev server

**Room not found**
- Check room code is correct
- Room may have been deleted if host left

**Build fails**
- Node.js 18+ required
- Clear cache: `rm -rf .next node_modules && npm install`

**Can't access from other devices**
- Check firewall settings
- Ensure app is bound to 0.0.0.0, not 127.0.0.1

## 📄 License

MIT License - feel free to use this project for learning or fun!

## 🎉 Credits

Built with ❤️ using Next.js and Firebase

---

**Enjoy playing Danks!** 🎮💥
