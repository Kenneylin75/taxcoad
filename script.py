import codecs

filepath = 'src/app/[templeId]/admin/customers/page.tsx'
with codecs.open(filepath, 'r', 'utf-8') as f:
    content = f.read()

# 1. Add isCreatingNote state
old_state = '''  const [isSavingNote, setIsSavingNote] = useState(false);'''
new_state = '''  const [isSavingNote, setIsSavingNote] = useState(false);\n  const [isCreatingNote, setIsCreatingNote] = useState(false);'''
if old_state in content and new_state not in content:
    content = content.replace(old_state, new_state)

# 2. Update "+" button
old_plus = '''                                 onClick={() => {
                                    setActiveNote(null);
                                    setNoteTitle('');
                                    setNoteContent('');
                                    setSelectedNoteMonth(new Date().toISOString().substring(0, 7));
                                 }}'''
new_plus = '''                                 onClick={() => {
                                    setActiveNote(null);
                                    setNoteTitle('');
                                    setNoteContent('');
                                    setIsCreatingNote(true);
                                    setSelectedNoteMonth(new Date().toISOString().substring(0, 7));
                                 }}'''
content = content.replace(old_plus, new_plus)

# 3. Update note click
old_note_click = '''                                 onClick={() => {
                                    setActiveNote(note);
                                    setNoteTitle(note.title);
                                    setNoteContent(note.content);
                                 }}'''
new_note_click = '''                                 onClick={() => {
                                    setActiveNote(note);
                                    setNoteTitle(note.title);
                                    setNoteContent(note.content);
                                    setIsCreatingNote(false);
                                 }}'''
content = content.replace(old_note_click, new_note_click)

# 4. Update right side renderer
old_right_side = '''                     {/* 右側欄：內容編輯區 */}
                     <div className="w-full md:w-2/3 bg-white border-4 border-slate-900 rounded-[40px] flex flex-col shadow-2xl overflow-hidden relative">
                        {activeNote && ('''

new_right_side = '''                     {/* 右側欄：內容編輯區 */}
                     <div className="w-full md:w-2/3 bg-white border-4 border-slate-900 rounded-[40px] flex flex-col shadow-2xl overflow-hidden relative">
                        {(activeNote || isCreatingNote) ? (
                           <>
                              {activeNote && ('''
content = content.replace(old_right_side, new_right_side)


# 5. Update save button
old_save = '''                                       setIsSavingNote(false);
                                       alert('備註已儲存！');
                                    }}
                                    disabled={isSavingNote}
                                    className="px-8 py-4 bg-emerald-500 text-slate-900 rounded-2xl font-black text-sm uppercase tracking-widest shadow-lg hover:bg-emerald-400 transition-colors disabled:opacity-50"
                                 >
                                    {isSavingNote ? '儲存中...' : '儲存備註錄 ✓'}
                                 </button>
                              </div>
                           </>
                        ) : ('''

# Wait, the save button currently looks like:
old_save_full = '''                                       await saveGuestNote(selectedGuest.id, selectedGuest.phone, noteTitle, noteContent, dateToSave, activeNote?.id);
                                       if (selectedGuest) await loadHistory(selectedGuest.phone);
                                       setIsSavingNote(false);
                                       alert('備註已儲存！');
                                    }}
                                    disabled={isSavingNote}
                                    className="px-8 py-4 bg-emerald-500 text-slate-900 rounded-2xl font-black text-sm uppercase tracking-widest shadow-lg hover:bg-emerald-400 transition-colors disabled:opacity-50"
                                 >
                                    {isSavingNote ? '儲存中...' : '儲存備註錄 ✓'}
                                 </button>
                              </div>
                           </>
                        ) : ('''

# I need to find the save button logic because it hasn't been wrapped in <> yet.
# Currently it is:
current_save_full = '''                                 await saveGuestNote(selectedGuest.id, selectedGuest.phone, noteTitle, noteContent, dateToSave, activeNote?.id);
                                 if (selectedGuest) await loadHistory(selectedGuest.phone);
                                 setIsSavingNote(false);
                                 alert('備註已儲存！');
                              }}
                              disabled={isSavingNote}
                              className="px-8 py-4 bg-emerald-500 text-slate-900 rounded-2xl font-black text-sm uppercase tracking-widest shadow-lg hover:bg-emerald-400 transition-colors disabled:opacity-50"
                           >
                              {isSavingNote ? '儲存中...' : '儲存備註錄 ✓'}
                           </button>
                        </div>
                     </div>'''

new_save_full = '''                                 await saveGuestNote(selectedGuest.id, selectedGuest.phone, noteTitle, noteContent, dateToSave, activeNote?.id);
                                 if (selectedGuest) await loadHistory(selectedGuest.phone);
                                 setIsSavingNote(false);
                                 setActiveNote(null);
                                 setNoteTitle('');
                                 setNoteContent('');
                                 setIsCreatingNote(false);
                                 alert('備註已儲存！');
                              }}
                              disabled={isSavingNote}
                              className="px-8 py-4 bg-emerald-500 text-slate-900 rounded-2xl font-black text-sm uppercase tracking-widest shadow-lg hover:bg-emerald-400 transition-colors disabled:opacity-50"
                           >
                              {isSavingNote ? '儲存中...' : '儲存備註錄 ✓'}
                           </button>
                        </div>
                     </>
                     ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-slate-300 p-10 text-center">
                           <div className="text-6xl mb-6 opacity-50">📝</div>
                           <h3 className="text-xl font-black text-slate-400 mb-2">請選擇左側紀錄以查看詳細內容</h3>
                           <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">或點擊左上角 ＋ 新增信眾備註</p>
                        </div>
                     )}
                     </div>'''
content = content.replace(current_save_full, new_save_full)

with codecs.open(filepath, 'w', 'utf-8') as f:
    f.write(content)
