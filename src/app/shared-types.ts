// Shared types and constants for the Temple App
export type AppRole = 'SuperAdmin' | 'SuperAgent' | 'Distributor' | 'DistSales' | 'TempleAdmin' | 'Staff' | 'Service';
export type OrgType = 'HQ' | 'AgentOffice' | 'DistributorOffice' | 'Temple';

export interface PricePlan {
  id: string; distributorId: string; name: string; setupFee: number; monthlyFee: number; isFree: boolean; freeMonths: number;
}

export interface Organization {
  id: string; name: string; type: OrgType; parentId?: string; status: 'Active' | 'Pending' | 'Suspended';
  quotaTotal?: number; quotaUsed?: number; planInfo?: string;
}

export interface User {
  id: number; name: string; account?: string; appRole: AppRole; orgId: string; status: string; avatar: string;
}

export interface ServiceForm {
  id: string; name: string; description: string;
  fields: { 
    id: string; 
    label: string; 
    type: 'text' | 'textarea' | 'checkbox' | 'number' | 'radio' | 'section'; 
    options?: string[];
    width?: 'full' | 'half' | 'third';
  }[];
}

export interface ServiceDefinition {
  id: string;
  name: string;
  assignedStaff: string[]; 
  linkedFormId: string;
  status: 'Active' | 'Inactive';
  precautions?: string;
  priceInfo?: string;
}

export interface LinePushStage {
  id: string;
  timeType: 'Before' | 'After';
  timeValue: number;
  timeUnit: 'Days' | 'Hours';
  target: 'Customer' | 'Temple' | 'Both';
  content: string;
  enabled: boolean;
}

export interface ServicePushConfig {
  serviceId: string;
  stages: LinePushStage[];
}

export interface GuestSettings { requireBirthday: boolean; requireAddress: boolean; requireNeeds: boolean; }
export interface ServiceSettings { 
  enableAgiModule: boolean; 
  enableCalendar: boolean;
  enableLamps: boolean;
  enableQueue: boolean;
  enableEvents: boolean;
  enableAnalytics: boolean;
  enableDarkMode: boolean;
  enableAutoAudit: boolean;
  enableLineNotification: boolean;
  allowCancel: boolean;
  allowModify: boolean;
  cancelHoursBefore: number; 
  modifyHoursBefore: number; 
  pushConfigs: ServicePushConfig[];
}

export interface AnalyticsSettings {
  showGenderRatio: boolean;
  showServiceDistribution: boolean;
  showPeakHours: boolean;
  showRevenueTrends: boolean;
  showAgeDemographics: boolean;
  showQueueStats: boolean;
  showCashFlow: boolean;
  showStorageInfo?: boolean;
}

export interface QueueEvent {
  id: string;
  title: string;
  date: string;
  location: string;
  maxCapacity: number;
  paymentType: 'Free' | 'Paid' | 'Donation';
  status: 'Upcoming' | 'Active' | 'Completed';
  precautions?: string;
  priceInfo?: string;
  timeWindow?: string;
}

export interface EventRegistration {
  id: string;
  eventId: string;
  guestName: string;
  phone: string;
  amount: number;
  status: 'Paid' | 'Unpaid';
  timestamp: string;
}

export interface QueueTicket {
  id: string;
  eventId: string;
  phone: string;
  guestName: string;
  assignedNumber: number;
  actualOrder?: number;
  status: 'Pending' | 'Queuing' | 'Completed';
  scannedAt?: string;
}

export interface LampCategory {
  id: string;
  name: string;
  defaultPrice: number;
  defaultDays: number;
  precautions?: string;
}

export interface LampRecord {
  id: string;
  phone: string;
  guestName: string;
  categoryId: string;
  categoryName: string;
  price: number;
  startDate: string;
  expiryDate: string;
  status: 'Active' | 'Expiring' | 'Expired';
  mediaUrls: string[];
  notified: boolean;
}

