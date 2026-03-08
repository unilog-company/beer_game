import { create } from 'zustand';
import type { RoomState, GameState, PlayerRole, RoomSummary } from '@shared/types';
import { socket } from './socket';

type Screen = 'lobby' | 'waiting' | 'game' | 'results' | 'leaderboard';

interface SessionData {
  roomCode: string;
  playerName: string;
}

function saveSession(data: SessionData | null) {
  if (data) {
    sessionStorage.setItem('beer-game-session', JSON.stringify(data));
  } else {
    sessionStorage.removeItem('beer-game-session');
  }
}

function loadSession(): SessionData | null {
  try {
    const raw = sessionStorage.getItem('beer-game-session');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

interface GameStore {
  screen: Screen;
  playerName: string;
  room: RoomState | null;
  game: GameState | null;
  myRole: PlayerRole | null;
  orderTimeRemaining: number;
  connected: boolean;
  error: string | null;
  openRooms: RoomSummary[];

  setScreen: (screen: Screen) => void;
  setPlayerName: (name: string) => void;
  setError: (error: string | null) => void;
  clearError: () => void;

  createRoom: (name: string) => void;
  joinRoom: (code: string, name: string) => void;
  selectRole: (role: PlayerRole) => void;
  updateConfig: (config: Record<string, unknown>) => void;
  fillAI: () => void;
  startGame: () => void;
  submitOrder: (amount: number) => void;
  leaveRoom: () => void;
  refreshRooms: () => void;
}

export const useGameStore = create<GameStore>((set, get) => ({
  screen: 'lobby',
  playerName: '',
  room: null,
  game: null,
  myRole: null,
  orderTimeRemaining: 0,
  connected: false,
  error: null,
  openRooms: [],

  setScreen: (screen) => set({ screen }),
  setPlayerName: (playerName) => set({ playerName }),
  setError: (error) => set({ error }),
  clearError: () => set({ error: null }),

  createRoom: (name) => {
    set({ playerName: name });
    socket.emit('create-room', { playerName: name });
  },

  joinRoom: (code, name) => {
    set({ playerName: name });
    socket.emit('join-room', { roomCode: code, playerName: name });
  },

  selectRole: (role) => {
    socket.emit('select-role', { role });
  },

  updateConfig: (config) => {
    socket.emit('update-config', config as never);
  },

  fillAI: () => {
    socket.emit('fill-ai');
  },

  startGame: () => {
    socket.emit('start-game');
  },

  submitOrder: (amount) => {
    socket.emit('submit-order', { amount });
  },

  leaveRoom: () => {
    socket.emit('leave-room');
    saveSession(null);
    set({ screen: 'lobby', room: null, game: null, myRole: null });
  },

  refreshRooms: () => {
    socket.emit('list-rooms');
  },
}));

let initialized = false;

export function initSocketListeners(): void {
  if (initialized) return;
  initialized = true;

  const store = useGameStore;

  socket.on('connect', () => {
    store.setState({ connected: true });
    socket.emit('list-rooms');

    const session = loadSession();
    const state = store.getState();
    if (session && state.screen === 'lobby' && !state.room) {
      socket.emit('rejoin-room', {
        roomCode: session.roomCode,
        playerName: session.playerName,
      });
    }
  });

  socket.on('disconnect', () => {
    store.setState({ connected: false });
  });

  socket.on('room-updated', (room) => {
    const state = store.getState();
    const me = room.players.find((p) => p.id === socket.id);
    const myRole = me?.role ?? null;

    if (me) {
      saveSession({ roomCode: room.code, playerName: me.name });
    }

    let screen = state.screen;
    if (room.gamePhase === 'lobby' && state.screen === 'lobby') {
      screen = 'waiting';
    }
    if (room.gamePhase === 'finished') {
      screen = 'results';
    }

    store.setState({ room, myRole, screen });
  });

  socket.on('rejoined', ({ role, gamePhase }) => {
    const screenMap: Record<string, Screen> = {
      lobby: 'waiting',
      playing: 'game',
      finished: 'results',
    };
    store.setState({
      screen: screenMap[gamePhase] ?? 'waiting',
      myRole: role,
    });
  });

  socket.on('game-started', (_state) => {
    store.setState({ screen: 'game' });
  });

  socket.on('game-state', (gameState) => {
    store.setState({ game: gameState });
  });

  socket.on('order-phase', ({ timeRemaining }) => {
    store.setState({ orderTimeRemaining: timeRemaining });
  });

  socket.on('timer-tick', ({ timeRemaining }) => {
    store.setState({ orderTimeRemaining: timeRemaining });
  });

  socket.on('game-over', (gameState) => {
    saveSession(null);
    store.setState({ game: gameState, screen: 'results' });
  });

  socket.on('error', ({ message }) => {
    store.setState({ error: message });
    setTimeout(() => store.setState({ error: null }), 4000);
  });

  socket.on('room-list', (rooms: RoomSummary[]) => {
    store.setState({ openRooms: rooms });
  });

  socket.on('order-submitted', ({ role }) => {
    const game = store.getState().game;
    if (game && !game.ordersSubmitted.includes(role)) {
      store.setState({
        game: {
          ...game,
          ordersSubmitted: [...game.ordersSubmitted, role],
        },
      });
    }
  });

  socket.connect();
}
