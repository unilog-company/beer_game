import {
  PlayerInfo,
  PlayerRole,
  RoomState,
  GameConfig,
  GameState,
} from '@beer-game/shared';
import { ROLE_ORDER } from '@beer-game/shared';
import { createDefaultConfig, createGameState } from './game-engine.js';

interface Room {
  state: RoomState;
  game: GameState | null;
  orderTimer: ReturnType<typeof setTimeout> | null;
  tickInterval: ReturnType<typeof setInterval> | null;
  orderTimeRemaining: number;
  pendingOrders: Map<PlayerRole, number>;
  aiTimers: ReturnType<typeof setTimeout>[];
}

const rooms = new Map<string, Room>();

function generateCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 4; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return rooms.has(code) ? generateCode() : code;
}

export function createRoom(playerId: string, playerName: string): Room {
  const code = generateCode();
  const room: Room = {
    state: {
      code,
      players: [
        {
          id: playerId,
          name: playerName,
          role: null,
          isHost: true,
          isAI: false,
          connected: true,
        },
      ],
      config: createDefaultConfig(),
      gamePhase: 'lobby',
    },
    game: null,
    orderTimer: null,
    tickInterval: null,
    orderTimeRemaining: 0,
    pendingOrders: new Map(),
    aiTimers: [],
  };
  rooms.set(code, room);
  return room;
}

export function getRoom(code: string): Room | undefined {
  return rooms.get(code.toUpperCase());
}

export interface RoomSummary {
  code: string;
  hostName: string;
  playerCount: number;
  hasAI: boolean;
  config: GameConfig;
}

export function listOpenRooms(): RoomSummary[] {
  const result: RoomSummary[] = [];
  for (const room of rooms.values()) {
    if (room.state.gamePhase !== 'lobby') continue;
    const humans = room.state.players.filter((p) => !p.isAI);
    if (humans.length >= 4) continue;
    const host = room.state.players.find((p) => p.isHost);
    result.push({
      code: room.state.code,
      hostName: host?.name ?? 'Unknown',
      playerCount: humans.length,
      hasAI: room.state.players.some((p) => p.isAI),
      config: room.state.config,
    });
  }
  return result;
}

export function joinRoom(
  code: string,
  playerId: string,
  playerName: string
): Room | null {
  const room = rooms.get(code.toUpperCase());
  if (!room) return null;
  if (room.state.gamePhase !== 'lobby') return null;

  const existing = room.state.players.find((p) => p.id === playerId);
  if (existing) {
    existing.connected = true;
    existing.name = playerName;
    return room;
  }

  if (room.state.players.filter((p) => !p.isAI).length >= 4) return null;

  room.state.players.push({
    id: playerId,
    name: playerName,
    role: null,
    isHost: false,
    isAI: false,
    connected: true,
  });
  return room;
}

export function removePlayer(code: string, playerId: string): Room | null {
  const room = rooms.get(code);
  if (!room) return null;

  room.state.players = room.state.players.filter((p) => p.id !== playerId);

  if (room.state.players.filter((p) => !p.isAI).length === 0) {
    cleanupRoom(code);
    return null;
  }

  if (!room.state.players.some((p) => p.isHost && !p.isAI)) {
    const firstHuman = room.state.players.find((p) => !p.isAI);
    if (firstHuman) firstHuman.isHost = true;
  }

  return room;
}

export function selectRole(
  code: string,
  playerId: string,
  role: PlayerRole
): boolean {
  const room = rooms.get(code);
  if (!room) return false;

  const taken = room.state.players.some(
    (p) => p.role === role && p.id !== playerId
  );
  if (taken) return false;

  const player = room.state.players.find((p) => p.id === playerId);
  if (!player) return false;

  player.role = role;
  return true;
}

export function updateConfig(code: string, config: Partial<GameConfig>): boolean {
  const room = rooms.get(code);
  if (!room) return false;
  room.state.config = { ...room.state.config, ...config };
  return true;
}

export function fillWithAI(code: string): boolean {
  const room = rooms.get(code);
  if (!room) return false;

  const takenRoles = new Set(
    room.state.players.filter((p) => p.role).map((p) => p.role)
  );

  for (const role of ROLE_ORDER) {
    if (!takenRoles.has(role)) {
      room.state.players.push({
        id: `ai-${role}`,
        name: `AI ${role.charAt(0).toUpperCase() + role.slice(1)}`,
        role,
        isHost: false,
        isAI: true,
        connected: true,
      });
    }
  }
  return true;
}

export function canStartGame(code: string): boolean {
  const room = rooms.get(code);
  if (!room) return false;

  const assignedRoles = new Set(
    room.state.players.filter((p) => p.role).map((p) => p.role)
  );
  return ROLE_ORDER.every((role) => assignedRoles.has(role));
}

export function startGame(code: string): GameState | null {
  const room = rooms.get(code);
  if (!room || !canStartGame(code)) return null;

  room.state.gamePhase = 'playing';
  room.game = createGameState(code, room.state.config);
  room.pendingOrders = new Map();
  return room.game;
}

export function disconnectPlayer(playerId: string): { code: string; room: Room } | null {
  for (const [code, room] of rooms.entries()) {
    const player = room.state.players.find((p) => p.id === playerId);
    if (player) {
      player.connected = false;
      return { code, room };
    }
  }
  return null;
}

export function reconnectPlayer(
  code: string,
  newSocketId: string,
  playerName: string
): { room: Room; role: PlayerRole | null } | null {
  const room = rooms.get(code.toUpperCase());
  if (!room) return null;

  const player = room.state.players.find(
    (p) => p.name === playerName && !p.isAI
  );
  if (!player) return null;

  const oldId = player.id;
  player.id = newSocketId;
  player.connected = true;

  if (room.pendingOrders.has(player.role as PlayerRole)) {
    const order = room.pendingOrders.get(player.role as PlayerRole)!;
    room.pendingOrders.delete(player.role as PlayerRole);
    room.pendingOrders.set(player.role as PlayerRole, order);
  }

  return { room, role: player.role };
}

export function findRoomByPlayer(playerId: string): Room | null {
  for (const room of rooms.values()) {
    if (room.state.players.some((p) => p.id === playerId)) {
      return room;
    }
  }
  return null;
}

function cleanupRoom(code: string): void {
  const room = rooms.get(code);
  if (room) {
    if (room.orderTimer) clearTimeout(room.orderTimer);
    if (room.tickInterval) clearInterval(room.tickInterval);
    if (room.aiTimers) {
      for (const t of room.aiTimers) clearTimeout(t);
    }
    rooms.delete(code);
  }
}

export function closeRoom(code: string, playerId: string): string[] | null {
  const room = rooms.get(code);
  if (!room) return null;

  const player = room.state.players.find((p) => p.id === playerId);
  if (!player?.isHost) return null;

  const playerIds = room.state.players
    .filter((p) => !p.isAI)
    .map((p) => p.id);

  cleanupRoom(code);
  return playerIds;
}

export function deleteRoom(code: string): void {
  cleanupRoom(code);
}
