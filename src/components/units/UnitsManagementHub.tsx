import React, { useState } from 'react';
import { LayoutGrid, Users, ShieldCheck, Database, ArrowRight, Edit2, ChevronRight } from 'lucide-react';
import { EvangelismUnit, Committee } from '../../types';
import UnitDetails from './UnitDetails';

interface UnitsManagementHubProps {
  units: EvangelismUnit[];
  committees: Committee[];
  onUpdateUnit: (unit: EvangelismUnit) => void;
  onUpdateCommittee: (committee: Committee) => void;
  isAdmin: boolean;
}

const UnitsManagementHub: React.FC<UnitsManagementHubProps> = ({
  units,
  committees,
  onUpdateUnit,
  onUpdateCommittee,
  isAdmin
}) => {
  const [selectedGroup, setSelectedGroup] = useState<EvangelismUnit | Committee | null>(null);

  if (selectedGroup) {
    return (
      <UnitDetails
        unit={selectedGroup}
        onBack={() => setSelectedGroup(null)}
        onUpdate={(group) => {
          if ('mission' in group) {
            onUpdateUnit(group as EvangelismUnit);
          } else {
            onUpdateCommittee(group as Committee);
          }
          setSelectedGroup(group);
        }}
        isAdmin={isAdmin}
      />
    );
  }

  return (
    <div className="p-6 space-y-20 animate-in slide-in-from-bottom-4 duration-500 max-w-7xl mx-auto">
      {/* UNITÉS SECTION */}
      <section>
        <div className="mb-10 flex items-center gap-4">
          <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg">
            <LayoutGrid size={24} />
          </div>
          <div>
            <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter leading-none">
              Gérer les Unités d'Évangélisation
            </h2>
            <p className="text-slate-500 mt-2 font-medium">
              Modifier la direction, bureau, membres, âmes, actions sociales, programme, rapports, finances et bilans annuels.
            </p>
          </div>
        </div>

        {units.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-[2.5rem] border-2 border-dashed border-slate-100 flex flex-col items-center">
            <Database className="w-12 h-12 text-slate-100 mb-4" />
            <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">Aucune unité trouvée</p>
            <p className="text-slate-300 text-xs mt-1">Utilisez l'onglet Maintenance de la Console Admin pour re-initialiser.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {units.map(u => (
              <button
                key={u.id}
                onClick={() => setSelectedGroup(u)}
                className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 group hover:border-indigo-500 hover:shadow-2xl hover:shadow-indigo-500/10 transition-all text-left relative overflow-hidden h-full"
              >
                <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity">
                  <LayoutGrid size={120} />
                </div>

                <div className="flex items-start justify-between mb-4 relative z-10">
                  <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-all">
                    <LayoutGrid size={24} />
                  </div>
                  <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-all opacity-0 group-hover:opacity-100">
                    <Edit2 size={18} />
                  </div>
                </div>

                <h3 className="text-xl font-black text-slate-800 mb-2 uppercase tracking-tight relative z-10">
                  {u.name}
                </h3>
                <p className="text-sm text-slate-500 mb-6 leading-relaxed line-clamp-3 relative z-10">
                  {u.mission}
                </p>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-2 mb-6 pb-6 border-b border-slate-100 relative z-10">
                  <div className="text-center">
                    <div className="text-lg font-black text-indigo-600">{u.members.length}</div>
                    <div className="text-[10px] text-slate-500 uppercase font-bold">Membres</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-black text-indigo-600">{u.office?.length || 0}</div>
                    <div className="text-[10px] text-slate-500 uppercase font-bold">Bureau</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-black text-indigo-600">{u.socialActions?.length || 0}</div>
                    <div className="text-[10px] text-slate-500 uppercase font-bold">Actions</div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 relative z-10">
                  <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full uppercase tracking-widest">
                    ÉDITER
                  </span>
                  <ChevronRight size={18} className="text-slate-300 group-hover:text-indigo-600 transition-all" />
                </div>
              </button>
            ))}
          </div>
        )}
      </section>

      {/* COMITÉS SECTION */}
      <section>
        <div className="mb-10 flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-600 rounded-2xl flex items-center justify-center text-white shadow-lg">
            <Users size={24} />
          </div>
          <div>
            <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter leading-none">
              Gérer les Comités Spécialisés
            </h2>
            <p className="text-slate-500 mt-2 font-medium">
              Modifier les informations de chaque comité de soutien.
            </p>
          </div>
        </div>

        {committees.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-[2.5rem] border-2 border-dashed border-slate-100 flex flex-col items-center">
            <Database className="w-12 h-12 text-slate-100 mb-4" />
            <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">Aucun comité trouvé</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {committees.map(c => (
              <button
                key={c.id}
                onClick={() => setSelectedGroup(c)}
                className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 group hover:border-emerald-500 hover:shadow-2xl hover:shadow-emerald-500/10 transition-all text-left relative overflow-hidden h-full"
              >
                <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity">
                  <Users size={120} />
                </div>

                <div className="flex items-start justify-between mb-4 relative z-10">
                  <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-all">
                    <ShieldCheck size={24} />
                  </div>
                  <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-all opacity-0 group-hover:opacity-100">
                    <Edit2 size={18} />
                  </div>
                </div>

                <h3 className="text-xl font-black text-slate-800 mb-2 uppercase tracking-tight relative z-10">
                  {c.name}
                </h3>
                <p className="text-sm text-slate-500 mb-6 leading-relaxed line-clamp-3 relative z-10">
                  {c.description}
                </p>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-2 mb-6 pb-6 border-b border-slate-100 relative z-10">
                  <div className="text-center">
                    <div className="text-lg font-black text-emerald-600">{c.members.length}</div>
                    <div className="text-[10px] text-slate-500 uppercase font-bold">Membres</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-black text-emerald-600">{c.office?.length || 0}</div>
                    <div className="text-[10px] text-slate-500 uppercase font-bold">Bureau</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-black text-emerald-600">-</div>
                    <div className="text-[10px] text-slate-500 uppercase font-bold">-</div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 relative z-10">
                  <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full uppercase tracking-widest">
                    ÉDITER
                  </span>
                  <ChevronRight size={18} className="text-slate-300 group-hover:text-emerald-600 transition-all" />
                </div>
              </button>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default UnitsManagementHub;
