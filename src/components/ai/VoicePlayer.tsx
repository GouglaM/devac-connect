import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, X, Music, Volume2, Waves, Sparkles, Headphones, Radio } from 'lucide-react';

interface Props {
  podcastAudio: AudioBuffer | null;
  onClearPodcast: () => void;
  currentVerse: any;
  currentPrayer: any;
  announcements: any[];
}

const VoicePlayer: React.FC<Props> = ({ podcastAudio, onClearPodcast }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<AudioBufferSourceNode | null>(null);

  useEffect(() => {
    if (podcastAudio) {
      setIsPlaying(true);
      playBuffer(podcastAudio);
    }
    return () => stopAudio();
  }, [podcastAudio]);

  const stopAudio = () => {
    if (sourceRef.current) {
      try {
        sourceRef.current.stop();
      } catch (e) { }
      sourceRef.current = null;
    }
    setIsPlaying(false);
  };

  const playBuffer = async (buffer: AudioBuffer) => {
    stopAudio();
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    audioContextRef.current = ctx;

    if (ctx.state === 'suspended') {
      await ctx.resume();
    }

    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(ctx.destination);

    source.onended = () => {
      setIsPlaying(false);
      onClearPodcast();
    };

    source.start(0);
    sourceRef.current = source;
  };

  if (!podcastAudio) return null;

  return (
    <div className="fixed bottom-24 left-4 right-4 md:left-auto md:right-8 md:bottom-8 z-[100] animate-in slide-in-from-bottom-8 duration-500">
      <div className="bg-[#0f172a] text-white rounded-[2rem] p-5 shadow-2xl shadow-indigo-900/40 border border-slate-700/50 flex items-center gap-5 w-full md:w-96 backdrop-blur-xl bg-opacity-95">
        <div className="relative">
          <div className="w-14 h-14 bg-gradient-to-br from-indigo-600 to-violet-700 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-indigo-500/20">
            <Radio size={24} className="text-white animate-pulse" />
          </div>
          <div className="absolute -top-1 -right-1">
            <Sparkles size={16} className="text-amber-400 animate-bounce" />
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <div className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em] mb-1">DEVAC Radio / Insights</div>
          <div className="text-sm font-bold truncate text-slate-100">Podcast Duo : Marcellin & Sara</div>
          <div className="flex items-center gap-3 mt-1.5">
            <div className="flex gap-0.5">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className={`w-1 bg-indigo-500 rounded-full animate-wave-${i}`} style={{ height: '8px' }}></div>
              ))}
            </div>
            <span className="text-[10px] text-slate-400 font-medium">Lecture en cours...</span>
          </div>
        </div>

        <button
          onClick={() => { stopAudio(); onClearPodcast(); }}
          className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl transition-all border border-white/5 group"
          title="Fermer le lecteur"
        >
          <X size={18} className="group-hover:text-red-400 transition-colors" />
        </button>
      </div>

      <style>{`
        @keyframes wave {
          0%, 100% { height: 4px; }
          50% { height: 12px; }
        }
        .animate-wave-1 { animation: wave 1s ease-in-out infinite; }
        .animate-wave-2 { animation: wave 1.2s ease-in-out infinite; }
        .animate-wave-3 { animation: wave 0.8s ease-in-out infinite; }
        .animate-wave-4 { animation: wave 1.1s ease-in-out infinite; }
      `}</style>
    </div>
  );
};

export default VoicePlayer;
