import {
  GameState,
  GameConfig,
  NodeState,
  PlayerRole,
  WeekSnapshot,
  GamePhase,
} from '@beer-game/shared';
import {
  HOLDING_COST,
  BACKLOG_COST,
  SHIPPING_DELAY,
  ORDER_DELAY,
  PRODUCTION_DELAY,
  DEFAULT_INITIAL_INVENTORY,
  DEFAULT_INITIAL_PIPELINE,
  DEFAULT_GAME_WEEKS,
  DEFAULT_BASE_DEMAND,
  DEFAULT_STEP_DEMAND,
  DEMAND_STEP_WEEK,
  ROLE_ORDER,
} from '@beer-game/shared';

export function createDefaultConfig(): GameConfig {
  return {
    totalWeeks: DEFAULT_GAME_WEEKS,
    initialInventory: DEFAULT_INITIAL_INVENTORY,
    initialPipeline: DEFAULT_INITIAL_PIPELINE,
    baseDemand: DEFAULT_BASE_DEMAND,
    stepDemand: DEFAULT_STEP_DEMAND,
    demandStepWeek: DEMAND_STEP_WEEK,
    unilogMode: false,
  };
}

function createNodeState(role: PlayerRole, config: GameConfig): NodeState {
  const halfPipeline = config.initialPipeline / SHIPPING_DELAY;
  return {
    role,
    inventory: config.initialInventory,
    backlog: 0,
    incomingOrder: 0,
    outgoingOrder: 0,
    inTransitFreight: Array(SHIPPING_DELAY).fill(halfPipeline),
    inTransitOrders: Array(ORDER_DELAY).fill(config.baseDemand),
    weeklyCost: 0,
    totalCost: 0,
    lastOrderPlaced: config.baseDemand,
  };
}

export function createGameState(roomCode: string, config: GameConfig): GameState {
  const nodes = {} as Record<PlayerRole, NodeState>;
  for (const role of ROLE_ORDER) {
    nodes[role] = createNodeState(role, config);
  }

  return {
    roomCode,
    config,
    currentWeek: 0,
    phase: 'ordering' as GamePhase,
    nodes,
    history: [],
    consumerDemand: config.baseDemand,
    ordersSubmitted: [],
  };
}

function getConsumerDemand(week: number, config: GameConfig): number {
  return week >= config.demandStepWeek ? config.stepDemand : config.baseDemand;
}

function getDownstreamRole(role: PlayerRole): PlayerRole | null {
  const idx = ROLE_ORDER.indexOf(role);
  return idx > 0 ? ROLE_ORDER[idx - 1] : null;
}

function getUpstreamRole(role: PlayerRole): PlayerRole | null {
  const idx = ROLE_ORDER.indexOf(role);
  return idx < ROLE_ORDER.length - 1 ? ROLE_ORDER[idx + 1] : null;
}

export function advanceTurn(
  state: GameState,
  orders: Record<PlayerRole, number>
): GameState {
  const next = structuredClone(state);
  next.currentWeek++;
  next.consumerDemand = getConsumerDemand(next.currentWeek, next.config);

  // Step 1: Receive Freight — advance in-transit freight queues
  for (const role of ROLE_ORDER) {
    const node = next.nodes[role];
    if (node.inTransitFreight.length > 0) {
      const arriving = node.inTransitFreight.shift()!;
      node.inventory += arriving;
    }
  }

  // Step 2: Receive Orders — advance in-transit order queues
  for (const role of ROLE_ORDER) {
    const node = next.nodes[role];

    if (role === 'retailer') {
      node.incomingOrder = next.consumerDemand;
    } else {
      if (next.config.unilogMode) {
        const downstream = getDownstreamRole(role)!;
        node.incomingOrder = orders[downstream];
      } else {
        if (node.inTransitOrders.length > 0) {
          node.incomingOrder = node.inTransitOrders.shift()!;
        }
      }
    }
  }

  // Step 3 & 4: Calculate demand and fulfill orders
  for (const role of ROLE_ORDER) {
    const node = next.nodes[role];
    const totalDemand = node.incomingOrder + node.backlog;

    if (node.inventory >= totalDemand) {
      const shipped = totalDemand;
      node.inventory -= shipped;
      node.backlog = 0;

      const downstream = getDownstreamRole(role);
      if (downstream) {
        next.nodes[downstream].inTransitFreight.push(shipped);
      }
    } else {
      const shipped = node.inventory;
      node.backlog = totalDemand - node.inventory;
      node.inventory = 0;

      const downstream = getDownstreamRole(role);
      if (downstream) {
        next.nodes[downstream].inTransitFreight.push(shipped);
      }
    }
  }

  // Step 5: Place orders — enters upstream in-transit order queue
  for (const role of ROLE_ORDER) {
    const node = next.nodes[role];
    const orderAmount = orders[role];
    node.outgoingOrder = orderAmount;
    node.lastOrderPlaced = orderAmount;

    const upstream = getUpstreamRole(role);
    if (upstream) {
      if (next.config.unilogMode) {
        // In Unilog mode, orders arrive instantly (no delay)
      } else {
        next.nodes[upstream].inTransitOrders.push(orderAmount);
      }
    } else {
      // Manufacturer: production enters own freight pipeline after production delay
      node.inTransitFreight.push(orderAmount);
    }
  }

  // Step 6: Calculate costs
  for (const role of ROLE_ORDER) {
    const node = next.nodes[role];
    node.weeklyCost = node.inventory * HOLDING_COST + node.backlog * BACKLOG_COST;
    node.totalCost += node.weeklyCost;
  }

  // Save snapshot
  const snapshot: WeekSnapshot = {
    week: next.currentWeek,
    nodes: structuredClone(next.nodes),
    consumerDemand: next.consumerDemand,
  };
  next.history.push(snapshot);

  // Check game over
  if (next.currentWeek >= next.config.totalWeeks) {
    next.phase = 'finished';
  } else {
    next.phase = 'ordering';
    next.ordersSubmitted = [];
  }

  return next;
}

export function getAIOrder(node: NodeState, _config: GameConfig): number {
  const targetInventory = 12;
  const orderUpTo = node.incomingOrder + node.backlog + (targetInventory - node.inventory);
  return Math.max(0, Math.round(orderUpTo));
}

export function getVisibleState(
  state: GameState,
  role: PlayerRole
): Record<PlayerRole, NodeState> {
  if (state.config.unilogMode) {
    return structuredClone(state.nodes);
  }

  const visible = {} as Record<PlayerRole, NodeState>;
  for (const r of ROLE_ORDER) {
    if (r === role) {
      visible[r] = structuredClone(state.nodes[r]);
    } else {
      visible[r] = {
        ...state.nodes[r],
        inventory: -1,
        backlog: -1,
        inTransitFreight: [],
        inTransitOrders: [],
        outgoingOrder: -1,
        weeklyCost: -1,
        totalCost: -1,
        lastOrderPlaced: -1,
      };
    }
  }
  return visible;
}
