import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useGameStore } from '../store';
import { Crown, ChevronLeft, Trophy, Star } from '../components/Icons';
import { RoleIcon } from '../components/Icons';
import { getLeaderboard, clearLeaderboard } from '../lib/leaderboard';
import { getScoreGrade } from '@shared/scoring';
import { playClick } from '../lib/sounds';

const RANK_COLORS = ['text-accent-amber', 'text-white/50', 'text-orange-400/60'];

const ROLE_COLORS: Record<string, string> = {
  retailer: '#7ed321',
  warehouse: '#6ae08c',
  distributor: '#3dd9c4',
  manufacturer: '#00c9b1',
};

export function Leaderboard() {
  const setScreen = useGameStore((s) => s.setScreen);
  const entries = useMemo(() => getLeaderboard(), []);

  return (
    <div className="min-h-screen flex flex-col items-center px-3 py-6 md:px-6 md:py-12">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-2xl"
      >
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => { setScreen('lobby'); playClick(); }}
            className="text-white/50 hover:text-white/80 text-base transition-colors flex items-center gap-1.5 group"
          >
            <ChevronLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
            Back
          </button>
          <div className="flex items-center gap-3">
            <Crown size={24} className="text-accent-amber" />
            <h1 className="text-2xl md:text-3xl font-bold text-white">Leaderboard</h1>
          </div>
          <div className="w-16" />
        </div>

        {entries.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="glass rounded-2xl p-12 text-center"
          >
            <Trophy size={48} className="text-white/10 mx-auto mb-4" />
            <p className="text-white/40 text-lg font-mono">No scores yet</p>
            <p className="text-white/20 text-sm font-mono mt-2">Play a game to see your score here</p>
          </motion.div>
        ) : (
          <div className="space-y-2">
            {entries.map((entry, i) => {
              const grade = getScoreGrade(entry.score);
              return (
                <motion.div
                  key={entry.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className={`glass rounded-xl p-4 flex items-center gap-3 ${
                    i === 0 ? 'border-accent-amber/20 glow-teal' : ''
                  }`}
                >
                  <span className={`w-8 text-center font-mono font-bold text-lg ${
                    RANK_COLORS[i] ?? 'text-white/25'
                  }`}>
                    {i < 3 ? ['🥇', '🥈', '🥉'][i] : `#${i + 1}`}
                  </span>

                  <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{ background: `${ROLE_COLORS[entry.role] ?? '#fff'}15`, color: ROLE_COLORS[entry.role] ?? '#fff' }}>
                    <RoleIcon role={entry.role} size={16} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-white/80 truncate">{entry.playerName}</div>
                    <div className="text-xs text-white/30 font-mono">
                      {entry.weeks}wk · {entry.unilogMode ? '4PL' : 'Standard'} · Team: {entry.teamScore}
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="text-lg font-bold font-mono text-lime-400">{entry.score}</div>
                    <div className={`text-xs font-bold font-mono ${
                      grade.letter === 'S' ? 'text-accent-amber' :
                      grade.letter === 'A' ? 'text-lime-400' :
                      grade.letter === 'B' ? 'text-teal-400' : 'text-white/40'
                    }`}>
                      {grade.letter}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {entries.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-8 text-center"
          >
            <button
              onClick={() => {
                if (confirm('Clear all leaderboard data?')) {
                  clearLeaderboard();
                  setScreen('lobby');
                }
              }}
              className="text-xs text-white/20 hover:text-accent-red/60 font-mono transition-colors"
            >
              Clear Leaderboard
            </button>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
