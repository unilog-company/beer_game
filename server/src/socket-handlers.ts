import { Server, Socket } from 'socket.io';
import {
  ClientToServerEvents,
  ServerToClientEvents,
  PlayerRole,
  GameState,
} from '@beer-game/shared';
import { ORDER_TIMEOUT_SECONDS, ROLE_ORDER } from '@beer-game/shared';
import {
  createRoom,
  joinRoom,
  selectRole,
  updateConfig,
  fillWithAI,
  canStartGame,
  startGame,
  removePlayer,
  disconnectPlayer,
  reconnectPlayer,
  findRoomByPlayer,
  getRoom,
  listOpenRooms,
} from './rooms.js';
import { advanceTurn, getAIOrder, getVisibleState } from './game-engine.js';

type GameSocket = Socket<ClientToServerEvents, ServerToClientEvents>;

function broadcastRoomState(io: Server, code: string): void {
  const room = getRoom(code);
  if (!room) return;
  io.to(code).emit('room-updated', room.state);
}

function broadcastGameState(io: Server, room: ReturnType<typeof getRoom>): void {
  if (!room?.game) return;
  const code = room.state.code;

  for (const player of room.state.players) {
    if (player.isAI || !player.role) continue;
    const visibleNodes = getVisibleState(room.game, player.role);
    const stateForPlayer: GameState = {
      ...room.game,
      nodes: visibleNodes,
    };
    io.to(player.id).emit('game-state', stateForPlayer);
  }
}

function startOrderPhase(io: Server, room: ReturnType<typeof getRoom>): void {
  if (!room?.game) return;
  const code = room.state.code;

  room.game.phase = 'ordering';
  room.game.ordersSubmitted = [];
  room.pendingOrders = new Map();
  room.orderTimeRemaining = ORDER_TIMEOUT_SECONDS;

  // Submit AI orders immediately
  for (const player of room.state.players) {
    if (player.isAI && player.role) {
      const aiOrder = getAIOrder(room.game.nodes[player.role], room.game.config);
      room.pendingOrders.set(player.role, aiOrder);
      room.game.ordersSubmitted.push(player.role);
    }
  }

  broadcastGameState(io, room);
  io.to(code).emit('order-phase', {
    week: room.game.currentWeek + 1,
    timeRemaining: room.orderTimeRemaining,
  });

  if (room.tickInterval) clearInterval(room.tickInterval);
  room.tickInterval = setInterval(() => {
    room.orderTimeRemaining--;
    io.to(code).emit('timer-tick', { timeRemaining: room.orderTimeRemaining });

    if (room.orderTimeRemaining <= 0) {
      autoSubmitMissing(io, room);
    }
  }, 1000);

  checkAllOrdersIn(io, room);
}

function autoSubmitMissing(io: Server, room: ReturnType<typeof getRoom>): void {
  if (!room?.game) return;

  for (const player of room.state.players) {
    if (!player.role) continue;
    if (!room.pendingOrders.has(player.role)) {
      const lastOrder = room.game.nodes[player.role].lastOrderPlaced;
      room.pendingOrders.set(player.role, lastOrder);
      room.game.ordersSubmitted.push(player.role);
      io.to(room.state.code).emit('order-submitted', { role: player.role });
    }
  }
  processOrders(io, room);
}

function checkAllOrdersIn(io: Server, room: ReturnType<typeof getRoom>): void {
  if (!room?.game) return;
  const allRolesAssigned = ROLE_ORDER.every((role) =>
    room.pendingOrders.has(role)
  );
  if (allRolesAssigned) {
    processOrders(io, room);
  }
}

function processOrders(io: Server, room: ReturnType<typeof getRoom>): void {
  if (!room?.game) return;

  if (room.tickInterval) {
    clearInterval(room.tickInterval);
    room.tickInterval = null;
  }
  if (room.orderTimer) {
    clearTimeout(room.orderTimer);
    room.orderTimer = null;
  }

  room.game.phase = 'processing';

  const orders = {} as Record<PlayerRole, number>;
  for (const role of ROLE_ORDER) {
    orders[role] = room.pendingOrders.get(role) ?? room.game.nodes[role].lastOrderPlaced;
  }

  room.game = advanceTurn(room.game, orders);

  broadcastGameState(io, room);

  if (room.game.phase === 'finished') {
    io.to(room.state.code).emit('game-over', room.game);
    room.state.gamePhase = 'finished';
    broadcastRoomState(io, room.state.code);
  } else {
    setTimeout(() => {
      startOrderPhase(io, room);
    }, 1500);
  }
}

