const fs = require('fs');
let content = fs.readFileSync('src/app/[templeId]/admin/services/page.tsx', 'utf8');

const oldRoot = `export default function ServicesManagement() {
  const [activeTab, setActiveTab] = useState('services');
  const [services, setServices] = useState<any[]>([]);
  const [forms, setForms] = useState<any[]>([]);
  const [staffList, setStaffList] = useState<any[]>([]);
  const [availableSlots, setAvailableSlots] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [s, f, st, sl] = await Promise.all([
        fetchServiceDefinitions(), fetchForms(), fetchStaff(), fetchAvailableSlots()
      ]);
      setServices(Array.isArray(s) ? s : []);
      setForms(Array.isArray(f) ? f : []);
      setStaffList(Array.isArray(st) ? st : []);
      setAvailableSlots(Array.isArray(sl) ? sl : []);
    } catch (e) { console.error(e); }
    finally { setIsLoading(false); }
  };

  useEffect(() => {
    loadData();
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  if (isLoading) return <div className="h-screen flex items-center justify-center font-bold text-slate-300 animate-pulse tracking-[0.5em] italic text-xl">系統資料加載中...</div>;

  const commonProps = { services, forms, staffList, availableSlots, loadData, activeTab, setActiveTab };`;

const newRoot = `export default function ServicesManagement() {
  const [activeTab, setActiveTab] = useState('services');
  const [services, setServices] = useState<any[]>([]);
  const [forms, setForms] = useState<any[]>([]);
  const [printTemplates, setPrintTemplates] = useState<any[]>([]);
  const [staffList, setStaffList] = useState<any[]>([]);
  const [availableSlots, setAvailableSlots] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [s, f, st, sl, pt] = await Promise.all([
        fetchServiceDefinitions(), fetchForms(), fetchStaff(), fetchAvailableSlots(), fetchPrintTemplates()
      ]);
      setServices(Array.isArray(s) ? s : []);
      setForms(Array.isArray(f) ? f : []);
      setStaffList(Array.isArray(st) ? st : []);
      setAvailableSlots(Array.isArray(sl) ? sl : []);
      setPrintTemplates(Array.isArray(pt) ? pt : []);
    } catch (e) { console.error(e); }
    finally { setIsLoading(false); }
  };

  useEffect(() => {
    loadData();
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  if (isLoading) return <div className="h-screen flex items-center justify-center font-bold text-slate-300 animate-pulse tracking-[0.5em] italic text-xl">系統資料加載中...</div>;

  const commonProps = { services, forms, printTemplates, staffList, availableSlots, loadData, activeTab, setActiveTab };`;

content = content.replace(oldRoot, newRoot);
fs.writeFileSync('src/app/[templeId]/admin/services/page.tsx', content, 'utf8');
console.log('Root component updated');
