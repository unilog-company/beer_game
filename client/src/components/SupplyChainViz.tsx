import { motion } from 'framer-motion';
import { ROLE_ORDER, ROLE_LABELS } from '@shared/constants';
import type { GameState, PlayerRole } from '@shared/types';
import { Lock, User } from './Icons';

interface Props {
  game: GameState;
  myRole: PlayerRole | null;
}

const NODE_COLORS: Record<PlayerRole, string> = {
  manufacturer: '#00c9b1',
  distributor: '#3dd9c4',
  warehouse: '#6ae08c',
  retailer: '#7ed321',
};

export function SupplyChainViz({ game, myRole }: Props) {
  const reversed = [...ROLE_ORDER].reverse();

  return (
    <div className="glass rounded-xl p-3 md:p-5 relative overflow-hidden">
      {game.config.unilogMode && (
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-teal-500/40 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-lime-500/30 to-transparent" />
        </div>
      )}

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-3">
        <h3 className="text-sm font-mono text-white/50 uppercase tracking-wider font-medium">
          Supply Chain Pipeline
        </h3>
        <div className="flex items-center gap-4">
          {game.config.unilogMode && (
            <span className="text-xs font-mono text-teal-400/70 uppercase tracking-wider font-medium">
              Full Visibility
            </span>
          )}
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-white/40">Consumer Demand:</span>
            <motion.span
              key={game.consumerDemand}
              initial={{ scale: 1.4, opacity: 0.5 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-lg font-mono font-bold text-lime-400"
            >
              {game.consumerDemand}
            </motion.span>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto -mx-2 px-2">
        <div className="relative flex items-center py-3 md:py-5 gap-0.5 md:gap-1 min-w-[500px]">
        {reversed.map((role, i) => {
          const node = game.nodes[role];
          const isMe = role === myRole;
          const isHidden = node.inventory < 0;
          const invLevel = isHidden ? 0 : Math.min(node.inventory / 30, 1);

          return (
            <div key={role} className="flex items-center flex-1 min-w-0">
              <motion.div
                layout
                className={`relative shrink-0 w-full rounded-xl p-2 md:p-3 border transition-all duration-500 ${
                  isMe
                    ? 'bg-navy-800/80 border-teal-500/40'
                    : 'bg-navy-800/30 border-white/8'
                }`}
              >
                <div className="absolute bottom-0 left-0 right-0 h-1 rounded-b-xl overflow-hidden">
                  <motion.div
                    className="h-full"
                    style={{ background: NODE_COLORS[role] }}
                    animate={{ width: `${invLevel * 100}%` }}
                    transition={{ type: 'spring', stiffness: 100 }}
                  />
                </div>

                {isMe && (
                  <motion.div
                    className="absolute -inset-px rounded-xl border border-teal-500/20"
                    animate={{ opacity: [0.2, 0.5, 0.2] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                )}

                <div className="text-center">
                  <div className="text-[10px] font-mono text-white/45 uppercase tracking-wider truncate font-medium">
                    {ROLE_LABELS[role]}
                  </div>
                  {isHidden ? (
                    <div className="text-white/12 mt-1 flex justify-center">
                      <Lock size={18} />
                    </div>
                  ) : (
                    <motion.div
                      key={node.inventory}
                      initial={{ y: -5, opacity: 0.5 }}
                      animate={{ y: 0, opacity: 1 }}
                      className="text-lg md:text-2xl font-bold font-mono text-white mt-1"
                    >
                      {node.inventory}
                      {node.backlog > 0 && (
                        <span className="text-xs text-accent-red ml-1 font-semibold">
                          -{node.backlog}
                        </span>
                      )}
                    </motion.div>
                  )}
                </div>
              </motion.div>

              {i < reversed.length - 1 && (
                <div className="hidden sm:block shrink-0 w-6 md:w-14 relative mx-0.5">
                  <svg className="w-full h-4" viewBox="0 0 48 16">
                    <line x1="0" y1="8" x2="48" y2="8" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
                    <polygon points="44,5 48,8 44,11" fill="rgba(255,255,255,0.1)" />
                  </svg>
                  {!isHidden && node.inTransitFreight.map((qty, fi) =>
                    qty > 0 ? (
                      <motion.div
                        key={fi}
                        className="absolute top-1/2 -translate-y-1/2 w-2 h-2 rounded-full"
                        style={{
                          background: NODE_COLORS[role],
                          left: `${((fi + 1) / (node.inTransitFreight.length + 1)) * 100}%`,
                          boxShadow: `0 0 6px ${NODE_COLORS[role]}`,
                        }}
                        animate={{ scale: [1, 1.4, 1], opacity: [0.6, 1, 0.6] }}
                        transition={{ duration: 1.5, repeat: Infinity, delay: fi * 0.3 }}
                      />
                    ) : null
                  )}
                </div>
              )}
            </div>
          );
        })}

        <div className="shrink-0 ml-2">
          <div className="w-10 h-10 rounded-full bg-lime-500/10 border border-lime-500/20
            flex items-center justify-center text-lime-400/60">
            <User size={18} />
          </div>
        </div>
        </div>
      </div>

      <div className="flex items-center justify-center gap-3 text-[10px] text-white/20 font-mono uppercase tracking-wider">
        <span>Production</span>
        <span className="hidden sm:inline">→→→</span>
        <span>Freight Flow</span>
        <span className="hidden sm:inline">→→→</span>
        <span>Consumer</span>
      </div>
    </div>
  );
}
