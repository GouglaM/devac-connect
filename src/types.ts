export interface Member {
  id: string;
  name: string;
  role?: string;
  profession?: string;
  phone?: string;
  location?: string;
  photo?: string;
  email?: string;
}

export interface UnitFile {
  id: string;
  name: string;
  mimeType: string;
  data: string; // base64
  date: string;
  size: number;
  category?: 'LISTE' | 'RAPPORT' | 'GUIDE' | 'AUTRE';
  description?: string;
}

export interface FollowUpLog {
  id: string;
  date: string;
  status: 'NOUVEAU' | 'STABLE' | 'EN_CROISSANCE' | 'MATURE' | 'PERDU';
  observation: string;
}

export interface NewSoul {
  id: string;
  name: string;
  phone: string;
  location: string;
  decisionDate: string;
  activity?: string;
  evangelistName?: string;
  evangelistContact?: string;
  supervisionStatus?: string;
  supervisorName?: string;
  supervisorContact?: string;
  followUpLogs?: FollowUpLog[];
}

export interface OfficeMember {
  id: string;
  position: string;
  name: string;
  photo?: string;
  phone?: string;
  email?: string;
}

export interface ProgrammeItem {
  id: string;
  date: string;
  activity: string;
  location: string;
  resources: string;
  budget: string;
  assignedTo: string;
  assignedContact: string;
}

export interface ReportItem {
  id: string;
  date: string;
  missionField: string;
  projectedActivities: string;
  realizedActivities: string;
  expectedResults: string;
  expectedAudience?: string;
  expectedDecisions?: string;
  obtainedAudience: string;
  activeMembers?: string;
  decisionsAdults: string;
  decisionsChildren: string;
  title?: string;
  content?: string;
  observations?: string;
  indicators?: string;
  financialCost?: string;
}

export interface ActivityReportItem {
  id: string;
  date: string;
  activity: string;
  expectedResults: string;
  indicators: string;
  obtainedResults: string;
  product: string;
  humanResources: string;
  financialResources: string;
  observations: string;
}

export interface TreasuryItem {
  id: string;
  date: string;
  label: string;
  previsionnel: string;
  realise: string;
  sourceDevac: string;
  sourceUnite: string;
  expenses: string;
  encaisse: string;
}

export interface ContributionRecord {
  id: string;
  memberId: string;
  memberName: string;
  date: string;
  amount: string;
  month: string;
  year: string;
  status: 'PAYÉ' | 'EN_ATTENTE' | 'PARTIEL';
  observation?: string;
}

export interface SocialActionRecord {
  id: string;
  date: string;
  beneficiaryName: string;
  beneficiaryFirstName?: string;
  category: 'JOY' | 'DIFFICULTY';
  eventType: 'DEATH' | 'BIRTH' | 'WEDDING' | 'VISIT' | 'OTHER' | 'SICKNESS';
  eventDate?: string;
  visitDate?: string;
  assistanceType: string;
  status: 'RECEIVED' | 'AWAITING';
  isVisited?: boolean;
  details?: string;
  visitors?: string[];
  files?: UnitFile[];
}

export interface AnnualReportData {
  introduction: string;
  period?: string;
  generalObjective: string;
  missionField: string;
  specificObjectivePopulation: string;
  specificObjectiveBudget: string;
  moralSpiritualBilan: string;
  internalAnalysisStrengths: string;
  internalAnalysisWeaknesses: string;
  recommendations: string;
  conclusion: string;
  perspectives: string;
}

export interface EvangelismUnit {
  id: string;
  name: string;
  members: Member[];
  mission: string;
  leaderName?: string;
  leaderPhone?: string;
  leaderEmail?: string;
  leaderPhoto?: string;
  assistantName?: string;
  assistantPhone?: string;
  assistantEmail?: string;
  assistantPhoto?: string;
  programme?: ProgrammeItem[];
  reports?: ReportItem[];
  activityReports?: ActivityReportItem[];
  treasury?: TreasuryItem[];
  office?: OfficeMember[];
  newSouls?: NewSoul[];
  gallery?: UnitFile[];
  socialActions?: SocialActionRecord[];
  annualReport?: string;
  annualReportData?: AnnualReportData;
  contributions?: ContributionRecord[];
  initialBalance?: string;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  date: string;
  category?: 'EVENT' | 'GENERAL' | 'URGENT';
  priority?: 'normal' | 'high';
  image?: string;
}

export interface Committee {
  id: string;
  name: string;
  members: Member[];
  description: string;
  leaderName?: string;
  leaderPhone?: string;
  leaderEmail?: string;
  leaderPhoto?: string;
  assistantName?: string;
  assistantPhone?: string;
  assistantEmail?: string;
  assistantPhoto?: string;
  newSouls?: NewSoul[];
  treasury?: TreasuryItem[];
  programme?: ProgrammeItem[];
  reports?: ReportItem[];
  gallery?: UnitFile[];
  socialActions?: SocialActionRecord[];
  annualReport?: string;
  annualReportData?: AnnualReportData;
  activityReports?: ActivityReportItem[];
  office?: OfficeMember[];
  contributions?: ContributionRecord[];
  initialBalance?: string;
}

export interface AttendanceSession {
  id: string;
  groupId: string;
  date: string;
  attendees: string[];
  title?: string;
}

export interface ChatMessage {
  id: string;
  sender: string;
  text: string;
  timestamp: number;
}

export interface CampaignRegistration {
  id: string;
  lastName: string;
  firstName: string;
  phone: string;
  location: string;
  photo?: string; // base64
  isHolySpiritBaptized: boolean;
  isWaterBaptized: boolean;
  department: string;
  category: string;
  registrationDate: string;
}

export interface CampaignComiteMember {
  id: string;
  role: string;
  name: string;
  phone?: string;
}

export interface CampaignContribution {
  id: string;
  missionaryId: string; // From CampaignRegistration.id
  amount: number;
  date: string;
  time?: string; // e.g., "14:30"
  observation?: string;
}

export interface CampaignDonation {
  id: string;
  donorName: string;
  amount: number;
  date: string;
  time?: string; // e.g., "14:30"
  observation?: string;
}

export interface CampaignExpense {
  id: string;
  label: string;
  amount: number;
  date: string;
  time?: string;
  observation?: string;
}

export interface CampaignSite {
  id: string;
  name: string;
  type: 'QUARTIER' | 'VILLAGE';
  isCombined?: boolean;
}

export interface CampaignGroup {
  id: string;
  name: string;
  siteIds: string[];
  missionaryIds: string[]; // IDs from Member or CampaignRegistration
  leaderId?: string;
}

export type UnitMember = Member;
