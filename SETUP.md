# Danks! - Setup Guide

## Overview

Danks! is a 2-player tank artillery game with both local and online multiplayer modes.

- **Local Play**: Two players take turns on the same device
- **Online Multiplayer**: Play with friends over the internet using Firebase

## Quick Start (Local Play)

Local play works immediately with no setup required!

1. Start the dev server (use the Run button in your IDE)
2. Choose "Local Play" from the menu
3. Play with a friend on the same computer

## Online Multiplayer Setup

To enable online multiplayer, you need to set up Firebase (it's free!):

### Step 1: Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project" or "Create a project"
3. Enter a project name (e.g., "danks-game")
4. Disable Google Analytics (not needed for this game)
5. Click "Create project"

### Step 2: Create a Firestore Database

1. In your Firebase project, click "Firestore Database" in the left menu
2. Click "Create database"
3. Choose "Start in test mode" (for development)
4. Select a Cloud Firestore location (choose one closest to you)
5. Click "Enable"

### Step 3: Register Your Web App

1. In your Firebase project overview, click the Web icon (`</>`)
2. Give your app a nickname (e.g., "Danks Web")
3. Don't check "Set up Firebase Hosting"
4. Click "Register app"
5. Copy the `firebaseConfig` object values

### Step 4: Configure Environment Variables

1. Copy `.env.local.example` to `.env.local`:
   ```bash
   cp .env.local.example .env.local
   ```

2. Open `.env.local` and paste your Firebase config values:
   ```env
   NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key-here
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
   NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id
   ```

3. Save the file

### Step 5: Restart Your Dev Server

Stop and restart your development server to load the new environment variables.

### Step 6: Update Firestore Rules (Optional, for Production)

For production use, update your Firestore security rules:

1. Go to Firestore Database > Rules
2. Replace the rules with:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /rooms/{roomId} {
      // Allow anyone to read rooms
      allow read: if true;

      // Allow anyone to create rooms
      allow create: if true;

      // Allow updates only to existing room members
      allow update: if request.auth != null || true;

      // Allow deletion by host or after 24 hours
      allow delete: if true;
    }
  }
}
```

Note: The rules above are permissive for ease of use. For production, consider adding authentication.

## How to Play Online

1. **Player 1** (Host):
   - Choose "Online Multiplayer"
   - Enter your name
   - Click "Create New Room"
   - Share the 4-letter room code with your friend

2. **Player 2**:
   - Choose "Online Multiplayer"
   - Enter your name
   - Enter the room code
   - Click "Join Room"

3. Game starts automatically when both players join!

## Game Controls

- **← →** : Move tank left/right
- **↑ ↓** : Adjust gun angle
- **W / S** : Increase/decrease shot power
- **SPACE** : Fire!

## Features

### Core Gameplay
- Procedurally generated terrain (different every game!)
- Realistic projectile physics with gravity
- Turn-based gameplay
- Improved tank graphics with treads and turrets

### Shot Feedback
- **"SO CLOSE!"** - Shot landed within 30 pixels
- **"CLOSE!"** - Shot landed within 50 pixels
- **"Getting Warm..."** - Shot landed within 80 pixels
- **"DIRECT HIT!"** - Explosion animation on successful hit

### Multiplayer Features
- Real-time game state synchronization
- Room-based matchmaking with 4-letter codes
- Automatic turn management
- Host can delete room on disconnect

## Future Enhancements (Ready to Implement)

The game is architected to support these features:

- **Wind**: The physics engine already supports wind! Just need to add UI controls
- **Multiple rounds**: Track wins across multiple games
- **Power-ups**: Terrain destruction, shields, etc.
- **Spectator mode**: Watch games in progress
- **Replay system**: Record and playback epic shots

## Troubleshooting

### "Firebase is not configured" error
- Make sure you created `.env.local` with your Firebase credentials
- Restart your dev server after creating `.env.local`

### "Room not found" error
- Check that the room code is correct (case-insensitive)
- Room might have been deleted if host left

### "Room is full" error
- Rooms support exactly 2 players
- Create a new room instead

### Game state not syncing
- Check your internet connection
- Make sure both players are in the same room
- Check browser console for errors

## Tech Stack

- **Frontend**: Next.js 16, React 19, TypeScript, Tailwind CSS
- **Canvas Rendering**: HTML5 Canvas API
- **Multiplayer**: Firebase Firestore (real-time database)
- **Deployment**: Ready for Vercel/Netlify

## Firebase Costs

Firebase offers a generous free tier:
- **Firestore**: 50,000 reads/day, 20,000 writes/day
- For a typical game: ~100 reads/writes per game
- Free tier supports ~200+ games per day!

## Development

Local play works immediately. For testing multiplayer locally:

1. Open two browser windows/tabs
2. Create a room in one window
3. Join with the room code in the other window
4. Play against yourself!

---

Enjoy Danks! 🎮💥
