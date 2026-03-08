import { useState } from 'react';
import { isMuted, toggleMute, playClick } from '../lib/sounds';
import { Volume2, VolumeX } from './Icons';

export function SoundToggle() {
  const [muted, setMuted] = useState(isMuted);

  const handleToggle = () => {
    const newMuted = toggleMute();
    setMuted(newMuted);
    if (!newMuted) playClick();
  };

  return (
    <button
      onClick={handleToggle}
      className="fixed z-50 text-white/30 hover:text-white/60 transition-all
        hover:bg-white/5 rounded-lg"
      style={{ bottom: 20, right: 20, padding: 10 }}
      title={muted ? 'Unmute sounds' : 'Mute sounds'}
    >
      {muted ? <VolumeX size={20} /> : <Volume2 size={20} />}
    </button>
  );
}
