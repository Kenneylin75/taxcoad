const fs = require('fs');
let content = fs.readFileSync('src/app/[templeId]/admin/services/page.tsx', 'utf8');

// 1. Add handleDeleteForm to ServicesManagement
const formDeleteLogic = `
   const handleDeleteForm = async (id: string, e: React.MouseEvent) => {
      e.stopPropagation();
      if (!confirm('確定要刪除此表單嗎？此操作無法還原。')) return;
      
      const { deleteForm } = await import('@/app/actions');
      await deleteForm(id);
      loadData();
   };

   const loadData = async () => {`;

content = content.replace('const loadData = async () => {', formDeleteLogic);

// 2. Add handleDeleteForm to commonProps
content = content.replace(
  'loadData, activeTab, setActiveTab, handleDeleteService };', 
  'loadData, activeTab, setActiveTab, handleDeleteService, handleDeleteForm };'
);

// 3. Add handleDeleteForm to AdminDesktopView props
content = content.replace(
  'loadData, activeTab, setActiveTab, handleDeleteService }: any) => {',
  'loadData, activeTab, setActiveTab, handleDeleteService, handleDeleteForm }: any) => {'
);

// 4. Update the forms list card
const oldFormFooter = `<div className="mt-auto pt-6 border-t border-slate-50 flex items-center justify-between text-[11px] font-bold text-slate-300 uppercase tracking-widest group-hover:text-indigo-600 transition-colors">建模設定 ➔</div>`;
const newFormFooter = `<div className="mt-auto pt-6 border-t border-slate-50 flex items-center justify-between">
                              <span className="text-[11px] font-bold text-slate-300 uppercase tracking-widest group-hover:text-indigo-600 transition-colors">建模設定 ➔</span>
                              <button 
                                 onClick={(e) => handleDeleteForm(f.id, e)}
                                 className="text-[11px] font-bold text-rose-300 uppercase tracking-widest hover:text-rose-600 transition-colors"
                              >
                                 刪除
                              </button>
                           </div>`;
content = content.replace(oldFormFooter, newFormFooter);

fs.writeFileSync('src/app/[templeId]/admin/services/page.tsx', content, 'utf8');
console.log('services/page.tsx updated.');
