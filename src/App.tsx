import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { BIBLICAL_VERSES, PRAYER_TOPICS, ADMIN_PASSWORD } from './constants';
import { Announcement, EvangelismUnit, Committee, AttendanceSession, Member, UnitFile, CampaignRegistration, CampaignComiteMember, CampaignGroup, CampaignContribution, CampaignDonation, CampaignExpense } from './types';
import {
  subscribeToAnnouncements, subscribeToUnits, subscribeToCommittees, subscribeToAttendance,
  addAnnouncementToDB, deleteAnnouncementFromDB, updateUnitInDB, updateCommitteeInDB,
  saveAttendanceToDB, initializeData, addMemberToGroup,
  getInitialAnnouncements, getInitialUnits, getInitialCommittees, getInitialAttendance,
  getInitialDocuments, subscribeToDocuments, saveDocumentToDB, deleteDocumentFromDB,
  subscribeToRegistrations, saveRegistrationToDB, deleteRegistrationFromDB,
  subscribeToCampaignComite, saveCampaignComiteMemberToDB, deleteAttendanceFromDB,
  subscribeToCampaignGroups, saveCampaignGroupToDB,
  subscribeToCampaignContributions, saveCampaignContributionToDB,
  subscribeToCampaignDonations, saveCampaignDonationToDB,
  deleteCampaignContribution, deleteCampaignDonation,
  subscribeToCampaignExpenses, saveCampaignExpenseToDB, deleteCampaignExpense
} from './services/dataService';
import { generateDevotionalPodcast } from './services/geminiService';
import { authService } from './services/authService';

import Clock from './components/ui/Clock';
import VerseTicker from './components/ui/VerseTicker';
import PrayerFocus from './components/ui/PrayerFocus';
import Header from './components/ui/Header';
import AnnouncementBoard from './components/community/AnnouncementBoard';
import BibleAssistant from './components/ai/BibleAssistant';
import Home from './components/Home';
import AdminPanel from './admin/AdminPanel';
import AdminLogin from './admin/AdminLogin';
import VoicePlayer from './components/ai/VoicePlayer';
import CommunityChat from './components/community/CommunityChat';
import AttendanceManager from './components/units/AttendanceManager';
import UnitDetails from './components/units/UnitDetails';
import UnitsManagementHub from './components/units/UnitsManagementHub';
import DocumentLibrary from './components/documents/DocumentLibrary';
import SoulFollowUp from './components/members/SoulFollowUp';
import CampaignDashboard from './components/campaign/CampaignDashboard';

import {
  LayoutGrid, Users, ShieldCheck, Database, ArrowRight, Megaphone, CheckSquare, Heart, Lock, AlertCircle
} from 'lucide-react';

// Initialisation immédiate du stockage
initializeData();

