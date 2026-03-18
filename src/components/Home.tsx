/**
 * Page d'Accueil Optimisée - DEVAC Connect
 * Structure professionnelle avec contrôle d'accès basé sur les rôles (RBAC)
 */

import React, { useState } from 'react';
import {
  LayoutGrid, Users, ShieldCheck, Database, ArrowRight, Megaphone, CheckSquare, Heart,
  BarChart3, Clock, FileText, MessageSquare, Settings, LogOut, Lock, Download, Database as DbIcon, X
} from 'lucide-react';
import { Announcement, EvangelismUnit, Committee, AttendanceSession } from '../types';
import { Protected, AdminGate, ReadOnlyWrapper, ProtectedButton } from './ui/ProtectedComponents';
import { authService } from '../services/authService';
import PrayerFocus from './ui/PrayerFocus';
import BibleAssistant from './ai/BibleAssistant';
import AnnouncementBoard from './community/AnnouncementBoard';
import VerseTicker from './ui/VerseTicker';

interface HomeProps {
  announcements: Announcement[];
  units: EvangelismUnit[];
  committees: Committee[];
  attendanceHistory: AttendanceSession[];
  onNavigate: (view: 'UNITS' | 'ATTENDANCE' | 'ACTU' | 'CHAT' | 'DOCS' | 'SOULS' | 'CAMPAIGN') => void;
  onRefresh: () => void;
  isAdmin: boolean;
  currentVerse: any;
  currentPrayer: any;
  verseIndex?: number;
  onGeneratePodcast: (topic: string) => Promise<void>;
  onDelete: (id: string) => void;
  onAdd: (announcement: Announcement) => void;
}

interface QuickAction {
  id: string;
  label: string;
  icon: React.ReactNode;
  description: string;
  action: () => void;
  color: 'blue' | 'indigo' | 'emerald' | 'rose' | 'amber' | 'violet';
  permission?: string;
  adminOnly?: boolean;
}

