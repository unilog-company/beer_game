import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../store';
import { ROLE_ORDER, ROLE_LABELS } from '@shared/constants';
import type { PlayerRole } from '@shared/types';
import { socket } from '../socket';
import {
  RoleIcon, ChevronLeft, Bot, Rocket, Plus, Calendar,
  Package, TrendingUp, Zap, Settings,
} from '../components/Icons';
import { playClick, playLaunch } from '../lib/sounds';

const ROLE_DESCRIPTIONS: Record<string, string> = {
  retailer: 'Front line. Fulfills consumer demand and orders from the warehouse.',
  warehouse: 'Storage hub. Balances stock between distributor supply and retailer orders.',
  distributor: 'Regional logistics. Bridges manufacturers and warehouses.',
  manufacturer: 'Source of goods. Manages production lead times and raw output.',
};

const ROLE_COLORS: Record<string, string> = {
  retailer: 'from-lime-500/20 to-lime-500/5',
  warehouse: 'from-teal-500/20 to-teal-500/5',
  distributor: 'from-accent-blue/20 to-accent-blue/5',
  manufacturer: 'from-accent-amber/20 to-accent-amber/5',
};

export function WaitingRoom() {
  const room = useGameStore((s) => s.room);
  const myRole = useGameStore((s) => s.myRole);
  const selectRole = useGameStore((s) => s.selectRole);
  const fillAI = useGameStore((s) => s.fillAI);
  const startGame = useGameStore((s) => s.startGame);
  const leaveRoom = useGameStore((s) => s.leaveRoom);
  const updateConfig = useGameStore((s) => s.updateConfig);

  if (!room) return null;

  const me = room.players.find((p) => p.id === socket.id);
  const isHost = me?.isHost ?? false;
  const assignedCount = ROLE_ORDER.filter((role) =>
    room.players.some((p) => p.role === role)
  ).length;
  const allRolesAssigned = assignedCount === 4;

  const getPlayerForRole = (role: PlayerRole) =>
    room.players.find((p) => p.role === role);

  return (
    <div className="min-h-screen flex flex-col items-center px-3 py-6 md:px-6 md:py-12">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between w-full max-w-4xl"
        style={{ marginBottom: 40 }}
      >
        <button
          onClick={leaveRoom}
          className="text-white/50 hover:text-white/80 text-base transition-colors
            flex items-center gap-1.5 group"
        >
          <ChevronLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
          Leave
        </button>

        <div className="text-center hidden md:block">
          <img src="/logo.png" alt="Unilog" className="h-10 mx-auto mb-1" />
        </div>

        <div className="text-right">
          <div className="text-xs text-white/50 font-mono uppercase tracking-wider mb-0.5">Room Code</div>
          <div className="text-2xl md:text-3xl font-bold font-mono tracking-[0.2em] gradient-text">
            {room.code}
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-4xl"
        style={{ marginBottom: 40 }}
      >
        <div className="flex items-center justify-between" style={{ marginBottom: 10 }}>
          <span className="text-sm font-mono text-white/50 uppercase tracking-wider">Squad Assembly</span>
          <span className="text-sm font-mono text-white/60">
            <span className="text-teal-400 font-bold">{assignedCount}</span> / 4 roles filled
          </span>
        </div>
        <div className="h-2 bg-navy-800 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-teal-500 to-lime-500 rounded-full"
            animate={{ width: `${(assignedCount / 4) * 100}%` }}
            transition={{ type: 'spring', stiffness: 50 }}
          />
        </div>
      </motion.div>

      <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2"
        style={{ gap: 24, marginBottom: 40 }}>
        {ROLE_ORDER.map((role, i) => {
          const player = getPlayerForRole(role);
          const isMe = player?.id === socket.id;
          const isTaken = !!player && !isMe;
          const isSelected = myRole === role;

          return (
            <motion.button
              key={role}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              whileHover={!isTaken ? { scale: 1.02, y: -2 } : undefined}
              whileTap={!isTaken ? { scale: 0.98 } : undefined}
              onClick={() => { if (!isTaken) { selectRole(role); playClick(); } }}
              disabled={isTaken}
              className={`
                relative rounded-2xl p-4 md:p-7 text-left transition-all duration-300 overflow-hidden
                ${isSelected
                  ? 'glass border-teal-500/40 glow-teal'
                  : isTaken
                    ? 'glass opacity-50 cursor-default'
                    : 'glass hover:border-teal-500/25 cursor-pointer'
                }
              `}
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${ROLE_COLORS[role]} opacity-0
                ${isSelected ? '!opacity-100' : ''} transition-opacity`} />

              <div className={`absolute top-0 left-6 right-6 h-[2px] rounded-full transition-all ${
                isSelected ? 'bg-gradient-to-r from-teal-500 to-lime-500' : 'bg-white/5'
              }`} />

              <div className="relative flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${
                      isSelected ? 'bg-teal-500/15 text-teal-400' : 'bg-white/5 text-white/40'
                    }`}>
                      <RoleIcon role={role} size={22} strokeWidth={1.8} />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white/90">
                        {ROLE_LABELS[role]}
                      </h3>
                      <p className="text-xs text-white/35 font-mono">
                        Stage {i + 1} of 4
                      </p>
                    </div>
                  </div>
                  <p className="text-sm text-white/40 leading-relaxed mt-2 pr-4">
                    {ROLE_DESCRIPTIONS[role]}
                  </p>
                </div>

                <div className="text-right shrink-0 ml-2">
                  <AnimatePresence mode="wait">
                    {player ? (
                      <motion.div
                        key={player.name}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                      >
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold mb-1 ${
                          isMe
                            ? 'bg-teal-500/20 text-teal-400 border border-teal-500/30'
                            : player.isAI
                              ? 'bg-accent-amber/15 text-accent-amber border border-accent-amber/20'
                              : 'bg-white/10 text-white/70 border border-white/10'
                        }`}>
                          {player.isAI ? <Bot size={18} /> : player.name.charAt(0).toUpperCase()}
                        </div>
                        <div className={`text-xs font-medium truncate max-w-[80px] ${
                          isMe ? 'text-teal-400' : 'text-white/60'
                        }`}>
                          {isMe ? 'You' : player.name}
                        </div>
                        {player.isAI && (
                          <span className="text-[10px] font-mono text-accent-amber/60 uppercase">Bot</span>
                        )}
                      </motion.div>
                    ) : (
                      <motion.div
                        key="empty"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-center"
                      >
                        <div className="w-10 h-10 rounded-full border-2 border-dashed border-white/15
                          flex items-center justify-center mb-1 text-white/20">
                          <Plus size={16} />
                        </div>
                        <span className="text-xs text-white/25 font-mono">Open</span>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </motion.button>
          );
        })}
      </div>

      {isHost && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="w-full max-w-4xl glass rounded-2xl p-5 md:p-9"
          style={{ marginBottom: 28 }}
        >
          <h3 className="text-sm font-mono text-white/50 uppercase tracking-wider font-semibold flex items-center gap-2"
            style={{ marginBottom: 28 }}>
            <Settings size={16} className="text-white/40" /> Game Settings
          </h3>

          <div className="grid grid-cols-2 md:grid-cols-4" style={{ gap: 20, marginBottom: 32 }}>
            <ConfigInput label="Weeks" value={room.config.totalWeeks} min={10} max={52}
              onChange={(v) => updateConfig({ totalWeeks: v })} icon={<Calendar size={14} />} />
            <ConfigInput label="Initial Stock" value={room.config.initialInventory} min={0} max={100}
              onChange={(v) => updateConfig({ initialInventory: v })} icon={<Package size={14} />} />
            <ConfigInput label="Base Demand" value={room.config.baseDemand} min={1} max={20}
              onChange={(v) => updateConfig({ baseDemand: v })} icon={<TrendingUp size={14} />} />
            <ConfigInput label="Step Demand" value={room.config.stepDemand} min={1} max={40}
              onChange={(v) => updateConfig({ stepDemand: v })} icon={<Zap size={14} />} />
          </div>

          <div className={`flex items-center justify-between py-5 px-6 rounded-xl border transition-all duration-300 ${
            room.config.unilogMode
              ? 'bg-teal-500/8 border-teal-500/20'
              : 'bg-navy-900/40 border-white/8'
          }`}>
            <div className="flex items-center gap-3">
              <img src="/logo.png" alt="" className="h-6" />
              <div>
                <div className="text-base font-medium text-white/90">4PL Control Tower</div>
                <div className="text-sm text-white/40 mt-0.5">
                  Unlock full supply chain visibility
                </div>
              </div>
            </div>
            <button
              onClick={() => updateConfig({ unilogMode: !room.config.unilogMode })}
              className={`relative w-14 h-7 rounded-full transition-all duration-300 ${
                room.config.unilogMode
                  ? 'bg-gradient-to-r from-teal-500 to-lime-500 shadow-[0_0_12px_rgba(0,201,177,0.3)]'
                  : 'bg-white/15'
              }`}
            >
              <motion.div
                className="absolute top-0.5 w-6 h-6 rounded-full bg-white shadow-md"
                animate={{ left: room.config.unilogMode ? 30 : 2 }}
                transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              />
            </button>
          </div>
        </motion.div>
      )}

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="flex flex-col items-center"
        style={{ gap: 24, marginTop: 16 }}
      >
        {isHost && (
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-6 w-full sm:w-auto">
            <motion.button
              onClick={fillAI}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="px-8 py-4 md:px-12 md:py-5 w-full sm:w-auto justify-center rounded-xl text-lg font-semibold text-white/70
                border border-white/15 hover:border-white/25 hover:text-white/90
                hover:bg-white/5 transition-all flex items-center gap-3"
            >
              <Bot size={22} /> Play with AI
            </motion.button>
            <motion.button
              onClick={() => { startGame(); playLaunch(); }}
              disabled={!allRolesAssigned}
              whileHover={allRolesAssigned ? { scale: 1.03 } : undefined}
              whileTap={allRolesAssigned ? { scale: 0.97 } : undefined}
              className={`px-10 py-4 md:px-14 md:py-5 w-full sm:w-auto flex items-center justify-center rounded-xl text-lg font-bold
                transition-all relative overflow-hidden
                ${allRolesAssigned
                  ? 'text-navy-950 bg-gradient-to-r from-teal-500 to-lime-500 shadow-[0_0_30px_rgba(0,201,177,0.4)]'
                  : 'text-white/30 bg-white/5 cursor-not-allowed'
                }`}
            >
              <span className="relative z-10 flex items-center gap-3">
                <Rocket size={22} /> Launch Game
              </span>
              {allRolesAssigned && (
                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0
                  animate-shimmer" />
              )}
            </motion.button>
          </div>
        )}
        {!isHost && (
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-teal-500 animate-pulse" />
            <span className="text-white/50 text-base font-mono">
              Waiting for host to launch...
            </span>
          </div>
        )}
        <span className="text-sm text-white/30 font-mono">
          {room.players.filter((p) => !p.isAI).length} human player(s) connected
        </span>
      </motion.div>
    </div>
  );
}

function ConfigInput({ label, value, min, max, onChange, icon }: {
  label: string; value: number; min: number; max: number;
  onChange: (v: number) => void; icon: React.ReactNode;
}) {
  const [localValue, setLocalValue] = useState(String(value));
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    if (!focused) setLocalValue(String(value));
  }, [value, focused]);

  const commit = () => {
    const parsed = parseInt(localValue);
    if (isNaN(parsed) || parsed < min) onChange(min);
    else if (parsed > max) onChange(max);
    else onChange(parsed);
    setFocused(false);
  };

  return (
    <div>
      <label className="flex items-center text-sm text-white/50 font-mono"
        style={{ gap: 6, marginBottom: 10 }}>
        <span className="text-white/35">{icon}</span> {label}
      </label>
      <input
        type="number"
        value={localValue}
        onChange={(e) => setLocalValue(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={commit}
        onKeyDown={(e) => { if (e.key === 'Enter') commit(); }}
        min={min}
        max={max}
        className="w-full bg-navy-900/80 border border-white/15 rounded-lg px-4 py-3
          text-white text-base focus:outline-none focus:border-teal-500/50
          focus:shadow-[0_0_10px_rgba(0,201,177,0.1)] transition-all font-mono"
      />
    </div>
  );
}
