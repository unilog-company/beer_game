import { useMemo, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { useGameStore } from '../store';
import { ROLE_ORDER, ROLE_LABELS } from '@shared/constants';
import {
  calculateGameScore, getScoreGrade, SCORE_CATEGORIES, MAX_TOTAL_SCORE,
} from '@shared/scoring';
import type { PlayerRole } from '@shared/types';
import { CostChart } from '../components/CostChart';
import { OrderChart } from '../components/OrderChart';
import {
  RoleIcon, Crown, Star, Dumbbell, Target, Trophy, Telescope, Shield,
  Gem, Sparkles, AlertTriangle, RefreshCw, BarChart3, DollarSign,
  Activity, Eye, Radio, TrendingUp,
} from '../components/Icons';
import { playGameOver } from '../lib/sounds';
import { addEntry, getLeaderboard } from '../lib/leaderboard';

const ROLE_COLORS: Record<string, string> = {
  manufacturer: '#00c9b1',
  distributor: '#3dd9c4',
  warehouse: '#6ae08c',
  retailer: '#7ed321',
};

const GRADE_STYLES: Record<string, { color: string; icon: React.ReactNode }> = {
  S: { color: 'text-accent-amber', icon: <Crown size={28} className="text-accent-amber" /> },
  A: { color: 'text-teal-400', icon: <Star size={28} className="text-teal-400" /> },
  B: { color: 'text-lime-400', icon: <Shield size={28} className="text-lime-400" /> },
  C: { color: 'text-accent-blue', icon: <TrendingUp size={28} className="text-accent-blue" /> },
  D: { color: 'text-white/50', icon: <Activity size={28} className="text-white/50" /> },
  F: { color: 'text-accent-red', icon: <AlertTriangle size={28} className="text-accent-red" /> },
};

const RANK_STYLES = [
  { bg: 'from-accent-amber/15 to-accent-amber/5', border: 'border-accent-amber/30', badge: 'bg-accent-amber text-navy-950' },
  { bg: 'from-white/10 to-white/3', border: 'border-white/20', badge: 'bg-white/80 text-navy-950' },
  { bg: 'from-orange-500/10 to-orange-500/3', border: 'border-orange-500/20', badge: 'bg-orange-500/80 text-navy-950' },
  { bg: 'from-white/5 to-transparent', border: 'border-white/10', badge: 'bg-white/20 text-white/70' },
];

function getAchievements(game: NonNullable<ReturnType<typeof useGameStore.getState>['game']>, stats: Stats) {
  const achievements: { icon: React.ReactNode; title: string; desc: string }[] = [];

  if (stats.totalCost < 100) achievements.push({ icon: <Gem size={24} className="text-accent-blue" />, title: 'Diamond Efficiency', desc: 'Total cost under $100' });
  if (!stats.hasBullwhip) achievements.push({ icon: <Target size={24} className="text-teal-400" />, title: 'Bullwhip Breaker', desc: 'No significant bullwhip effect detected' });

  const minCostRole = stats.costData.reduce((min, d) => d.cost < min.cost ? d : min, stats.costData[0]);
  achievements.push({ icon: <Trophy size={24} className="text-accent-amber" />, title: 'MVP Node', desc: `${minCostRole.name} had the lowest cost` });

  if (game.config.unilogMode) achievements.push({ icon: <Telescope size={24} className="text-teal-400" />, title: 'Control Tower', desc: 'Played with full visibility enabled' });
  if (game.config.totalWeeks >= 26) achievements.push({ icon: <Dumbbell size={24} className="text-lime-400" />, title: 'Endurance', desc: 'Survived 26+ weeks' });

  const maxBacklog = Math.max(...game.history.map((h) =>
    Math.max(...ROLE_ORDER.map((r) => h.nodes[r].backlog))
  ));
  if (maxBacklog === 0) achievements.push({ icon: <Sparkles size={24} className="text-accent-amber" />, title: 'Zero Backlog', desc: 'Never had any unfulfilled orders' });

  return achievements;
}

interface Stats {
  costData: { name: string; role: string; cost: number }[];
  totalCost: number;
  bullwhipRatios: { role: string; label: string; variance: number; stdDev: number; ratio: number }[];
  hasBullwhip: boolean;
  maxBullwhip: number;
}

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 25 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

export function Results() {
  const game = useGameStore((s) => s.game);
  const room = useGameStore((s) => s.room);
  const myRole = useGameStore((s) => s.myRole);
  const leaveRoom = useGameStore((s) => s.leaveRoom);

  const stats = useMemo<Stats | null>(() => {
    if (!game) return null;

    const costData = ROLE_ORDER.map((role) => ({
      name: ROLE_LABELS[role],
      role,
      cost: game.nodes[role].totalCost,
    }));

    const totalCost = costData.reduce((sum, d) => sum + d.cost, 0);

    const orderVariances = ROLE_ORDER.map((role) => {
      const orders = game.history.map((h) => h.nodes[role].outgoingOrder);
      const mean = orders.reduce((a, b) => a + b, 0) / orders.length;
      const variance =
        orders.reduce((sum, o) => sum + (o - mean) ** 2, 0) / orders.length;
      return { role, label: ROLE_LABELS[role], variance, stdDev: Math.sqrt(variance) };
    });

    const demandOrders = game.history.map((h) => h.consumerDemand);
    const demandMean = demandOrders.reduce((a, b) => a + b, 0) / demandOrders.length;
    const demandVariance =
      demandOrders.reduce((sum, o) => sum + (o - demandMean) ** 2, 0) / demandOrders.length;

    const bullwhipRatios = orderVariances.map((v) => ({
      ...v,
      ratio: demandVariance > 0 ? v.variance / demandVariance : 1,
    }));

    const maxBullwhip = Math.max(...bullwhipRatios.map((b) => b.ratio));
    const hasBullwhip = maxBullwhip > 1.5;

    return { costData, totalCost, bullwhipRatios, hasBullwhip, maxBullwhip };
  }, [game]);

  const gameScore = useMemo(() => {
    if (!game || !room) return null;
    const playerNames = {} as Record<PlayerRole, string>;
    for (const p of room.players) {
      if (p.role) playerNames[p.role] = p.name;
    }
    return calculateGameScore(game, playerNames);
  }, [game, room]);

  const myPlayerScore = gameScore?.players.find((p) => p.role === myRole) ?? null;
  const myGrade = myPlayerScore ? getScoreGrade(myPlayerScore.breakdown.total) : null;
  const myGradeStyle = myGrade ? (GRADE_STYLES[myGrade.letter] ?? GRADE_STYLES.F) : GRADE_STYLES.F;

  if (!game || !stats || !gameScore) return null;

  const costPerWeek = stats.totalCost / game.config.totalWeeks;
  const achievements = getAchievements(game, stats);

  const soundPlayed = useRef(false);
  const leaderboardSaved = useRef(false);

  useEffect(() => {
    if (!soundPlayed.current && myPlayerScore) {
      soundPlayed.current = true;
      playGameOver(myPlayerScore.breakdown.total >= 800);
    }
  }, [myPlayerScore]);

  useEffect(() => {
    if (!leaderboardSaved.current && myPlayerScore && myRole && myGrade) {
      leaderboardSaved.current = true;
      addEntry({
        playerName: myPlayerScore.playerName,
        role: myRole,
        score: myPlayerScore.breakdown.total,
        teamScore: gameScore.teamScore,
        grade: myGrade.letter,
        weeks: game.config.totalWeeks,
        unilogMode: game.config.unilogMode,
      });
    }
  }, [myPlayerScore, myRole, myGrade, gameScore, game]);

  return (
    <div className="min-h-screen flex flex-col items-center px-3 py-6 md:px-6 md:py-8 relative">
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        {Array.from({ length: 12 }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 rounded-full"
            style={{
              left: `${5 + (i * 8) % 90}%`,
              background: ['#00c9b1', '#7ed321', '#ffb84d', '#ff4d6a', '#4d9fff'][i % 5],
            }}
            initial={{ top: '-5%', opacity: 0 }}
            animate={{
              top: '110%',
              opacity: [0, 1, 1, 0],
              rotate: [0, 360 * (i % 2 === 0 ? 1 : -1)],
            }}
            transition={{
              duration: 4 + i * 0.3,
              delay: i * 0.2,
              ease: 'easeIn',
            }}
          />
        ))}
      </div>

      <motion.div
        variants={stagger}
        initial="hidden"
        animate="show"
        className="w-full max-w-5xl space-y-6 relative z-10"
      >
        <motion.div variants={fadeUp} className="text-center mb-4">
          <img src="/logo.png" alt="Unilog" className="h-12 mx-auto mb-5" />
          <h1 className="text-4xl md:text-6xl font-bold mb-3">
            <span className="gradient-text">Mission Complete</span>
          </h1>
          <p className="text-white/50 font-mono text-base">
            {game.config.totalWeeks} weeks &middot; {game.config.unilogMode ? '4PL Control Tower' : 'Standard Mode'}
          </p>
        </motion.div>

        {/* Score Hero */}
        <motion.div variants={fadeUp} className="glass-strong rounded-2xl p-5 md:p-10 relative overflow-hidden">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-teal-500/30 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-lime-500/20 to-transparent" />
          </div>

          <div className="flex flex-col md:flex-row items-center gap-8">
            <motion.div
              initial={{ scale: 0, rotate: -30 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.5, type: 'spring', stiffness: 200 }}
              className="relative shrink-0"
            >
              <div className="w-24 h-24 md:w-32 md:h-32 rounded-2xl bg-gradient-to-br from-navy-800 to-navy-900
                border border-white/10 flex flex-col items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-teal-500/5 to-lime-500/5" />
                <div className="mb-1">{myGradeStyle.icon}</div>
                <span className={`text-4xl md:text-5xl font-black ${myGradeStyle.color} relative`}>{myGrade?.letter ?? '-'}</span>
              </div>
              <div className="text-center mt-2">
                <div className="text-sm font-semibold text-white/70">{myGrade?.label ?? ''}</div>
              </div>
            </motion.div>

            <div className="flex-1 text-center md:text-left">
              <div className="text-sm font-mono text-white/40 uppercase tracking-widest mb-2">
                Your Score
              </div>
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
                className="flex items-baseline gap-3 justify-center md:justify-start mb-4"
              >
                <span className="text-4xl md:text-6xl font-bold font-mono text-lime-400">
                  {myPlayerScore?.breakdown.total ?? 0}
                </span>
                <span className="text-xl font-mono text-white/20">/ {MAX_TOTAL_SCORE}</span>
              </motion.div>

              {/* Score category bars */}
              <div className="space-y-2.5 mb-5">
                {SCORE_CATEGORIES.map((cat, i) => {
                  const val = myPlayerScore?.breakdown[cat.key] ?? 0;
                  const pct = (val / cat.max) * 100;
                  return (
                    <motion.div
                      key={cat.key}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.5 + i * 0.08 }}
                    >
                      <div className="flex items-center justify-between text-xs font-mono mb-0.5">
                        <span className="text-white/50">{cat.label}</span>
                        <span className="text-white/60 font-bold">{val}<span className="text-white/20">/{cat.max}</span></span>
                      </div>
                      <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={{ delay: 0.6 + i * 0.08, duration: 0.8, ease: 'easeOut' }}
                          className="h-full rounded-full"
                          style={{
                            background: pct > 70
                              ? 'linear-gradient(to right, #00c9b1, #7ed321)'
                              : pct > 40
                                ? 'linear-gradient(to right, #ffb84d, #ff9800)'
                                : 'linear-gradient(to right, #ff4d6a, #ff7043)',
                          }}
                        />
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              <div className="flex items-center justify-center md:justify-start gap-4 text-xs font-mono text-white/30">
                <span>Total Cost: <span className="text-accent-amber font-bold">${stats.totalCost.toFixed(0)}</span></span>
                <span>&middot;</span>
                <span>${costPerWeek.toFixed(1)}/wk avg</span>
                <span>&middot;</span>
                <span>Team Score: <span className="text-teal-400 font-bold">{gameScore.teamScore}</span></span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Player Rankings */}
        <motion.div variants={fadeUp} className="glass rounded-2xl p-6">
          <h3 className="text-sm font-mono text-white/50 uppercase tracking-wider mb-4 font-medium flex items-center gap-2">
            <Trophy size={16} className="text-accent-amber" /> Player Rankings
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {gameScore.players.map((p, i) => {
              const style = RANK_STYLES[Math.min(i, RANK_STYLES.length - 1)];
              const pGrade = getScoreGrade(p.breakdown.total);
              const isMe = p.role === myRole;
              return (
                <motion.div
                  key={p.role}
                  initial={{ opacity: 0, x: -20, scale: 0.95 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  transition={{ delay: 0.6 + i * 0.12, type: 'spring', stiffness: 200 }}
                  className={`relative rounded-xl p-4 border bg-gradient-to-r ${style.bg} ${style.border} ${
                    isMe ? 'ring-1 ring-teal-500/30' : ''
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg ${style.badge} flex items-center justify-center text-sm font-black`}>
                      #{p.rank}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span style={{ color: ROLE_COLORS[p.role] }}>
                          <RoleIcon role={p.role} size={16} />
                        </span>
                        <span className="text-sm font-semibold text-white/80 truncate">{p.playerName}</span>
                        {isMe && (
                          <span className="text-[9px] font-mono text-teal-400 uppercase bg-teal-500/15 px-1.5 py-0.5 rounded font-bold shrink-0">
                            You
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-white/35 font-mono">{ROLE_LABELS[p.role]}</div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-xl font-bold font-mono text-white/90">{p.breakdown.total}</div>
                      <div className="text-[10px] font-mono text-white/30">Grade {pGrade.letter}</div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* Achievements */}
        {achievements.length > 0 && (
          <motion.div variants={fadeUp} className="glass rounded-2xl p-6">
            <h3 className="text-sm font-mono text-white/50 uppercase tracking-wider mb-4 font-medium flex items-center gap-2">
              <Trophy size={16} className="text-accent-amber" /> Achievements Unlocked
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {achievements.map((a, i) => (
                <motion.div
                  key={a.title}
                  initial={{ opacity: 0, scale: 0.8, rotate: -5 }}
                  animate={{ opacity: 1, scale: 1, rotate: 0 }}
                  transition={{ delay: 0.8 + i * 0.15, type: 'spring', stiffness: 200 }}
                  className="flex items-center gap-3 bg-navy-900/50 rounded-xl p-4 border border-white/8
                    hover:border-teal-500/20 transition-colors"
                >
                  <div className="shrink-0">{a.icon}</div>
                  <div>
                    <div className="text-sm font-semibold text-white/80">{a.title}</div>
                    <div className="text-xs text-white/35">{a.desc}</div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Cost bar chart */}
        <motion.div variants={fadeUp} className="glass rounded-2xl p-6">
          <h3 className="text-sm font-mono text-white/50 uppercase tracking-wider mb-5 font-medium flex items-center gap-2">
            <BarChart3 size={16} className="text-white/40" /> Cost Breakdown
          </h3>
          <div className="h-40 md:h-52">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.costData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis
                  dataKey="name"
                  stroke="rgba(255,255,255,0.3)"
                  tick={{ fontSize: 12, fill: 'rgba(255,255,255,0.5)' }}
                />
                <YAxis
                  stroke="rgba(255,255,255,0.3)"
                  tick={{ fontSize: 12, fill: 'rgba(255,255,255,0.4)' }}
                />
                <Tooltip
                  contentStyle={{
                    background: 'rgba(10, 22, 40, 0.95)',
                    border: '1px solid rgba(0, 201, 177, 0.2)',
                    borderRadius: '8px',
                    fontSize: '13px',
                    color: '#fff',
                  }}
                  formatter={(value: number) => [`$${value.toFixed(2)}`, 'Total Cost']}
                />
                <Bar dataKey="cost" radius={[6, 6, 0, 0]}>
                  {stats.costData.map((d) => (
                    <Cell key={d.role} fill={ROLE_COLORS[d.role]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Bullwhip effect */}
        <motion.div variants={fadeUp} className="glass rounded-2xl p-6">
          <div className="flex items-start justify-between mb-5">
            <div>
              <h3 className="text-sm font-mono text-white/50 uppercase tracking-wider mb-1 font-medium flex items-center gap-2">
                <Activity size={16} className="text-white/40" /> Bullwhip Effect Analysis
              </h3>
              <p className="text-sm text-white/35 max-w-lg">
                Order variance amplification upstream. Values above 1.0x show the bullwhip effect.
              </p>
            </div>
            {stats.hasBullwhip && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 1, type: 'spring' }}
                className="text-xs font-mono text-accent-red bg-accent-red/15 border border-accent-red/25
                  px-3 py-1.5 rounded-full font-bold flex items-center gap-1.5"
              >
                <AlertTriangle size={14} /> Bullwhip Detected
              </motion.span>
            )}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            {stats.bullwhipRatios.map((b, i) => (
              <motion.div
                key={b.role}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.7 + i * 0.1 }}
                className="rounded-xl bg-navy-900/50 p-4 text-center border border-white/8 relative overflow-hidden"
              >
                <div
                  className="absolute bottom-0 left-0 right-0 opacity-10"
                  style={{
                    height: `${Math.min(b.ratio / (stats.maxBullwhip || 1), 1) * 100}%`,
                    background: b.ratio > 3 ? '#ff4d6a' : b.ratio > 1.5 ? '#ffb84d' : ROLE_COLORS[b.role],
                  }}
                />

                <div className="relative">
                  <span style={{ color: ROLE_COLORS[b.role] }}>
                    <RoleIcon role={b.role as any} size={20} className="mx-auto" />
                  </span>
                  <div className="text-xs font-mono text-white/40 uppercase mb-1.5 mt-1 font-medium">{b.label}</div>
                  <div
                    className="text-2xl font-bold font-mono"
                    style={{
                      color: b.ratio > 3 ? '#ff4d6a' : b.ratio > 1.5 ? '#ffb84d' : ROLE_COLORS[b.role],
                    }}
                  >
                    {b.ratio.toFixed(1)}x
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Charts side-by-side */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <motion.div variants={fadeUp} className="glass rounded-2xl p-5">
            <h3 className="text-sm font-mono text-white/50 uppercase tracking-wider mb-4 font-medium flex items-center gap-2">
              <BarChart3 size={16} className="text-white/40" /> Order Patterns
            </h3>
            <div className="h-36 md:h-48">
              <OrderChart history={game.history} />
            </div>
          </motion.div>

          <motion.div variants={fadeUp} className="glass rounded-2xl p-5">
            <h3 className="text-sm font-mono text-white/50 uppercase tracking-wider mb-4 font-medium flex items-center gap-2">
              <DollarSign size={16} className="text-white/40" /> Cumulative Costs
            </h3>
            <div className="h-36 md:h-48">
              <CostChart history={game.history} />
            </div>
          </motion.div>
        </div>

        {/* 4PL insight */}
        {!game.config.unilogMode ? (
          <motion.div
            variants={fadeUp}
            className="rounded-2xl p-8 bg-gradient-to-br from-teal-500/8 to-lime-500/8
              border border-teal-500/15 relative overflow-hidden"
          >
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-teal-500/30 to-transparent" />
            <div className="flex items-start gap-5">
              <img src="/logo.png" alt="Unilog" className="h-10 mt-1 shrink-0" />
              <div>
                <h3 className="text-lg font-semibold text-white/90 mb-2 flex items-center gap-2">
                  <Telescope size={20} className="text-teal-400" /> What if you had a Unilog Control Tower?
                </h3>
                <p className="text-sm text-white/45 leading-relaxed mb-4">
                  With 4PL Mode, all nodes share real-time visibility into consumer demand
                  and supply chain state. Orders propagate instantly, eliminating the information
                  asymmetry that causes the Bullwhip Effect.
                </p>
                <div className="flex items-center gap-4 text-xs font-mono text-teal-400/70">
                  <span className="flex items-center gap-1"><RefreshCw size={12} /> Zero order delay</span>
                  <span className="flex items-center gap-1"><Eye size={12} /> Full visibility</span>
                  <span className="flex items-center gap-1"><Radio size={12} /> Live demand data</span>
                </div>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            variants={fadeUp}
            className="rounded-2xl p-8 bg-gradient-to-br from-teal-500/8 to-lime-500/8
              border border-teal-500/15 text-center"
          >
            <img src="/logo.png" alt="Unilog" className="h-10 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white/90 mb-2 flex items-center justify-center gap-2">
              <Telescope size={20} className="text-teal-400" /> Control Tower Was Active
            </h3>
            <p className="text-sm text-white/45 max-w-lg mx-auto">
              With full visibility, the bullwhip effect was significantly reduced.
              Try playing in <span className="text-white/70 font-medium">Standard Mode</span> to
              see the dramatic difference information asymmetry makes!
            </p>
          </motion.div>
        )}

        {/* Leaderboard */}
        <LeaderboardSection />

        <motion.div variants={fadeUp} className="flex items-center justify-center gap-4 py-8">
          <motion.button
            onClick={leaveRoom}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            className="px-8 py-3 md:px-10 md:py-4 rounded-xl text-lg font-bold text-navy-950
              bg-gradient-to-r from-teal-500 to-lime-500
              hover:from-teal-400 hover:to-lime-400
              transition-all shadow-[0_0_30px_rgba(0,201,177,0.4)]
              relative overflow-hidden group"
          >
            <span className="relative z-10 flex items-center gap-2">
              <RefreshCw size={20} /> Play Again
            </span>
            <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0
              -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
          </motion.button>
        </motion.div>
      </motion.div>
    </div>
  );
}

function LeaderboardSection() {
  const entries = useMemo(() => getLeaderboard().slice(0, 10), []);

  if (entries.length === 0) return null;

  return (
    <motion.div
      variants={fadeUp}
      className="glass rounded-2xl p-6"
    >
      <h3 className="text-sm font-mono text-white/50 uppercase tracking-wider mb-4 font-medium flex items-center gap-2">
        <Crown size={16} className="text-accent-amber" /> Local Leaderboard
      </h3>
      <div className="space-y-2">
        {entries.map((entry, i) => (
          <div
            key={entry.id}
            className="flex items-center gap-3 py-2.5 px-3 rounded-lg hover:bg-white/3 transition-colors"
          >
            <span className={`w-6 text-center font-mono font-bold text-sm ${
              i === 0 ? 'text-accent-amber' : i === 1 ? 'text-white/60' : i === 2 ? 'text-orange-400' : 'text-white/25'
            }`}>
              {i + 1}
            </span>
            <span style={{ color: ROLE_COLORS[entry.role] ?? '#fff' }}>
              <RoleIcon role={entry.role} size={14} />
            </span>
            <span className="text-sm text-white/70 font-medium flex-1 truncate">{entry.playerName}</span>
            <span className="text-xs font-mono text-white/30">{ROLE_LABELS[entry.role] ?? entry.role}</span>
            <span className="text-xs font-mono text-white/20">{entry.weeks}wk</span>
            <span className={`text-xs font-mono font-bold px-1.5 py-0.5 rounded ${
              entry.grade === 'S' ? 'text-accent-amber bg-accent-amber/10' :
              entry.grade === 'A' ? 'text-teal-400 bg-teal-500/10' :
              'text-white/40 bg-white/5'
            }`}>
              {entry.grade}
            </span>
            <span className="text-sm font-mono font-bold text-lime-400 w-12 text-right">{entry.score}</span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
