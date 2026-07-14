// @ts-nocheck
"use client";
import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Solar } from 'lunar-javascript';
import { 
  GuestSettings, ServiceSettings, GuestFile, GuestRecord 
} from "@/app/shared-types";
import liff from '@line/liff';
import { 
  bookAppointment, 
  cancelAppointment,
  modifyAppointment,
  updateAppointmentPayment,
  fetchAvailableSlots, 
  fetchEvents, 
  getGuestUser, 
  guestLogin, 
  checkPhoneStatus,
  liffAutoLogin,
  checkGuestProfile,
  fetchGuestSettings, 
  askAgiAssistant, 
  fetchGuestAppointments, 
  fetchServiceSettings, 
  fetchQueueEvents, 
  fetchGuestFiles, 
  createOrUpdateGuest,
  createLightingOrder,
  uploadCustomerMedia,
  fetchServiceDefinitions,
  fetchPaymentConfig,
  fetchStaff,
  joinQueue,
  verifyQueueTicket,
  registerForEvent,
  fetchGuestRegistrations,
  fetchGuestQueueTickets,
  fetchGuestLampRecords,
  fetchLampCategories,
  fetchLatestNotificationForGuest,
  fetchActiveNotificationsForGuest,
  fetchActiveQueueCount,
  fetchTempleAiUsage,
  fetchGuestRecords,
  type TempleNotification
} from "@/app/actions";

// --- Custom Icons (SVG) ---
const IconHome = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>;
const IconCalendar = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>;
const IconUser = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>;
const IconSpace = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6"><path d="M12 2H2v10h10V2z"/><path d="M22 2h-10v10h10V2z"/><path d="M12 12H2v10h10V12z"/><path d="M22 12h-10v10h10V12z"/></svg>;
const IconBell = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>;
const IconCandle = () => <svg viewBox="0 0 24 24" fill="none" stroke="#E11D48" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6"><path d="M9 22h6"/><path d="M12 22V10"/><path d="M12 10a2 2 0 0 1 2-2 2 2 0 0 1 2 2v2a2 2 0 0 1-2 2 2 2 0 0 1-2-2z"/><path d="M12 6V4"/><path d="M11 4c0-1.1.9-2 2-2s2 .9 2 2"/></svg>;
const IconFestive = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6"><path d="M12 2v10"/><path d="m16 8-4 4-4-4"/><path d="M3 21h18"/><path d="M12 12v9"/></svg>;
const IconTempleMedia = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><path d="m10 8 5 4-5 4V8z"/><path d="M21 8h-2"/><path d="M21 12h-2"/><path d="M21 16h-2"/></svg>;
const IconLotus = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 100 100" className={className} fill="currentColor">
    <path d="M50 20 C60 40 90 40 50 80 C10 40 40 40 50 20" opacity="0.3"/>
    <path d="M50 30 C70 45 80 70 50 85 C20 70 30 45 50 30" opacity="0.2"/>
  </svg>
);

function QRScannerComponent({ onScan, onClose }: { onScan: (data: string) => void, onClose: () => void }) {
  useEffect(() => {
    let html5QrCode: any;
    let isUnmounted = false;

    import('html5-qrcode').then(({ Html5Qrcode }) => {
      if (isUnmounted) return;
      html5QrCode = new Html5Qrcode("qr-reader");
      
      html5QrCode.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decodedText: string) => {
          if (isUnmounted) return;
          html5QrCode.stop().then(() => {
            html5QrCode.clear();
            onScan(decodedText);
          }).catch(console.error);
        },
        (error: any) => { /* ignore */ }
      ).catch((err: any) => {
        console.error("相機啟動失敗", err);
        alert("無法啟動相機，請確認是否已授予相機權限");
      });
    });

    return () => {
      isUnmounted = true;
      if (html5QrCode && html5QrCode.isScanning) {
        html5QrCode.stop().then(() => html5QrCode.clear()).catch(console.error);
      }
    };
  }, [onScan]);

  return (
    <div className="relative w-full max-w-[280px] mx-auto overflow-hidden rounded-[30px] bg-black">
      <div id="qr-reader" className="w-full h-full text-white [&>div]:border-none"></div>
      
      {/* Fallback mock input (for debugging on PC) */}
      <input 
        type="text" 
        placeholder="模擬掃碼輸入 (PC測試用)" 
        className="w-full p-3 mt-4 text-black text-sm rounded-xl border border-gray-200"
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            onScan(e.currentTarget.value);
            e.currentTarget.value = '';
          }
        }}
      />
    </div>
  );
}

const TopNav = ({ title, onBack }: { title: string, onBack: () => void }) => (
  <div className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-200">
    <div className="flex items-center justify-between h-14 px-4 max-w-md mx-auto">
      <button onClick={onBack} className="p-2 -ml-2 text-gray-700 active:bg-gray-100 rounded-full transition-colors">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
      </button>
      <h2 className="text-lg font-bold text-gray-900">{title}</h2>
      <div className="w-10"></div> {/* Spacer for centering */}
    </div>
  </div>
);

type ViewState = 'home' | 'booking' | 'events' | 'queue' | 'space' | 'records' | 'profile' | 'lighting';

