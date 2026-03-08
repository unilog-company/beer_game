import type { GameState, PlayerRole } from './types';
import { ROLE_ORDER } from './constants';

export interface ScoreBreakdown {
  efficiency: number;
  stability: number;
  streak: number;
  teamwork: number;
  total: number;
}

export interface PlayerScore {
  role: PlayerRole;
  playerName: string;
  breakdown: ScoreBreakdown;
  rank: number;
}

export interface GameScore {
  players: PlayerScore[];
  teamScore: number;
  teamGrade: ScoreGrade;
}

export interface ScoreGrade {
  letter: string;
  label: string;
  tier: number;
}

export interface LeaderboardEntry {
  id: string;
  playerName: string;
  role: string;
  score: number;
  teamScore: number;
  grade: string;
  weeks: number;
  unilogMode: boolean;
  date: number;
}

const MAX_EFFICIENCY = 1000;
const MAX_STABILITY = 300;
const MAX_STREAK = 200;
const MAX_TEAMWORK = 200;

/**
 * Calculates the "optimal" cost for a given game config.
 * In a perfect game, each node holds ~baseDemand inventory and has zero backlog.
 * Holding cost = baseDemand * 0.5 per week per node.
 * After demand step: holding might increase. This gives us a reasonable floor.
 */
function getOptimalCostPerWeek(baseDemand: number): number {
  return baseDemand * 0.5;
}

export function calculatePlayerScore(
  game: GameState,
  role: PlayerRole,
): ScoreBreakdown {
  const node = game.nodes[role];
  const weeks = game.config.totalWeeks;
  const optimalWeekly = getOptimalCostPerWeek(game.config.baseDemand);

  // --- Efficiency (0-1000): How close to optimal cost ---
  const actualCostPerWeek = node.totalCost / weeks;
  const costRatio = optimalWeekly > 0 ? actualCostPerWeek / optimalWeekly : actualCostPerWeek;
  // ratio of 1 = optimal → full score; ratio of 10+ → near zero
  const efficiency = Math.round(
    Math.max(0, MAX_EFFICIENCY * Math.exp(-0.25 * (costRatio - 1)))
  );

  // --- Stability (0-300): Low order variance = high score ---
  const orders = game.history.map((h) => h.nodes[role].outgoingOrder);
  const orderMean = orders.length > 0
    ? orders.reduce((a, b) => a + b, 0) / orders.length
    : 0;
  const orderVariance = orders.length > 0
    ? orders.reduce((sum, o) => sum + (o - orderMean) ** 2, 0) / orders.length
    : 0;
  const orderCV = orderMean > 0 ? Math.sqrt(orderVariance) / orderMean : 0;
  // CV of 0 = perfect stability; CV > 1 = very chaotic
  const stability = Math.round(
    Math.max(0, MAX_STABILITY * Math.exp(-2 * orderCV))
  );

  // --- Streak (0-200): Consecutive zero-backlog weeks ---
  let maxStreak = 0;
  let currentStreak = 0;
  for (const h of game.history) {
    if (h.nodes[role].backlog === 0) {
      currentStreak++;
      maxStreak = Math.max(maxStreak, currentStreak);
    } else {
      currentStreak = 0;
    }
  }
  const streakRatio = weeks > 0 ? maxStreak / weeks : 0;
  const streak = Math.round(MAX_STREAK * streakRatio);

  // --- Teamwork (0-200): How well your orders matched actual demand ---
  const demandValues = game.history.map((h) => h.consumerDemand);
  const avgDemand = demandValues.length > 0
    ? demandValues.reduce((a, b) => a + b, 0) / demandValues.length
    : game.config.baseDemand;
  const orderDemandDiff = orders.length > 0
    ? orders.reduce((sum, o) => sum + Math.abs(o - avgDemand), 0) / orders.length
    : 0;
  const demandDeviation = avgDemand > 0 ? orderDemandDiff / avgDemand : 0;
  const teamwork = Math.round(
    Math.max(0, MAX_TEAMWORK * Math.exp(-1.5 * demandDeviation))
  );

  const total = efficiency + stability + streak + teamwork;

  return { efficiency, stability, streak, teamwork, total };
}

export function calculateLiveScore(
  game: GameState,
  role: PlayerRole,
): number {
  if (!game.history.length) return 0;
  return calculatePlayerScore(game, role).total;
}

export function calculateGameScore(
  game: GameState,
  playerNames: Record<PlayerRole, string>,
): GameScore {
  const players: PlayerScore[] = ROLE_ORDER.map((role) => ({
    role,
    playerName: playerNames[role] ?? role,
    breakdown: calculatePlayerScore(game, role),
    rank: 0,
  }));

  players.sort((a, b) => b.breakdown.total - a.breakdown.total);
  players.forEach((p, i) => { p.rank = i + 1; });

  const teamScore = Math.round(
    players.reduce((sum, p) => sum + p.breakdown.total, 0) / players.length,
  );

  const teamGrade = getScoreGrade(teamScore);

  return { players, teamScore, teamGrade };
}

export function getScoreGrade(score: number): ScoreGrade {
  if (score >= 1400) return { letter: 'S', label: 'Supply Chain Master', tier: 5 };
  if (score >= 1100) return { letter: 'A', label: 'Excellent', tier: 4 };
  if (score >= 800) return { letter: 'B', label: 'Good Performance', tier: 3 };
  if (score >= 500) return { letter: 'C', label: 'Room to Improve', tier: 2 };
  if (score >= 250) return { letter: 'D', label: 'Needs Work', tier: 1 };
  return { letter: 'F', label: 'Bullwhip Victim', tier: 0 };
}

export const SCORE_CATEGORIES = [
  { key: 'efficiency' as const, label: 'Efficiency', max: MAX_EFFICIENCY, desc: 'Low cost relative to optimal play' },
  { key: 'stability' as const, label: 'Stability', max: MAX_STABILITY, desc: 'Consistent order quantities' },
  { key: 'streak' as const, label: 'Fulfillment', max: MAX_STREAK, desc: 'Consecutive weeks with zero backlog' },
  { key: 'teamwork' as const, label: 'Demand Match', max: MAX_TEAMWORK, desc: 'Orders aligned with actual demand' },
] as const;

export const MAX_TOTAL_SCORE = MAX_EFFICIENCY + MAX_STABILITY + MAX_STREAK + MAX_TEAMWORK;
