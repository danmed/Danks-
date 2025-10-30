'use client';

import { useEffect, useRef, useState } from 'react';
import { db } from '@/lib/firebase';
import {
  collection,
  doc,
  setDoc,
  getDoc,
  onSnapshot,
  updateDoc,
  serverTimestamp,
  deleteDoc
} from 'firebase/firestore';

interface Tank {
  x: number;
  y: number;
  angle: number;
  power: number;
  color: string;
  name: string;
  width: number;
  height: number;
}

interface Projectile {
  x: number;
  y: number;
  vx: number;
  vy: number;
  active: boolean;
}

interface ExplosionParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
}

interface Explosion {
  particles: ExplosionParticle[];
  active: boolean;
}

interface ShotFeedback {
  message: string;
  x: number;
  y: number;
  life: number;
}

interface GameState {
  tanks: Tank[];
  currentPlayer: number;
  projectile: Projectile | null;
  terrain: number[];
  gameOver: boolean;
  winner: string | null;
  wind: number;
  explosion: Explosion | null;
  feedback: ShotFeedback | null;
}

interface RoomData {
  roomCode: string;
  players: string[];
  gameState: GameState | null;
  host: string;
  createdAt: any;
  status: 'waiting' | 'playing' | 'finished';
}

const CANVAS_WIDTH = 1200;
const CANVAS_HEIGHT = 600;
const GRAVITY = 0.3;
const TANK_WIDTH = 30;
const TANK_HEIGHT = 20;
const GUN_LENGTH = 25;

