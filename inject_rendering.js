const fs = require('fs');
let content = fs.readFileSync('src/app/[templeId]/admin/services/page.tsx', 'utf8');

// For Desktop View
const formsEndPatternDesktop = `                           )}
                        </div>
                     </div>
                  </div>
               </div>
            </div>
         )}
      </main>
    </div>
  );
};`;

const newFormsEndPatternDesktop = `                           )}
                        </div>
                     </div>
                  </div>
               </div>
            </div>
         )}
         {activeTab === 'print-templates' && <PrintTemplatesView printTemplates={printTemplates} loadData={loadData} />}
      </main>
    </div>
  );
};`;

content = content.replace(formsEndPatternDesktop, newFormsEndPatternDesktop);

// For Mobile View
const formsEndPatternMobile = `             <div key={f.id} className="bg-white p-5 mb-4 rounded-3xl border border-slate-100 shadow-sm">
                <h3 className="text-lg font-bold text-slate-900">{f.name}</h3>
                <p className="text-[11px] text-slate-400 mt-1">{f.fields?.length || 0} 個欄位</p>
             </div>
          ))}
       </main>
    </div>
  );
};`;

const newFormsEndPatternMobile = `             <div key={f.id} className="bg-white p-5 mb-4 rounded-3xl border border-slate-100 shadow-sm">
                <h3 className="text-lg font-bold text-slate-900">{f.name}</h3>
                <p className="text-[11px] text-slate-400 mt-1">{f.fields?.length || 0} 個欄位</p>
             </div>
          ))}
          {activeTab === 'print-templates' && (
             <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm text-center">
                <span className="text-4xl mb-4 block">🖨️</span>
                <h3 className="text-lg font-bold text-slate-900 mb-2">版型設計請使用電腦版</h3>
                <p className="text-sm text-slate-500">版型設計介面較複雜，為了給您最好的體驗，請使用平板或電腦開啟此功能。</p>
             </div>
          )}
       </main>
    </div>
  );
};`;

content = content.replace(formsEndPatternMobile, newFormsEndPatternMobile);

fs.writeFileSync('src/app/[templeId]/admin/services/page.tsx', content, 'utf8');
console.log('Rendering injected');
