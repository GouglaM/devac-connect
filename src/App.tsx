import React, { useState, useEffect } from 'react';
import { BIBLICAL_VERSES, PRAYER_TOPICS } from './constants';
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

import Clock from './components/ui/Clock';
import VerseTicker from './components/ui/VerseTicker';
import PrayerFocus from './components/ui/PrayerFocus';
import AnnouncementBoard from './components/community/AnnouncementBoard';
import BibleAssistant from './components/ai/BibleAssistant';
import AdminPanel from './admin/AdminPanel';
import VoicePlayer from './components/ai/VoicePlayer';
import CommunityChat from './components/community/CommunityChat';
import AttendanceManager from './components/units/AttendanceManager';
import UnitDetails from './components/units/UnitDetails';
import DocumentLibrary from './components/documents/DocumentLibrary';
import SoulFollowUp from './components/members/SoulFollowUp';
import CampaignDashboard from './components/campaign/CampaignDashboard';

import {
  LayoutGrid, Users, ShieldCheck, Database, RefreshCcw, ArrowRight
} from 'lucide-react';

// Initialisation immédiate du stockage
initializeData();

const App: React.FC = () => {
  const [verseIndex, setVerseIndex] = useState(0);
  const [prayerIndex, setPrayerIndex] = useState(0);

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

  const [isAdmin, setIsAdmin] = useState(false);
  const [currentView, setCurrentView] = useState<'HOME' | 'UNITS' | 'ATTENDANCE' | 'ACTU' | 'CHAT' | 'DOCS' | 'SOULS' | 'CAMPAIGN'>('HOME');
  const [selectedGroup, setSelectedGroup] = useState<EvangelismUnit | Committee | null>(null);
  const [podcastAudio, setPodcastAudio] = useState<AudioBuffer | null>(null);
  const [isGeneratingPodcast, setIsGeneratingPodcast] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [currentLogo, setCurrentLogo] = useState<string | null>(() => {
    return localStorage.getItem('devac_logo');
  });

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

  const handleUpdateLogo = (logo: string | null) => {
    setCurrentLogo(logo);
    if (logo) {
      localStorage.setItem('devac_logo', logo);
    } else {
      localStorage.removeItem('devac_logo');
    }
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
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 p-4 animate-in fade-in duration-500 xl:max-w-[1600px] mx-auto">
            <div className="lg:col-span-5 space-y-6">
              <PrayerFocus currentIndex={prayerIndex} onGeneratePodcast={handleGeneratePodcast} />
              <BibleAssistant
                announcements={announcements}
                units={units}
                committees={committees}
                attendanceHistory={attendanceHistory}
                currentVerse={BIBLICAL_VERSES[verseIndex]}
                currentPrayer={PRAYER_TOPICS[prayerIndex]}
                onSetPodcastAudio={setPodcastAudio}
              />
            </div>
            <div className="lg:col-span-4">
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
            <div className="lg:col-span-3 space-y-4">
              <AdminPanel
                onAddAnnouncement={(ann) => addAnnouncementToDB(ann)}
                isAdmin={isAdmin}
                setIsAdmin={setIsAdmin}
                onUpdateLogo={handleUpdateLogo}
                currentLogo={currentLogo}
              />
            </div>
          </div>
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
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-28">
      <header className="bg-[#0f172a] text-white py-3 px-8 sticky top-0 z-50 flex flex-col md:flex-row justify-between items-center shadow-2xl">
        <div className="flex items-center gap-4 mb-4 md:mb-0">
          <div className="w-12 h-12 rounded-full border-2 border-indigo-500/30 shadow-xl overflow-hidden bg-slate-800 flex items-center justify-center">
            <img src={currentLogo || "https://images.unsplash.com/photo-1635326445353-888915467417?q=80&w=200&auto=format&fit=crop"} alt="Logo" className="w-full h-full object-contain" />
          </div>
          <h1 className="text-xl font-black tracking-tighter uppercase leading-none">DEVAC <span className="text-indigo-400 font-light">CONNECT</span></h1>
        </div>

        <nav className="flex gap-1 bg-slate-800/40 p-1.5 rounded-2xl mb-4 md:mb-0 border border-white/5">
          {[
            { id: 'HOME', label: 'Accueil' },
            { id: 'UNITS', label: 'Unités & Comités' },
            { id: 'ATTENDANCE', label: 'Présences' },
            { id: 'DOCS', label: 'Archives' },
            { id: 'SOULS', label: 'Suivi des Âmes' },
            { id: 'ACTU', label: 'Actu' },
            { id: 'CAMPAIGN', label: 'TAFIRE 2026' },
            { id: 'CHAT', label: 'Chat' }
          ].map(v => (
            <button key={v.id} onClick={() => { setCurrentView(v.id as any); setSelectedGroup(null); }} className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${currentView === v.id ? 'bg-[#4f46e5] text-white shadow-lg' : 'text-slate-500 hover:text-white hover:bg-slate-700/50'}`}>
              {v.label}
            </button>
          ))}
        </nav>

        <div className="flex items-center gap-4">
          <button onClick={handleRefreshData} className={`p-3 bg-white/5 hover:bg-white/10 rounded-xl transition-all border border-white/5 ${isRefreshing ? 'animate-spin text-indigo-400' : 'text-slate-400'}`}><RefreshCcw size={18} /></button>
          <Clock />
        </div>
      </header>

      <VerseTicker currentIndex={verseIndex} onGeneratePodcast={handleGeneratePodcast} />

      <main className="container mx-auto mt-6">
        {renderContent()}
      </main>

      <VoicePlayer podcastAudio={podcastAudio} onClearPodcast={() => setPodcastAudio(null)} currentVerse={BIBLICAL_VERSES[verseIndex]} currentPrayer={PRAYER_TOPICS[prayerIndex]} announcements={announcements} />
    </div>
  );
};

export default App;
