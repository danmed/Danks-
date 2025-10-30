'use client';

import { useState } from 'react';
import TankGame from './components/TankGame';
import MultiplayerTankGame from './components/MultiplayerTankGame';

export default function Home() {
  const [mode, setMode] = useState<'menu' | 'local' | 'online'>('menu');

  if (mode === 'menu') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white">
        <h1 className="text-6xl font-bold mb-4">Danks!</h1>
        <p className="text-gray-400 text-xl mb-12">Choose your game mode</p>

        <div className="flex gap-6">
          <button
            onClick={() => setMode('local')}
            className="px-8 py-4 bg-blue-600 hover:bg-blue-700 rounded-lg text-xl font-semibold transition transform hover:scale-105"
          >
            🎮 Local Play
            <p className="text-sm font-normal mt-2 text-gray-300">Play on the same device</p>
          </button>

          <button
            onClick={() => setMode('online')}
            className="px-8 py-4 bg-green-600 hover:bg-green-700 rounded-lg text-xl font-semibold transition transform hover:scale-105"
          >
            🌐 Online Multiplayer
            <p className="text-sm font-normal mt-2 text-gray-300">Play over the internet</p>
          </button>
        </div>

        <div className="mt-12 max-w-2xl text-center text-gray-400 text-sm">
          <p className="mb-2">
            <strong className="text-white">Local Play:</strong> Two players take turns on the same computer
          </p>
          <p>
            <strong className="text-white">Online Multiplayer:</strong> Create or join a room with a friend anywhere in the world
          </p>
        </div>
      </div>
    );
  }

  if (mode === 'local') {
    return (
      <div>
        <button
          onClick={() => setMode('menu')}
          className="absolute top-4 left-4 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded text-white z-10"
        >
          ← Back to Menu
        </button>
        <TankGame />
      </div>
    );
  }

  if (mode === 'online') {
    return (
      <div>
        <button
          onClick={() => setMode('menu')}
          className="absolute top-4 left-4 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded text-white z-10"
        >
          ← Back to Menu
        </button>
        <MultiplayerTankGame />
      </div>
    );
  }

  return null;
}
