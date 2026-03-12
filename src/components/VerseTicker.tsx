import React, { useState } from 'react';
import { BIBLICAL_VERSES } from '../constants';
import { Book, Headphones, Loader2 } from 'lucide-react';

interface Props {
  currentIndex: number;
  onGeneratePodcast: (topic: string) => Promise<void>;
}

const VerseTicker: React.FC<Props> = ({ currentIndex, onGeneratePodcast }) => {
  const [isLoading, setIsLoading] = useState(false);
  const verse = BIBLICAL_VERSES[currentIndex];

  const handleMeditationClick = async () => {
    setIsLoading(true);
    try {
      await onGeneratePodcast(`Méditation spirituelle sur ${verse.reference}: ${verse.text}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-[#fffcf2] border-t-4 border-[#eab308] py-10 px-4 shadow-sm relative overflow-hidden">
      <div className="max-w-6xl mx-auto flex flex-col items-center">
        {/* En-tête de la section */}
        <div className="flex items-center justify-center gap-2 text-[#b45309] font-bold text-sm tracking-[0.2em] uppercase mb-6">
          <Book size={18} />
          <span>Pensée du moment</span>
        </div>

        {/* Bloc Central avec Verset et Bouton Méditation */}
        <div className="w-full flex flex-col md:flex-row items-center justify-center gap-6 md:gap-12 mb-6 relative">
          <div className="flex-1 text-center">
            <h2 className="text-2xl md:text-4xl font-serif italic text-slate-800 leading-relaxed max-w-4xl mx-auto">
              "{verse.text}"
            </h2>
          </div>

          {/* Bouton Méditation Audio */}
          <div className="md:absolute md:right-0 md:top-1/2 md:-translate-y-1/2">
            <button
              onClick={handleMeditationClick}
              disabled={isLoading}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold transition-all shadow-sm border ${isLoading
                  ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-wait'
                  : 'bg-[#fef3c7] text-[#92400e] hover:bg-[#fde68a] border-[#f59e0b]/20 active:scale-95'
                }`}
            >
              {isLoading ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Headphones size={14} className="fill-current" />
              )}
              {isLoading ? 'Génération...' : 'Méditation Audio'}
            </button>
          </div>
        </div>

        {/* Référence et Note de temps */}
        <div className="flex flex-col items-center gap-2">
          <span className="text-lg md:text-xl font-bold text-[#4f46e5] flex items-center gap-2">
            <span className="text-2xl">—</span> {verse.reference}
          </span>

          <p className="text-[10px] text-slate-400 font-medium uppercase tracking-widest mt-1">
            (Change toutes les 5 min)
          </p>
        </div>
      </div>
    </div>
  );
};

export default VerseTicker;
