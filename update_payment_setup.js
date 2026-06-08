const fs = require('fs');
let content = fs.readFileSync('src/app/[templeId]/admin/payment-setup/page.tsx', 'utf8');

const helper = `  const renderModuleSelector = (paymentKey: keyof TemplePaymentConfig, colorClass: string, ringClass: string) => {
    const section = config[paymentKey] as any;
    if (!section) return null;
    return (
      <div className="mt-6 border-t border-slate-100 pt-6 animate-in fade-in">
        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">適用的服務模組</label>
        <div className="grid grid-cols-2 gap-3">
          {[
            { id: 'allowBooking', label: '預約服務' },
            { id: 'allowLamp', label: '點燈服務' },
            { id: 'allowEvent', label: '法會活動' },
            { id: 'allowQueue', label: '現場排隊' }
          ].map(opt => (
            <label key={opt.id} className={\`flex items-center gap-3 p-3 rounded-xl border-2 border-slate-100 hover:border-\${colorClass}-200 cursor-pointer bg-white transition-colors\`}>
              <input
                type="checkbox"
                className={\`w-4 h-4 text-\${colorClass}-500 rounded border-gray-300 focus:ring-\${ringClass}-500\`}
                checked={section[opt.id] !== false}
                onChange={e => setConfig({...config, [paymentKey]: { ...section, [opt.id]: e.target.checked } as any})}
              />
              <span className="text-sm font-bold text-slate-700">{opt.label}</span>
            </label>
          ))}
        </div>
      </div>
    );
  };

`;

content = content.replace('if (isLoading)', helper + '  if (isLoading)');

// Add for linePay
content = content.replace(
  'placeholder="••••••••••••••••" />\n              </div>\n           </div>',
  'placeholder="••••••••••••••••" />\n              </div>\n              {renderModuleSelector(\'linePay\', \'emerald\', \'emerald\')}\n           </div>'
);

// Add for thirdParty
content = content.replace(
  'placeholder="••••••••••••" />\n                 </div>\n              </div>\n           </div>',
  'placeholder="••••••••••••" />\n                 </div>\n              </div>\n              {renderModuleSelector(\'thirdParty\', \'indigo\', \'indigo\')}\n           </div>'
);

// Add for customTransfer
content = content.replace(
  'placeholder="1234-5678-9012" />\n              </div>\n           </div>',
  'placeholder="1234-5678-9012" />\n              </div>\n              {renderModuleSelector(\'customTransfer\', \'amber\', \'amber\')}\n           </div>'
);

// Remove the old cash logic and use helper
content = content.replace(
  /<label className="block text-\[10px\] font-bold text-slate-400 uppercase tracking-widest mb-3 mt-4">適用的服務模組<\/label>[\s\S]*?<\/div>\s*<\/div>\s*<\/div>\s*\)}/g,
  '{renderModuleSelector(\'cash\', \'amber\', \'amber\')}\n                </div>\n             </div>\n           )}'
);

// Add for customQR
content = content.replace(
  ' placeholder="請輸入 QR Code 說明，如：請掃描上方條碼完成付款" />\n              </div>\n           </div>',
  ' placeholder="請輸入 QR Code 說明，如：請掃描上方條碼完成付款" />\n              </div>\n              {renderModuleSelector(\'customQR\', \'pink\', \'pink\')}\n           </div>'
);

fs.writeFileSync('src/app/[templeId]/admin/payment-setup/page.tsx', content);
console.log('Modified payment-setup/page.tsx');
