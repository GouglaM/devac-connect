
import React, { useState } from 'react';
import { Announcement } from '../types';
import { Calendar, Filter, AlertCircle, Clock, Search, Newspaper, ChevronDown } from 'lucide-react';

interface NewsFeedProps {
  announcements: Announcement[];
}

const NewsFeed: React.FC<NewsFeedProps> = ({ announcements }) => {
  const [filterPriority, setFilterPriority] = useState<'all' | 'high' | 'normal'>('all');
  const [filterDate, setFilterDate] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Tri et Filtrage
  const filteredNews = announcements
    .filter(item => {
      // Filtre Priorité
      if (filterPriority !== 'all' && item.priority !== filterPriority) return false;
      
      // Filtre Date (Correspondance exacte ou postérieure)
      if (filterDate) {
        const itemDate = new Date(item.date).setHours(0,0,0,0);
        const selectedDate = new Date(filterDate).setHours(0,0,0,0);
        if (itemDate < selectedDate) return false;
      }

      // Recherche Textuelle
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        return item.title.toLowerCase().includes(term) || item.content.toLowerCase().includes(term);
      }

      return true;
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()); // Tri Chronologique Inverse (Plus récent en haut)

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in">
      
      {/* Header & Filtres */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm sticky top-0 z-30">
        <div className="flex items-center gap-2 mb-4 text-indigo-900">
            <Newspaper className="w-6 h-6" />
            <h2 className="text-xl font-bold font-serif">Fil d'Actualités</h2>
        </div>

        <div className="flex flex-col md:flex-row gap-3">
            {/* Barre de recherche */}
            <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                <input 
                    type="text" 
                    placeholder="Rechercher une actualité..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                />
            </div>

            {/* Filtre Priorité */}
            <div className="relative">
                <select 
                    value={filterPriority}
                    onChange={(e) => setFilterPriority(e.target.value as any)}
                    className="w-full md:w-40 pl-3 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm appearance-none focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer"
                >
                    <option value="all">Toutes priorités</option>
                    <option value="high">Urgentes</option>
                    <option value="normal">Normales</option>
                </select>
                <Filter className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 w-3 h-3 pointer-events-none" />
            </div>

            {/* Filtre Date */}
            <div className="relative">
                <input 
                    type="date" 
                    value={filterDate}
                    onChange={(e) => setFilterDate(e.target.value)}
                    className="w-full md:w-auto pl-3 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                />
            </div>
        </div>
      </div>

      {/* Flux Chronologique */}
      <div className="space-y-8 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-300 before:to-transparent">
        {filteredNews.length > 0 ? (
            filteredNews.map((news) => (
                <div key={news.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                    
                    {/* Icone Centrale Timeline */}
                    <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-slate-50 bg-slate-200 group-hover:bg-indigo-500 group-hover:text-white transition-colors shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 absolute left-0 md:static">
                        {news.priority === 'high' ? <AlertCircle className="w-5 h-5" /> : <Calendar className="w-5 h-5" />}
                    </div>
                    
                    {/* Carte Contenu */}
                    <div className="w-[calc(100%-3rem)] md:w-[calc(50%-2.5rem)] bg-white p-5 rounded-xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow ml-auto md:ml-0">
                        
                        {/* Header Carte */}
                        <div className="flex justify-between items-start mb-3">
                            <div>
                                <span className="font-mono text-xs text-slate-400 flex items-center gap-1 mb-1">
                                    <Clock className="w-3 h-3" />
                                    {new Date(news.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', hour: '2-digit', minute:'2-digit' })}
                                </span>
                                <h3 className="font-bold text-lg text-slate-800 leading-tight">{news.title}</h3>
                            </div>
                            {news.priority === 'high' && (
                                <span className="bg-red-100 text-red-600 text-[10px] font-bold px-2 py-1 rounded-full border border-red-200 uppercase tracking-wide">
                                    Urgent
                                </span>
                            )}
                        </div>

                        {/* Image (si présente) */}
                        {news.image && (
                            <div className="mb-3 rounded-lg overflow-hidden border border-slate-100">
                                <img src={news.image} alt={news.title} className="w-full h-40 object-cover hover:scale-105 transition-transform duration-500" />
                            </div>
                        )}

                        {/* Contenu Texte */}
                        <div className="text-slate-600 text-sm leading-relaxed whitespace-pre-wrap">
                            {news.content}
                        </div>
                    </div>
                </div>
            ))
        ) : (
            <div className="text-center py-12 bg-white rounded-xl border border-dashed border-slate-200 relative z-10">
                <Newspaper className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <h3 className="text-slate-600 font-medium">Aucune actualité trouvée</h3>
                <p className="text-slate-400 text-sm">Essayez de modifier vos filtres.</p>
                {(filterDate || filterPriority !== 'all' || searchTerm) && (
                    <button 
                        onClick={() => { setFilterDate(''); setFilterPriority('all'); setSearchTerm(''); }}
                        className="mt-3 text-indigo-600 text-sm hover:underline font-medium"
                    >
                        Réinitialiser tout
                    </button>
                )}
            </div>
        )}
      </div>

    </div>
  );
};

export default NewsFeed;
