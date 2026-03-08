import { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../store';
import { ROLE_ORDER, ROLE_LABELS, HOLDING_COST, BACKLOG_COST } from '@shared/constants';
import { calculateLiveScore, MAX_TOTAL_SCORE } from '@shared/scoring';
import type { PlayerRole } from '@shared/types';
import { SupplyChainViz } from '../components/SupplyChainViz';
import { CostChart } from '../components/CostChart';
import { OrderChart } from '../components/OrderChart';
import {
  RoleIcon, Send, Minus, Plus, Lock, Check, Loader2,
  ClipboardList, DollarSign, BarChart3,
} from '../components/Icons';
import { playOrderSent, playWeekAdvance, playTimerWarning, playTimerCritical } from '../lib/sounds';

export function GameBoard() {
  const game = useGameStore((s) => s.game);
  const myRole = useGameStore((s) => s.myRole);
  const room = useGameStore((s) => s.room);
  const orderTimeRemaining = useGameStore((s) => s.orderTimeRemaining);
  const submitOrder = useGameStore((s) => s.submitOrder);

  const [orderAmount, setOrderAmount] = useState(4);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [activeTab, setActiveTab] = useState<'cost' | 'orders'>('cost');
  const [showWeekBanner, setShowWeekBanner] = useState(false);
  const [showOrderCelebration, setShowOrderCelebration] = useState(false);
  const prevWeekRef = useRef(0);

  useEffect(() => {
    if (game?.phase === 'ordering') {
      setHasSubmitted(false);
      if (game.currentWeek !== prevWeekRef.current) {
        prevWeekRef.current = game.currentWeek;
        setShowWeekBanner(true);
        playWeekAdvance();
        setTimeout(() => setShowWeekBanner(false), 1800);
      }
    }
  }, [game?.currentWeek, game?.phase]);

  const handleSubmit = () => {
    if (hasSubmitted || !game || game.phase !== 'ordering') return;
    submitOrder(orderAmount);
    setHasSubmitted(true);
    setShowOrderCelebration(true);
    playOrderSent();
    setTimeout(() => setShowOrderCelebration(false), 1200);
  };

  const myNode = myRole && game ? game.nodes[myRole] : null;
  const isOrdering = game?.phase === 'ordering';

  const prevTimerRef = useRef(61);
  useEffect(() => {
    if (!isOrdering) { prevTimerRef.current = 61; return; }
    if (orderTimeRemaining <= 5 && prevTimerRef.current > 5) playTimerCritical();
    else if (orderTimeRemaining <= 10 && prevTimerRef.current > 10) playTimerWarning();
    else if (orderTimeRemaining <= 5 && orderTimeRemaining > 0 && orderTimeRemaining < prevTimerRef.current) playTimerCritical();
    prevTimerRef.current = orderTimeRemaining;
  }, [orderTimeRemaining, isOrdering]);

  const myCost = useMemo(() => {
    if (!myNode || myNode.totalCost < 0) return 0;
    return myNode.totalCost;
  }, [myNode]);

  const totalChainCost = useMemo(() => {
    if (!game) return 0;
    return ROLE_ORDER.reduce(
      (sum, role) => sum + (game.nodes[role].totalCost >= 0 ? game.nodes[role].totalCost : 0),
      0
    );
  }, [game]);

  const liveScore = useMemo(() => {
    if (!game || !myRole || game.history.length === 0) return 0;
    return calculateLiveScore(game, myRole);
  }, [game, myRole]);

  if (!game || !room) return null;

  const progress = (game.currentWeek / game.config.totalWeeks) * 100;
  const timerUrgent = isOrdering && orderTimeRemaining <= 10;
  const timerCritical = isOrdering && orderTimeRemaining <= 5;

  return (
    <div className="min-h-screen flex flex-col relative">
      {/* Week Transition Banner */}
      <AnimatePresence>
        {showWeekBanner && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.1 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none"
          >
            <div className="text-center">
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="text-white/30 text-lg font-mono uppercase tracking-widest mb-2"
              >
                Week
              </motion.div>
              <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 200 }}
                className="text-8xl font-bold gradient-text glow-text"
              >
                {game.currentWeek}
              </motion.div>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: 120 }}
                className="h-1 bg-gradient-to-r from-teal-500 to-lime-500 rounded-full mx-auto mt-4"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Order Celebration */}
      <AnimatePresence>
        {showOrderCelebration && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 pointer-events-none flex items-center justify-center"
          >
            <motion.div
              initial={{ scale: 0, rotate: -10 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              className="bg-teal-500/10 backdrop-blur-sm border border-teal-500/30
                rounded-2xl px-10 py-6 text-center"
            >
              <Send size={36} className="text-teal-400 mx-auto mb-2" />
              <div className="text-xl font-bold text-teal-400">Order Sent!</div>
              <div className="text-sm text-white/50 font-mono mt-1">{orderAmount} units dispatched</div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top Bar */}
      <header className={`glass-strong border-b px-3 py-2 md:px-6 md:py-3 shrink-0 transition-colors duration-300 ${
        timerCritical ? 'border-accent-red/40' : timerUrgent ? 'border-accent-amber/30' : 'border-white/8'
      }`}>
        <div className="max-w-[1400px] mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <img src="/logo.png" alt="Unilog" className="h-8 hidden md:block" />
            {game.config.unilogMode && (
              <span className="text-xs font-mono uppercase tracking-wider px-3 py-1
                rounded-full bg-gradient-to-r from-teal-500/15 to-lime-500/15
                text-teal-400 border border-teal-500/25 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
                Control Tower
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 md:gap-5 flex-wrap justify-center">
            <StatBlock label="Week" color="text-white">
              <span className="text-base md:text-xl font-bold font-mono">{game.currentWeek}</span>
              <span className="text-white/30 text-sm font-mono">/{game.config.totalWeeks}</span>
            </StatBlock>
            <div className="w-px h-8 bg-white/10 hidden md:block" />
            <StatBlock label="My Cost" color="text-teal-400">
              <motion.span
                key={myCost.toFixed(0)}
                initial={{ y: -5, opacity: 0.5 }}
                animate={{ y: 0, opacity: 1 }}
                className="text-base md:text-xl font-bold font-mono text-teal-400"
              >
                ${myCost.toFixed(0)}
              </motion.span>
            </StatBlock>
            <div className="w-px h-8 bg-white/10 hidden md:block" />
            <StatBlock label="Chain Total" color="text-accent-amber">
              <motion.span
                key={totalChainCost.toFixed(0)}
                initial={{ y: -5, opacity: 0.5 }}
                animate={{ y: 0, opacity: 1 }}
                className="text-base md:text-xl font-bold font-mono text-accent-amber"
              >
                ${totalChainCost.toFixed(0)}
              </motion.span>
            </StatBlock>
            <div className="w-px h-8 bg-white/10 hidden md:block" />
            <StatBlock label="Score" color="text-lime-400">
              <motion.span
                key={liveScore}
                initial={{ y: -5, opacity: 0.5 }}
                animate={{ y: 0, opacity: 1 }}
                className="text-base md:text-xl font-bold font-mono text-lime-400"
              >
                {liveScore}
              </motion.span>
              <span className="text-white/20 text-[10px] font-mono">/{MAX_TOTAL_SCORE}</span>
            </StatBlock>
            {isOrdering && (
              <>
                <div className="w-px h-8 bg-white/10 hidden md:block" />
                <StatBlock label="Timer" color={timerCritical ? 'text-accent-red' : timerUrgent ? 'text-accent-amber' : 'text-white'}>
                  <span className={`text-base md:text-xl font-bold font-mono ${
                    timerCritical ? 'text-accent-red animate-urgency' : timerUrgent ? 'text-accent-amber' : 'text-white'
                  }`}>
                    {orderTimeRemaining}s
                  </span>
                </StatBlock>
              </>
            )}
          </div>

          <div className="hidden md:flex items-center gap-3">
            {myRole && (
              <div className="w-9 h-9 rounded-lg bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400">
                <RoleIcon role={myRole} size={18} />
              </div>
            )}
            <div className="text-right">
              <div className="text-xs text-white/40 font-mono uppercase tracking-wider">Your Role</div>
              <div className="text-base font-semibold gradient-text">
                {myRole ? ROLE_LABELS[myRole] : 'Spectator'}
              </div>
            </div>
          </div>
          {myRole && (
            <div className="md:hidden w-9 h-9 rounded-lg bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400 shrink-0">
              <RoleIcon role={myRole} size={18} />
            </div>
          )}
        </div>

        <div className="max-w-[1400px] mx-auto mt-2.5">
          <div className={`h-1.5 rounded-full overflow-hidden transition-colors ${
            timerCritical ? 'bg-accent-red/10' : 'bg-white/5'
          }`}>
            <motion.div
              className={`h-full rounded-full ${
                timerCritical ? 'bg-accent-red' : 'bg-gradient-to-r from-teal-500 to-lime-500'
              }`}
              animate={{ width: `${progress}%` }}
              transition={{ type: 'spring', stiffness: 50 }}
            />
          </div>
        </div>
      </header>

      {/* Phase indicator */}
      <div className="max-w-[1400px] mx-auto w-full px-6">
        <motion.div
          layout
          className={`mt-3 flex items-center justify-center gap-2 py-1.5 px-4 rounded-full text-xs font-mono uppercase tracking-wider mx-auto w-fit ${
            isOrdering && !hasSubmitted
              ? 'bg-teal-500/10 text-teal-400 border border-teal-500/20'
              : hasSubmitted
                ? 'bg-lime-500/10 text-lime-400 border border-lime-500/20'
                : 'bg-white/5 text-white/40 border border-white/8'
          }`}
        >
          <span className={`w-2 h-2 rounded-full ${
            isOrdering && !hasSubmitted ? 'bg-teal-400 animate-pulse' : hasSubmitted ? 'bg-lime-400' : 'bg-white/20'
          }`} />
          {isOrdering && !hasSubmitted ? 'Place Your Order' : hasSubmitted ? 'Order Submitted - Waiting...' : 'Processing Turn...'}
        </motion.div>
      </div>

      {/* Main content */}
      <div className="flex-1 max-w-[1400px] mx-auto w-full px-3 py-3 md:px-6 md:py-4 flex flex-col gap-4 overflow-y-auto">
        <SupplyChainViz game={game} myRole={myRole} />

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {ROLE_ORDER.map((role) => {
              const node = game.nodes[role];
              const isMe = role === myRole;
              const isHidden = node.inventory < 0;

              return (
                <motion.div
                  key={role}
                  layout
                  className={`rounded-xl p-4 transition-all duration-300 ${
                    isMe ? 'glass border-teal-500/30 glow-teal' : 'glass'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-3">
                    <div className={`${isMe ? 'text-teal-400' : 'text-white/35'}`}>
                      <RoleIcon role={role} size={16} />
                    </div>
                    <h3 className={`text-xs font-mono uppercase tracking-wider font-semibold truncate ${
                      isMe ? 'text-teal-400' : 'text-white/60'
                    }`}>
                      {ROLE_LABELS[role]}
                    </h3>
                    {isMe && (
                      <span className="text-[10px] font-mono text-teal-400 uppercase bg-teal-500/15 px-1.5 py-0.5 rounded font-bold ml-auto shrink-0">
                        You
                      </span>
                    )}
                  </div>

                  {isHidden ? (
                    <div className="text-center py-4 text-white/15">
                      <Lock size={24} className="mx-auto mb-1" />
                      <div className="text-sm text-white/25 font-mono">Hidden</div>
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      <NodeStat label="Stock" value={node.inventory} color="text-teal-400" large
                        warning={node.inventory === 0} />
                      {node.backlog > 0 && (
                        <NodeStat label="Backlog" value={node.backlog} color="text-accent-red" />
                      )}
                      <NodeStat label="Incoming" value={node.incomingOrder} color="text-accent-blue" />
                      <NodeStat label="Transit" value={node.inTransitFreight.reduce((a, b) => a + b, 0)} color="text-white/60" />
                      <div className="pt-2 mt-1 border-t border-white/8 flex items-baseline justify-between">
                        <span className="text-xs text-white/40 font-mono">Cost</span>
                        <span className="text-sm font-mono font-bold text-accent-amber">
                          ${node.totalCost.toFixed(0)}
                        </span>
                      </div>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>

          {/* Order panel */}
          <motion.div
            layout
            className={`rounded-xl p-5 h-fit lg:sticky lg:top-4 transition-all duration-300 ${
              isOrdering && !hasSubmitted ? 'glass border-teal-500/40 glow-teal' : 'glass'
            }`}
          >
            <h3 className="text-sm font-mono uppercase tracking-wider text-white/60 mb-4 font-semibold flex items-center gap-2">
              <ClipboardList size={16} className="text-white/40" /> Place Order
            </h3>

            <AnimatePresence mode="wait">
              {isOrdering && !hasSubmitted ? (
                <motion.div
                  key="input"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-4"
                >
                  <div className="text-sm text-white/50 font-mono text-center">
                    Week {game.currentWeek + 1} Order
                  </div>

                  <div className="flex items-center gap-2">
                    <motion.button
                      whileTap={{ scale: 0.9 }}
                      onClick={() => setOrderAmount(Math.max(0, orderAmount - 1))}
                      className="w-12 h-12 rounded-lg bg-navy-800 border border-white/15
                        text-white/70 hover:text-white hover:border-teal-500/30
                        transition-all flex items-center justify-center"
                    >
                      <Minus size={18} />
                    </motion.button>
                    <input
                      type="number"
                      value={orderAmount}
                      onChange={(e) => setOrderAmount(Math.max(0, parseInt(e.target.value) || 0))}
                      onKeyDown={(e) => { if (e.key === 'Enter') handleSubmit(); }}
                      className="flex-1 bg-navy-900/80 border border-white/15 rounded-lg px-3 py-3
                        text-white text-center text-3xl font-mono
                        focus:outline-none focus:border-teal-500/50 transition-colors"
                      min={0}
                    />
                    <motion.button
                      whileTap={{ scale: 0.9 }}
                      onClick={() => setOrderAmount(orderAmount + 1)}
                      className="w-12 h-12 rounded-lg bg-navy-800 border border-white/15
                        text-white/70 hover:text-white hover:border-teal-500/30
                        transition-all flex items-center justify-center"
                    >
                      <Plus size={18} />
                    </motion.button>
                  </div>

                  {myNode && (
                    <div className="text-xs text-white/30 font-mono text-center">
                      Holding: ${(myNode.inventory * HOLDING_COST).toFixed(1)}/wk &middot; Backlog: ${(myNode.backlog * BACKLOG_COST).toFixed(1)}/wk
                    </div>
                  )}

                  <motion.button
                    onClick={handleSubmit}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.96 }}
                    className="w-full py-3.5 rounded-xl text-base font-bold text-navy-950
                      bg-gradient-to-r from-teal-500 to-lime-500
                      hover:from-teal-400 hover:to-lime-400 transition-all
                      shadow-[0_0_20px_rgba(0,201,177,0.3)]
                      relative overflow-hidden group"
                  >
                    <span className="relative z-10 flex items-center justify-center gap-2">
                      <Send size={18} /> Send Order
                    </span>
                    <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0
                      -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                  </motion.button>
                </motion.div>
              ) : (
                <motion.div
                  key="status"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-4"
                >
                  {hasSubmitted ? (
                    <>
                      <motion.div
                        initial={{ scale: 0, rotate: -20 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ type: 'spring', stiffness: 300 }}
                        className="text-teal-400 mb-2 flex justify-center"
                      >
                        <Check size={40} />
                      </motion.div>
                      <div className="text-sm text-white/50 font-mono">
                        Ordered <span className="text-teal-400 font-bold">{orderAmount}</span> units
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="text-white/20 mb-2 flex justify-center">
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                        >
                          <Loader2 size={32} />
                        </motion.div>
                      </div>
                      <div className="text-sm text-white/40 font-mono">Processing turn...</div>
                    </>
                  )}

                  <div className="mt-4 space-y-1.5">
                    {ROLE_ORDER.map((role) => {
                      const submitted = game.ordersSubmitted.includes(role);
                      const playerInfo = room.players.find((p) => p.role === role);
                      return (
                        <div key={role} className="flex items-center gap-2 text-xs font-mono justify-center">
                          <motion.div
                            animate={submitted ? { scale: [1, 1.3, 1] } : {}}
                            className={`w-2 h-2 rounded-full transition-colors ${
                              submitted ? 'bg-teal-400' : 'bg-white/15'
                            }`}
                          />
                          <span className={submitted ? 'text-white/60' : 'text-white/25'}>
                            {playerInfo?.name ?? ROLE_LABELS[role]}
                          </span>
                          {submitted && <Check size={12} className="text-teal-400/50" />}
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>

        {/* Charts */}
        {game.history.length > 0 && (
          <div className="glass rounded-xl p-5">
            <div className="flex items-center gap-3 mb-4">
              {[
                { key: 'cost' as const, icon: <DollarSign size={14} />, label: 'Costs', active: activeTab === 'cost' },
                { key: 'orders' as const, icon: <BarChart3 size={14} />, label: 'Orders (Bullwhip)', active: activeTab === 'orders' },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`px-4 py-1.5 rounded-lg text-sm font-mono font-medium transition-all flex items-center gap-1.5 ${
                    tab.active
                      ? 'bg-teal-500/20 text-teal-400 shadow-[0_0_8px_rgba(0,201,177,0.15)]'
                      : 'text-white/40 hover:text-white/60 hover:bg-white/5'
                  }`}
                >
                  {tab.icon} {tab.label}
                </button>
              ))}
            </div>
            <div className="h-40 md:h-52">
              {activeTab === 'cost' ? (
                <CostChart history={game.history} />
              ) : (
                <OrderChart history={game.history} />
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function StatBlock({ label, color, children }: { label: string; color: string; children: React.ReactNode }) {
  return (
    <div className="text-center min-w-[45px] md:min-w-[65px]">
      <div className="text-[10px] text-white/40 font-mono uppercase tracking-wider mb-0.5">{label}</div>
      <div className={`leading-tight ${color}`}>{children}</div>
    </div>
  );
}

function NodeStat({ label, value, color, large, warning }: {
  label: string; value: number; color: string; large?: boolean; warning?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between">
      <span className="text-xs text-white/40 font-mono">{label}</span>
      <motion.span
        key={value}
        initial={{ scale: 1.3, opacity: 0.5 }}
        animate={{ scale: 1, opacity: 1 }}
        className={`font-mono font-bold ${color} ${large ? 'text-lg' : 'text-sm'} ${
          warning ? 'animate-urgency' : ''
        }`}
      >
        {value}
      </motion.span>
    </div>
  );
}
