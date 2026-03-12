import React from 'react';
import { PRAYER_TOPICS } from '../constants';
import { Heart, Headphones } from 'lucide-react';

interface Props {
  currentIndex: number;
  onGeneratePodcast: (topic: string) => void;
}

const PrayerFocus: React.FC<Props> = ({ currentIndex, onGeneratePodcast }) => {
  const prayer = PRAYER_TOPICS[currentIndex];

  return (
    <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 overflow-hidden relative group">
      <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
        <Heart size={80} />
      </div>
      <h3 className="text-indigo-600 font-bold text-sm uppercase tracking-widest mb-2 flex items-center gap-2">
        <Heart size={14} className="fill-current" /> Focus Prière
      </h3>
      <h4 className="text-2xl font-bold text-slate-800 mb-3">{prayer.topic}</h4>
      <p className="text-slate-600 mb-6 leading-relaxed">
        {prayer.details}
      </p>
      <button
        onClick={() => onGeneratePodcast(`Prière et intercession pour : ${prayer.topic}. ${prayer.details}`)}
        className="w-full bg-slate-50 hover:bg-indigo-50 text-indigo-600 border border-indigo-100 py-3 rounded-2xl flex items-center justify-center gap-2 font-semibold transition-all"
      >
        <Headphones size={18} /> Podcast d'Intercession
      </button>
    </div>
  );
};

export default PrayerFocus;