const MainApp: React.FC<{ isAdmin: boolean; currentLogo: string | null; onUpdateLogo: (logo: string | null) => void }> = ({ isAdmin, currentLogo, onUpdateLogo }) => {
  const [verseIndex, setVerseIndex] = useState(0);
  const [prayerIndex, setPrayerIndex] = useState(0);
  const [showAdminRestrictedMessage, setShowAdminRestrictedMessage] = useState(false);

  const [announcements, setAnnouncements] = useState<Announcement[]>(getInitialAnnouncements);
  const [units, setUnits] = useState<EvangelismUnit[]>(getInitialUnits);
  const [committees, setCommittees] = useState<Committee[]>(getInitialCommittees);
  const [attendanceHistory, setAttendanceHistory] = useState<AttendanceSession[]>(getInitialAttendance);
  const [documents, setDocuments] = useState<UnitFile[]>(getInitialDocuments);
  const [registrations, setRegistrations] = useState<CampaignRegistration[]>([]);
  const [comiteMembers, setComiteMembers] = useState<CampaignComiteMember[]>([]);
  const [missionGroups, setMissionGroups] = useState<CampaignGroup[]>([]);
  const [campaignContributions, setCampaignContributions] = useState<CampaignContribution[]>([]);
  const [campaignDonations, setCampaignDonations] = useState<CampaignDonation[]>([]);
  const [campaignExpenses, setCampaignExpenses] = useState<CampaignExpense[]>([]);

  const [currentView, setCurrentView] = useState<'HOME' | 'UNITS' | 'ATTENDANCE' | 'ACTU' | 'CHAT' | 'DOCS' | 'SOULS' | 'CAMPAIGN' | 'ADMIN_UNITS'>('HOME');
  const [selectedGroup, setSelectedGroup] = useState<EvangelismUnit | Committee | null>(null);
  const [podcastAudio, setPodcastAudio] = useState<AudioBuffer | null>(null);
  const [isGeneratingPodcast, setIsGeneratingPodcast] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    const unsubA = subscribeToAnnouncements(setAnnouncements);
    const unsubU = subscribeToUnits(setUnits);
    const unsubC = subscribeToCommittees(setCommittees);
    const unsubAtt = subscribeToAttendance(setAttendanceHistory);
    const unsubD = subscribeToDocuments(setDocuments);
    const unsubR = subscribeToRegistrations(setRegistrations);
    const unsubCO = subscribeToCampaignComite(setComiteMembers);
    const unsubG = subscribeToCampaignGroups(setMissionGroups);
    const unsubContrib = subscribeToCampaignContributions(setCampaignContributions);
    const unsubDonations = subscribeToCampaignDonations(setCampaignDonations);
    const unsubExpenses = subscribeToCampaignExpenses(setCampaignExpenses);

    const interval = setInterval(() => {
      setVerseIndex(prev => (prev + 1) % BIBLICAL_VERSES.length);
      setPrayerIndex(prev => (prev + 1) % PRAYER_TOPICS.length);
    }, 300000);

    return () => {
      unsubA(); unsubU(); unsubC(); unsubAtt(); unsubD(); unsubR(); unsubCO(); unsubG(); unsubContrib(); unsubDonations(); unsubExpenses();
      clearInterval(interval);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Sync selectedGroup with live data
  useEffect(() => {
    if (selectedGroup) {
      const refreshed = units.find(u => u.id === selectedGroup.id) || committees.find(c => c.id === selectedGroup.id);
      if (refreshed) setSelectedGroup(refreshed);
    }
  }, [units, committees]);

  const handleRefreshData = () => {
    setIsRefreshing(true);
    // Real-time synchronization is automatic with Firebase.
    // This just provides visual feedback of a "refresh".
    setTimeout(() => {
      setIsRefreshing(false);
    }, 600);
  };

  const handleGeneratePodcast = async (topic: string) => {
    setIsGeneratingPodcast(true);
    try {
      const audio = await generateDevotionalPodcast(topic);
      if (audio) setPodcastAudio(audio);
    } finally {
      setIsGeneratingPodcast(false);
    }
  };

  const handleUpdateGroup = (group: EvangelismUnit | Committee) => {
    if ('mission' in group) updateUnitInDB(group as EvangelismUnit);
    else updateCommitteeInDB(group as Committee);
    if (selectedGroup?.id === group.id) setSelectedGroup(group);
  };

  const handleAddMemberToGroup = (groupId: string, member: Member) => {
    const isUnit = units.some(u => u.id === groupId);
    const isCommittee = committees.some(c => c.id === groupId);

    if (isUnit || isCommittee) {
      addMemberToGroup(member, groupId, isUnit ? 'UNIT' : 'COMMITTEE');
    }
  };

  const renderContent = () => {
    if (selectedGroup && currentView === 'UNITS') {
      return (
        <UnitDetails
          unit={selectedGroup}
          onBack={() => setSelectedGroup(null)}
          onUpdate={handleUpdateGroup}
          isAdmin={isAdmin}
        />
      );
    }

    switch (currentView) {
      case 'HOME':
        return (
          <Home
            announcements={announcements}
            units={units}
            committees={committees}
            attendanceHistory={attendanceHistory}
            onNavigate={setCurrentView}
            onRefresh={handleRefreshData}
            isAdmin={isAdmin}
            currentVerse={BIBLICAL_VERSES[verseIndex]}
            currentPrayer={PRAYER_TOPICS[prayerIndex]}
            verseIndex={verseIndex}
            onGeneratePodcast={handleGeneratePodcast}
            onDelete={deleteAnnouncementFromDB}
            onAdd={addAnnouncementToDB}
          />
        );
      case 'UNITS':
        return (
          <div className="p-6 space-y-20 animate-in slide-in-from-bottom-4 duration-500 max-w-7xl mx-auto">
            {/* UNITÉS SECTION */}
            <section>
              <div className="mb-10 flex items-center gap-4">
                <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg"><LayoutGrid size={24} /></div>
                <div>
                  <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter leading-none">Unités d'Évangélisation</h2>
                  <p className="text-slate-500 mt-2 font-medium">Les piliers de notre mission sur le terrain.</p>
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
                    <button key={u.id} onClick={() => setSelectedGroup(u)} className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 group hover:border-indigo-500 hover:shadow-2xl hover:shadow-indigo-500/10 transition-all text-left relative overflow-hidden">
                      <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity"><LayoutGrid size={120} /></div>
                      <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-indigo-600 group-hover:text-white transition-all relative z-10"><LayoutGrid size={24} /></div>
                      <h3 className="text-xl font-black text-slate-800 mb-2 uppercase tracking-tight relative z-10">{u.name}</h3>
                      <p className="text-sm text-slate-500 mb-6 leading-relaxed line-clamp-2 relative z-10">{u.mission}</p>
                      <div className="flex items-center justify-between pt-6 border-t border-slate-50 relative z-10">
                        <div className="flex gap-2">
                          <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full uppercase tracking-widest">{u.members.length} MEMBRES</span>
                        </div>
                        <ArrowRight size={18} className="text-slate-300 group-hover:text-indigo-600 transition-all" />
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </section>

            {/* COMITÉS SECTION */}
            <section>
              <div className="mb-10 flex items-center gap-4">
                <div className="w-12 h-12 bg-emerald-600 rounded-2xl flex items-center justify-center text-white shadow-lg"><Users size={24} /></div>
                <div>
                  <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter leading-none">Comités Spécialisés</h2>
                  <p className="text-slate-500 mt-2 font-medium">Soutien logistique, spirituel et technique à la mission.</p>
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
                    <button key={c.id} onClick={() => setSelectedGroup(c)} className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 group hover:border-emerald-500 hover:shadow-2xl hover:shadow-emerald-500/10 transition-all text-left relative overflow-hidden">
                      <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity"><Users size={120} /></div>
                      <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-emerald-600 group-hover:text-white transition-all relative z-10"><ShieldCheck size={24} /></div>
                      <h3 className="text-xl font-black text-slate-800 mb-2 uppercase tracking-tight relative z-10">{c.name}</h3>
                      <p className="text-sm text-slate-500 mb-6 leading-relaxed line-clamp-2 relative z-10">{c.description}</p>
                      <div className="flex items-center justify-between pt-6 border-t border-slate-50 relative z-10">
                        <div className="flex gap-2">
                          <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full uppercase tracking-widest">{c.members.length} MEMBRES</span>
                        </div>
                        <ArrowRight size={18} className="text-slate-300 group-hover:text-emerald-600 transition-all" />
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </section>
          </div>
        );
      case 'ATTENDANCE':
        return (
          <div className="p-4 max-w-[1400px] mx-auto animate-in fade-in">
            <AttendanceManager
              units={units}
              committees={committees}
              history={attendanceHistory}
              onSaveSession={saveAttendanceToDB}
              onAddMemberToGroup={handleAddMemberToGroup}
              isAdmin={isAdmin}
            />
          </div>
        );
      case 'DOCS':
        return (
          <div className="p-4 max-w-[1400px] mx-auto animate-in fade-in">
            <DocumentLibrary
              documents={documents}
              onUpload={saveDocumentToDB}
              onDelete={deleteDocumentFromDB}
              isAdmin={isAdmin}
            />
          </div>
        );
      case 'ACTU':
        return (
          <div className="p-4">
            <AnnouncementBoard
              announcements={announcements}
              units={units}
              committees={committees}
              isAdmin={isAdmin}
              onDelete={deleteAnnouncementFromDB}
              onAdd={addAnnouncementToDB}
              onRefresh={handleRefreshData}
            />
          </div>
        );
      case 'CHAT':
        return <div className="p-4 animate-in fade-in"><CommunityChat /></div>;
      case 'SOULS':
        return (
          <div className="p-4 animate-in fade-in">
            <SoulFollowUp
              units={units}
              committees={committees}
              onUpdateGroup={handleUpdateGroup}
              isAdmin={isAdmin}
            />
          </div>
        );
      case 'CAMPAIGN':
        return (
          <CampaignDashboard
            units={units}
            committees={committees}
            history={attendanceHistory}
            registrations={registrations}
            comiteMembers={comiteMembers}
            missionGroups={missionGroups}
            contributions={campaignContributions}
            donations={campaignDonations}
            expenses={campaignExpenses}
            onSaveSession={saveAttendanceToDB}
            onSaveRegistration={saveRegistrationToDB}
            onDeleteRegistration={deleteRegistrationFromDB}
            onSaveComiteMember={saveCampaignComiteMemberToDB}
            onSaveCampaignGroup={saveCampaignGroupToDB}
            onSaveCampaignContribution={saveCampaignContributionToDB}
            onSaveCampaignDonation={saveCampaignDonationToDB}
            onSaveCampaignExpense={saveCampaignExpenseToDB}
            onDeleteCampaignContribution={deleteCampaignContribution}
            onDeleteCampaignDonation={deleteCampaignDonation}
            onDeleteCampaignExpense={deleteCampaignExpense}
            onDeleteSession={deleteAttendanceFromDB}
            isAdmin={isAdmin}
          />
        );
      case 'ADMIN_UNITS':
        if (!isAdmin) {
          return (
            <div className="min-h-[60vh] flex items-center justify-center p-4 animate-in fade-in">
              <div className="bg-white rounded-[2.5rem] shadow-2xl border border-slate-100 p-10 max-w-md w-full text-center">
                <div className="flex justify-center mb-6">
                  <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600">
                    <Lock size={32} />
                  </div>
                </div>
                <h2 className="text-2xl font-black uppercase tracking-tight text-slate-900 mb-4">
                  Gestion des Unités
                </h2>
                <p className="text-slate-600 font-medium mb-8 leading-relaxed">
                  Cette section est réservée aux administrateurs de DEVAC Connect. Veuillez vous authentifier pour y accéder.
                </p>
                <div className="space-y-3">
                  <a
                    href="#/administrateur"
                    className="w-full px-6 py-3 bg-indigo-600 text-white rounded-xl font-black uppercase text-xs tracking-widest hover:bg-indigo-700 hover:shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 shadow-lg inline-block"
                  >
                    <Lock size={16} /> Se Connecter Admin
                  </a>
                </div>
                <p className="text-[10px] text-slate-400 uppercase tracking-widest mt-6">
                  Mot de passe administrateur requis
                </p>
              </div>
            </div>
          );
        }
        return (
          <UnitsManagementHub
            units={units}
            committees={committees}
            onUpdateUnit={updateUnitInDB}
            onUpdateCommittee={updateCommitteeInDB}
            isAdmin={isAdmin}
          />
        );
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-28">
      <Header
        currentView={currentView}
        onViewChange={(view) => {
          setCurrentView(view);
          setSelectedGroup(null);
        }}
        onRefresh={handleRefreshData}
        isRefreshing={isRefreshing}
        currentLogo={currentLogo}
        isAdmin={isAdmin}
      />

      <VerseTicker currentIndex={verseIndex} onGeneratePodcast={handleGeneratePodcast} />

      <main className="container mx-auto mt-6">
        {renderContent()}
      </main>

      <VoicePlayer podcastAudio={podcastAudio} onClearPodcast={() => setPodcastAudio(null)} currentVerse={BIBLICAL_VERSES[verseIndex]} currentPrayer={PRAYER_TOPICS[prayerIndex]} announcements={announcements} />
    </div>
  );
};

const App: React.FC = () => {
  const [isAdmin, setIsAdmin] = useState<boolean>(() => {
    return localStorage.getItem('devac_admin_auth') === 'true';
  });
  const [currentLogo, setCurrentLogo] = useState<string | null>(() => {
    return localStorage.getItem('devac_logo');
  });
  const [adminLoginError, setAdminLoginError] = useState('');

  useEffect(() => {
    localStorage.setItem('devac_admin_auth', isAdmin.toString());
  }, [isAdmin]);

  const handleAdminLogin = (password: string) => {
    try {
      const success = authService.authenticateWithPassword(password, ADMIN_PASSWORD);
      if (success) {
        setIsAdmin(true);
        setAdminLoginError('');
        return '';
      } else {
        const error = 'Mot de passe incorrect';
        setAdminLoginError(error);
        return error;
      }
    } catch (err: any) {
      const error = err.message || 'Erreur d\'authentification';
      setAdminLoginError(error);
      return error;
    }
  };

  const handleAdminLogout = () => {
    setIsAdmin(false);
    authService.logout();
  };

  const handleUpdateLogo = (logo: string | null) => {
    setCurrentLogo(logo);
    if (logo && logo.trim()) {
      localStorage.setItem('devac_logo', logo);
    } else {
      localStorage.removeItem('devac_logo');
    }
  };

  return (
    <Router>
      <Routes>
        <Route path="/administrateur" element={
          isAdmin ? (
            <AdminPanel
              onAddAnnouncement={(ann) => addAnnouncementToDB(ann)}
              onUpdateLogo={handleUpdateLogo}
              currentLogo={currentLogo}
              onLogout={handleAdminLogout}
            />
          ) : (
            <AdminLogin onLogin={handleAdminLogin} error={adminLoginError} />
          )
        } />
        <Route path="*" element={<MainApp isAdmin={isAdmin} currentLogo={currentLogo} onUpdateLogo={handleUpdateLogo} />} />
      </Routes>
    </Router>
  );
};

export default App;
