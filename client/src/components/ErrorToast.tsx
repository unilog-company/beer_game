import { AnimatePresence, motion } from 'framer-motion';
import { useGameStore } from '../store';

export function ErrorToast() {
  const error = useGameStore((s) => s.error);

  return (
    <AnimatePresence>
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="fixed top-4 left-1/2 -translate-x-1/2 z-50
            bg-accent-red/20 border border-accent-red/40 text-accent-red
            px-6 py-3 rounded-xl font-medium text-sm backdrop-blur-md"
        >
          {error}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
