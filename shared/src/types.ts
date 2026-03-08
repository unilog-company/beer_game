export type PlayerRole = 'retailer' | 'warehouse' | 'distributor' | 'manufacturer';

export interface GameConfig {
  totalWeeks: number;
  initialInventory: number;
  initialPipeline: number;
  baseDemand: number;
  stepDemand: number;
  demandStepWeek: number;
  unilogMode: boolean;
}

export interface NodeState {
  role: PlayerRole;
  inventory: number;
  backlog: number;
  incomingOrder: number;
  outgoingOrder: number;
  inTransitFreight: number[];
  inTransitOrders: number[];
  weeklyCost: number;
  totalCost: number;
  lastOrderPlaced: number;
}

export interface WeekSnapshot {
  week: number;
  nodes: Record<PlayerRole, NodeState>;
  consumerDemand: number;
}

export interface GameState {
  roomCode: string;
  config: GameConfig;
  currentWeek: number;
  phase: GamePhase;
  nodes: Record<PlayerRole, NodeState>;
  history: WeekSnapshot[];
  consumerDemand: number;
  ordersSubmitted: PlayerRole[];
}

export type GamePhase = 'waiting' | 'ordering' | 'processing' | 'finished';

export interface PlayerInfo {
  id: string;
  name: string;
  role: PlayerRole | null;
  isHost: boolean;
  isAI: boolean;
  connected: boolean;
}

export interface RoomState {
  code: string;
  players: PlayerInfo[];
  config: GameConfig;
  gamePhase: 'lobby' | 'playing' | 'finished';
}

export interface RoomSummary {
  code: string;
  hostName: string;
  playerCount: number;
  hasAI: boolean;
  config: GameConfig;
}

export type ClientView = {
  room: RoomState;
  game: GameState | null;
  myRole: PlayerRole | null;
  visibleNodes: Record<PlayerRole, NodeState> | null;
  orderTimeRemaining: number;
};

export interface ClientToServerEvents {
  'list-rooms': () => void;
  'create-room': (data: { playerName: string }) => void;
  'join-room': (data: { roomCode: string; playerName: string }) => void;
  'rejoin-room': (data: { roomCode: string; playerName: string }) => void;
  'select-role': (data: { role: PlayerRole }) => void;
  'toggle-ready': () => void;
  'update-config': (data: Partial<GameConfig>) => void;
  'start-game': () => void;
  'submit-order': (data: { amount: number }) => void;
  'fill-ai': () => void;
  'leave-room': () => void;
  'close-room': () => void;
}

export interface ServerToClientEvents {
  'room-list': (rooms: RoomSummary[]) => void;
  'room-updated': (room: RoomState) => void;
  'game-started': (state: GameState) => void;
  'game-state': (state: GameState) => void;
  'order-phase': (data: { week: number; timeRemaining: number }) => void;
  'timer-tick': (data: { timeRemaining: number }) => void;
  'game-over': (state: GameState) => void;
  'error': (data: { message: string }) => void;
  'player-joined': (data: { playerName: string }) => void;
  'player-left': (data: { playerName: string }) => void;
  'order-submitted': (data: { role: PlayerRole }) => void;
  'ai-thinking': (data: { roles: PlayerRole[] }) => void;
  'room-closed': () => void;
  'rejoined': (data: { role: PlayerRole | null; gamePhase: 'lobby' | 'playing' | 'finished' }) => void;
}
