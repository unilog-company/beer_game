export const HOLDING_COST = 0.5;
export const BACKLOG_COST = 1.0;
export const SHIPPING_DELAY = 2;
export const ORDER_DELAY = 2;
export const PRODUCTION_DELAY = 2;

export const DEFAULT_INITIAL_INVENTORY = 12;
export const DEFAULT_INITIAL_PIPELINE = 4;
export const DEFAULT_GAME_WEEKS = 26;
export const DEFAULT_BASE_DEMAND = 4;
export const DEFAULT_STEP_DEMAND = 8;
export const DEMAND_STEP_WEEK = 5;

export const ORDER_TIMEOUT_SECONDS = 60;

export const ROLE_ORDER = ['retailer', 'warehouse', 'distributor', 'manufacturer'] as const;

export const ROLE_LABELS: Record<string, string> = {
  retailer: 'Retailer',
  warehouse: '3PL Warehouse',
  distributor: 'Regional Distributor',
  manufacturer: 'Manufacturer',
};

export const ROLE_ICONS: Record<string, string> = {
  retailer: '🏪',
  warehouse: '🏭',
  distributor: '🚛',
  manufacturer: '⚙️',
};
