import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../store';
import type { RoomSummary } from '@shared/types';
import {
  Package, Truck, Factory, Store, BarChart3, Link2, ClipboardList,
  Rocket, Users, Bot, Activity, Settings, Boxes, HelpCircle, Crown,
} from '../components/Icons';
import { Tutorial } from '../components/Tutorial';
import { playClick } from '../lib/sounds';

const FLOATING_ICONS = [Package, Truck, Factory, Store, BarChart3, Link2, ClipboardList, Boxes];

function FloatingIcon({ Icon, delay, x, y }: { Icon: typeof Package; delay: number; x: number; y: number }) {
  return (
    <motion.div
      className="absolute select-none pointer-events-none text-teal-400/20"
      style={{ left: `${x}%`, top: `${y}%` }}
      initial={{ opacity: 0, scale: 0 }}
      animate={{
        opacity: [0, 0.2, 0.2, 0],
        scale: [0.5, 1, 1, 0.5],
        y: [0, -20, -20, 0],
      }}
      transition={{
        duration: 6,
        delay,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
    >
      <Icon size={28} strokeWidth={1.5} />
    </motion.div>
  );
}

export function Lobby() {
  const [name, setName] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [mode, setMode] = useState<'idle' | 'join'>('idle');
  const [showTutorial, setShowTutorial] = useState(false);
  const createRoom = useGameStore((s) => s.createRoom);
  const joinRoom = useGameStore((s) => s.joinRoom);
  const connected = useGameStore((s) => s.connected);

  const handleCreate = () => {
    if (!name.trim()) return;
    createRoom(name.trim());
  };

  const handleJoin = () => {
    if (!name.trim() || !joinCode.trim()) return;
    joinRoom(joinCode.trim().toUpperCase(), name.trim());
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-12 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 -left-32 w-[500px] h-[500px] bg-teal-500/8 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 -right-32 w-[500px] h-[500px] bg-lime-500/6 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-teal-500/4 rounded-full blur-3xl" />
        <div className="absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-teal-500/20 to-transparent animate-scan-line" />

        {FLOATING_ICONS.map((Icon, i) => (
          <FloatingIcon
            key={i}
            Icon={Icon}
            delay={i * 0.8}
            x={10 + (i * 11) % 80}
            y={10 + ((i * 37) % 80)}
          />
        ))}

        <div className="absolute bottom-[15%] animate-truck text-white/[0.06]">
          <Truck size={36} />
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="relative z-10 flex flex-col items-center w-full max-w-lg"
      >
        <motion.div
          className="relative"
          style={{ marginBottom: 32 }}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <img src="/logo.png" alt="Unilog" className="h-20 relative z-10" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-28 h-28 rounded-full border border-teal-500/10 animate-pulse-ring" />
          </div>
        </motion.div>

        <h1 className="text-4xl md:text-7xl font-bold tracking-tight text-center leading-tight"
          style={{ marginBottom: 16 }}>
          <span className="gradient-text">Supply Chain</span>
          <br />
          <span className="text-white">Challenge</span>
        </h1>

        <motion.p
          className="text-white/50 text-lg md:text-xl tracking-wide text-center"
          style={{ marginBottom: 32 }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          Can you tame the <span className="text-accent-amber font-semibold">Bullwhip Effect</span>?
        </motion.p>

        <motion.div
          className="flex flex-wrap items-center justify-center"
          style={{ gap: 12, marginBottom: 32 }}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          {[
            { icon: <Users size={15} />, label: 'Multiplayer' },
            { icon: <Bot size={15} />, label: 'AI Players' },
            { icon: <Activity size={15} />, label: 'Live Analytics' },
            { icon: <Settings size={15} />, label: '4PL Mode' },
          ].map((feat) => (
            <span
              key={feat.label}
              className="flex items-center rounded-full
                bg-navy-800/60 border border-white/8 text-sm text-white/60"
              style={{ gap: 8, padding: '8px 16px' }}
            >
              <span className="text-teal-400/70">{feat.icon}</span>
              {feat.label}
            </span>
          ))}
        </motion.div>

        <motion.div
          className="flex items-center"
          style={{ gap: 10, marginBottom: 32 }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <div
            className={`w-2 h-2 rounded-full ${
              connected
                ? 'bg-teal-400 shadow-[0_0_8px_rgba(0,201,177,0.6)]'
                : 'bg-accent-red animate-pulse'
            }`}
          />
          <span className="text-sm text-white/50 font-mono uppercase tracking-widest">
            {connected ? 'Server Online' : 'Connecting...'}
          </span>
        </motion.div>

        <motion.div
          className="glass-strong rounded-2xl w-full"
          style={{ padding: '28px 24px' }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          <div style={{ marginBottom: 40 }}>
            <label className="block text-sm text-white/60 uppercase tracking-wider font-mono font-medium"
              style={{ marginBottom: 12 }}>
              Your Callsign
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your name"
              maxLength={20}
              className="w-full bg-navy-900/80 border border-white/15 rounded-xl text-lg text-white
                placeholder:text-white/25 focus:outline-none focus:border-teal-500/50
                focus:shadow-[0_0_15px_rgba(0,201,177,0.15)]
                transition-all duration-200 font-medium"
              style={{ padding: '16px 20px' }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && mode === 'idle') handleCreate();
                if (e.key === 'Enter' && mode === 'join') handleJoin();
              }}
            />
          </div>

          {mode === 'idle' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <motion.button
                onClick={handleCreate}
                disabled={!name.trim() || !connected}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full rounded-xl text-lg font-bold text-navy-950
                  bg-gradient-to-r from-teal-500 to-lime-500
                  hover:from-teal-400 hover:to-lime-400
                  disabled:opacity-30 disabled:cursor-not-allowed
                  transition-all duration-200
                  shadow-[0_0_30px_rgba(0,201,177,0.3)]
                  relative overflow-hidden group"
                style={{ padding: '18px 0' }}
              >
                <span className="relative z-10 flex items-center justify-center gap-2.5">
                  <Rocket size={20} />
                  Create Game
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0
                  -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
              </motion.button>
              <motion.button
                onClick={() => setMode('join')}
                disabled={!connected}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full rounded-xl text-lg font-semibold text-white/90
                  border border-white/15 hover:border-teal-500/40 hover:text-white
                  hover:bg-teal-500/5
                  disabled:opacity-30 disabled:cursor-not-allowed
                  transition-all duration-200 flex items-center justify-center gap-2.5"
                style={{ padding: '18px 0' }}
              >
                <Link2 size={20} />
                Join Game
              </motion.button>
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              style={{ display: 'flex', flexDirection: 'column', gap: 24 }}
            >
              <div>
                <label className="block text-sm text-white/60 uppercase tracking-wider font-mono font-medium"
                  style={{ marginBottom: 12 }}>
                  Game Code
                </label>
                <input
                  type="text"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  placeholder="XXXX"
                  maxLength={4}
                  className="w-full bg-navy-900/80 border border-white/15 rounded-xl
                    text-white text-center text-3xl tracking-[0.3em] font-mono
                    placeholder:text-white/20 focus:outline-none focus:border-teal-500/50
                    focus:shadow-[0_0_15px_rgba(0,201,177,0.15)]
                    transition-all uppercase"
                  style={{ padding: '16px 20px' }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleJoin();
                  }}
                  autoFocus
                />
              </div>
              <motion.button
                onClick={handleJoin}
                disabled={!name.trim() || joinCode.length !== 4 || !connected}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full rounded-xl text-lg font-bold text-navy-950
                  bg-gradient-to-r from-teal-500 to-lime-500
                  hover:from-teal-400 hover:to-lime-400
                  disabled:opacity-30 disabled:cursor-not-allowed
                  transition-all duration-200
                  shadow-[0_0_30px_rgba(0,201,177,0.3)]"
                style={{ padding: '18px 0' }}
              >
                Join Room
              </motion.button>
              <button
                onClick={() => setMode('idle')}
                className="w-full text-white/50 hover:text-white/70 text-base transition-colors"
                style={{ padding: '12px 0' }}
              >
                Back
              </button>
            </motion.div>
          )}
        </motion.div>

        <motion.div
          className="flex items-center gap-3"
          style={{ marginTop: 32 }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          <button
            onClick={() => { setShowTutorial(true); playClick(); }}
            className="text-white/40 hover:text-white/70 transition-all flex items-center
              hover:bg-white/5 rounded-xl"
            style={{ gap: 8, padding: '10px 20px', fontSize: 14, fontFamily: 'monospace' }}
          >
            <HelpCircle size={18} />
            How to Play
          </button>
          <button
            onClick={() => { useGameStore.getState().setScreen('leaderboard'); playClick(); }}
            className="text-white/40 hover:text-white/70 transition-all flex items-center
              hover:bg-white/5 rounded-xl"
            style={{ gap: 8, padding: '10px 20px', fontSize: 14, fontFamily: 'monospace' }}
          >
            <Crown size={18} />
            Leaderboard
          </button>
        </motion.div>

        <AnimatePresence>
          {showTutorial && <Tutorial onClose={() => setShowTutorial(false)} />}
        </AnimatePresence>

        <OpenRoomsList
          name={name}
          connected={connected}
          joinRoom={joinRoom}
        />

        <motion.div
          className="grid grid-cols-4 w-full"
          style={{ marginTop: 24, gap: 24 }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
        >
          {[
            { Icon: Factory, label: 'Produce' },
            { Icon: Truck, label: 'Distribute' },
            { Icon: Package, label: 'Warehouse' },
            { Icon: Store, label: 'Sell' },
          ].map((s, i) => (
            <motion.div
              key={s.label}
              className="text-center"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 + i * 0.1 }}
            >
              <div className="flex justify-center text-teal-400/40 mb-2 animate-float-slow" style={{ animationDelay: `${i * 0.5}s` }}>
                <s.Icon size={28} strokeWidth={1.5} />
              </div>
              <div className="text-xs font-mono text-white/40 uppercase tracking-wider">{s.label}</div>
            </motion.div>
          ))}
        </motion.div>
      </motion.div>
    </div>
  );
}

function OpenRoomsList({ name, connected, joinRoom }: {
  name: string;
  connected: boolean;
  joinRoom: (code: string, name: string) => void;
}) {
  const openRooms = useGameStore((s) => s.openRooms);
  const refreshRooms = useGameStore((s) => s.refreshRooms);

  useEffect(() => {
    refreshRooms();
    const interval = setInterval(refreshRooms, 5000);
    return () => clearInterval(interval);
  }, [refreshRooms]);

  if (openRooms.length === 0) return null;

  return (
    <motion.div
      className="w-full rounded-xl glass"
      style={{ marginTop: 24, padding: '16px 20px' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.65 }}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Users size={14} className="text-teal-400" />
          <span className="text-xs font-mono text-white/40 uppercase tracking-wider font-medium">Open Rooms</span>
        </div>
        <span className="text-xs font-mono text-white/30">{openRooms.length} available</span>
      </div>
      <div className="space-y-2">
        {openRooms.map((room) => (
          <div
            key={room.code}
            className="flex items-center gap-3 p-3 rounded-lg bg-white/[0.02] border border-white/[0.06] hover:border-teal-500/20 transition-colors"
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-white/80 truncate">{room.hostName}</span>
                <span className="text-[10px] font-mono text-white/25 bg-white/5 px-1.5 py-0.5 rounded">{room.code}</span>
              </div>
              <div className="text-xs text-white/30 font-mono mt-0.5">
                {room.playerCount}/4 players · {room.config.totalWeeks}wk{room.config.unilogMode ? ' · 4PL' : ''}
              </div>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                if (name.trim() && connected) {
                  joinRoom(room.code, name.trim());
                  playClick();
                }
              }}
              disabled={!name.trim() || !connected}
              className="px-4 py-1.5 rounded-lg text-xs font-bold font-mono uppercase
                bg-teal-500/15 text-teal-400 border border-teal-500/25
                hover:bg-teal-500/25 transition-all
                disabled:opacity-30 disabled:cursor-not-allowed"
            >
              Join
            </motion.button>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