export default function MultiplayerTankGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [screen, setScreen] = useState<'menu' | 'lobby' | 'game'>('menu');
  const [roomCode, setRoomCode] = useState('');
  const [playerName, setPlayerName] = useState('');
  const [playerId, setPlayerId] = useState('');
  const [roomData, setRoomData] = useState<RoomData | null>(null);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [error, setError] = useState('');
  const animationFrameRef = useRef<number | null>(null);
  const unsubscribeRef = useRef<(() => void) | null>(null);

  // Generate random room code
  const generateRoomCode = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 4; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  };

  // Generate terrain using simple algorithm
  const generateTerrain = (): number[] => {
    const terrain: number[] = [];
    const segments = 100;
    const width = CANVAS_WIDTH / segments;

    // Random parameters for varied terrain each game
    const offset1 = Math.random() * Math.PI * 2;
    const offset2 = Math.random() * Math.PI * 2;
    const offset3 = Math.random() * Math.PI * 2;
    const amp1 = 30 + Math.random() * 40;
    const amp2 = 20 + Math.random() * 30;
    const amp3 = 25 + Math.random() * 35;
    const freq1 = 0.008 + Math.random() * 0.004;
    const freq2 = 0.015 + Math.random() * 0.01;
    const freq3 = 0.004 + Math.random() * 0.003;

    for (let i = 0; i <= segments; i++) {
      const x = i * width;
      const y = CANVAS_HEIGHT * 0.7 -
        Math.sin(x * freq1 + offset1) * amp1 -
        Math.sin(x * freq2 + offset2) * amp2 -
        Math.cos(x * freq3 + offset3) * amp3;
      terrain.push(Math.max(CANVAS_HEIGHT * 0.3, Math.min(CANVAS_HEIGHT * 0.9, y)));
    }

    return terrain;
  };

  // Get terrain height at specific x position
  const getTerrainHeight = (x: number, terrain: number[]): number => {
    const index = Math.floor((x / CANVAS_WIDTH) * (terrain.length - 1));
    return terrain[Math.max(0, Math.min(terrain.length - 1, index))];
  };

  // Initialize game state
  const initGameState = (terrain: number[]): GameState => {
    const tank1X = CANVAS_WIDTH * 0.2;
    const tank2X = CANVAS_WIDTH * 0.8;

    return {
      tanks: [
        {
          x: tank1X,
          y: getTerrainHeight(tank1X, terrain) - TANK_HEIGHT,
          angle: 45,
          power: 50,
          color: '#3b82f6',
          name: 'Player 1',
          width: TANK_WIDTH,
          height: TANK_HEIGHT,
        },
        {
          x: tank2X,
          y: getTerrainHeight(tank2X, terrain) - TANK_HEIGHT,
          angle: 135,
          power: 50,
          color: '#ef4444',
          name: 'Player 2',
          width: TANK_WIDTH,
          height: TANK_HEIGHT,
        },
      ],
      currentPlayer: 0,
      projectile: null,
      terrain,
      gameOver: false,
      winner: null,
      wind: 0,
      explosion: null,
      feedback: null,
    };
  };

  // Create a new room
  const createRoom = async () => {
    if (!playerName.trim()) {
      setError('Please enter your name');
      return;
    }

    try {
      const code = generateRoomCode();
      const pid = `player_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      const terrain = generateTerrain();
      const initialGameState = initGameState(terrain);

      const roomRef = doc(db, 'rooms', code);
      const newRoom: RoomData = {
        roomCode: code,
        players: [pid],
        gameState: initialGameState,
        host: pid,
        createdAt: serverTimestamp(),
        status: 'waiting',
      };

      await setDoc(roomRef, newRoom);

      setRoomCode(code);
      setPlayerId(pid);
      setScreen('lobby');
      setError('');

      // Subscribe to room updates
      subscribeToRoom(code);
    } catch (err) {
      console.error('Error creating room:', err);
      setError('Failed to create room. Make sure Firebase is configured.');
    }
  };

  // Join an existing room
  const joinRoom = async () => {
    if (!playerName.trim()) {
      setError('Please enter your name');
      return;
    }
    if (!roomCode.trim()) {
      setError('Please enter a room code');
      return;
    }

    try {
      const code = roomCode.toUpperCase().trim();
      const roomRef = doc(db, 'rooms', code);
      const roomSnap = await getDoc(roomRef);

      if (!roomSnap.exists()) {
        setError('Room not found');
        return;
      }

      const room = roomSnap.data() as RoomData;

      if (room.players.length >= 2) {
        setError('Room is full');
        return;
      }

      const pid = `player_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      await updateDoc(roomRef, {
        players: [...room.players, pid],
        status: 'playing',
      });

      setPlayerId(pid);
      setScreen('lobby');
      setError('');

      // Subscribe to room updates
      subscribeToRoom(code);
    } catch (err) {
      console.error('Error joining room:', err);
      setError('Failed to join room');
    }
  };

  // Subscribe to room updates
  const subscribeToRoom = (code: string) => {
    const roomRef = doc(db, 'rooms', code);

    const unsubscribe = onSnapshot(roomRef, (snapshot) => {
      if (snapshot.exists()) {
        const room = snapshot.data() as RoomData;
        setRoomData(room);

        if (room.status === 'playing' && room.gameState) {
          setGameState(room.gameState);
          setScreen('game');
        }
      } else {
        setError('Room was deleted');
        setScreen('menu');
      }
    });

    unsubscribeRef.current = unsubscribe;
  };

  // Update game state in Firestore
  const updateGameState = async (newState: GameState) => {
    if (!roomCode || !roomData) return;

    try {
      const roomRef = doc(db, 'rooms', roomCode);
      await updateDoc(roomRef, {
        gameState: newState,
        status: newState.gameOver ? 'finished' : 'playing',
      });
    } catch (err) {
      console.error('Error updating game state:', err);
    }
  };

  // Get current player index
  const getPlayerIndex = (): number => {
    if (!roomData || !playerId) return -1;
    return roomData.players.indexOf(playerId);
  };

  // Check if it's this player's turn
  const isMyTurn = (): boolean => {
    if (!gameState) return false;
    return getPlayerIndex() === gameState.currentPlayer;
  };

  // Create explosion
  const createExplosion = (x: number, y: number): Explosion => {
    const particles: ExplosionParticle[] = [];
    const particleCount = 30;

    for (let i = 0; i < particleCount; i++) {
      const angle = (Math.PI * 2 * i) / particleCount + (Math.random() - 0.5) * 0.5;
      const speed = 2 + Math.random() * 4;
      const life = 40 + Math.random() * 20;

      particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life,
        maxLife: life,
        color: ['rgba(255, 100, 0, 1)', 'rgba(255, 150, 0, 1)', 'rgba(255, 200, 0, 1)', 'rgba(255, 50, 0, 1)'][Math.floor(Math.random() * 4)],
        size: 3 + Math.random() * 3,
      });
    }

    return { particles, active: true };
  };

  // Update physics (only called by host/current player)
  const updatePhysics = (state: GameState): GameState => {
    let newState = { ...state };

    // Update explosion particles
    if (newState.explosion && newState.explosion.active) {
      const updatedParticles = newState.explosion.particles
        .map((p) => ({
          ...p,
          x: p.x + p.vx,
          y: p.y + p.vy,
          vy: p.vy + GRAVITY * 0.5,
          life: p.life - 1,
        }))
        .filter((p) => p.life > 0);

      if (updatedParticles.length === 0) {
        newState.explosion = null;
      } else {
        newState.explosion = { ...newState.explosion, particles: updatedParticles };
      }
    }

    // Update feedback
    if (newState.feedback && newState.feedback.life > 0) {
      newState.feedback = {
        ...newState.feedback,
        life: newState.feedback.life - 1,
        y: newState.feedback.y - 0.5,
      };
      if (newState.feedback.life <= 0) {
        newState.feedback = null;
      }
    }

    if (!state.projectile || !state.projectile.active) return newState;

    const newProjectile = { ...state.projectile };

    // Apply gravity
    newProjectile.vy += GRAVITY;
    newProjectile.vx += state.wind * 0.01;

    // Update position
    newProjectile.x += newProjectile.vx;
    newProjectile.y += newProjectile.vy;

    // Check collision with bounds
    if (newProjectile.x < 0 || newProjectile.x > CANVAS_WIDTH || newProjectile.y > CANVAS_HEIGHT) {
      newProjectile.active = false;
      return {
        ...newState,
        projectile: null,
        currentPlayer: (state.currentPlayer + 1) % state.tanks.length,
      };
    }

    const terrainHeight = getTerrainHeight(newProjectile.x, state.terrain);
    if (newProjectile.y >= terrainHeight) {
      // Hit terrain - check if close to enemy tank
      let closestDistance = Infinity;
      let closestTankIndex = -1;

      for (let i = 0; i < state.tanks.length; i++) {
        if (i === state.currentPlayer) continue;
        const tank = state.tanks[i];
        const distance = Math.abs(tank.x - newProjectile.x);
        if (distance < closestDistance) {
          closestDistance = distance;
          closestTankIndex = i;
        }
      }

      newProjectile.active = false;
      let feedback = null;

      if (closestTankIndex !== -1 && closestDistance < 80) {
        feedback = {
          message: closestDistance < 30 ? 'SO CLOSE!' : closestDistance < 50 ? 'CLOSE!' : 'Getting Warm...',
          x: newProjectile.x,
          y: terrainHeight - 20,
          life: 60,
        };
      }

      return {
        ...newState,
        projectile: null,
        currentPlayer: (state.currentPlayer + 1) % state.tanks.length,
        feedback,
      };
    }

    // Check collision with tanks
    for (let i = 0; i < state.tanks.length; i++) {
      if (i === state.currentPlayer) continue;

      const tank = state.tanks[i];
      if (
        newProjectile.x >= tank.x - tank.width / 2 &&
        newProjectile.x <= tank.x + tank.width / 2 &&
        newProjectile.y >= tank.y &&
        newProjectile.y <= tank.y + tank.height
      ) {
        return {
          ...newState,
          projectile: null,
          explosion: createExplosion(newProjectile.x, newProjectile.y),
          feedback: {
            message: 'DIRECT HIT!',
            x: newProjectile.x,
            y: tank.y - 40,
            life: 80,
          },
          gameOver: true,
          winner: state.tanks[state.currentPlayer].name,
        };
      }
    }

    return { ...newState, projectile: newProjectile };
  };

  // Draw game
  const draw = (ctx: CanvasRenderingContext2D, state: GameState) => {
    // Clear canvas
    ctx.fillStyle = '#87CEEB';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Draw terrain
    ctx.fillStyle = '#8B4513';
    ctx.beginPath();
    ctx.moveTo(0, CANVAS_HEIGHT);

    for (let i = 0; i < state.terrain.length; i++) {
      const x = (i / (state.terrain.length - 1)) * CANVAS_WIDTH;
      ctx.lineTo(x, state.terrain[i]);
    }

    ctx.lineTo(CANVAS_WIDTH, CANVAS_HEIGHT);
    ctx.closePath();
    ctx.fill();

    // Draw grass
    ctx.strokeStyle = '#228B22';
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let i = 0; i < state.terrain.length; i++) {
      const x = (i / (state.terrain.length - 1)) * CANVAS_WIDTH;
      if (i === 0) {
        ctx.moveTo(x, state.terrain[i]);
      } else {
        ctx.lineTo(x, state.terrain[i]);
      }
    }
    ctx.stroke();

    // Draw tanks
    state.tanks.forEach((tank, index) => {
      tank.y = getTerrainHeight(tank.x, state.terrain) - tank.height;

      // Tank treads
      ctx.fillStyle = '#2a2a2a';
      ctx.fillRect(tank.x - tank.width / 2, tank.y + tank.height - 6, tank.width, 6);

      // Tread wheels
      ctx.fillStyle = '#1a1a1a';
      for (let i = 0; i < 4; i++) {
        const wheelX = tank.x - tank.width / 2 + (tank.width / 5) * (i + 0.5);
        ctx.beginPath();
        ctx.arc(wheelX, tank.y + tank.height - 3, 3, 0, Math.PI * 2);
        ctx.fill();
      }

      // Tank body
      ctx.fillStyle = tank.color;
      ctx.fillRect(tank.x - tank.width / 2 + 3, tank.y + 4, tank.width - 6, tank.height - 10);

      // Shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
      ctx.fillRect(tank.x - tank.width / 2 + 3, tank.y + tank.height - 10, tank.width - 6, 4);

      // Turret base
      ctx.fillStyle = tank.color;
      ctx.fillRect(tank.x - 10, tank.y, 20, 10);

      // Turret top
      ctx.beginPath();
      ctx.arc(tank.x, tank.y + 5, 7, 0, Math.PI * 2);
      ctx.fill();

      // Highlight
      ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.beginPath();
      ctx.arc(tank.x - 2, tank.y + 3, 3, 0, Math.PI * 2);
      ctx.fill();

      // Gun barrel
      const angleRad = (tank.angle * Math.PI) / 180;
      const gunEndX = tank.x + Math.cos(angleRad) * GUN_LENGTH;
      const gunEndY = tank.y + 5 - Math.sin(angleRad) * GUN_LENGTH;

      // Shadow
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(tank.x, tank.y + 5);
      ctx.lineTo(gunEndX + 1, gunEndY + 1);
      ctx.stroke();

      // Main barrel
      ctx.strokeStyle = tank.color;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(tank.x, tank.y + 5);
      ctx.lineTo(gunEndX, gunEndY);
      ctx.stroke();

      // Highlight
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(tank.x, tank.y + 5);
      ctx.lineTo(gunEndX, gunEndY);
      ctx.stroke();

      // Current player indicator
      if (index === state.currentPlayer && !state.projectile) {
        ctx.strokeStyle = '#ffff00';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.strokeRect(tank.x - tank.width / 2 - 3, tank.y - 3, tank.width + 6, tank.height + 6);
        ctx.setLineDash([]);
      }
    });

    // Draw projectile
    if (state.projectile && state.projectile.active) {
      ctx.fillStyle = '#000000';
      ctx.beginPath();
      ctx.arc(state.projectile.x, state.projectile.y, 4, 0, Math.PI * 2);
      ctx.fill();
    }

    // Draw explosion
    if (state.explosion && state.explosion.active) {
      state.explosion.particles.forEach((particle) => {
        const opacity = particle.life / particle.maxLife;
        ctx.fillStyle = particle.color.replace('1)', `${opacity})`);
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fill();
      });
    }

    // Draw feedback
    if (state.feedback && state.feedback.life > 0) {
      const opacity = state.feedback.life / 60;
      const scale = 1 + (1 - opacity) * 0.5;
      ctx.save();
      ctx.translate(state.feedback.x, state.feedback.y);
      ctx.scale(scale, scale);
      ctx.font = 'bold 24px Arial';
      ctx.fillStyle = `rgba(255, 255, 0, ${opacity})`;
      ctx.strokeStyle = `rgba(0, 0, 0, ${opacity})`;
      ctx.lineWidth = 3;
      ctx.textAlign = 'center';
      ctx.strokeText(state.feedback.message, 0, 0);
      ctx.fillText(state.feedback.message, 0, 0);
      ctx.restore();
    }
  };

  // Game loop
  useEffect(() => {
    if (!gameState || !canvasRef.current || screen !== 'game') return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const gameLoop = () => {
      let newState = gameState;

      // Only update physics if it's my turn or if animations are running
      if (isMyTurn() || gameState.explosion || gameState.feedback) {
        newState = updatePhysics(gameState);

        // Only sync to Firebase if state actually changed
        if (newState !== gameState) {
          setGameState(newState);
          updateGameState(newState);
        }
      }

      draw(ctx, newState);

      if (!newState.gameOver) {
        animationFrameRef.current = requestAnimationFrame(gameLoop);
      }
    };

    animationFrameRef.current = requestAnimationFrame(gameLoop);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [gameState, screen]);

  // Handle keyboard controls
  useEffect(() => {
    if (!gameState || gameState.projectile || gameState.gameOver || !isMyTurn()) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isMyTurn() || !gameState) return;

      const newState = { ...gameState };
      const playerIndex = getPlayerIndex();
      const currentTank = { ...newState.tanks[playerIndex] };

      let updated = false;

      switch (e.key) {
        case 'ArrowLeft':
          currentTank.x = Math.max(TANK_WIDTH, currentTank.x - 5);
          updated = true;
          break;
        case 'ArrowRight':
          currentTank.x = Math.min(CANVAS_WIDTH - TANK_WIDTH, currentTank.x + 5);
          updated = true;
          break;
        case 'ArrowUp':
          currentTank.angle = Math.min(180, currentTank.angle + 2);
          updated = true;
          break;
        case 'ArrowDown':
          currentTank.angle = Math.max(0, currentTank.angle - 2);
          updated = true;
          break;
        case 'w':
        case 'W':
          currentTank.power = Math.min(100, currentTank.power + 2);
          updated = true;
          break;
        case 's':
        case 'S':
          currentTank.power = Math.max(10, currentTank.power - 2);
          updated = true;
          break;
        case ' ':
          const angleRad = (currentTank.angle * Math.PI) / 180;
          const velocity = currentTank.power / 5;
          newState.projectile = {
            x: currentTank.x,
            y: currentTank.y + currentTank.height / 2,
            vx: Math.cos(angleRad) * velocity,
            vy: -Math.sin(angleRad) * velocity,
            active: true,
          };
          updated = true;
          break;
      }

      if (updated) {
        newState.tanks[playerIndex] = currentTank;
        setGameState(newState);
        updateGameState(newState);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState, playerId, roomData]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, []);

  // Leave room
  const leaveRoom = async () => {
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
    }

    if (roomCode && roomData && roomData.host === playerId) {
      // Delete room if host leaves
      try {
        await deleteDoc(doc(db, 'rooms', roomCode));
      } catch (err) {
        console.error('Error deleting room:', err);
      }
    }

    setScreen('menu');
    setRoomCode('');
    setRoomData(null);
    setGameState(null);
  };

  // RENDER: Menu screen
  if (screen === 'menu') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white p-4">
        <h1 className="text-5xl font-bold mb-2">Danks!</h1>
        <p className="text-gray-400 mb-8">Online Multiplayer</p>

        <div className="bg-gray-800 p-8 rounded-lg max-w-md w-full space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Your Name</label>
            <input
              type="text"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              className="w-full px-4 py-2 bg-gray-700 rounded border border-gray-600 focus:border-blue-500 outline-none"
              placeholder="Enter your name"
              maxLength={20}
            />
          </div>

          <button
            onClick={createRoom}
            className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold transition"
          >
            Create New Room
          </button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-600"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-gray-800 text-gray-400">or</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Room Code</label>
            <input
              type="text"
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
              className="w-full px-4 py-2 bg-gray-700 rounded border border-gray-600 focus:border-blue-500 outline-none uppercase"
              placeholder="ABCD"
              maxLength={4}
            />
          </div>

          <button
            onClick={joinRoom}
            className="w-full px-6 py-3 bg-green-600 hover:bg-green-700 rounded-lg font-semibold transition"
          >
            Join Room
          </button>

          {error && (
            <div className="p-3 bg-red-600/20 border border-red-600 rounded text-red-400 text-sm">
              {error}
            </div>
          )}

          <div className="mt-6 p-4 bg-gray-700/50 rounded text-sm text-gray-300">
            <p className="font-semibold mb-2">⚠️ Firebase Setup Required</p>
            <p>Configure your Firebase credentials in <code className="bg-gray-900 px-1">.env.local</code></p>
            <p className="mt-2 text-xs">See <code className="bg-gray-900 px-1">.env.local.example</code> for template</p>
          </div>
        </div>
      </div>
    );
  }

  // RENDER: Lobby screen
  if (screen === 'lobby') {
    const playerIndex = getPlayerIndex();
    const isHost = roomData?.host === playerId;

    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white p-4">
        <h1 className="text-4xl font-bold mb-8">Danks!</h1>

        <div className="bg-gray-800 p-8 rounded-lg max-w-md w-full">
          <div className="text-center mb-6">
            <p className="text-gray-400 text-sm mb-2">Room Code</p>
            <p className="text-4xl font-bold tracking-wider">{roomCode}</p>
            <p className="text-gray-400 text-sm mt-2">Share this code with your friend!</p>
          </div>

          <div className="space-y-3 mb-6">
            <div className={`p-4 rounded ${playerIndex === 0 ? 'bg-blue-600' : 'bg-gray-700'}`}>
              <p className="font-semibold">Player 1 {isHost && playerIndex === 0 ? '(You - Host)' : playerIndex === 0 ? '(You)' : ''}</p>
              <p className="text-sm text-gray-300">{roomData?.players[0] ? 'Ready' : 'Waiting...'}</p>
            </div>
            <div className={`p-4 rounded ${playerIndex === 1 ? 'bg-red-600' : 'bg-gray-700'}`}>
              <p className="font-semibold">Player 2 {playerIndex === 1 ? '(You)' : ''}</p>
              <p className="text-sm text-gray-300">{roomData?.players[1] ? 'Ready' : 'Waiting...'}</p>
            </div>
          </div>

          {roomData?.status === 'waiting' && (
            <p className="text-center text-yellow-400 mb-4">
              Waiting for another player to join...
            </p>
          )}

          <button
            onClick={leaveRoom}
            className="w-full px-6 py-3 bg-red-600 hover:bg-red-700 rounded-lg font-semibold transition"
          >
            Leave Room
          </button>
        </div>
      </div>
    );
  }

  // RENDER: Game screen
  if (screen === 'game' && gameState && roomData) {
    const playerIndex = getPlayerIndex();
    const currentTank = gameState.tanks[playerIndex];
    const myTurn = isMyTurn();

    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white p-4">
        <h1 className="text-3xl font-bold mb-4">Danks! - Room: {roomCode}</h1>

        <div className="mb-4 bg-gray-800 p-4 rounded-lg">
          <div className="grid grid-cols-2 gap-8">
            {gameState.tanks.map((tank, i) => (
              <div key={i} className={`text-center ${i === gameState.currentPlayer ? 'font-bold' : 'opacity-50'}`}>
                <div style={{ color: tank.color }} className="text-xl mb-2">
                  {tank.name} {i === playerIndex ? '(You)' : ''}
                  {i === gameState.currentPlayer ? ' - YOUR TURN!' : ''}
                </div>
              </div>
            ))}
          </div>
        </div>

        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          className="border-4 border-gray-700 rounded-lg"
        />

        {!gameState.gameOver && !gameState.projectile && (
          <div className="mt-4 bg-gray-800 p-6 rounded-lg max-w-2xl">
            {myTurn ? (
              <>
                <div className="grid grid-cols-2 gap-6 mb-4">
                  <div>
                    <div className="text-sm text-gray-400 mb-1">Angle: {currentTank.angle}°</div>
                    <div className="text-sm text-gray-400">Power: {currentTank.power}%</div>
                  </div>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="font-semibold text-yellow-400 mb-2">Controls:</div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>← → : Move tank</div>
                    <div>↑ ↓ : Adjust angle</div>
                    <div>W S : Adjust power</div>
                    <div>SPACE : Fire!</div>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center text-yellow-400 text-lg">
                Waiting for opponent's turn...
              </div>
            )}
          </div>
        )}

        {gameState.gameOver && (
          <div className="mt-4 bg-green-600 p-6 rounded-lg text-center">
            <h2 className="text-2xl font-bold mb-4">
              {gameState.winner} Wins!
            </h2>
            <button
              onClick={leaveRoom}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold"
            >
              Back to Menu
            </button>
          </div>
        )}

        <button
          onClick={leaveRoom}
          className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 rounded text-sm"
        >
          Leave Game
        </button>
      </div>
    );
  }

  return null;
}
