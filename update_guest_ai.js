const fs = require('fs');
let content = fs.readFileSync('src/app/[templeId]/GuestAppClient.tsx', 'utf8');

// 1. Add import
content = content.replace(
  '  fetchActiveQueueCount,\n  type TempleNotification\n} from "@/app/actions";',
  '  fetchActiveQueueCount,\n  fetchTempleAiUsage,\n  type TempleNotification\n} from "@/app/actions";'
);

// 2. Add state
content = content.replace(
  '  const [serviceSettings, setServiceSettings] = useState<any>(null);',
  \`  const [serviceSettings, setServiceSettings] = useState<any>(null);
  const [templeAiUsage, setTempleAiUsage] = useState<any>(null);\`
);

// 3. Add to initialization
content = content.replace(
  '        fetchActiveQueueCount()',
  '        fetchActiveQueueCount(),\n        fetchTempleAiUsage()'
);

content = content.replace(
  '        const [slotsData, eventsData, sdData, staffData, qeData, lcData, ssData, notifData, activeNotifs, activeQc] = await Promise.all([',
  '        const [slotsData, eventsData, sdData, staffData, qeData, lcData, ssData, notifData, activeNotifs, activeQc, aiUsageData] = await Promise.all(['
);

content = content.replace(
  '        setActiveQueueCount(activeQc);',
  '        setActiveQueueCount(activeQc);\n        setTempleAiUsage(aiUsageData);'
);

// 4. Conditionally render the Floating AI Assistant
content = content.replace(
  \`        {/* Floating AI Assistant (LINE Style) */}
        <button 
          onClick={() => setIsAgiModalOpen(true)}
          className="fixed bottom-24 right-5 w-14 h-14 bg-red-700 text-white rounded-full flex items-center justify-center shadow-lg active:scale-95 transition-transform z-40"
        >
          <span className="text-2xl">✨</span>
        </button>\`,
  \`        {/* Floating AI Assistant (LINE Style) */}
        {serviceSettings?.modules?.agi && templeAiUsage && (templeAiUsage.enabled && (templeAiUsage.isVip || (new Date(templeAiUsage.expiryDate).getTime() > Date.now() && templeAiUsage.usedCount < templeAiUsage.chatLimit))) && (
          <button 
            onClick={() => setIsAgiModalOpen(true)}
            className="fixed bottom-24 right-5 w-14 h-14 bg-red-700 text-white rounded-full flex items-center justify-center shadow-lg active:scale-95 transition-transform z-40"
          >
            <span className="text-2xl">✨</span>
          </button>
        )}\`
);

fs.writeFileSync('src/app/[templeId]/GuestAppClient.tsx', content);
console.log('Modified GuestAppClient.tsx to integrate AI restrictions');