export default function GuestAppClient({ templeId, forceLogin, templeInfo }: { templeId: string, forceLogin?: boolean, templeInfo?: any }) {
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const themeColors: any = {
    amber: { primary: '#B91C1C', secondary: '#D97706', light: '#FEF2F2', border: '#fca5a5' }, // Traditional Red/Gold
    rose: { primary: '#e11d48', secondary: '#be123c', light: '#ffe4e6', border: '#fda4af' },
    emerald: { primary: '#10b981', secondary: '#047857', light: '#d1fae5', border: '#6ee7b7' },
    blue: { primary: '#2563eb', secondary: '#1d4ed8', light: '#dbeafe', border: '#93c5fd' },
    slate: { primary: '#334155', secondary: '#0f172a', light: '#f1f5f9', border: '#cbd5e1' }
  };
  const theme = themeColors[templeInfo?.themeColor || 'amber'] || themeColors.amber;
  const logoUrl = templeInfo?.logoUrl || null;
  const bannerUrl = templeInfo?.bannerUrl || "https://images.unsplash.com/photo-1542869781-a272dcbc07fa?auto=format&fit=crop&q=80&w=1200&h=400";


  const [activeView, setActiveView] = useState<ViewState>('home');
  const [bookingStatus, setBookingStatus] = useState<"idle" | "booking" | "success">("idle");
  const [paymentIntent, setPaymentIntent] = useState<{ amount: number, module: 'Booking' | 'Lamp' | 'Event' | 'Queue', onPaid: (method: string, ref: string, proofFile: File | null) => void } | null>(null);
  const [paymentSubView, setPaymentSubView] = useState<'methods' | 'transfer' | 'customQR'>('methods');
  const [paymentRefInput, setPaymentRefInput] = useState('');
  const [checkoutProofFile, setCheckoutProofFile] = useState<File | null>(null);
  const [paymentConfig, setPaymentConfig] = useState<any>(null);
  const [paymentMethod, setPaymentMethod] = useState<string>('');
  const [customAmount, setCustomAmount] = useState<number>(100);
  const [viewPaymentInfo, setViewPaymentInfo] = useState<{ method: 'transfer' | 'customQR', recordId: string, recordType: 'Appointment' | 'LampRecord' | 'EventRegistration' } | null>(null);
  const [paymentRef, setPaymentRef] = useState<string>('');
  
  // AGI Chat States
  const [isAgiModalOpen, setIsAgiModalOpen] = useState(false);
  const [agiInput, setAgiInput] = useState("");
  const [agiIsThinking, setAgiIsThinking] = useState(false);
  const [chatHistory, setChatHistory] = useState<{role: 'user' | 'agi', text: string, action?: 'booking' | 'event'}[]>([
    { role: 'agi', text: '您好！這裡是您的個人助理。有什麼我可以幫您的嗎？' }
  ]);
  const [successInfo, setSuccessInfo] = useState<{title: string, message: string} | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Data states
  const [slots, setSlots] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [guestUser, setGuestUser] = useState<any | null>(null);
  const [guestFiles, setGuestFiles] = useState<any[]>([]);
  const [guestRecords, setGuestRecords] = useState<any[]>([]);
  const [guestAppointments, setGuestAppointments] = useState<any[]>([]);
  const [serviceDefinitions, setServiceDefinitions] = useState<any[]>([]);
  const [staff, setStaff] = useState<any[]>([]);
  const [queueEvents, setQueueEvents] = useState<any[]>([]);
  const [fileSearch, setFileSearch] = useState("");
  const [activeFileTab, setActiveFileTab] = useState<'photo' | 'video' | 'file'>('photo');
  const [latestNotification, setLatestNotification] = useState<TempleNotification | null>(null);
  const [activeNotifications, setActiveNotifications] = useState<TempleNotification[]>([]);
  const [expandedNotifIds, setExpandedNotifIds] = useState<Record<string, boolean>>({});
  const [isNotificationsModalOpen, setIsNotificationsModalOpen] = useState(false);
  const [activeQueueCount, setActiveQueueCount] = useState<number>(0);

  // Multi-step Booking States
  const [selectedService, setSelectedService] = useState<any>(null);
  const [selectedStaff, setSelectedStaff] = useState<any>(null);
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    try {
      return new Date().toISOString().split('T')[0];
    } catch {
      return '2025-01-01';
    }
  });
  const [bookingStep, setBookingStep] = useState<1 | 2 | 3>(1);
  const [recordsTab, setRecordsTab] = useState('全部');
  const [availableStaffList, setAvailableStaffList] = useState<any[]>([]);
  const [lampCategories, setLampCategories] = useState<any[]>([]);
  
  // Dynamic Calendar States
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());

  // Event & Modal States
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [detailContent, setDetailContent] = useState<any>(null);

  // Login States
  const [showLoginWall, setShowLoginWall] = useState(true);
  const [loginPhone, setLoginPhone] = useState("");
  const [loginName, setLoginName] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [phoneStatus, setPhoneStatus] = useState<"IDLE" | "NEW" | "NO_PASSWORD" | "HAS_PASSWORD">("IDLE");
  const [isCheckingPhone, setIsCheckingPhone] = useState(false);
  const [isLiffLoading, setIsLiffLoading] = useState(true);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const [bindLineId, setBindLineId] = useState("");

  // Profile Form States
  const [gregorianDate, setGregorianDate] = useState("");
  const [lunarResult, setLunarResult] = useState("");
  const [profileName, setProfileName] = useState("");
  const [profileEmail, setProfileEmail] = useState("");
  const [profilePassword, setProfilePassword] = useState("");
  const [profileAddress, setProfileAddress] = useState("");
  const [profileBirthHour, setProfileBirthHour] = useState("");
  const [serviceSettings, setServiceSettings] = useState<ServiceSettings | null>(null);
  const [templeAiUsage, setTempleAiUsage] = useState<any>(null);

  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState("");

  const [modifyModalOpen, setModifyModalOpen] = useState(false);
  const [selectedModifyAppId, setSelectedModifyAppId] = useState<number | null>(null);
  const [availableModifySlots, setAvailableModifySlots] = useState<any[]>([]);
  const [isModifying, setIsModifying] = useState(false);

  const handleSecureCheckIn = async (qrData: string) => {
    // 驗證格式: SECURE_CHECKIN_EVENTID_YYYY-MM-DD
    if (!qrData.startsWith('SECURE_CHECKIN_')) {
      alert("❌ 無效的報到 QR Code。");
      return;
    }

    const parts = qrData.split('_');
    const eventId = parts[2];
    const qrDate = parts[3];
    const today = new Date().toISOString().split('T')[0];

    if (qrDate !== today) {
      alert("❌ 報到連結已過期，請掃描現場最新的 QR Code。");
      return;
    }

    const res = await verifyQueueTicket(eventId, guestUser.phone);
    if (res.success) {
      setSuccessInfo({ title: "報到成功", message: "您已成功完成現場報到！\n請留意現場叫號與手機推播。" });
      refreshAllData(guestUser.phone);
    } else {
      alert(`❌ 報到失敗：${res.error || '查無有效掛號紀錄'}`);
    }
    setIsScanning(false);
  };

  
  const router = useRouter();
  useEffect(() => {
    if (forceLogin && guestUser && !isRedirecting) {
      setIsRedirecting(true);
      router.push(`/${templeId}`);
    }
  }, [forceLogin, guestUser, isRedirecting, router, templeId]);

  useEffect(() => {
    if (gregorianDate) {
      try {
        const [y, m, d] = gregorianDate.split('-');
        if (y && m && d) {
          const lunarInfo = Solar.fromYmd(parseInt(y), parseInt(m), parseInt(d)).getLunar();
          setLunarResult(`${lunarInfo.getYearInGanZhi()}年 ${lunarInfo.getMonthInChinese()}月 ${lunarInfo.getDayInChinese()}日`);
        }
      } catch (e) {
        // ignore invalid date
      }
    }
  }, [gregorianDate]);

  const initiatePayment = async (amount: number, module: any, onPaid: (method: string, ref?: string, proofFile?: File | null) => Promise<void>) => {
    if (amount === 0) {
      // 若金額為 0，直接當作免付款成功
      await onPaid('Free');
      setIsDetailModalOpen(false);
    } else {
      setPaymentIntent({ amount, module, onPaid: (method, ref, proofFile) => onPaid(method, ref, proofFile || null) });
    }
  };

  const handleOnlinePaymentRedirect = (method: string, orderId: string, amount: number) => {
    const returnUrl = encodeURIComponent(window.location.href);
    window.location.href = `/mock-gateway?orderId=${orderId}&amount=${amount}&method=${method}&returnUrl=${returnUrl}`;
  };
  const fileToBase64 = (file: File): Promise<string> => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });


  const handleCancelRecord = async (recordId: string, type: string) => {
    if (!confirm(`確定要取消此${type}嗎？`)) return;
    const { cancelServiceRecord } = await import('@/app/actions');
    const res = await cancelServiceRecord(recordId, type);
    if (res.success) {
      alert(`${type}已成功取消`);
      refreshAllData(guestUser?.phone || "");
    } else {
      alert(res.message || "取消失敗");
    }
  };

  const handleModifyClick = async (appId: number) => {
    setSelectedModifyAppId(appId);
    const slots = await fetchAvailableSlots();
    // Filter out past slots and already booked slots, maybe only show same service
    const app = guestAppointments.find(a => a.id === appId);
    if (app) {
      const filtered = slots.filter((s: any) => s.status === 'Available');
      setAvailableModifySlots(filtered);
    } else {
      setAvailableModifySlots(slots.filter((s: any) => s.status === 'Available'));
    }
    setModifyModalOpen(true);
  };

  const handleConfirmModify = async (newSlotId: number) => {
    if (!selectedModifyAppId) return;
    setIsModifying(true);
    const res = await modifyAppointment(selectedModifyAppId, newSlotId);
    setIsModifying(false);
    if (res.success) {
      alert("預約已成功更改");
      setModifyModalOpen(false);
      refreshAllData(guestUser?.phone || "");
    } else {
      alert(res.message || "更改失敗");
    }
  };

  useEffect(() => {
    const init = async () => {
      // 🔍 LIFF Auto Login & Capture LINE ID
      try {
        const liffId = process.env.NEXT_PUBLIC_LIFF_ID || "YOUR_LIFF_ID";
        if (liffId !== "YOUR_LIFF_ID") {
          await liff.init({ liffId });
          if (liff.isLoggedIn()) {
            const profile = await liff.getProfile();
            setBindLineId(profile.userId);
            const autoLoginRes = await liffAutoLogin(profile.userId);
            if (autoLoginRes.success && autoLoginRes.guest) {
              const user = autoLoginRes.guest;
              setGuestUser(user);
              setProfileName(user.name || "");
              setGregorianDate(user.birthday || "");
              setProfileEmail(user.email || "");
              setProfilePassword(user.password || "");
              setProfileAddress(user.address || "");
              setProfileBirthHour(user.birthHour || "");
              setShowLoginWall(false);
              refreshAllData(user.phone);
              setIsLiffLoading(false);
              return;
            }
          }
        }
      } catch (err) {
        console.warn("LIFF Init Error or not in LINE:", err);
      }
      setIsLiffLoading(false);

      if (typeof window !== "undefined") {
        const params = new URLSearchParams(window.location.search);
        const urlLineId = params.get("lineId") || params.get("line_id");
        if (urlLineId) {
          setBindLineId(urlLineId);
        }
        const urlPhone = params.get("phone") || params.get("mobile");
        if (urlPhone) {
          setLoginPhone(urlPhone);
        }
      }

      const pc = await fetchPaymentConfig();
      if (pc) setPaymentConfig(pc);
      
      const user = await getGuestUser();
      if (user) {
        setGuestUser(user);
        // Sync local states with central data
        setProfileName(user.name || "");
        setGregorianDate(user.birthday || "");
        setProfileEmail(user.email || "");
        setProfilePassword(user.password || "");
        setProfileAddress(user.address || "");
        setProfileBirthHour(user.birthHour || "");
        
        setShowLoginWall(false);
        refreshAllData(user.phone);
      }
      const [slotsData, eventsData, servicesData, staffData, qEventsData, lampsData, settingsData, latestNotif, activeNotifs, qCount, aiUsageData] = await Promise.all([
        fetchAvailableSlots(), 
        fetchEvents(),
        fetchServiceDefinitions(),
        fetchStaff(),
        fetchQueueEvents(),
        fetchLampCategories(),
        fetchServiceSettings(),
        fetchLatestNotificationForGuest(),
        fetchActiveNotificationsForGuest(),
        fetchActiveQueueCount(),
        fetchTempleAiUsage()
      ]);
      setSlots(slotsData);
      setEvents(eventsData);
      setServiceDefinitions(servicesData);
      setStaff(staffData);
      setQueueEvents(qEventsData);
      setLampCategories(lampsData);
      setServiceSettings(settingsData);
      setLatestNotification(latestNotif);
      setActiveNotifications(activeNotifs);
      setActiveQueueCount(qCount);
      setTempleAiUsage(aiUsageData);
      setSelectedDate(new Date().toISOString().split('T')[0]);
    };
    init();

    // 背景輪詢機制：每 10 秒更新一次推播通知與排隊人數，達成即時化 (Phase 2.2)
    const pollInterval = setInterval(async () => {
      try {
        const [latestNotif, activeNotifs, qCount] = await Promise.all([
          fetchLatestNotificationForGuest(),
          fetchActiveNotificationsForGuest(),
          fetchActiveQueueCount()
        ]);
        setLatestNotification(latestNotif);
        setActiveNotifications(activeNotifs);
        setActiveQueueCount(qCount);
      } catch (e) {
        console.error("Polling error:", e);
      }
    }, 10000);

    return () => clearInterval(pollInterval);
  }, []);

  const [guestRegistrations, setGuestRegistrations] = useState<any[]>([]);
  const [guestTickets, setGuestTickets] = useState<any[]>([]);
  const [guestLamps, setGuestLamps] = useState<any[]>([]);
  const [previewFile, setPreviewFile] = useState<any>(null);
  const [previewRecord, setPreviewRecord] = useState<any>(null);

  const refreshAllData = async (phone: string) => {
    const [apps, files, regs, tix, lamps, latestNotif, activeNotifs, qCount, records] = await Promise.all([
      fetchGuestAppointments(phone), 
      fetchGuestFiles(phone),
      fetchGuestRegistrations(phone),
      fetchGuestQueueTickets(phone),
      fetchGuestLampRecords(phone),
      fetchLatestNotificationForGuest(),
      fetchActiveNotificationsForGuest(),
      fetchActiveQueueCount(),
      fetchGuestRecords(phone)
    ]);
    setGuestAppointments(apps);
    setGuestFiles(files);
    setGuestRegistrations(regs);
    setGuestTickets(tix);
    setGuestLamps(lamps);
    setLatestNotification(latestNotif);
    setActiveNotifications(activeNotifs);
    setActiveQueueCount(qCount);
    setGuestRecords(records);
  };

  const handlePhoneNext = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!loginPhone || !/^09\d{8}$/.test(loginPhone)) {
      alert('請輸入有效的手機號碼 (10位數，09開頭)');
      return;
    }
    setIsCheckingPhone(true);
    try {
      const res = await checkPhoneStatus(loginPhone);
      setPhoneStatus(res.status as any);
      if (res.name) setLoginName(res.name);
    } catch (err) {
      alert("連線發生錯誤，請稍後再試");
    }
    setIsCheckingPhone(false);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (phoneStatus === "IDLE") return;
    if (phoneStatus === "NEW" && !loginName) {
      alert("首次註冊請填寫您的真實姓名");
      return;
    }
    if (!loginPassword) {
      alert("請輸入密碼");
      return;
    }
    setIsLoggingIn(true);
    
    // 正常登入流程
    const res = await guestLogin(loginPhone, loginPassword, loginName);
    if (res.success) {
      const user = res.fullGuest || { 
        phone: loginPhone, 
        name: res.guestName, 
        password: loginPassword,
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(res.guestName)}&background=B91C1C&color=fff` 
      };

      // 背景自動綁定 LINE ID (僅限尚未綁定任何 LINE ID 的信眾)
      if (bindLineId && !user.lineId) {
        user.lineId = bindLineId;
        await createOrUpdateGuest(user, loginPhone);
      }

      setGuestUser(user);
      setProfileName(user.name || "");
      setGregorianDate(user.birthday || "");
      setProfileEmail(user.email || "");
      setProfilePassword(user.password || "");
      setProfileAddress(user.address || "");
      setProfileBirthHour(user.birthHour || "");

      setShowLoginWall(false);
      refreshAllData(user.phone);
    } else {
      alert(res.error || "登入失敗，請確認資料後再試");
    }
    setIsLoggingIn(false);
  };



  const handleAgiSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agiInput.trim() || agiIsThinking) return;
    const query = agiInput;
    setAgiInput("");
    setChatHistory(prev => [...prev, { role: 'user', text: query }]);
    setAgiIsThinking(true);
    const res = await askAgiAssistant(query, chatHistory.length);
    setChatHistory(prev => [...prev, { role: 'agi', text: res.reply, action: res.suggestedAction }]);
    setAgiIsThinking(false);
  };

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatHistory, agiIsThinking]);

  useEffect(() => {
    if (activeView === 'queue') {
      fetchActiveQueueCount().then(c => setActiveQueueCount(c));
    }
  }, [activeView]);

  const renderDetailModal = () => {
    if (!isDetailModalOpen || !detailContent) return null;
    return (
      <div className="fixed inset-0 z-[110] flex items-end justify-center bg-black/60 animate-in fade-in duration-300">
        <div className="w-full max-w-md bg-white rounded-t-3xl p-6 space-y-6 animate-in slide-in-from-bottom duration-300">
          <div className="w-12 h-1.5 bg-gray-300 rounded-full mx-auto -mt-2 mb-2"></div>
          <div className="flex justify-between items-start">
            <div className="space-y-2">
              <h3 className="text-2xl font-bold text-gray-900 leading-tight">{detailContent.title}</h3>
              <div className="flex flex-wrap gap-2">
                <span className="bg-red-50 px-2 py-1 rounded text-xs font-bold text-red-700">{detailContent.category}</span>
                {detailContent.price && <span className="bg-amber-50 px-2 py-1 rounded text-xs font-bold text-amber-700">{detailContent.price}</span>}
              </div>
            </div>
            <button onClick={() => setIsDetailModalOpen(false)} className="p-2 text-gray-400 active:bg-gray-100 rounded-full transition-colors">✕</button>
          </div>
          
          {detailContent.description && (
            <div className="space-y-2">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">詳細資訊</p>
              <div className="text-gray-700 text-sm bg-gray-50 p-4 rounded-xl space-y-2">
                 {detailContent.description.split('\n').map((line: string, i: number) => <p key={i} className="leading-relaxed">{line}</p>)}
              </div>
            </div>
          )}

          {detailContent.precautions && (
            <div className="bg-amber-50 p-3 rounded-xl flex gap-3 items-start border border-amber-100 mt-4">
              <span className="text-amber-600 text-sm">💡</span>
              <div>
                <p className="text-[10px] font-bold text-amber-700 uppercase">注意事項</p>
                <div className="text-xs text-amber-800 mt-0.5 space-y-1">
                  {detailContent.precautions.split('\n').map((line: string, i: number) => <p key={i}>{line}</p>)}
                </div>
              </div>
            </div>
          )}

          {detailContent.onConfirm && (
            <button 
              onClick={() => {
                detailContent.onConfirm();
                setIsDetailModalOpen(false);
              }}
              className="btn-primary w-full py-4 mt-2"
            >
              確認辦理
            </button>
          )}
        </div>
      </div>
    );
  };

  const renderNotificationsModal = () => {
    if (!isNotificationsModalOpen) return null;

    const formatNotifDate = (isoString: string) => {
      const d = new Date(isoString);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const date = String(d.getDate()).padStart(2, '0');
      const hours = String(d.getHours()).padStart(2, '0');
      const minutes = String(d.getMinutes()).padStart(2, '0');
      return `${year}-${month}-${date} ${hours}:${minutes}`;
    };

    return (
      <div className="fixed inset-0 z-[110] flex items-end justify-center bg-black/60 animate-in fade-in duration-300">
        <div className="w-full max-w-md bg-white rounded-t-3xl p-6 space-y-5 animate-in slide-in-from-bottom duration-300 max-h-[85vh] flex flex-col">
          <div className="w-12 h-1.5 bg-gray-300 rounded-full mx-auto -mt-2 mb-1 shrink-0"></div>
          
          <div className="flex justify-between items-center shrink-0">
            <div>
              <h3 className="text-xl font-black text-gray-900 tracking-tight">📢 歷史公告與通知</h3>
              <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">Sanctuary Broadcaster Logs</p>
            </div>
            <button 
              onClick={() => setIsNotificationsModalOpen(false)} 
              className="w-8 h-8 flex items-center justify-center bg-gray-50 hover:bg-gray-100 active:scale-90 text-gray-400 hover:text-gray-600 rounded-full transition-all text-sm font-bold"
            >
              ✕
            </button>
          </div>

          <div className="flex-1 overflow-y-auto space-y-3 pr-1 py-1 custom-scrollbar">
            {activeNotifications.length === 0 ? (
              <div className="py-12 text-center space-y-2 opacity-30">
                <span className="text-3xl">📭</span>
                <p className="text-xs font-black uppercase tracking-widest text-gray-500">目前尚無歷史公告通知</p>
              </div>
            ) : (
              activeNotifications.map((notif) => {
                const isOpen = expandedNotifIds[notif.id] || false;
                return (
                  <div 
                    key={notif.id}
                    className="bg-gray-50/60 rounded-2xl border border-gray-150 overflow-hidden transition-all duration-300 hover:border-gray-200"
                  >
                    {/* Accordion Header */}
                    <div 
                      onClick={() => {
                        setExpandedNotifIds(prev => ({
                          ...prev,
                          [notif.id]: !prev[notif.id]
                        }));
                      }}
                      className="p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors select-none"
                    >
                      <div className="flex items-start gap-3 min-w-0 pr-2">
                        <span className="text-base shrink-0 mt-0.5">🔔</span>
                        <div className="min-w-0">
                          <h4 className="font-bold text-xs text-gray-800 tracking-tight leading-snug truncate">{notif.title}</h4>
                          <p className="text-[8px] font-bold text-gray-400 font-mono mt-0.5">{formatNotifDate(notif.sendTime)}</p>
                        </div>
                      </div>
                      <span className={`text-[10px] text-gray-400 font-black transition-transform duration-300 shrink-0 ${isOpen ? 'rotate-180' : ''}`}>
                        ▼
                      </span>
                    </div>

                    {/* Accordion Content */}
                    {isOpen && (
                      <div className="px-4 pb-4 pt-1 border-t border-gray-100 bg-white/50 animate-in slide-in-from-top-1 duration-300">
                        <div className="p-3 bg-white rounded-xl border border-gray-100 mt-2 text-xs text-gray-600 leading-relaxed font-semibold whitespace-pre-wrap">
                          {notif.content}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
          
          <button 
            onClick={() => setIsNotificationsModalOpen(false)}
            className="w-full bg-slate-900 text-white font-black py-3 rounded-xl text-xs tracking-widest hover:bg-amber-500 hover:text-slate-950 transition-all shrink-0 active:scale-98"
          >
            關閉視窗 CLOSE
          </button>
        </div>
      </div>
    );
  };

  // --- Intercept Feature Click ---
  const handleFeatureClick = (viewName: 'booking' | 'lighting' | 'queue' | 'events') => {
    if (!guestUser) return;
    if (!guestUser.address || !guestUser.birthday) {
      alert("請完善您的個人資料（出生日期與聯絡地址），才能使用預約與點燈等服務功能！");
      setActiveView('profile');
      return;
    }
    setActiveView(viewName);
  };

  // --- Sub-Renders ---

  const renderHome = () => {
    // 篩選未完成的項目
    const activeAppointment = guestAppointments.find(a => a.status === 'Confirmed' || a.status === 'Pending');
    const activeLamps = guestLamps.filter(l => l.status === 'Active' || l.status === 'Pending');
    const activeTicket = guestTickets.find(t => t.status === 'Pending' || t.status === 'Queuing' || t.status === 'Calling');
    const activeRegistration = guestRegistrations[0]; // 最新的活動報名

    const getRemainingDays = (expiryDateStr: string) => {
      const expiry = new Date(expiryDateStr);
      const now = new Date();
      expiry.setHours(0, 0, 0, 0);
      now.setHours(0, 0, 0, 0);
      const diffTime = expiry.getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays > 0 ? diffDays : 0;
    };

    return (
      <main className="max-w-md mx-auto min-h-screen pb-32">
        {/* Header Profile Section */}
        <div 
          className="bg-red-700 rounded-b-[2rem] p-6 pb-10 text-white shadow-md relative overflow-hidden"
          style={bannerUrl ? { backgroundImage: `url(${bannerUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}}
        >
          {bannerUrl && <div className="absolute inset-0 bg-black/40 z-0 pointer-events-none"></div>}
          <div className="absolute top-0 right-0 opacity-10 pointer-events-none z-0">
            <IconLotus className="w-48 h-48 -mt-10 -mr-10 text-white" />
          </div>
          <div className="flex justify-between items-center relative z-10">
            <div className="flex items-center gap-3">
              {logoUrl && (
                <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center overflow-hidden border border-white/30 shadow-lg">
                  <img src={logoUrl} alt="Logo" className="w-full h-full object-contain p-1" />
                </div>
              )}
              <div>
              <p className="text-xs text-red-200 font-medium mb-1">Premium Sanctuary</p>
              <h2 className="text-2xl font-bold">平安，{guestUser?.name}</h2>
            </div>
            </div>
            <div className="flex items-center gap-4">
              <button onClick={() => setIsScanning(true)} className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white active:scale-90 transition-all border border-white/20">
                 <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-6 h-6"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
              </button>
              <button onClick={() => setActiveView('profile')} className="w-14 h-14 rounded-full border-2 border-white/50 overflow-hidden bg-white/10">
                <img src={guestUser?.avatar || 'https://ui-avatars.com/api/?name=Guest'} className="w-full h-full object-cover" alt="User Avatar" />
              </button>
            </div>
          </div>
        </div>

        {/* Quick Action Card (Overlapping header) */}
        <div className="px-5 -mt-6 relative z-20">
          <div className="app-card p-5 flex items-center justify-between">
            <div className="flex items-center gap-4 overflow-hidden">
              <div className="w-12 h-12 bg-amber-50 rounded-full flex items-center justify-center text-amber-600 shrink-0">
                <IconBell />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold text-gray-900">最新動態</p>
                <p className="text-xs text-gray-500 mt-0.5 truncate max-w-[180px] md:max-w-xs font-medium">
                  {latestNotification ? latestNotification.title : '歡迎拜訪聖皇宮，祝您平安喜樂！'}
                </p>
              </div>
            </div>
            <button 
              onClick={() => {
                setIsNotificationsModalOpen(true);
              }}
              className="text-amber-600 font-bold text-sm bg-amber-50 px-3 py-1.5 rounded-lg hover:bg-amber-100 active:scale-95 transition-all shrink-0"
            >
              查看
            </button>
          </div>
        </div>

        {/* Main Service Grid */}
        <div className="px-5 mt-8">
          <h3 className="text-lg font-bold text-gray-900 mb-4 px-1">常用服務</h3>
          <div className="grid grid-cols-2 gap-4">
            <button onClick={() => handleFeatureClick('booking')} className="app-card p-6 flex flex-col items-center justify-center gap-3 active:bg-gray-50 transition-colors">
              <div className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center text-3xl text-red-600">📅</div>
              <span className="font-bold text-gray-900">預約</span>
            </button>
            
            <button onClick={() => handleFeatureClick('lighting')} className="app-card p-6 flex flex-col items-center justify-center gap-3 active:bg-gray-50 transition-colors">
              <div className="w-14 h-14 bg-amber-50 rounded-2xl flex items-center justify-center text-3xl text-amber-600"><IconCandle /></div>
              <span className="font-bold text-gray-900">點燈</span>
            </button>
            
            <button onClick={() => handleFeatureClick('queue')} className="app-card p-6 flex flex-col items-center justify-center gap-3 active:bg-gray-50 transition-colors">
              <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center text-3xl text-emerald-600">🎟️</div>
              <span className="font-bold text-gray-900">排隊</span>
            </button>
            
            <button onClick={() => handleFeatureClick('events')} className="app-card p-6 flex flex-col items-center justify-center gap-3 active:bg-gray-50 transition-colors">
              <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center text-3xl text-indigo-600"><IconFestive /></div>
              <span className="font-bold text-gray-900">活動</span>
            </button>
          </div>
        </div>

        {/* 信眾提醒中心 */}
        <div className="px-5 mt-8">
          <div className="flex justify-between items-center mb-4 px-1">
            <h3 className="text-lg font-bold text-gray-900">信眾提醒中心</h3>
            <button onClick={() => setActiveView('records')} className="text-sm font-bold text-red-600">查看全部</button>
          </div>
          
          <div className="space-y-3.5">
            {/* 1. 未完成預約 */}
            <div className="app-card overflow-hidden border-l-4 border-indigo-600 hover:shadow-md transition-all duration-300">
              <div className="p-4 flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-xl text-indigo-600">📅</div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start">
                    <span className="text-[10px] font-black text-indigo-600 tracking-wider uppercase">已預約</span>
                    {activeAppointment && (
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        activeAppointment.paymentStatus === 'Paid' 
                          ? 'bg-emerald-50 text-emerald-700' 
                          : 'bg-rose-50 text-rose-700'
                      }`}>
                        {activeAppointment.paymentMethod === 'Cash' 
                          ? (activeAppointment.paymentStatus === 'Paid' ? '標記已完成支付' : '現金支付: 未付款')
                          : (activeAppointment.paymentStatus === 'Paid' ? '標記已完成支付' : '未完成預約: 待付款/對帳')
                        }
                      </span>
                    )}
                  </div>
                  {activeAppointment ? (
                    <>
                      <h4 className="font-bold text-gray-900 text-sm mt-1 truncate">{activeAppointment.service}</h4>
                      <p className="text-[11px] text-gray-500 mt-0.5">{activeAppointment.date} {activeAppointment.time} • {activeAppointment.staff}</p>
                      <p className="text-[10px] font-bold text-amber-600 mt-1 uppercase">
                        {(!activeAppointment.amount && activeAppointment.paymentMethod !== 'Cash') ? '隨喜功德' : 
                         (activeAppointment.amount ? `${activeAppointment.amount === 0 ? '隨喜功德' : '結緣金'}: NT$ ${activeAppointment.amount}` : '現場付現')}
                      </p>
                      {activeAppointment.paymentStatus === 'Pending' && activeAppointment.paymentMethod === 'Cash' && (
                        <button
                          onClick={() => {
                            alert('本宮目前採取現金對帳，請於現場出示此預約紀錄並完成繳費。');
                          }}
                          className="mt-2 w-full py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-[10px] font-black uppercase tracking-widest transition-colors flex items-center justify-center gap-1"
                        >
                          💸 請至現場繳費核銷
                        </button>
                      )}
                      {activeAppointment.paymentStatus === 'Pending' && (activeAppointment.paymentMethod === 'transfer' || activeAppointment.paymentMethod === 'customQR') && (
                        <button onClick={() => setViewPaymentInfo({ method: activeAppointment.paymentMethod as any, recordId: activeAppointment.id.toString(), recordType: 'Appointment' })} className="mt-2 w-full py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-1 transition-colors">
                          ⌛ 等待對帳中 (點擊查看{activeAppointment.paymentMethod === 'transfer' ? '匯款資訊' : '付款條碼'}及上傳截圖)
                        </button>
                      )}
                    </>
                  ) : (
                    <p className="text-xs text-gray-400 font-bold mt-1">暫無未完成的預約服務</p>
                  )}
                </div>
              </div>
            </div>

            {/* 2. 正在點的燈 */}
            <div className="app-card overflow-hidden border-l-4 border-amber-500 hover:shadow-md transition-all duration-300">
              <div className="p-4 flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-xl text-amber-600 flex-shrink-0 mt-0.5">🕯️</div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-[10px] font-black text-amber-600 tracking-wider uppercase">正在點的燈</span>
                    {activeLamps.length > 0 && (
                      <span className="bg-amber-50 px-2 py-0.5 rounded-full text-[10px] font-bold text-amber-700">共 {activeLamps.length} 盞</span>
                    )}
                  </div>
                  {activeLamps.length > 0 ? (
                    <div className="space-y-3 mt-1">
                      {activeLamps.map((lamp, idx) => {
                        const daysLeft = getRemainingDays(lamp.expiryDate);
                        return (
                          <div key={lamp.id || idx} className={`${idx > 0 ? 'pt-2.5 border-t border-gray-100' : ''}`}>
                            <div className="flex justify-between items-center">
                              <h4 className="font-bold text-gray-900 text-sm truncate">
                                {lamp.categoryName} {lamp.guestName && lamp.guestName !== guestUser?.name && <span className="text-xs text-gray-500 font-normal ml-1">({lamp.guestName})</span>}
                              </h4>
                              <div className="flex items-center gap-1.5">
                                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${lamp.paymentStatus === 'Paid' ? 'text-emerald-600 bg-emerald-50' : 'text-rose-600 bg-rose-50'}`}>{lamp.paymentStatus === 'Paid' ? '已付款' : '待付款'}</span>
                                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${lamp.status === 'Pending' ? 'text-slate-500 bg-slate-100' : 'text-amber-600 bg-amber-50/50'}`}>{lamp.status === 'Pending' ? '等待安奉' : '安奉中'}</span>
                              </div>
                            </div>
                            <div className="flex justify-between items-center mt-1">
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-xs text-gray-400 font-bold mt-1">目前無正在安奉的燈位</p>
                  )}
                </div>
              </div>
            </div>

            {/* 3. 未完成排隊 */}
            <div className="app-card overflow-hidden border-l-4 border-emerald-500 hover:shadow-md transition-all duration-300">
              <div className="p-4 flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-xl text-emerald-600">🎟️</div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start">
                    <span className="text-[10px] font-black text-emerald-600 tracking-wider uppercase">未完成排隊</span>
                    {activeTicket && (
                      <span className="bg-emerald-50 px-2 py-0.5 rounded-full text-[10px] font-bold text-emerald-700">
                        {activeTicket.status === 'Calling' ? '叫號中' : activeTicket.status === 'Queuing' ? '排隊中' : '已登錄'}
                      </span>
                    )}
                  </div>
                  {activeTicket ? (
                    <>
                      <h4 className="font-bold text-gray-900 text-sm mt-1 truncate">{activeTicket.eventTitle}</h4>
                      <p className="text-[11px] text-gray-500 mt-0.5">持票號碼：{activeTicket.assignedNumber} {activeTicket.actualOrder ? `• 順位 ${activeTicket.actualOrder}` : ''}</p>
                    </>
                  ) : (
                    <p className="text-xs text-gray-400 font-bold mt-1">目前無正在排隊的現場掛號</p>
                  )}
                </div>
              </div>
            </div>

            {/* 4. 未參加活動 */}
            <div className="app-card overflow-hidden border-l-4 border-rose-500 hover:shadow-md transition-all duration-300">
              <div className="p-4 flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center text-xl text-rose-600">🏮</div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start">
                    <span className="text-[10px] font-black text-rose-500 tracking-wider uppercase">未參加活動</span>
                    {activeRegistration && (
                      <span className="bg-rose-50 px-2 py-0.5 rounded-full text-[10px] font-bold text-rose-700">已報名</span>
                    )}
                  </div>
                  {activeRegistration ? (
                    <>
                      <h4 className="font-bold text-gray-900 text-sm mt-1 truncate">{activeRegistration.title}</h4>
                      <p className="text-[11px] text-gray-500 mt-0.5">活動時間：{activeRegistration.timestamp}</p>
                    </>
                  ) : (
                    <p className="text-xs text-gray-400 font-bold mt-1">目前無即將參加的法會活動</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>


      </main>
    );
  };

  const renderPersonalSpace = () => (
    <div className="min-h-screen pb-32">
      <TopNav title="個人空間" onBack={() => setActiveView('home')} />
      <div className="max-w-md mx-auto px-5 pt-6 space-y-6">
        {/* Search Bar */}
        <div className="bg-gray-100 p-3 rounded-xl flex items-center px-4 border border-gray-200">
          <span className="text-gray-400 text-lg mr-3">🔍</span>
          <input 
            type="text" 
            placeholder="搜尋檔案名稱或日期..." 
            value={fileSearch}
            onChange={(e) => setFileSearch(e.target.value)}
            className="flex-1 bg-transparent border-none font-bold text-gray-900 outline-none placeholder:text-gray-400"
          />
        </div>

        {/* Category Tabs */}
        <div className="flex bg-gray-100 p-1 rounded-xl">
          {(['photo', 'video', 'file'] as const).map(tab => (
            <button 
              key={tab}
              onClick={() => setActiveFileTab(tab)}
              className={`flex-1 py-2.5 rounded-lg font-bold text-sm transition-colors ${
                activeFileTab === tab ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'
              }`}
            >
              {tab === 'photo' ? '照片' : tab === 'video' ? '影音' : '檔案'}
            </button>
          ))}
        </div>

        {/* File List */}
        <div className="grid grid-cols-1 gap-4">
          {guestFiles.filter(f => f.type === activeFileTab && (f.name.includes(fileSearch) || f.folder.includes(fileSearch))).map(file => (
            <div 
              key={file.id} 
              onClick={() => {
                if (file.type === 'file' && file.name.endsWith('.pdf')) {
                  const possibleServiceType = file.name.split('_')[0];
                  const matchedRecord = guestRecords.find(r => r.serviceType === possibleServiceType);
                  if (matchedRecord) {
                    setPreviewRecord(matchedRecord);
                    return;
                  }
                }
                setPreviewFile(file);
              }}
              className="app-card p-4 flex items-center gap-4 cursor-pointer hover:border-red-200 hover:shadow-md transition-all active:scale-[0.99]"
            >
              <div className="w-16 h-16 bg-gray-100 rounded-xl overflow-hidden flex-shrink-0">
                {file.type === 'photo' ? <img src={file.url} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-2xl">{file.type === 'video' ? '🎬' : '📄'}</div>}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-gray-900 truncate">{file.name}</h4>
                <p className="text-xs text-gray-500 mt-1">{file.folder}</p>
                <div className="mt-2">
                  <span className={`px-2 py-0.5 rounded text-xs font-bold ${file.uploadedBy === 'Temple' ? 'bg-red-50 text-red-700' : 'bg-gray-100 text-gray-600'}`}>
                    {file.uploadedBy === 'Temple' ? '宮廟傳承' : '個人收藏'}
                  </span>
                </div>
              </div>
              <button 
                onClick={(e) => { e.stopPropagation(); alert(`已複製連結：${file.url}`); }}
                className="p-2 text-gray-400 hover:text-gray-950 font-bold"
              >
                🔗
              </button>
            </div>
          ))}

          <input 
            type="file" 
            id="believer-file-upload" 
            className="hidden" 
            accept={activeFileTab === 'photo' ? 'image/*' : activeFileTab === 'video' ? 'video/*' : '*/*'}
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file || !guestUser?.phone) return;
              
              // Simulate uploading
              const mockUrl = `/uploads/${Date.now()}_${file.name}`;
              await uploadCustomerMedia(guestUser.phone, mockUrl, activeFileTab, 'Member', file.name);
              
              // Refresh files list
              const updatedFiles = await fetchGuestFiles(guestUser.phone);
              setGuestFiles(updatedFiles);
              alert(`✨ 檔案「${file.name}」已成功上傳至您的個人空間！`);
            }}
          />
          <label 
            htmlFor="believer-file-upload"
            className="w-full py-6 bg-red-50/50 hover:bg-red-50 border-2 border-dashed border-red-200 text-red-700 font-bold rounded-2xl flex flex-col items-center justify-center cursor-pointer transition-colors active:scale-98"
          >
            <span className="text-xl">📤</span>
            <span className="text-sm mt-1">+ 上傳新的{activeFileTab === 'photo' ? '照片' : activeFileTab === 'video' ? '影音' : '檔案'}</span>
          </label>
        </div>
      </div>
    </div>
  );

  const renderRecordPreviewModal = () => {
    if (!previewRecord) return null;
    return (
      <div className="fixed inset-0 z-[600] bg-black/80 backdrop-blur-md flex flex-col items-center justify-center p-4 animate-in fade-in duration-300">
        <div className="bg-white w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300 flex flex-col max-h-[85vh]">
          <header className="px-5 py-4 border-b border-gray-100 flex items-center justify-between bg-red-50/50">
            <div className="min-w-0 flex-1">
              <h3 className="font-bold text-gray-900 truncate text-sm">{previewRecord.serviceType}</h3>
              <p className="text-[10px] text-gray-400 font-bold uppercase mt-0.5">案卷紀錄摘要 | {previewRecord.date}</p>
            </div>
            <button 
              onClick={() => setPreviewRecord(null)} 
              className="p-2 text-gray-400 hover:text-gray-900 rounded-full active:bg-gray-100"
            >
              ✕
            </button>
          </header>
          
          <div className="flex-1 overflow-y-auto p-5 bg-white space-y-4">
             {Object.entries(previewRecord.values || {}).map(([label, val]) => (
                <div key={label} className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">{label}</label>
                   <p className="text-sm font-bold text-slate-900 leading-relaxed">{String(val)}</p>
                </div>
             ))}
             {(!previewRecord.values || Object.keys(previewRecord.values).length === 0) && (
                <div className="py-10 text-center opacity-30 font-black italic text-sm">此案卷無詳細內容資料</div>
             )}
          </div>

          <div className="px-5 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
             <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">歸檔人：{previewRecord.staffName}</span>
             </div>
             <div className="flex gap-2">
               <button onClick={() => {
                 const pdfWindow = window.open('', '', 'width=800,height=600');
                 if (!pdfWindow) { alert('請允許彈出視窗以啟用 PDF 下載功能'); return; }

                 const content = Object.entries(previewRecord.values || {}).map(([k, v]) => '<div style="margin-bottom: 20px; border-bottom: 1px solid #eee; padding-bottom: 10px;"><strong>' + k + '</strong><p style="margin-top: 5px;">' + v + '</p></div>').join('');
                 
                 const htmlString = '<html lang="zh-TW"><head><title>' + previewRecord.serviceType + ' - 下載</title>' +
                   '<style>' +
                   'body { font-family: \\\'Microsoft JhengHei\\\', sans-serif; color: #333; margin: 0; padding: 40px; background: white; } ' +
                   '.page-container { position: relative; width: 100%; max-width: 800px; margin: 0 auto; box-sizing: border-box; } ' +
                   'h1 { text-align: center; border-bottom: 2px solid #000; padding-bottom: 15px; margin-bottom: 30px; font-size: 28px; } ' +
                   '</style>' +
                   '<script src="https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js"></script>' +
                   '</head><body>' +
                   '<div id="pdf-content" class="page-container">' +
                   '<h1>' + previewRecord.serviceType + '</h1>' +
                   '<div style="display: flex; justify-content: space-between; font-weight: bold; margin-bottom: 20px;">' +
                   '<span>歸檔日期: ' + previewRecord.date + '</span>' +
                   '</div>' +
                   '<div style="position: relative; z-index: 10;">' + content + '</div>' +
                   '</div>';

                 const scriptStr = '<script>' +
                   'window.onload = function() { ' +
                   '  const element = document.getElementById("pdf-content"); ' +
                   '  html2pdf().set({ ' +
                   '    margin: 10, ' +
                   '    filename: "' + previewRecord.serviceType + '_表單紀錄.pdf", ' +
                   '    image: { type: "jpeg", quality: 0.98 }, ' +
                   '    html2canvas: { scale: 2, useCORS: true }, ' +
                   '    jsPDF: { unit: "mm", format: "a4", orientation: "portrait" } ' +
                   '  }).from(element).save().then(() => { setTimeout(() => window.close(), 1500); }); ' +
                   '}; ' +
                   '</script></body></html>';
                 
                 pdfWindow.document.write(htmlString + scriptStr);
                 pdfWindow.document.close();
               }} className="px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl text-[10px] font-bold">下載 PDF</button>
               <button onClick={() => setPreviewRecord(null)} className="px-4 py-2 bg-slate-900 text-white rounded-xl text-[10px] font-bold">關閉</button>
             </div>
          </div>
        </div>
      </div>
    );
  };

  const renderPreviewModal = () => {
    if (!previewFile) return null;
    return (
      <div className="fixed inset-0 z-[600] bg-black/80 backdrop-blur-md flex flex-col items-center justify-center p-4 animate-in fade-in duration-300">
        <div className="bg-white w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300 flex flex-col max-h-[80vh]">
          <header className="px-5 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
            <div className="min-w-0 flex-1">
              <h3 className="font-bold text-gray-900 truncate text-sm">{previewFile.name}</h3>
              <p className="text-[10px] text-gray-400 font-bold uppercase mt-0.5">{previewFile.type === 'photo' ? '現場祭祀相片' : previewFile.type === 'video' ? '消災祈福影音' : '信眾專屬檔案'}</p>
            </div>
            <button 
              onClick={() => setPreviewFile(null)} 
              className="p-2 text-gray-400 hover:text-gray-900 rounded-full active:bg-gray-100"
            >
              ✕
            </button>
          </header>
          
          <div className="flex-1 overflow-y-auto p-5 flex flex-col items-center justify-center min-h-[260px] bg-white">
            {previewFile.type === 'photo' ? (
              <img 
                src={previewFile.url} 
                className="max-w-full max-h-[40vh] object-contain rounded-2xl shadow-sm border border-gray-100" 
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1543884149-bc91b61972ec?auto=format&fit=crop&q=80";
                }}
              />
            ) : previewFile.type === 'video' ? (
              <div className="w-full aspect-video rounded-2xl overflow-hidden bg-slate-900 border border-slate-800 shadow-sm">
                <video 
                  src={previewFile.url} 
                  controls 
                  autoPlay
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    (e.target as HTMLVideoElement).src = "https://assets.mixkit.co/videos/preview/mixkit-worship-hands-raised-in-church-41716-large.mp4";
                  }}
                />
              </div>
            ) : (
              <div className="w-full bg-slate-50 border border-slate-200/80 rounded-2xl p-4 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="text-3xl">📄</div>
                  <div className="min-w-0 flex-1">
                    <h4 className="font-bold text-gray-900 text-xs truncate">{previewFile.name}</h4>
                    <p className="text-[10px] text-gray-400 mt-0.5">{previewFile.folder}</p>
                  </div>
                </div>
                <div className="border-t border-slate-200/60 pt-3 space-y-2">
                  <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-xs">
                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1">信眾案卡憑證</p>
                    <p className="text-[11px] text-gray-600 leading-relaxed font-mono">
                      【聖皇宮 數位憑證專用】<br/>
                      歸檔手機：{previewFile.phone}<br/>
                      歸檔編號：{previewFile.id}<br/>
                      同步戳記：{new Date().toLocaleDateString('zh-TW')}<br/>
                      執事法師加持確認，原件完好無損。
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          <footer className="px-5 py-4 border-t border-gray-100 bg-gray-50 flex gap-3">
            <button 
              onClick={() => {
                const link = document.createElement('a');
                link.href = previewFile.url;
                link.download = previewFile.name;
                link.target = '_blank';
                link.click();
              }}
              className="flex-1 py-2.5 bg-red-700 hover:bg-red-800 text-white rounded-xl font-bold text-xs uppercase tracking-widest transition-colors shadow-sm active:scale-95 text-center"
            >
              📥 下載/開啟原檔
            </button>
          </footer>
        </div>
      </div>
    );
  };

  const renderAllRecords = () => {
    const sanitizeUrl = (url?: string | null) => url?.startsWith('blob:') ? null : url;
    const allRecords = [
      ...guestAppointments.map(a => ({ ...a, type: '預約', icon: '📅', color: 'text-indigo-600', bg: 'bg-indigo-50', time: `${a.date} ${a.time}`, rawTime: `${a.date}T${a.time}` })),
      ...guestRegistrations.map(r => {
        const evt = events.find(e => e.id === r.eventId);
        return { ...r, type: '活動', icon: '🏮', color: 'text-red-600', bg: 'bg-red-50', service: r.title, time: r.timestamp, rawTime: r.timestamp, staff: null, precautions: evt?.precautions };
      }),
      ...guestTickets.map(t => ({ ...t, type: '排隊', icon: '🎟️', color: 'text-emerald-600', bg: 'bg-emerald-50', service: t.eventTitle, time: t.scannedAt || '尚未核銷', rawTime: t.scannedAt, staff: '現場候位' })),
      ...guestLamps.map(l => {
        const remaining = Math.ceil((new Date(l.expiryDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
        return { 
          ...l,
          paymentProofUrl: sanitizeUrl(l.paymentProofUrl),
          type: '點燈', 
          icon: '🕯️', 
          color: 'text-amber-600', 
          bg: 'bg-amber-50',
          service: l.categoryName, 
          time: `${l.startDate} ~ ${l.expiryDate}`, 
          rawTime: l.startDate,
          staff: '本宮法事',
          remaining: remaining > 0 ? remaining : 0,
          status: l.paymentStatus === 'Unpaid' ? 'Unpaid' : (l.status === 'Active' ? '生效中' : (l.status === 'Pending' ? 'WaitingLamp' : l.status))
        };
      })
    ].sort((a, b) => b.rawTime?.localeCompare(a.rawTime || '') || 0);

    const filtered = recordsTab === '全部' ? allRecords : allRecords.filter(r => r.type === recordsTab);

    const getDeadlineInfo = (record: any) => {
      if (record.type === '點燈') return null;
      if (record.status !== 'Pending' && record.status !== 'Confirmed' && record.status !== 'Queuing' && record.status !== 'Unpaid') return null;
      if (!serviceSettings) return null;
      
      let recordDate = new Date();
      if (record.type === '預約' || record.type === '活動') {
         recordDate = new Date(record.rawTime);
      }
      
      if (isNaN(recordDate.getTime())) return null;

      const cancelDeadline = record.type === '排隊' ? new Date(new Date().getTime() + 1000000000) : new Date(recordDate.getTime() - serviceSettings.cancelHoursBefore * 60 * 60 * 1000);
      const modifyDeadline = new Date(recordDate.getTime() - serviceSettings.modifyHoursBefore * 60 * 60 * 1000);
      
      return { cancelDeadline, modifyDeadline };
    };

    return (
      <div className="min-h-screen pb-32">
        <TopNav title="信眾提醒中心" onBack={() => setActiveView('home')} />
        <div className="max-w-md mx-auto px-5 pt-6 space-y-6">
          {/* Categories Tab */}
          <div className="flex overflow-x-auto no-scrollbar gap-2 pb-2">
            {['全部', '預約', '活動', '排隊', '點燈'].map(cat => (
              <button 
                key={cat} 
                onClick={() => setRecordsTab(cat)}
                className={`whitespace-nowrap px-5 py-2 rounded-full font-bold text-sm transition-colors border ${
                  recordsTab === cat ? 'bg-red-700 text-white border-red-700' : 'bg-white text-gray-600 border-gray-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="space-y-4">
            {filtered.length === 0 ? (
              <div className="py-16 text-center app-card">
                <div className="text-5xl opacity-20 mb-4">📜</div>
                <p className="text-gray-500 font-bold text-sm">目前尚無相關紀錄</p>
              </div>
            ) : filtered.map((record, idx) => {
              const deadlines = getDeadlineInfo(record);
              const now = new Date();
              const canCancel = deadlines && (serviceSettings?.allowCancel !== false) && now < deadlines.cancelDeadline;
              const canModify = deadlines && (serviceSettings?.allowModify !== false) && record.type === '預約' && now < deadlines.modifyDeadline;

              return (
                <div key={idx} className="app-card p-5 space-y-4">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${record.bg} ${record.color}`}>{record.icon}</div>
                      <div>
                        <p className="text-xs font-bold text-gray-500 mb-0.5">{record.type}</p>
                        <h3 className="text-base font-bold text-gray-900 leading-tight">
                          {record.service} {record.type === '點燈' && record.guestName && record.guestName !== guestUser?.name && <span className="text-sm text-gray-500 font-normal ml-1">({record.guestName})</span>}
                        </h3>
                      </div>
                    </div>
                    <span className={`px-2 py-1 rounded text-xs font-bold ${
                      record.status === 'WaitingLamp' ? 'bg-slate-100 text-slate-500' :
                      record.status === 'Pending' || record.status === 'Confirmed' ? 'bg-amber-50 text-amber-600' :
                      record.status === 'Arrived' ? 'bg-emerald-100 text-emerald-700' :
                      record.status === 'Unpaid' ? 'bg-rose-50 text-rose-600' :
                      record.status === '生效中' ? 'bg-emerald-50 text-emerald-600' :
                      record.status === 'Completed' || record.status === 'Paid' ? 'bg-green-50 text-green-600' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      {record.status === 'WaitingLamp' ? '等待安奉' :
                       record.status === 'Pending' || record.status === 'Confirmed' ? '已預約' : 
                       record.status === 'Arrived' ? '已到場' :
                       record.status === 'Unpaid' ? '待付款' :
                       record.status === 'Completed' || record.status === 'Paid' ? '已完成' : 
                       record.status === 'Queuing' ? '現場候位' : record.status}
                    </span>
                  </div>
                  
                  <div className="bg-gray-50 p-4 rounded-xl space-y-3">
                    {record.type !== '點燈' && (
                       <div className="flex items-center gap-3">
                         <span className="text-gray-400">📅</span>
                         <div>
                            <p className="text-xs text-gray-500 font-bold">時間與日期</p>
                            <p className="text-gray-900 font-bold text-sm">{record.time}</p>
                         </div>
                       </div>
                    )}
                    {(record.type === '點燈' || (record.staff && record.type !== '活動')) && (
                      <div className="flex items-center gap-3">
                        <span className="text-gray-400">{record.type === '點燈' ? '⏳' : '👤'}</span>
                        <div>
                           <p className="text-xs text-gray-500 font-bold">{record.type === '點燈' ? '期限狀態' : '服務人員'}</p>
                           <p className="text-gray-900 font-bold text-sm">
                              {record.type === '點燈' ? (record.remaining <= 0 ? '已屆期' : record.status === 'WaitingLamp' || record.status === 'Pending' ? '等待安奉' : '安奉中') : record.staff}
                           </p>
                        </div>
                      </div>
                    )}
                  </div>
                  {record.precautions && (
                     <div className="bg-amber-50 p-3 rounded-xl flex gap-3 items-start border border-amber-100 mt-2">
                       <span className="text-amber-600 text-sm">💡</span>
                       <div>
                         <p className="text-[10px] font-bold text-amber-700 uppercase">注意事項</p>
                         <p className="text-xs text-amber-800 mt-0.5 whitespace-pre-line">{record.precautions}</p>
                       </div>
                     </div>
                  )}
                  {record.type === '預約' && record.amount !== undefined && record.amount !== null && (
                    <div className="bg-gray-50 p-4 rounded-xl mt-2 flex items-center gap-3">
                      <span className="text-gray-400">💰</span>
                      <div>
                         <p className="text-xs text-gray-500 font-bold">結緣金額</p>
                         <p className="text-gray-900 font-bold text-sm">
                            ${record.amount}
                         </p>
                      </div>
                    </div>
                  )}

                  {(record.paymentProofUrl || record.paymentRef) && (
                    <div className="space-y-2 pt-2 mt-2 border-t border-slate-100">
                      {record.paymentRef && (
                         <div className="flex items-center gap-2 px-3 py-2 bg-indigo-50 text-indigo-700 rounded-xl text-[11px] font-black tracking-widest w-full justify-center">
                           <span>💳</span> 匯款後五碼：{record.paymentRef}
                         </div>
                      )}
                      {/* Always show preview if proof exists */}
                      {record.paymentProofUrl && (
                        <button onClick={() => setPreviewFile({ type: 'photo', url: record.paymentProofUrl, name: '匯款截圖', folder: '付款憑證', phone: guestUser?.phone, id: record.id.toString() })} className="w-full py-2.5 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-xl text-[11px] font-black tracking-widest flex items-center justify-center gap-2 transition-colors">
                          <span>👁️</span> 查看已上傳的截圖
                        </button>
                      )}
                    </div>
                  )}

                  {/* 
                    TEMPORARILY DISABLED BY TEMPLE: 
                    deadlines && (serviceSettings?.allowCancel !== false || serviceSettings?.allowModify !== false) && ...
                  */}
                  {false && deadlines && (serviceSettings?.allowCancel !== false || serviceSettings?.allowModify !== false) && (
                    <div className="pt-2 space-y-2">
                      <div className="flex justify-between text-[10px] font-bold">
                        {serviceSettings?.allowCancel !== false && (
                          <span className={canCancel ? 'text-gray-500' : 'text-red-400'}>
                            最晚取消：{deadlines.cancelDeadline.toLocaleString('zh-TW', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </span>
                        )}
                        {serviceSettings?.allowModify !== false && (
                          <span className={canModify ? 'text-gray-500' : 'text-red-400'}>
                            最晚更改：{deadlines.modifyDeadline.toLocaleString('zh-TW', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </span>
                        )}
                      </div>
                      <div className="flex gap-2">
                        {record.type === '預約' && serviceSettings?.allowModify !== false && (
                          <button 
                            onClick={() => handleModifyClick(record.id)}
                            disabled={!canModify}
                            className={`flex-1 py-2 rounded-lg text-xs font-bold transition-colors ${canModify ? 'bg-white border border-gray-200 text-gray-700 active:bg-gray-50' : 'bg-gray-50 text-gray-300 border border-gray-100 cursor-not-allowed'}`}
                          >
                            更改預約
                          </button>
                        )}
                        {serviceSettings?.allowCancel !== false && (
                          <button 
                            onClick={() => handleCancelRecord(record.id, record.type)}
                            disabled={!canCancel}
                            className={`flex-1 py-2 rounded-lg text-xs font-bold transition-colors ${canCancel ? 'bg-red-50 border border-red-100 text-red-600 active:bg-red-100' : 'bg-gray-50 text-gray-300 border border-gray-100 cursor-not-allowed'}`}
                          >
                            取消{record.type}
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  const renderPaymentInfoModal = () => {
    if (!viewPaymentInfo) return null;
    return (
      <div className="fixed inset-0 z-[450] bg-black/60 flex flex-col items-center justify-center p-4 animate-in fade-in duration-300">
        <div className="bg-white w-full max-w-sm rounded-3xl p-6 flex flex-col space-y-6 shadow-2xl animate-in zoom-in-95 duration-300">
          <div className="text-center space-y-2">
            <h3 className="text-xl font-black text-gray-900 italic tracking-tighter">
              {viewPaymentInfo.method === 'transfer' ? '匯款資訊與上傳截圖' : '付款條碼與上傳截圖'}
            </h3>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Payment Information</p>
          </div>
          
          {viewPaymentInfo.method === 'transfer' && (
            <div className="bg-amber-50 p-4 rounded-2xl border border-amber-200 space-y-3">
               <div className="flex justify-between items-center border-b border-amber-200/50 pb-2">
                  <span className="text-[10px] font-bold text-amber-700/70">銀行代碼</span>
                  <span className="text-sm font-black text-amber-900">{paymentConfig?.customTransfer?.bankCode}</span>
               </div>
               <div className="flex justify-between items-center border-b border-amber-200/50 pb-2">
                  <span className="text-[10px] font-bold text-amber-700/70">收款帳號</span>
                  <span className="text-sm font-black text-amber-900 font-mono tracking-wider">{paymentConfig?.customTransfer?.accountNo}</span>
               </div>
               <div className="flex justify-between items-center border-b border-amber-200/50 pb-2">
                  <span className="text-[10px] font-bold text-amber-700/70">戶名</span>
                  <span className="text-sm font-black text-amber-900">{paymentConfig?.customTransfer?.accountName}</span>
               </div>
               <div className="flex justify-between items-center">
                  <span className="text-[10px] font-bold text-amber-700/70">銀行名稱</span>
                  <span className="text-xs font-black text-amber-900">{paymentConfig?.customTransfer?.bankName}</span>
               </div>
            </div>
          )}

          {viewPaymentInfo.method === 'customQR' && (
            <div className="bg-pink-50 p-4 rounded-2xl border border-pink-200 flex flex-col items-center justify-center text-center space-y-4">
               {paymentConfig?.customQR?.qrImageUrl ? (
                  <img src={paymentConfig.customQR.qrImageUrl} alt="QR Code" className="max-w-[200px] rounded-xl shadow-sm" />
               ) : (
                  <p className="text-xs text-pink-400">尚未設定條碼圖片</p>
               )}
               <p className="text-xs font-bold text-pink-800">{paymentConfig?.customQR?.description || '請掃描 QR Code 付款'}</p>
            </div>
          )}

          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
             <p className="text-xs font-bold text-slate-700 text-center">完成付款後，請上傳您的匯款截圖以便廟方對帳</p>
             <input 
               type="file" 
               accept="image/*"
               className="hidden"
               id="payment-proof-upload"
               onChange={async (e) => {
                 const file = e.target.files?.[0];
                 if (!file || !guestUser?.phone) return;
                 setIsLoading(true);
                 try {
                   const reader = new FileReader();
                   reader.onloadend = async () => {
                     const base64Url = reader.result as string;
                     const { uploadPaymentProof } = await import('@/app/actions_payment_proof');
                     await uploadPaymentProof(viewPaymentInfo.recordId, viewPaymentInfo.recordType, base64Url, guestUser.phone);
                     alert('✅ 匯款截圖已成功上傳！廟方將盡快為您對帳。');
                     setViewPaymentInfo(null);
                     refreshAllData(guestUser.phone);
                     setIsLoading(false);
                   };
                   reader.readAsDataURL(file);
                 } catch (err) {
                   alert('⚠️ 上傳失敗，請重試');
                   setIsLoading(false);
                 }
               }}
             />
             <label 
               htmlFor="payment-proof-upload" 
               className="w-full py-3 bg-indigo-600 text-white rounded-xl font-black text-xs hover:bg-indigo-700 shadow-md transition-colors cursor-pointer flex items-center justify-center gap-2"
             >
               <span>📸</span> 上傳付款截圖
             </label>
          </div>

          <button onClick={() => setViewPaymentInfo(null)} className="w-full py-3 bg-slate-900 text-white rounded-xl font-black text-xs hover:bg-slate-800 shadow-md transition-colors">關閉</button>
        </div>
      </div>
    );
  };

  const renderPaymentModal = () => {
    if (!paymentIntent) return null;
    return (
      <div className="fixed inset-0 z-[400] bg-black/60 flex flex-col items-center justify-end p-0 sm:justify-center sm:p-6 animate-in fade-in duration-300">
        <div className="bg-white w-full max-w-sm rounded-t-[40px] sm:rounded-[40px] p-8 flex flex-col space-y-8 shadow-2xl animate-in slide-in-from-bottom duration-500">
          <div className="text-center space-y-2">
            <h3 className="text-2xl font-black text-gray-900 italic tracking-tighter">確認預約支付</h3>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Payment Gateway</p>
          </div>
          
          <div className="bg-slate-50 p-6 rounded-[30px] border-2 border-slate-100 flex flex-col items-center justify-center space-y-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">應付總額</span>
            <div className="flex items-center gap-1">
              <span className="text-slate-400 font-bold">NT$</span>
              <span className="text-4xl font-black text-slate-900">{paymentIntent.amount}</span>
            </div>
          </div>

          {paymentSubView === 'methods' && (
            <div className="grid grid-cols-2 gap-4">
               {paymentConfig?.thirdParty?.enabled !== false && 
                 ((paymentIntent.module === 'Booking' && paymentConfig?.thirdParty?.allowBooking !== false) ||
                  (paymentIntent.module === 'Lamp' && paymentConfig?.thirdParty?.allowLamp !== false) ||
                  (paymentIntent.module === 'Event' && paymentConfig?.thirdParty?.allowEvent !== false) ||
                  (paymentIntent.module === 'Queue' && paymentConfig?.thirdParty?.allowQueue !== false)) && (
                 <button onClick={async () => { 
                   await paymentIntent.onPaid('ecpay', ''); 
                   setPaymentIntent(null); 
                   setPaymentSubView('methods');
                   setPaymentRefInput('');
                   setIsDetailModalOpen(false); 
                 }} className="col-span-2 py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl hover:bg-indigo-600 transition-all flex items-center justify-center gap-2">
                   💳 信用卡支付
                 </button>
               )}
               
               {paymentConfig?.linePay?.enabled !== false && 
                 ((paymentIntent.module === 'Booking' && paymentConfig?.linePay?.allowBooking !== false) ||
                  (paymentIntent.module === 'Lamp' && paymentConfig?.linePay?.allowLamp !== false) ||
                  (paymentIntent.module === 'Event' && paymentConfig?.linePay?.allowEvent !== false) ||
                  (paymentIntent.module === 'Queue' && paymentConfig?.linePay?.allowQueue !== false)) && (
                 <button onClick={async () => { 
                   await paymentIntent.onPaid('linepay', ''); 
                   setPaymentIntent(null); 
                   setPaymentSubView('methods');
                   setPaymentRefInput('');
                   setIsDetailModalOpen(false); 
                 }} className="py-4 bg-[#06C755] text-white rounded-2xl font-black text-xs shadow-md active:scale-95 transition-transform flex items-center justify-center gap-2">
                   LINE Pay
                 </button>
               )}

               {paymentConfig?.customTransfer?.enabled !== false && 
                 ((paymentIntent.module === 'Booking' && paymentConfig?.customTransfer?.allowBooking !== false) ||
                  (paymentIntent.module === 'Lamp' && paymentConfig?.customTransfer?.allowLamp !== false) ||
                  (paymentIntent.module === 'Event' && paymentConfig?.customTransfer?.allowEvent !== false) ||
                  (paymentIntent.module === 'Queue' && paymentConfig?.customTransfer?.allowQueue !== false)) && (
                 <button onClick={() => setPaymentSubView('transfer')} className="py-4 bg-slate-100 text-slate-600 hover:text-slate-900 rounded-2xl font-black text-xs shadow-sm border border-slate-200 active:scale-95 transition-transform flex items-center justify-center gap-2">
                   🏦 轉帳匯款
                 </button>
               )}

               {paymentConfig?.customQR?.enabled !== false && 
                 ((paymentIntent.module === 'Booking' && paymentConfig?.customQR?.allowBooking !== false) ||
                  (paymentIntent.module === 'Lamp' && paymentConfig?.customQR?.allowLamp !== false) ||
                  (paymentIntent.module === 'Event' && paymentConfig?.customQR?.allowEvent !== false) ||
                  (paymentIntent.module === 'Queue' && paymentConfig?.customQR?.allowQueue !== false)) && (
                 <button onClick={() => setPaymentSubView('customQR')} className="py-4 bg-pink-50 text-pink-600 hover:bg-pink-700 rounded-2xl font-black text-xs shadow-sm border border-pink-200 active:scale-95 transition-transform flex items-center justify-center gap-2">
                   🔗 自訂條碼
                 </button>
               )}

               {paymentConfig?.cash?.enabled !== false && 
                 ((paymentIntent.module === 'Booking' && paymentConfig?.cash?.allowBooking !== false) ||
                  (paymentIntent.module === 'Lamp' && paymentConfig?.cash?.allowLamp !== false) ||
                  (paymentIntent.module === 'Event' && paymentConfig?.cash?.allowEvent !== false) ||
                  (paymentIntent.module === 'Queue' && paymentConfig?.cash?.allowQueue !== false)) && (
                 <button onClick={async () => { 
                   await paymentIntent.onPaid('Cash', ''); 
                   setPaymentIntent(null); 
                   setPaymentSubView('methods');
                   setPaymentRefInput('');
                   setIsDetailModalOpen(false); 
                 }} className="col-span-2 py-4 bg-amber-500 text-slate-900 rounded-2xl font-black text-xs uppercase tracking-widest shadow-md hover:bg-amber-400 active:scale-95 transition-all flex items-center justify-center gap-2">
                   💵 現場現金付款
                 </button>
               )}
            </div>
          )}

          {paymentSubView === 'transfer' && (
            <div className="space-y-4 animate-in fade-in zoom-in-95">
               <div className="bg-amber-50 p-4 rounded-2xl border border-amber-200 space-y-3">
                  <div className="flex justify-between items-center border-b border-amber-200/50 pb-2">
                     <span className="text-[10px] font-bold text-amber-700/70">銀行代碼</span>
                     <span className="text-sm font-black text-amber-900">{paymentConfig?.customTransfer?.bankCode}</span>
                  </div>
                  <div className="flex justify-between items-center border-b border-amber-200/50 pb-2">
                     <span className="text-[10px] font-bold text-amber-700/70">收款帳號</span>
                     <span className="text-sm font-black text-amber-900 font-mono tracking-wider">{paymentConfig?.customTransfer?.accountNo}</span>
                  </div>
                  <div className="flex justify-between items-center border-b border-amber-200/50 pb-2">
                     <span className="text-[10px] font-bold text-amber-700/70">戶名</span>
                     <span className="text-sm font-black text-amber-900">{paymentConfig?.customTransfer?.accountName}</span>
                  </div>
                  <div className="flex justify-between items-center">
                     <span className="text-[10px] font-bold text-amber-700/70">銀行名稱</span>
                     <span className="text-xs font-black text-amber-900">{paymentConfig?.customTransfer?.bankName}</span>
                  </div>
               </div>
               <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-1 ml-1">請輸入您的帳號末五碼 (對帳用)</label>
                  <input type="text" maxLength={5} placeholder="例如: 12345" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-800 focus:ring-2 focus:ring-emerald-500/50"
                     value={paymentRefInput} onChange={e => setPaymentRefInput(e.target.value)} />
               </div>
               <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-1 ml-1">上傳匯款截圖 (可選)</label>
                  <input type="file" accept="image/*" onChange={e => {
                     const file = e.target.files?.[0];
                     if(file) setCheckoutProofFile(file);
                  }} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm font-bold text-slate-600 focus:ring-2 focus:ring-emerald-500/50 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100" />
               </div>
               <div className="flex gap-2">
                  <button onClick={() => setPaymentSubView('methods')} className="py-3 px-4 bg-slate-100 text-slate-600 rounded-xl font-bold text-xs hover:bg-slate-200 transition-colors">返回</button>
                  <button onClick={async () => {
                    await paymentIntent.onPaid('transfer', paymentRefInput || '無', checkoutProofFile);
                    setPaymentIntent(null);
                    setPaymentSubView('methods');
                    setPaymentRefInput('');
                    setCheckoutProofFile(null);
                    setIsDetailModalOpen(false);
                  }} className="flex-1 py-3 bg-emerald-500 text-white rounded-xl font-black text-xs hover:bg-emerald-600 shadow-md transition-colors">我已完成匯款</button>
               </div>
            </div>
          )}

          {paymentSubView === 'customQR' && (
            <div className="space-y-4 animate-in fade-in zoom-in-95">
               <div className="bg-pink-50 p-4 rounded-2xl border border-pink-200 flex flex-col items-center justify-center text-center space-y-4">
                  {paymentConfig?.customQR?.qrImageUrl && (
                     <img src={paymentConfig.customQR.qrImageUrl} alt="QR Code" className="max-w-[200px] rounded-xl shadow-sm" />
                  )}
                  <p className="text-xs font-bold text-pink-800">{paymentConfig?.customQR?.description || '請掃描 QR Code 付款'}</p>
               </div>
               <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-1 ml-1">帳號末五碼 / 轉帳備註 (對帳用)</label>
                  <input type="text" placeholder="以便工作人員核對" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-800 focus:ring-2 focus:ring-pink-500/50"
                     value={paymentRefInput} onChange={e => setPaymentRefInput(e.target.value)} />
               </div>
               <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-1 ml-1">上傳匯款截圖 (可選)</label>
                  <input type="file" accept="image/*" onChange={e => {
                     const file = e.target.files?.[0];
                     if(file) setCheckoutProofFile(file);
                  }} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm font-bold text-slate-600 focus:ring-2 focus:ring-pink-500/50 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-pink-50 file:text-pink-700 hover:file:bg-pink-100" />
               </div>
               <div className="flex gap-2">
                  <button onClick={() => setPaymentSubView('methods')} className="py-3 px-4 bg-slate-100 text-slate-600 rounded-xl font-bold text-xs hover:bg-slate-200 transition-colors">返回</button>
                  <button onClick={async () => {
                    await paymentIntent.onPaid('customQR', paymentRefInput || '無', checkoutProofFile);
                    setPaymentIntent(null);
                    setPaymentSubView('methods');
                    setPaymentRefInput('');
                    setCheckoutProofFile(null);
                    setIsDetailModalOpen(false);
                  }} className="flex-1 py-3 bg-pink-500 text-white rounded-xl font-black text-xs hover:bg-pink-600 shadow-md transition-colors">付款完成</button>
               </div>
            </div>
          )}

          {paymentSubView === 'methods' && (
            <button onClick={() => {
              setPaymentIntent(null);
              setPaymentSubView('methods');
              setPaymentRefInput('');
            }} className="py-2 text-xs font-bold text-slate-400 hover:text-slate-600 uppercase tracking-widest transition-colors">取消支付</button>
          )}
        </div>
      </div>
    );
  };

  const renderActionSuccess = () => (
    <div className="fixed inset-0 z-[300] bg-black/60 flex flex-col items-center justify-center p-6 animate-in fade-in zoom-in duration-300">
      <div className="app-card w-full max-w-sm p-8 flex flex-col items-center text-center space-y-6">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center text-4xl text-green-600 mb-2">
          ✓
        </div>
        
        <div className="space-y-2">
          <h3 className="text-2xl font-bold text-gray-900">{successInfo?.title || '辦理完成'}</h3>
          <p className="text-gray-500 font-bold text-sm leading-relaxed whitespace-pre-line">
            {successInfo?.message || '您的資料已同步至宮廟系統，祈願平安喜樂。'}
          </p>
        </div>

        <button 
          onClick={() => { setSuccessInfo(null); setBookingStatus('idle'); setBookingStep(1); setActiveView('home'); }} 
          className="btn-primary w-full py-4 mt-4"
        >
          返回首頁
        </button>
      </div>
    </div>
  );

  const renderScanModal = () => (
    <div className="fixed inset-0 z-[500] bg-black/95 flex flex-col items-center justify-center p-8 animate-in fade-in duration-300">
       <div className="w-full max-w-sm space-y-12">
          <div className="text-center space-y-4">
             <div className="w-20 h-20 bg-red-600 rounded-3xl mx-auto flex items-center justify-center text-white text-3xl shadow-2xl animate-pulse">
                📷
             </div>
             <h3 className="text-2xl font-black text-white italic tracking-tighter">現場掃碼報到</h3>
             <p className="text-sm font-bold text-red-400 uppercase tracking-widest">Secure Check-in Scanner</p>
          </div>

          <QRScannerComponent 
             onScan={(data) => {
               setIsScanning(false);
               handleSecureCheckIn(data);
             }} 
             onClose={() => setIsScanning(false)} 
          />

          <button onClick={() => setIsScanning(false)} className="w-full py-4 text-white font-black text-xs uppercase tracking-widest opacity-50 hover:opacity-100">
             取消掃描
          </button>
       </div>
    </div>
  );

  const renderProfile = () => (
    <div className="min-h-screen pb-32">
      <TopNav title="信眾資料" onBack={() => setActiveView('home')} />
      <div className="max-w-md mx-auto px-5 pt-6 space-y-6">
        <div className="app-card p-8 flex flex-col items-center">
           <div className="relative">
             <img src={guestUser?.avatar || 'https://ui-avatars.com/api/?name=Guest'} className="w-24 h-24 rounded-full shadow-md mb-4" alt="Avatar" />
             <div className="absolute bottom-4 right-0 w-6 h-6 bg-green-500 border-2 border-white rounded-full flex items-center justify-center" title="LINE 已綁定">
               <span className="text-[10px] text-white">L</span>
             </div>
           </div>
           <p className="text-xs text-gray-500 font-bold tracking-wider mb-1">用戶編號 GU-{guestUser?.phone?.slice(-4)}</p>
           <h3 className="text-xl font-bold text-gray-900">{guestUser?.name}</h3>
           <div className="mt-2 flex items-center gap-2 px-3 py-1 bg-green-50 rounded-full">
             <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
             <span className="text-[10px] font-bold text-green-700">LINE ID: @pivot_{guestUser?.phone?.slice(-4)} 已綁定</span>
           </div>
        </div>

        <form className="app-card p-6 space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-2">信眾姓名</label>
              <input 
                type="text" 
                value={profileName} 
                onChange={(e) => setProfileName(e.target.value)}
                className="app-input" 
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-2">聯絡電話</label>
              <input type="text" value={guestUser?.phone} readOnly className="app-input bg-gray-50 text-gray-400" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 mb-2">LINE ID 綁定</label>
            <input 
              type="text" 
              value={guestUser?.lineId || '無 (未來將開放點選自動綁定)'} 
              readOnly 
              className="app-input bg-gray-50 text-gray-400" 
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 mb-2">電子郵件 (EMAIL)</label>
            <input 
              type="email" 
              value={profileEmail}
              onChange={(e) => setProfileEmail(e.target.value)}
              placeholder="example@email.com" 
              className="app-input" 
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 mb-2">登入密碼</label>
            <input 
              type="password" 
              value={profilePassword}
              onChange={(e) => setProfilePassword(e.target.value)}
              placeholder="••••••••" 
              className="app-input" 
            />
          </div>

          <div className="space-y-3">
            <label className="block text-xs font-bold text-gray-500">出生日期與時辰</label>
            <div className="grid grid-cols-2 gap-4">
              <input 
                type="date" 
                value={gregorianDate} 
                max={new Date().toISOString().split('T')[0]}
                min={`${new Date().getFullYear() - 100}-01-01`}
                onChange={(e) => setGregorianDate(e.target.value)}
                className="app-input" 
              />
              <select 
                value={profileBirthHour}
                onChange={(e) => setProfileBirthHour(e.target.value)}
                className="app-input"
              >
                <option value="">選擇時辰</option>
                {['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'].map(h => (
                  <option key={h} value={h}>{h} 時</option>
                ))}
              </select>
            </div>
            {lunarResult && (
              <div className="bg-amber-50 p-3 rounded-xl border border-amber-100 flex items-center gap-3">
                <span className="text-lg">🏮</span>
                <div>
                  <p className="text-[10px] font-bold text-amber-700 uppercase">農曆生辰</p>
                  <p className="text-sm font-bold text-amber-900">{lunarResult}</p>
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 mb-2">居住地址</label>
            <textarea 
              value={profileAddress}
              onChange={(e) => setProfileAddress(e.target.value)}
              className="app-input min-h-[80px]" 
              placeholder="請輸入通訊地址" 
            />
          </div>

          <button 
            type="button" 
            onClick={async () => { 
              if (profileEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profileEmail)) {
                return alert('請輸入正確的電子郵件格式！');
              }
              if (gregorianDate) {
                const selectedYear = new Date(gregorianDate).getFullYear();
                const currentYear = new Date().getFullYear();
                if (new Date(gregorianDate) > new Date()) return alert('出生日期不可設定為未來時間！');
                if (currentYear - selectedYear > 100) return alert('出生日期設定異常，超過一百歲請洽宮廟人員協助！');
              }
              const updatedData = {
                phone: guestUser.phone,
                name: profileName,
                email: profileEmail,
                password: profilePassword,
                address: profileAddress,
                birthday: gregorianDate,
                lunarBirthday: lunarResult,
                birthHour: profileBirthHour
              };
              await createOrUpdateGuest(updatedData);
              setGuestUser(prev => ({ ...prev, ...updatedData }));
              setSuccessInfo({ title: "更新成功", message: "您的個人資料已同步至中心連接模組。" }); 
            }} 
            className="btn-primary mt-4"
          >
            儲存更新
          </button>
        </form>
        
        <div className="pt-2">
          <button 
            type="button" 
            onClick={() => {
              setGuestUser(null);
              setShowLoginWall(true);
              setActiveView('home');
              alert("✨ 您已成功安全登出個人帳號！");
            }} 
            className="w-full py-4 bg-gray-50 border border-gray-200 text-gray-500 hover:text-red-600 font-bold rounded-2xl active:bg-gray-100 transition-colors shadow-sm text-center text-xs font-black uppercase tracking-widest"
          >
            🚪 安全登出此帳號
          </button>
        </div>
      </div>
    </div>
  );

  const renderBooking = () => {
    return (
      <div className="min-h-screen pb-32">
        <TopNav title="預約" onBack={() => {
          if (bookingStep > 1) setBookingStep((prev) => (prev - 1) as any);
          else setActiveView('home');
        }} />
        
        <div className="max-w-md mx-auto px-5 pt-6 space-y-6">
          {/* Progress Indicator */}
          <div className="app-card p-4 flex justify-between items-center bg-white mb-6">
             {[1, 2].map(s => (
               <div key={s} className="flex flex-col items-center gap-1 flex-1">
                 <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                   bookingStep === s ? 'bg-red-700 text-white' : 
                   bookingStep > s ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-400'
                 }`}>{s}</div>
                 <p className={`text-xs font-bold mt-1 ${bookingStep === s ? 'text-gray-900' : 'text-gray-400'}`}>
                   {s === 1 ? '選項目' : '選時段'}
                 </p>
               </div>
             ))}
          </div>

          {bookingStep === 1 && (
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-gray-900 px-1">選擇預約</h3>
              <div className="grid gap-3">
                {serviceDefinitions.map(svc => (
                  <button 
                    key={svc.id}
                    onClick={() => {
                      setSelectedService(svc);
                      const assigned = (!svc.assignedStaff || svc.assignedStaff.length === 0) 
                        ? staff 
                        : staff.filter(s => svc.assignedStaff.includes(s.id));
                      setAvailableStaffList(assigned);
                      setSelectedStaff(null);
                      setBookingStep(2);
                    }}
                    className="app-card p-5 flex flex-col text-left active:bg-gray-50 transition-colors gap-4"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h4 className="font-bold text-gray-900 text-lg">{svc.name}</h4>
                        <p className="text-sm text-gray-500 mt-1">{svc.description}</p>
                      </div>
                      <span className="text-gray-400 text-xl font-bold ml-2">›</span>
                    </div>
                    
                    {svc.precautions && (
                      <div className="bg-red-50 p-3 rounded-xl flex gap-3 items-start">
                        <span className="text-red-500">⚠️</span>
                        <div>
                          <p className="text-[10px] font-bold text-red-700 uppercase">注意事項</p>
                          <p className="text-xs text-red-600 mt-0.5">{svc.precautions}</p>
                        </div>
                      </div>
                    )}
                    
                    <div className="flex justify-between items-center pt-2 border-t border-gray-100">
                      <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">結緣金額</span>
                      <span className="text-sm font-bold text-red-700 bg-red-50 px-3 py-1 rounded-lg">{(svc.price !== undefined && svc.price > 0) ? `$${svc.price}` : '隨喜'}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Staff Selection Skipped */}

          {bookingStep === 2 && (
            <div className="space-y-6">
              <h3 className="text-lg font-bold text-gray-900 px-1">挑選預約時段</h3>
              
              <div className="app-card p-4">
                <div className="flex justify-between items-center mb-4">
                  <button onClick={() => {
                    if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear(v => v - 1); }
                    else setCurrentMonth(v => v - 1);
                  }} className="p-2 text-gray-600 active:bg-gray-100 rounded-full">◀</button>
                  <span className="font-bold text-gray-900">{currentYear}年 {currentMonth + 1}月</span>
                  <button onClick={() => {
                    if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear(v => v + 1); }
                    else setCurrentMonth(v => v + 1);
                  }} className="p-2 text-gray-600 active:bg-gray-100 rounded-full">▶</button>
                </div>
                
                <div className="grid grid-cols-7 gap-1 text-center mb-2">
                  {['日', '一', '二', '三', '四', '五', '六'].map(d => (
                    <div key={d} className="text-xs font-bold text-gray-500 py-1">{d}</div>
                  ))}
                </div>
                
                <div className="grid grid-cols-7 gap-1">
                  {Array.from({ length: new Date(currentYear, currentMonth, 1).getDay() }).map((_, i) => (
                    <div key={`empty-${i}`} className="aspect-square"></div>
                  ))}
                  {Array.from({ length: new Date(currentYear, currentMonth + 1, 0).getDate() }).map((_, i) => {
                    const day = i + 1;
                    const dateStr = `${currentYear}-${(currentMonth + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
                    const isSelected = selectedDate === dateStr;
                    const today = new Date();
                    const todayStr = `${today.getFullYear()}-${(today.getMonth() + 1).toString().padStart(2, '0')}-${today.getDate().toString().padStart(2, '0')}`;
                    const isPast = dateStr < todayStr;
                    const hasSlots = slots.some(s => s.date === dateStr && s.status === 'Available' && (!selectedStaff || s.staff === selectedStaff.name));
                    
                    const isDisabled = isPast || !hasSlots;
                    
                    return (
                      <button 
                        key={i} 
                        disabled={isDisabled}
                        onClick={() => setSelectedDate(dateStr)}
                        className={`aspect-square rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 relative ${
                          isSelected ? 'bg-red-700 text-white shadow-lg scale-110 z-10' : 
                          isPast ? 'text-gray-200 bg-gray-50 cursor-not-allowed' :
                          hasSlots ? 'bg-white text-gray-900 hover:scale-105' : 'text-gray-300 cursor-not-allowed'
                        }`}
                        style={hasSlots && !isSelected && !isPast ? { 
                          border: `2px solid ${selectedService?.color || '#cbd5e1'}`,
                          boxShadow: `0 0 0 2px white, 0 0 0 4px ${selectedService?.color || '#cbd5e1'}`
                        } : {}}
                      >
                        {day}
                      </button>
                    );
                  })}
                </div>
              </div>
              
              <div className="space-y-3">
                <p className="text-sm font-bold text-gray-700 px-1">選擇具體時段</p>
                <div className="grid grid-cols-2 gap-3">
                  {slots
                    .filter(s => s.date === selectedDate && s.status === 'Available' && (!selectedStaff || s.staff === selectedStaff.name))
                    .map(slot => (
                      <button 
                        key={slot.id} 
                        onClick={() => {
                          setDetailContent({
                            title: selectedService?.name,
                            category: '預約',
                            price: !slot.price && !selectedService?.price ? '隨喜功德' : `結緣金 ${slot.price || selectedService?.price}`,
                            description: `預約時間：${selectedDate} ${slot.time}\n服務人員：${slot.staff}\n地點：${selectedService?.location || '本宮大殿'}\n\n注意事項：${slot.description || selectedService?.precautions || '無'}`,
                            onConfirm: async () => {
                              const amount = slot.price || selectedService?.price || 0;
                              initiatePayment(amount, 'Booking', async (method: string, ref?: string) => {
                                const res = await bookAppointment(slot.id, guestUser.name, guestUser.phone, method, ref, amount);
                                
                                if (res.success) {
                                  if (method === 'ecpay' || method === 'linepay') {
                                    handleOnlinePaymentRedirect(method, res.id || Date.now().toString(), amount);
                                    return;
                                  }

                                  setSuccessInfo({
                                    title: '預約成功',
                                    message: method === 'Cash' ? '您的預約已提交。由於採現場付款，請依循現場指示完成繳費。' : 
                                             method === 'Free' ? '已成功為您預約！隨喜功德，平安喜樂。' :
                                             '您的預約與付款紀錄已送出！祈願平安。'
                                  });
                                  await refreshAllData(guestUser.phone);
                                  const updatedSlots = await fetchAvailableSlots();
                                  setSlots(updatedSlots);
                                } else {
                                  alert(`❌ 預約失敗: ${res.message}`);
                                }
                              });
                            }
                          });
                          setIsDetailModalOpen(true);
                        }}
                        className="app-card py-4 text-center active:bg-gray-50 transition-colors border border-gray-100"
                      >
                        <p className="text-lg font-bold text-gray-900">{slot.time}</p>
                        <p className="text-xs text-gray-500 mt-1">{slot.staff}</p>
                      </button>
                    ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderEvents = () => {
    // Filter by the selected Year and Month
    const eventsOnSelectedMonth = events.filter(e => {
      if (!e.date) return false;
      const [y, m] = e.date.split('-');
      return parseInt(y) === currentYear && parseInt(m) === (currentMonth + 1);
    });
    
    return (
      <div className="min-h-screen pb-32">
        <TopNav title="活動" onBack={() => setActiveView('home')} />
        <div className="max-w-md mx-auto px-5 pt-6 space-y-6">
          <div className="text-center space-y-1 mb-6">
            <h3 className="text-xl font-bold text-gray-900">近期活動</h3>
            <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">Active Events</p>
          </div>

          {/* Month Selector */}
          <div className="app-card p-4">
            <div className="flex justify-between items-center px-2">
              <button onClick={() => {
                if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear(v => v - 1); }
                else setCurrentMonth(v => v - 1);
              }} className="p-2 text-gray-600 hover:bg-gray-100 rounded-full transition-colors">◀</button>
              
              <div className="text-center">
                <span className="font-bold text-xl text-gray-900">{currentYear}年 {currentMonth + 1}月</span>
              </div>

              <button onClick={() => {
                if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear(v => v + 1); }
                else setCurrentMonth(v => v + 1);
              }} className="p-2 text-gray-600 hover:bg-gray-100 rounded-full transition-colors">▶</button>
            </div>
          </div>

          <div className="space-y-4">
            <h5 className="text-xs font-bold text-gray-500 uppercase tracking-widest px-1">{currentYear}年 {currentMonth + 1}月 活動列表</h5>
            <div className="grid gap-6">
              {eventsOnSelectedMonth.length > 0 ? eventsOnSelectedMonth.map(evt => {
                const isRegistered = guestRegistrations.some(r => r.eventId === evt.id && r.status !== 'Cancelled');
                // Registration stats logic
                const enrolled = evt.enrolled || 0;
                const capacity = evt.capacity || 0;
                const progressPercent = capacity > 0 ? Math.min(100, Math.round((enrolled / capacity) * 100)) : 0;
                const isFull = capacity > 0 && enrolled >= capacity;

                return (
                <div key={evt.id} className="app-card overflow-hidden bg-white shadow-sm border border-gray-100 rounded-3xl">
                  {/* Image Section */}
                  <div className="h-56 w-full relative bg-gradient-to-br from-amber-50 to-orange-100 flex items-center justify-center overflow-hidden">
                    <div className="text-amber-500/20 text-7xl absolute">🏮</div>
                    {evt.imageUrl ? (
                      <img src={evt.imageUrl} className="absolute inset-0 w-full h-full object-cover z-10" onError={(e) => { e.currentTarget.style.display='none'; }} />
                    ) : null}
                  </div>

                  {/* Content Section */}
                  <div className="p-5 space-y-5">
                    {/* Basic Info */}
                    <div className="flex justify-between items-start gap-3">
                       <div>
                         <h4 className="text-xl font-bold text-gray-900 leading-tight mb-1">{evt.title}</h4>
                         <p className="text-sm font-bold text-red-600">{evt.date}</p>
                       </div>
                       <span className="font-bold text-red-700 bg-red-50 px-3 py-1.5 rounded-xl text-sm border border-red-100 shrink-0">
                         ${evt.price}
                       </span>
                    </div>

                    {/* Event Description Block */}
                    {evt.description && (
                      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex gap-3">
                        <div className="text-slate-500 mt-0.5">📝</div>
                        <div>
                          <h5 className="text-sm font-bold text-slate-800 mb-1">活動內容</h5>
                          <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-wrap">{evt.description}</p>
                        </div>
                      </div>
                    )}

                    {/* Precautions Block */}
                    {evt.precautions && (
                      <div className="bg-orange-50 border border-orange-200 rounded-2xl p-4 flex gap-3">
                        <div className="text-orange-500 mt-0.5">⚠️</div>
                        <div>
                          <h5 className="text-sm font-bold text-orange-800 mb-1">注意事項</h5>
                          <p className="text-xs text-orange-700 leading-relaxed whitespace-pre-wrap">{evt.precautions}</p>
                        </div>
                      </div>
                    )}

                    {/* Registration Stats */}
                    <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100 space-y-2">
                       <div className="flex justify-between text-xs font-bold">
                         <span className="text-gray-500">能接受 {capacity > 0 ? capacity : '無限制'} 人</span>
                         <span className={isFull ? "text-red-500" : "text-emerald-600"}>已經報名 {enrolled} 人</span>
                       </div>
                       {capacity > 0 && (
                         <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                           <div className={`h-2.5 rounded-full ${isFull ? 'bg-red-500' : 'bg-emerald-500'}`} style={{ width: `${progressPercent}%` }}></div>
                         </div>
                       )}
                    </div>

                    {/* Action Button */}
                    <div className="pt-2">
                       <button 
                         onClick={() => {
                           if (isFull && !isRegistered) {
                             alert('很抱歉，此活動已額滿！');
                             return;
                           }
                           setDetailContent({
                             title: evt.title,
                             category: '活動',
                             price: `結緣價 $${evt.price}`,
                             precautions: evt.precautions || '請於活動前 15 分鐘報到，並領取法器。',
                             description: `活動內容：${evt.description || evt.content || '詳細內容請洽宮廟'}\n日期：${evt.date}`,
                             onConfirm: isRegistered ? undefined : async () => {
                               initiatePayment(evt.price || 0, 'Event', async (method: string, ref?: string, proofFile?: File | null) => {
                                 const res = await registerForEvent(evt.id, guestUser.phone, guestUser.name, evt.price || 0, method, ref);
                                 if (res && res.success !== false) {
                                   if (method === 'ecpay' || method === 'linepay') {
                                     handleOnlinePaymentRedirect(method, res.id || Date.now().toString(), evt.price || 0);
                                     return;
                                   }
                                   if (res.id && proofFile) {
                                     const previewUrl = await fileToBase64(proofFile);
                                     const { uploadPaymentProof } = await import('@/app/actions_payment_proof');
                                     await uploadPaymentProof(res.id.toString(), 'EventRegistration', previewUrl, guestUser.phone);
                                   }
                                   setSuccessInfo({ title: '報名成功', message: method === 'Cash' ? '您已成功報名法會活動，請於當日現場完成繳費報到。' : method === 'Free' ? '報名成功！隨喜功德，平安喜樂。' : '您已成功報名法會活動與付款。' });
                                   refreshAllData(guestUser.phone);
                                 } else {
                                   alert(`❌ 報名失敗: ${res?.message || '未知錯誤'}`);
                                 }
                               });
                             }
                           });
                           setIsDetailModalOpen(true);
                         }}
                         className={`w-full py-3.5 rounded-2xl font-black text-[15px] tracking-wide transition-all ${
                           isRegistered 
                             ? "bg-gray-100 text-gray-400 cursor-default" 
                             : isFull
                               ? "bg-red-50 text-red-400 border border-red-100 cursor-not-allowed"
                               : "btn-primary shadow-lg shadow-red-500/30"
                         }`}
                       >
                         {isRegistered ? '已報名' : isFull ? '已額滿' : '立即報名'}
                       </button>
                    </div>
                  </div>
                </div>
                );
              }) : (
                <div key="no-events" className="py-16 text-center app-card">
                  <div className="text-5xl mb-4 opacity-50">🗓️</div>
                  <p className="text-gray-500 font-bold text-sm">此月份暫無法會活動</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderQueue = () => {
    const myTickets = guestTickets.filter(t => t.phone === guestUser?.phone);
    const hasActiveTicket = myTickets.some(t => t.status !== 'Completed');

    return (
      <div className="min-h-screen pb-32">
        <TopNav title="排隊" onBack={() => setActiveView('home')} />
        <div className="max-w-md mx-auto px-5 pt-6 space-y-6">
          {/* 現場排隊狀態看板 */}
          <div className="app-card p-5 bg-gradient-to-br from-amber-50 to-orange-50/50 border border-amber-200/60 flex items-center justify-between shadow-xs animate-in fade-in duration-300">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-amber-500/10 rounded-full flex items-center justify-center text-amber-600 text-2xl">⚡</div>
              <div>
                <p className="text-[10px] font-bold text-amber-800/80 uppercase tracking-wider">即時現場狀態</p>
                <h4 className="text-sm font-black text-gray-900 mt-0.5">目前現場排隊人數：{activeQueueCount} 人</h4>
              </div>
            </div>
            <div className="bg-amber-500 text-white text-[9px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider animate-pulse">
              LIVE
            </div>
          </div>

          {hasActiveTicket ? (
            <div className="space-y-6">
              {myTickets.filter(t => t.status !== 'Completed').map(ticket => (
                <div key={ticket.id} className="app-card p-6 space-y-6 bg-white">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-amber-50 rounded-full flex items-center justify-center text-amber-600 text-2xl">🎟️</div>
                    <div className="flex-1">
                      <h4 className="font-bold text-gray-900">{ticket.eventTitle}</h4>
                      <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mt-1">Status: {ticket.status === 'Pending' ? '已報名' : '已報到'}</p>
                    </div>
                    <div className="text-right">
                       <p className="text-[10px] font-bold text-gray-400 uppercase">持票號碼</p>
                       <p className="text-2xl font-black text-gray-900">{ticket.assignedNumber}</p>
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100 text-center space-y-4">
                     {ticket.status === 'Pending' ? (
                       <>
                         <div className="w-16 h-16 bg-white rounded-2xl mx-auto flex items-center justify-center shadow-sm text-2xl">📸</div>
                         <div className="space-y-1">
                           <p className="text-sm font-bold text-gray-900">請抵達現場後掃碼報到</p>
                           <p className="text-xs text-gray-500">掃描管理端 QR Code 以確認實際排隊順位</p>
                         </div>
                         <button 
                           onClick={async () => {
                             await verifyQueueTicket(ticket.eventId, guestUser.phone);
                             setSuccessInfo({ title: "報到成功", message: "您已完成現場報到，請依照實際順位候位。" });
                             refreshAllData(guestUser.phone);
                           }}
                           className="btn-primary py-3 w-full"
                         >
                           掃描 QR 報到
                         </button>
                       </>
                     ) : (
                       <>
                         <p className="text-[10px] font-bold text-amber-700 uppercase tracking-widest">實際排隊順位</p>
                         <p className="text-6xl font-black text-amber-600">{ticket.actualOrder || '計算中'}</p>
                         <p className="text-xs font-bold text-gray-500 mt-4">預計等待時間：15 分鐘</p>
                       </>
                     )}
                  </div>
                  <button className="btn-outline text-red-600 border-red-200 hover:bg-red-50 py-3">取消參加</button>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-gray-900 px-1">可參加的排隊項目</h3>
              <div className="grid gap-4">
                {queueEvents.filter(e => e.status === 'Active').map(evt => {
                  return (
                    <div key={evt.id} className="app-card p-5 space-y-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="text-lg font-bold text-gray-900">{evt.title}</h4>
                          <p className="text-xs text-gray-500 mt-1">{evt.location} • {evt.timeWindow}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] font-bold text-emerald-600 uppercase">已參加人數</p>
                          <p className="text-lg font-bold text-emerald-700">{evt.participantCount || 0}人</p>
                        </div>
                      </div>
                      
                      <div className="bg-gray-50 p-3 rounded-xl">
                        <p className="text-[10px] font-bold text-gray-500 uppercase">活動說明</p>
                        <p className="text-xs text-gray-600 mt-1 leading-relaxed">{evt.precautions}</p>
                      </div>

                      <button 
                        onClick={async () => {
                          initiatePayment(0, 'Queue', async (method: string, ref?: string, proofFile?: File | null) => {
                            const res = await joinQueue(evt.id, guestUser.phone, guestUser.name, method);
                            if (res && res.success !== false) {
                              const recordId = res.ticket?.id || res.id;
                              if (recordId && proofFile) {
                                const previewUrl = await fileToBase64(proofFile);
                                const { uploadPaymentProof } = await import('@/app/actions_payment_proof');
                                await uploadPaymentProof(recordId.toString(), 'Appointment', previewUrl, guestUser.phone);
                              }
                              setSuccessInfo({ title: "領號成功", message: "您已成功領取號碼牌，請抵達現場後掃描 QR 報到。" });
                              refreshAllData(guestUser.phone);
                            } else {
                              alert(`❌ 領取失敗: ${res?.message || '未知錯誤'}`);
                            }
                          });
                        }}
                        className="btn-primary w-full py-3"
                      >
                        領取號碼牌
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderLighting = () => {
    return (
      <div className="min-h-screen pb-32">
        <TopNav title="點燈" onBack={() => setActiveView('home')} />
        <div className="max-w-md mx-auto px-5 pt-6 space-y-6">
          <div className="app-card p-6 bg-amber-50">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-amber-600 shadow-sm"><IconCandle /></div>
              <div>
                <h4 className="text-xl font-bold text-gray-900">點燈祈福</h4>
                <p className="text-xs text-amber-700 font-bold tracking-widest mt-1">線上預約點燈</p>
              </div>
            </div>
            <p className="text-sm font-bold text-gray-700 mt-4 leading-relaxed">
              點亮平安燈，祈求新的一年萬事如意，閤家平安。本宮提供多種祈福燈項，歡迎信眾選取辦理。
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 w-full">
            {lampCategories.map(item => (
              <div key={item.id} className="app-card p-6 space-y-4 bg-white">
                <div className="flex justify-between items-start">
                   <div>
                      <h4 className="text-lg font-bold text-gray-900">{item.name}</h4>
                      <p className="text-xs text-gray-500 font-bold mt-1">{item.description}</p>
                   </div>
                   <span className="font-bold text-red-700 bg-red-50 px-2 py-1 rounded text-sm">{(!item.price || item.price === 0) ? '隨喜功德' : `$${item.price}`}</span>
                </div>
                
                {item.precautions && (
                  <div className="bg-amber-50 p-3 rounded-xl flex gap-3 items-start border border-amber-100">
                    <span className="text-amber-600 text-sm">💡</span>
                    <div>
                      <p className="text-[10px] font-bold text-amber-700 uppercase">注意事項</p>
                      <p className="text-xs text-amber-800 mt-0.5">{item.precautions}</p>
                    </div>
                  </div>
                )}

                <button 
                  onClick={() => {
                    setDetailContent({
                      title: item.name,
                      category: '點燈',
                      price: (!item.price || item.price === 0) ? '結緣價：隨喜功德' : `結緣價 $${item.price}`,
                      precautions: item.precautions || '點燈後將於三日內為您上燈，並寄送電子通知。',
                      description: `服務內容：${item.description || '祈福保平安'}`,
                      onConfirm: async () => {
                        const amt = item.price ?? 0;
                        initiatePayment(amt, 'Lamp', async (method: string, ref?: string, proofFile?: File | null) => {
                          const fd = new FormData();
                          fd.append('phone', guestUser.phone);
                          fd.append('guestName', guestUser.name);
                          fd.append('categoryId', item.id);
                          fd.append('categoryName', item.name);
                          fd.append('price', amt.toString());
                          fd.append('paymentMethod', method);
                          if (ref) fd.append('paymentRef', ref);
                          const res = await createLightingOrder(fd);
                          if (res && res.success !== false) {
                            if (method === 'ecpay' || method === 'linepay') {
                              handleOnlinePaymentRedirect(method, res.id || Date.now().toString(), amt);
                              return;
                            }
                            if (res.id && proofFile) {
                              const previewUrl = await fileToBase64(proofFile);
                              const { uploadPaymentProof } = await import('@/app/actions_payment_proof');
                              await uploadPaymentProof(res.id.toString(), 'LampRecord', previewUrl, guestUser.phone);
                            }
                            setSuccessInfo({
                              title: '辦理成功',
                              message: method === 'Cash' ? '您的點燈申請已提交，請至現場完成繳費以利上燈。' : method === 'Free' ? '申請成功！隨喜功德。' : '您的點燈申請與付款已完成，本宮將為您安排上燈法事。'
                            });
                            refreshAllData(guestUser.phone);
                          } else {
                            alert(`❌ 辦理失敗: ${res?.message || '未知錯誤'}`);
                          }
                        });
                      }
                    });
                    setIsDetailModalOpen(true);
                  }}
                  className="btn-primary py-3"
                >
                  立即辦理
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };


  if (showLoginWall) {
    return (
      <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center px-6">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center space-y-4">
            <div className="w-20 h-20 bg-white rounded-3xl mx-auto flex items-center justify-center text-4xl shadow-sm text-red-700">⛩️</div>
            <div>
              <h1 className="text-2xl font-black text-gray-900 tracking-tight">PREMIUM <span className="text-red-700">Sanctuary</span></h1>
              <p className="text-gray-500 font-bold uppercase tracking-widest text-[10px] mt-1">Digital Sacred Portal</p>
            </div>
          </div>
          
          <div className="app-card p-8 space-y-8 bg-white border-2 border-red-950/20 shadow-xl rounded-[35px] overflow-hidden">
            {isLiffLoading ? (
              <div className="flex flex-col items-center justify-center py-10">
                <div className="w-12 h-12 border-4 border-slate-200 border-t-amber-600 rounded-full animate-spin mb-4"></div>
                <p className="text-slate-600 font-bold tracking-widest text-sm">LINE 安全連線中...</p>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="text-center space-y-1">
                  <h3 className="text-xl font-black text-gray-900">信眾登入</h3>
                  <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest">Enter the Path of Peace</p>
                </div>
                
                {phoneStatus === "IDLE" ? (
                  <form onSubmit={handlePhoneNext} className="space-y-6">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 mb-2">手機號碼</label>
                      <input 
                        type="tel" 
                        value={loginPhone} 
                        onChange={(e) => setLoginPhone(e.target.value.replace(/\D/g, '').slice(0, 10))} 
                        className="app-input" 
                        placeholder="0912345678" 
                        pattern="^09\d{8}$" minLength={10} maxLength={10}
                        required 
                      />
                    </div>
                    <button 
                      type="submit" 
                      disabled={isCheckingPhone}
                      className="btn-primary w-full py-4 flex items-center justify-center gap-2"
                    >
                      {isCheckingPhone ? '驗證中...' : '下一步'}
                      <span className="text-lg">➔</span>
                    </button>
                  </form>
                ) : (
                  <form onSubmit={handleLogin} className="space-y-6">
                    {phoneStatus === "NEW" && (
                      <div>
                        <div className="mb-4 bg-blue-50 text-blue-700 p-3 rounded-xl text-xs font-bold">歡迎新信眾！請設定您的姓名與密碼進行註冊。</div>
                        <label className="block text-xs font-bold text-gray-500 mb-2">真實姓名</label>
                        <input 
                          type="text" 
                          value={loginName} 
                          onChange={(e) => setLoginName(e.target.value)} 
                          className="app-input mb-4" 
                          placeholder="請輸入姓名" 
                          required 
                        />
                      </div>
                    )}
                    
                    {phoneStatus === "NO_PASSWORD" && (
                      <div className="mb-4 bg-amber-50 text-amber-700 p-3 rounded-xl text-xs font-bold">
                        歡迎您, {loginName}！<br/>系統升級安全機制，請設定您的專屬密碼完成啟用。
                      </div>
                    )}

                    {phoneStatus === "HAS_PASSWORD" && (
                      <div className="mb-4 text-gray-700 text-sm font-bold text-center">
                        歡迎回來, {loginName}
                      </div>
                    )}

                    <div>
                      <label className="block text-xs font-bold text-gray-500 mb-2">{phoneStatus === "HAS_PASSWORD" ? "請輸入密碼" : "請設定密碼"}</label>
                      <input 
                        type="password" 
                        value={loginPassword} 
                        onChange={(e) => setLoginPassword(e.target.value)} 
                        className="app-input" 
                        placeholder="請輸入密碼" 
                        required 
                      />
                    </div>
                    <button 
                      type="submit" 
                      disabled={isLoggingIn}
                      className="btn-primary w-full py-4 flex items-center justify-center gap-2"
                    >
                      {isLoggingIn ? '開啟中...' : (phoneStatus === "HAS_PASSWORD" ? '登入' : '設定並登入')}
                      <span className="text-lg">➔</span>
                    </button>
                    <button 
                      type="button" 
                      onClick={() => { setPhoneStatus("IDLE"); setLoginPassword(""); setLoginName(""); }}
                      className="w-full py-3 text-xs font-bold text-gray-400 hover:text-gray-600 tracking-widest text-center"
                    >
                      返回重填手機號碼
                    </button>
                  </form>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 font-sans text-gray-900 pb-20 selection:bg-red-200">

      <style dangerouslySetInnerHTML={{__html: `
        :root {
          --temple-primary: ${theme.primary} !important;
          --temple-secondary: ${theme.secondary} !important;
        }
        .bg-red-700, .bg-red-600, .bg-amber-600 { background-color: var(--temple-primary) !important; }
        .text-red-700, .text-red-600, .text-amber-600, .text-red-500 { color: var(--temple-primary) !important; }
        .border-red-700, .border-red-600, .border-amber-600, .border-red-200 { border-color: var(--temple-primary) !important; }
        .bg-red-800, .bg-amber-700 { background-color: var(--temple-secondary) !important; }
        .bg-red-50, .bg-amber-50 { background-color: ${theme.light} !important; }
      `}} />

      
      {activeView === 'home' && renderHome()}
      {activeView === 'space' && renderPersonalSpace()}
      {activeView === 'records' && renderAllRecords()}
      {activeView === 'profile' && renderProfile()}
      {activeView === 'booking' && renderBooking()}
      {activeView === 'events' && renderEvents()}
      {activeView === 'queue' && renderQueue()}
      {activeView === 'lighting' && renderLighting()}
      {renderNotificationsModal()}
      {renderDetailModal()}
      {renderPaymentInfoModal()}
      {renderPaymentModal()}
      {renderPreviewModal()}
      {renderRecordPreviewModal()}
      {successInfo && renderActionSuccess()}
      
      {/* Native Bottom Tab Bar */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 pb-safe">
        <div className="max-w-md mx-auto flex justify-around items-center h-16 px-2">
          {[
            { id: 'home', icon: <IconHome />, label: '首頁' },
            { id: 'records', icon: <IconCalendar />, label: '紀錄' },
            { id: 'space', icon: <IconSpace />, label: '檔案' },
            { id: 'profile', icon: <IconUser />, label: '個人' }
          ].map(nav => {
            const isActive = activeView === nav.id;
            return (
              <button 
                key={nav.id} 
                onClick={() => setActiveView(nav.id as any)}
                className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-all active:scale-90 ${
                  isActive 
                    ? 'text-red-700' 
                    : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                <div className={`w-6 h-6 transition-transform ${isActive ? 'scale-110' : ''}`}>{nav.icon}</div>
                <span className={`text-[10px] font-black tracking-tight ${isActive ? 'opacity-100' : 'opacity-70'}`}>{nav.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* AGI Chat Assistant Modal */}
      {isAgiModalOpen && (
        <div className="fixed inset-0 z-[200] flex flex-col bg-gray-100 animate-in slide-in-from-bottom duration-300 overflow-hidden">
          <header className="bg-white border-b border-gray-200 h-14 flex items-center justify-between px-4 sticky top-0 z-10">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center text-amber-600 text-sm">✨</div>
              <h3 className="text-lg font-bold text-gray-900">生活助理</h3>
            </div>
            <button onClick={() => setIsAgiModalOpen(false)} className="p-2 -mr-2 text-gray-400 active:text-gray-900 active:bg-gray-100 rounded-full transition-colors">✕</button>
          </header>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-6">
            {chatHistory.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`p-4 rounded-2xl max-w-[85%] text-sm font-bold shadow-sm ${
                  msg.role === 'user' 
                    ? 'bg-amber-100 text-amber-900 rounded-tr-sm' 
                    : 'bg-white text-gray-800 rounded-tl-sm border border-gray-100'
                }`}>
                  {msg.text}
                </div>
              </div>
            ))}
            {agiIsThinking && (
              <div className="flex justify-start">
                <div className="bg-white p-4 rounded-2xl rounded-tl-sm border border-gray-100 flex gap-2 items-center shadow-sm">
                  <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                  <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce [animation-delay:0.4s]"></div>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>
          
          <div className="p-4 bg-white border-t border-gray-200 pb-safe">
            <form onSubmit={handleAgiSubmit} className="flex gap-3">
              <input 
                value={agiInput} 
                onChange={(e) => setAgiInput(e.target.value)} 
                className="flex-1 app-input rounded-full py-3 px-5 text-sm" 
                placeholder="請輸入您的問題..." 
              />
              <button type="submit" className="w-12 h-12 bg-red-700 text-white rounded-full flex items-center justify-center shadow-md active:bg-red-800 transition-colors">➔</button>
            </form>
          </div>
        </div>
      )}
      
      {/* Floating AI Assistant (LINE Style) - 全域顯示 */}
      {serviceSettings?.modules?.agi && templeAiUsage && templeAiUsage.enabled && (templeAiUsage.isVip || (new Date(templeAiUsage.expiryDate).getTime() > Date.now() && templeAiUsage.usedCount < templeAiUsage.chatLimit)) && !isAgiModalOpen && (
        <button 
          onClick={() => setIsAgiModalOpen(true)}
          className="fixed bottom-24 right-5 w-14 h-14 bg-red-700 text-white rounded-full flex items-center justify-center shadow-2xl active:scale-95 transition-transform z-40 hover:bg-red-800 border-2 border-white/20"
        >
          <span className="text-2xl">✨</span>
        </button>
      )}

      {isScanning && renderScanModal()}
      
      {modifyModalOpen && (
        <div className="fixed inset-0 z-[500] bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl flex flex-col max-h-[80vh]">
            <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="font-bold text-gray-900">請選擇新時段</h3>
              <button onClick={() => setModifyModalOpen(false)} className="text-gray-400 hover:text-gray-600 text-xl font-bold">×</button>
            </div>
            <div className="p-4 overflow-y-auto flex-1 space-y-3">
              {availableModifySlots.length === 0 ? (
                 <div className="py-8 text-center text-gray-400 text-sm font-bold">目前沒有可更換的時段</div>
              ) : (
                 availableModifySlots.map(slot => (
                   <div 
                     key={slot.id} 
                     onClick={() => handleConfirmModify(slot.id)}
                     className="p-4 border border-gray-200 rounded-xl hover:border-red-500 hover:bg-red-50 cursor-pointer transition-colors"
                   >
                     <div className="flex justify-between items-center">
                       <div>
                         <div className="text-xs text-gray-500 font-bold mb-1">{slot.date}</div>
                         <div className="text-lg font-black text-gray-900">{slot.time}</div>
                       </div>
                       <div className="text-right">
                         <div className="text-xs text-gray-400 font-bold mb-1">服務人員</div>
                         <div className="text-sm font-bold text-gray-700">{slot.staff}</div>
                       </div>
                     </div>
                   </div>
                 ))
              )}
            </div>
            {isModifying && (
               <div className="absolute inset-0 bg-white/50 backdrop-blur-sm flex flex-col items-center justify-center z-10">
                 <div className="w-8 h-8 border-4 border-red-500 border-t-transparent rounded-full animate-spin"></div>
                 <p className="mt-4 text-xs font-bold text-gray-600">正在為您更改預約...</p>
               </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
