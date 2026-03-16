import React, { useState, useEffect } from 'react';
import { Calendar, Clock as ClockIcon } from 'lucide-react';

const Clock: React.FC = () => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatDate = (date: Date) => {
    const day = date.toLocaleDateString('fr-FR', { weekday: 'short' }).toUpperCase();
    const dayNum = date.getDate();
    const month = date.toLocaleDateString('fr-FR', { month: 'long' });
    return { day, full: `${dayNum} ${month}` };
  };

  const dateInfo = formatDate(time);

  return (
    <div className="flex items-center gap-0 border border-slate-700 rounded-xl overflow-hidden bg-slate-900/50 backdrop-blur-sm">
      {/* Date Part */}
      <div className="flex items-center gap-2 px-4 py-2 border-r border-slate-700">
        <Calendar size={18} className="text-indigo-400" />
        <div className="text-left leading-none">
          <div className="text-[10px] font-bold text-indigo-400">{dateInfo.day}.</div>
          <div className="text-sm font-bold text-white whitespace-nowrap">{dateInfo.full}</div>
        </div>
      </div>

      {/* Time Part */}
      <div className="flex items-center gap-2 px-4 py-2">
        <ClockIcon size={18} className="text-emerald-400" />
        <div className="text-xl font-bold text-white tabular-nums tracking-widest">
          {time.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
        </div>
      </div>
    </div>
  );
};

export default Clock;