export function registerSocketHandlers(
  io: Server<ClientToServerEvents, ServerToClientEvents>
): void {
  io.on('connection', (socket: GameSocket) => {
    let currentRoomCode: string | null = null;

    socket.on('list-rooms', () => {
      socket.emit('room-list', listOpenRooms());
    });

    socket.on('create-room', ({ playerName }) => {
      const room = createRoom(socket.id, playerName);
      currentRoomCode = room.state.code;
      socket.join(room.state.code);
      broadcastRoomState(io, room.state.code);
      io.emit('room-list', listOpenRooms());
    });

    socket.on('join-room', ({ roomCode, playerName }) => {
      const room = joinRoom(roomCode, socket.id, playerName);
      if (!room) {
        socket.emit('error', { message: 'Room not found or full' });
        return;
      }
      currentRoomCode = room.state.code;
      socket.join(room.state.code);
      io.to(room.state.code).emit('player-joined', { playerName });
      broadcastRoomState(io, room.state.code);
      io.emit('room-list', listOpenRooms());
    });

    socket.on('rejoin-room', ({ roomCode, playerName }) => {
      const result = reconnectPlayer(roomCode, socket.id, playerName);
      if (!result) {
        socket.emit('error', { message: 'Could not rejoin — room may have expired' });
        return;
      }
      currentRoomCode = result.room.state.code;
      socket.join(result.room.state.code);

      socket.emit('rejoined', {
        role: result.role,
        gamePhase: result.room.state.gamePhase,
      });

      broadcastRoomState(io, result.room.state.code);

      if (result.room.game && result.room.state.gamePhase === 'playing') {
        broadcastGameState(io, result.room);
        if (result.room.game.phase === 'ordering') {
          socket.emit('order-phase', {
            week: result.room.game.currentWeek + 1,
            timeRemaining: result.room.orderTimeRemaining,
          });
        }
      }
    });

    socket.on('select-role', ({ role }) => {
      if (!currentRoomCode) return;
      const success = selectRole(currentRoomCode, socket.id, role);
      if (!success) {
        socket.emit('error', { message: 'Role already taken' });
        return;
      }
      broadcastRoomState(io, currentRoomCode);
    });

    socket.on('update-config', (config) => {
      if (!currentRoomCode) return;
      updateConfig(currentRoomCode, config);
      broadcastRoomState(io, currentRoomCode);
    });

    socket.on('fill-ai', () => {
      if (!currentRoomCode) return;
      fillWithAI(currentRoomCode);
      broadcastRoomState(io, currentRoomCode);
      io.emit('room-list', listOpenRooms());
    });

    socket.on('start-game', () => {
      if (!currentRoomCode) return;
      if (!canStartGame(currentRoomCode)) {
        socket.emit('error', { message: 'Not all roles assigned' });
        return;
      }
      const game = startGame(currentRoomCode);
      if (!game) {
        socket.emit('error', { message: 'Could not start game' });
        return;
      }
      const room = getRoom(currentRoomCode);
      if (!room) return;

      io.to(currentRoomCode).emit('game-started', game);
      broadcastRoomState(io, currentRoomCode);
      io.emit('room-list', listOpenRooms());

      setTimeout(() => {
        startOrderPhase(io, room);
      }, 2000);
    });

    socket.on('submit-order', ({ amount }) => {
      if (!currentRoomCode) return;
      const room = getRoom(currentRoomCode);
      if (!room?.game || room.game.phase !== 'ordering') return;

      const player = room.state.players.find((p) => p.id === socket.id);
      if (!player?.role) return;

      if (room.pendingOrders.has(player.role)) return;

      room.pendingOrders.set(player.role, Math.max(0, Math.round(amount)));
      room.game.ordersSubmitted.push(player.role);
      io.to(currentRoomCode).emit('order-submitted', { role: player.role });

      checkAllOrdersIn(io, room);
    });

    socket.on('leave-room', () => {
      if (!currentRoomCode) return;
      socket.leave(currentRoomCode);
      const room = removePlayer(currentRoomCode, socket.id);
      if (room) {
        io.to(currentRoomCode).emit('player-left', { playerName: '' });
        broadcastRoomState(io, currentRoomCode);
        io.emit('room-list', listOpenRooms());
      }
      currentRoomCode = null;
    });

    socket.on('disconnect', () => {
      if (currentRoomCode) {
        const result = disconnectPlayer(socket.id);
        if (result) {
          broadcastRoomState(io, result.code);
        }
      }
    });
  });
}