export interface GuestFile {
  id: string;
  phone: string;
  type: 'photo' | 'video' | 'file';
  url: string;
  folder: string;
  timestamp: string;
  isPrivate?: boolean;
  uploadedBy: 'Temple' | 'Guest';
}

export interface DeepRecord {
  id: string;
  phone: string;
  eventId: string;
  date: string;
  serviceType: string;
  staffName: string;
  content: any;
  pdfUrl?: string;
  timestamp: string;
}

export interface RevenueEntry {
  id: string;
  source: 'Appointment' | 'Lamp' | 'Event' | 'Queue' | 'Donation';
  title: string;
  guestName: string;
  amount: number;
  paymentMethod: 'LINE Pay' | 'Cash' | 'Bank Transfer';
  timestamp: string;
}

export interface ExpenseEntry {
  id: string;
  type: 'SetupFee' | 'MonthlyFee' | 'StorageUpgrade' | 'AgiService';
  amount: number;
  status: 'Paid' | 'Unpaid';
  billingDate: string;
  dueDate: string;
  invoiceUrl?: string;
}

export interface StorageInfo {
  used: number;
  total: number;
  tier: number;
}

export interface GuestRecord {
  id: string;
  name: string;
  phone: string;
  address?: string;
  birthday?: string;
  lunarBirthday?: string;
  birthHour?: string;
  email?: string;
  account?: string;
  password?: string;
  lineId?: string;
  status: 'Active' | 'Inactive';
}

export interface FreeAccountApplication {
  id: string;
  templeName: string;
  submittedBy: string;
  submittedRole: string;
  timestamp: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  rejectionReason?: string;
  account?: string;
  password?: string;
  setupFee?: number;
  monthlyRent: number;
  freeMonths?: number;
  city?: string;
  district?: string;
  address?: string;
  templePhone?: string;
  contactName?: string;
  contactPhone?: string;
  chairpersonName?: string;
  chairpersonPhone?: string;
  paymentBank?: string;
  paymentAccount?: string;
  receiptAccount?: string;
  contractId?: string;
  currentUsers?: number;
}

export interface VisitationRecord {
  id: string;
  salesName: string;
  templeName: string;
  date: string;
  visitIndex: number;
  notes: string;
  status: 'Planned' | 'Completed' | 'Cancelled';
  importance?: 'Low' | 'Medium' | 'High';
}

export interface SalesTool {
  id: string;
  title: string;
  type: 'video' | 'pdf' | 'link';
  category: 'Intro' | 'Tutorial' | 'Marketing';
  url: string;
  thumbnail?: string;
}

export interface EContract {
  id: string;
  templeName: string;
  salesName: string;
  templateName: string;
  status: 'Draft' | 'Pending' | 'Signed';
  signedAt?: string;
  signatureUrl?: string;
}

export interface SalesProfile {
  id: string;
  name: string;
  phone: string;
  parentDistributor: string;
  account: string;
  joinedAt: string;
  address?: string;
  commissionMode?: 'Flat' | 'Tiered' | 'Custom';
  setupSplit?: number;
  monthlySplit?: number;
  notes?: string;
}

export interface DistributorProfile {
  id: string;
  name: string;
  account: string;
  password?: string;
  planId: string;
  planName: string;
  totalQuota: number;
  usedQuota: number;
  startDate: string;
  expiryDate: string;
  linkedSuperSales: string;
  linkedSuperAdmin: string;
  phone: string;
  address: string;
}

export interface CommissionRecord {
  id: string;
  templeName: string;
  amount: number;
  type: 'Setup' | 'Monthly';
  date: string;
  status: 'Paid' | 'Pending';
}

export const TAIWAN_CITIES = [
  "台北市", "新北市", "桃園市", "台中市", "台南市", "高雄市", 
  "基隆市", "新竹市", "新竹縣", "苗栗縣", "彰化縣", "南投縣", 
  "雲林縣", "嘉義縣", "嘉義市", "屏東縣", "宜蘭縣", "花蓮縣", 
  "台東縣", "澎湖縣", "金門縣", "連江縣"
];
