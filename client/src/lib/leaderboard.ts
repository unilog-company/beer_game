import type { LeaderboardEntry } from '@shared/scoring';

const STORAGE_KEY = 'beer-game-leaderboard';
const MAX_ENTRIES = 25;

function load(): LeaderboardEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function save(entries: LeaderboardEntry[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

export function getLeaderboard(): LeaderboardEntry[] {
  return load().sort((a, b) => b.score - a.score);
}

export function addEntry(entry: Omit<LeaderboardEntry, 'id' | 'date'>): LeaderboardEntry {
  const full: LeaderboardEntry = {
    ...entry,
    id: crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    date: Date.now(),
  };

  const entries = load();
  entries.push(full);
  entries.sort((a, b) => b.score - a.score);
  save(entries.slice(0, MAX_ENTRIES));
  return full;
}

export function clearLeaderboard() {
  localStorage.removeItem(STORAGE_KEY);
}

export function getPersonalBest(playerName: string): LeaderboardEntry | null {
  const entries = load().filter((e) => e.playerName === playerName);
  return entries.length > 0
    ? entries.reduce((best, e) => e.score > best.score ? e : best)
    : null;
}