const Home: React.FC<HomeProps> = ({
  announcements,
  units,
  committees,
  attendanceHistory,
  onNavigate,
  onRefresh,
  isAdmin,
  currentVerse,
  currentPrayer,
  verseIndex = 0,
  onGeneratePodcast,
  onDelete,
  onAdd,
}) => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showPermissionWarning, setShowPermissionWarning] = useState(false);

  // Actions disponibles
  const quickActions: QuickAction[] = [
    {
      id: 'announcements',
      label: 'Annonces',
      icon: <Megaphone size={20} />,
      description: 'Gérer les annonces communautaires',
      action: () => onNavigate('ACTU'),
      color: 'amber',
      permission: 'read_announcement',
    },
    {
      id: 'units',
      label: 'Unités',
      icon: <LayoutGrid size={20} />,
      description: 'Voir les unités d\'évangélisation',
      action: () => onNavigate('UNITS'),
      color: 'indigo',
      permission: 'read_unit',
    },
    {
      id: 'attendance',
      label: 'Présence',
      icon: <CheckSquare size={20} />,
      description: 'Gérer les présences',
      action: () => onNavigate('ATTENDANCE'),
      color: 'emerald',
    },
    {
      id: 'souls',
      label: 'Âmes suivies',
      icon: <Heart size={20} />,
      description: 'Suivi des âmes converties',
      action: () => onNavigate('SOULS'),
      color: 'rose',
    },
    {
      id: 'docs',
      label: 'Documents',
      icon: <FileText size={20} />,
      description: 'Bibliothèque de documents',
      action: () => onNavigate('DOCS'),
      color: 'violet',
    },
    {
      id: 'chat',
      label: 'Discussion',
      icon: <MessageSquare size={20} />,
      description: 'Chat communautaire',
      action: () => onNavigate('CHAT'),
      color: 'blue',
    },
  ];

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await new Promise(resolve => setTimeout(resolve, 600));
    onRefresh();
    setIsRefreshing(false);
  };

  // Obtenir la couleur CSS pour chaque action
  const getColorStyles = (color: string) => {
    const colorMap: { [key: string]: string } = {
      'blue': 'bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white border-blue-500',
      'indigo': 'bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white border-indigo-500',
      'emerald': 'bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white border-emerald-500',
      'rose': 'bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white border-rose-500',
      'amber': 'bg-amber-50 text-amber-600 hover:bg-amber-600 hover:text-white border-amber-500',
      'violet': 'bg-violet-50 text-violet-600 hover:bg-violet-600 hover:text-white border-violet-500',
    };
    return colorMap[color] || colorMap['blue'];
  };

  return (
    <div className="space-y-8 pb-6">
      {/* ========== En-tête avec stats ==========*/}
      <div className="px-4 pt-4 xl:max-w-[1600px] mx-auto">
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 rounded-2xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-black uppercase tracking-tight mb-1">
                Bienvenue à DEVAC Connect
              </h1>
              <p className="text-slate-300 font-medium">
                {new Date().toLocaleDateString('fr-FR', { weekday: 'long', month: 'long', day: 'numeric' })}
              </p>
            </div>
            <div className="flex gap-2">
              <ProtectedButton
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors disabled:opacity-50"
              >
                <Clock size={18} />
                <span>{isRefreshing ? 'Sync...' : 'Actualiser'}</span>
              </ProtectedButton>
            </div>
          </div>

          {/* Statistiques clés */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-slate-700/50 rounded-lg p-4">
              <p className="text-slate-400 text-sm font-medium">Unités</p>
              <p className="text-2xl font-black">{units.length}</p>
            </div>
            <div className="bg-slate-700/50 rounded-lg p-4">
              <p className="text-slate-400 text-sm font-medium">Comités</p>
              <p className="text-2xl font-black">{committees.length}</p>
            </div>
            <div className="bg-slate-700/50 rounded-lg p-4">
              <p className="text-slate-400 text-sm font-medium">Annonces</p>
              <p className="text-2xl font-black">{announcements.length}</p>
            </div>
            <div className="bg-slate-700/50 rounded-lg p-4">
              <p className="text-slate-400 text-sm font-medium">État</p>
              <p className="text-2xl font-black text-emerald-400">✓</p>
            </div>
          </div>

          {/* Badge admin si connecté */}
          {isAdmin && (
            <div className="mt-6 flex items-center gap-2 bg-emerald-500/20 border border-emerald-500/50 text-emerald-300 px-4 py-2 rounded-lg w-fit">
              <ShieldCheck size={18} />
              <span className="font-semibold">Connecté en tant qu'Administrateur</span>
            </div>
          )}
        </div>
      </div>

      {/* ========== Actions rapides ==========*/}
      <div className="px-4 xl:max-w-[1600px] mx-auto">
        <div className="mb-6">
          <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter mb-2">
            Actions rapides
          </h2>
          <p className="text-slate-500 font-medium">Accédez rapidement aux fonctionnalités principales</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {quickActions.map((action) => (
            <Protected
              key={action.id}
              permission={action.permission}
              requireAdmin={action.adminOnly}
              fallback={
                <button
                  disabled
                  className="p-4 rounded-2xl shadow-sm border border-slate-200 bg-slate-50 opacity-50 cursor-not-allowed flex flex-col items-center gap-2.5 text-center relative group"
                  title="Accès restreint"
                >
                  <div className="w-10 h-10 bg-slate-100 text-slate-400 rounded-xl flex items-center justify-center">
                    {action.icon}
                  </div>
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-tight">
                    {action.label}
                  </span>
                  <Lock size={12} className="absolute top-1 right-1 text-red-500" />
                </button>
              }
            >
              <button
                onClick={action.action}
                className={`p-4 rounded-2xl shadow-sm border border-slate-100 bg-white group hover:border-${action.color}-500 hover:shadow-lg hover:shadow-${action.color}-500/10 transition-all flex flex-col items-center gap-2.5 text-center active:scale-95`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center group-hover:shadow-lg transition-all ${getColorStyles(action.color)}`}>
                  {action.icon}
                </div>
                <span className="text-xs font-bold text-slate-700 uppercase tracking-tight">
                  {action.label}
                </span>
                <p className="text-[10px] text-slate-400 line-clamp-1">
                  {action.description}
                </p>
              </button>
            </Protected>
          ))}
        </div>
      </div>

      {/* ========== Contenu principal ==========*/}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 px-4 animate-in fade-in duration-500 xl:max-w-[1600px] mx-auto">
        {/* Colonne principale */}
        <div className="lg:col-span-7 space-y-6">
          {/* Annonces */}
          <AnnouncementBoard
            announcements={announcements}
            units={units}
            committees={committees}
            isAdmin={isAdmin}
            onDelete={onDelete}
            onAdd={onAdd}
            onRefresh={handleRefresh}
          />

          {/* Grille de contenu auxiliaire */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <PrayerFocus currentIndex={0} onGeneratePodcast={onGeneratePodcast} />
            <BibleAssistant
              announcements={announcements}
              units={units}
              committees={committees}
              attendanceHistory={attendanceHistory}
              currentVerse={currentVerse}
              currentPrayer={currentPrayer}
              onSetPodcastAudio={() => {}}
            />
          </div>
        </div>

        {/* Colonne latérale */}
        <div className="lg:col-span-5 space-y-6">
          {/* Ticker de verset */}
          <VerseTicker 
            currentIndex={verseIndex}
            onGeneratePodcast={onGeneratePodcast}
          />

          {/* Widget d'info RBAC */}
          {isAdmin && (
            <AdminGate>
              <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-2xl p-6 border border-indigo-200">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center text-white flex-shrink-0">
                    <ShieldCheck size={24} />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-black text-indigo-900 mb-1 uppercase">Panel Administrateur</h3>
                    <p className="text-indigo-700 text-sm mb-3">
                      Vous avez accès à toutes les fonctionnalités de gestion.
                    </p>
                    <div className="flex gap-2 text-xs">
                      <span className="bg-indigo-600 text-white px-3 py-1 rounded-full font-semibold">
                        Permissions élevées
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </AdminGate>
          )}

          {/* Info lecture-seule si pas admin */}
          {!isAdmin && (
            <ReadOnlyWrapper
              isReadOnly={true}
              message="Vous avez accès en lecture seule. Certaines fonctionnalités de modification sont réservées aux administrateurs."
              className="p-4 bg-blue-50 rounded-2xl border border-blue-200"
            >
              <div className="flex items-start gap-3">
                <Lock className="text-blue-600 flex-shrink-0 mt-1" size={20} />
                <div>
                  <p className="font-bold text-blue-900">Accès standard</p>
                  <p className="text-blue-700 text-sm">
                    Vous pouvez consulter les données mais pas les modifier directement.
                  </p>
                </div>
              </div>
            </ReadOnlyWrapper>
          )}

          {/* Raccourcis admin */}
          <Protected requireAdmin>
            <div className="bg-slate-900 rounded-2xl p-6 border border-slate-700">
              <h3 className="font-black text-white mb-4 uppercase flex items-center gap-2">
                <Settings size={20} />
                Outils d'Administration
              </h3>
              <div className="space-y-2">
                <ProtectedButton
                  requireAdmin
                  className="w-full px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold transition-colors flex items-center gap-2"
                >
                  <DbIcon size={18} />
                  Gestion de la base de données
                </ProtectedButton>
                <ProtectedButton
                  requireAdmin
                  className="w-full px-4 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold transition-colors flex items-center gap-2"
                >
                  <Download size={18} />
                  Exporter les données
                </ProtectedButton>
              </div>
            </div>
          </Protected>
        </div>
      </div>

      {/* ========== Section de permission refusée (si ajouté) ==========*/}
      {showPermissionWarning && (
        <div className="px-4 xl:max-w-[1600px] mx-auto">
          <div className="bg-red-50 border-2 border-red-300 rounded-2xl p-6 flex items-start gap-4">
            <Lock className="text-red-600 flex-shrink-0 mt-1" size={24} />
            <div className="flex-1">
              <h3 className="font-black text-red-900 mb-1">Accès refusé</h3>
              <p className="text-red-700">
                Vous n'avez pas les permissions requises pour accéder à cette fonctionnalité.
                Veuillez contacter un administrateur si vous pensez qu'il y a une erreur.
              </p>
            </div>
            <button
              onClick={() => setShowPermissionWarning(false)}
              className="text-red-600 hover:text-red-700"
            >
              <X size={20} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;
