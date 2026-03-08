import { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useGameStore, initSocketListeners } from './store';
import { Lobby } from './screens/Lobby';
import { WaitingRoom } from './screens/WaitingRoom';
import { GameBoard } from './screens/GameBoard';
import { Results } from './screens/Results';
import { Leaderboard } from './screens/Leaderboard';
import { ErrorToast } from './components/ErrorToast';
import { SoundToggle } from './components/SoundToggle';

export default function App() {
  const screen = useGameStore((s) => s.screen);

  useEffect(() => {
    initSocketListeners();
  }, []);

  return (
    <div className="min-h-screen grid-bg relative">
      <ErrorToast />
      <SoundToggle />
      <AnimatePresence mode="wait">
        {screen === 'lobby' && (
          <motion.div
            key="lobby"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Lobby />
          </motion.div>
        )}
        {screen === 'waiting' && (
          <motion.div
            key="waiting"
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.3 }}
          >
            <WaitingRoom />
          </motion.div>
        )}
        {screen === 'game' && (
          <motion.div
            key="game"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
          >
            <GameBoard />
          </motion.div>
        )}
        {screen === 'results' && (
          <motion.div
            key="results"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
          >
            <Results />
          </motion.div>
        )}
        {screen === 'leaderboard' && (
          <motion.div
            key="leaderboard"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
          >
            <Leaderboard />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
