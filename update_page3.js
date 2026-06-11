const fs = require('fs');
let c = fs.readFileSync('src/app/super-sales/[salesId]/page.tsx', 'utf8');

const modalRegex = /<div className="p-8 overflow-y-auto bg-slate-50 flex-1 flex items-center justify-center">[\s\S]*?\}\)\}\s*<\/div>/;

const newModal = `<div className="p-8 overflow-y-auto bg-slate-50 flex-1 flex items-center justify-center flex-col gap-6">
                    {activeToolPreview.type === 'photo' ? (
                       <img src={activeToolPreview.url || activeToolPreview.thumbnail} className="max-w-full max-h-full rounded-2xl shadow-sm" />
                    ) : activeToolPreview.type === 'video' ? (
                       <video src={activeToolPreview.url || activeToolPreview.thumbnail} controls className="w-full aspect-video bg-black rounded-2xl shadow-lg" />
                    ) : (
                       <div className="text-center space-y-4">
                          <span className="text-6xl block">📄</span>
                          <p className="text-sm font-black text-slate-900">{activeToolPreview.title}</p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase">文件已被安全保護，請點擊下方按鈕下載檢閱</p>
                       </div>
                    )}
                    
                    <button 
                       className="px-8 py-4 bg-indigo-600 text-white font-black text-sm rounded-2xl shadow-lg hover:bg-indigo-700 transition-all mt-4" 
                       onClick={() => {
                         const fileUrl = activeToolPreview.url || activeToolPreview.thumbnail;
                         if (!fileUrl) {
                           alert('檔案連結無效，無法下載。');
                           return;
                         }
                         try {
                           if (fileUrl.startsWith('data:')) {
                             const arr = fileUrl.split(',');
                             const mime = arr[0].match(/:(.*?);/)[1];
                             const bstr = atob(arr[1]);
                             let n = bstr.length;
                             const u8arr = new Uint8Array(n);
                             while (n--) {
                               u8arr[n] = bstr.charCodeAt(n);
                             }
                             const blob = new Blob([u8arr], { type: mime });
                             const blobUrl = URL.createObjectURL(blob);
                             const a = document.createElement('a');
                             a.href = blobUrl;
                             a.download = activeToolPreview.title || 'download';
                             document.body.appendChild(a);
                             a.click();
                             document.body.removeChild(a);
                             setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
                           } else {
                             const a = document.createElement('a');
                             a.href = fileUrl;
                             a.download = activeToolPreview.title || 'download';
                             a.target = '_blank';
                             document.body.appendChild(a);
                             a.click();
                             document.body.removeChild(a);
                           }
                         } catch (err) {
                           alert('下載失敗，檔案可能已損壞或過大。');
                           console.error(err);
                         }
                       }}
                    >確認下載檔案 (Download)</button>
                 </div>
              </div>
           </div>
        )}
     </div>`;

c = c.replace(modalRegex, newModal);
fs.writeFileSync('src/app/super-sales/[salesId]/page.tsx', c);
console.log('REPLACED?', c.includes('下載失敗'));
