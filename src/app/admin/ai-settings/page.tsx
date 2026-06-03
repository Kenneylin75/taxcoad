"use client";
import React, { useState } from 'react';

export default function AiSettingsPage() {
  const [apiKey, setApiKey] = useState("sk-pivot-....");
  const [model, setModel] = useState("gpt-4o-sanctuary");

  return (
    <div className="space-y-8">
      <div className="bg-slate-900 border border-white/10 p-10 rounded-[3rem] shadow-2xl">
        <h1 className="text-3xl font-black text-white">AI 核心大腦配置</h1>
        <p className="text-slate-400 mt-2">此處設定將直接影響「信眾介面 - 生活大小事」模組的 AI 智力水平。</p>
      </div>

      <div className="grid grid-cols-1 gap-8">
        <div className="bg-white/5 border border-white/10 p-8 rounded-3xl space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-black text-rose-500 uppercase tracking-widest">API 供應商</label>
            <select className="w-full bg-slate-800 border-none rounded-xl p-4 text-white font-bold">
              <option>OpenAI (GPT-4o)</option>
              <option>Anthropic (Claude 3.5)</option>
              <option>Google (Gemini 1.5 Pro)</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-black text-rose-500 uppercase tracking-widest">API KEY</label>
            <input 
              type="password" 
              value={apiKey} 
              onChange={(e) => setApiKey(e.target.value)}
              className="w-full bg-slate-800 border-none rounded-xl p-4 text-white font-mono"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-black text-rose-500 uppercase tracking-widest">系統指令 (System Prompt)</label>
            <textarea 
              rows={6}
              className="w-full bg-slate-800 border-none rounded-xl p-4 text-white text-sm leading-relaxed"
              defaultValue="你是一位專業的宮廟生活助理。在與信眾交流時，請務必先進行至少 5 次深度的感性對話與聆聽。在未充分了解信眾困擾前，不得主動推薦預約或法會服務。"
            />
          </div>

          <button className="bg-rose-600 text-white font-black py-4 px-10 rounded-2xl shadow-lg hover:bg-rose-500 transition-all">
            儲存核心配置
          </button>
        </div>
      </div>
    </div>
  );
}
