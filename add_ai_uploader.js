const fs = require('fs');

let content = fs.readFileSync('src/app/[templeId]/admin/services/page.tsx', 'utf8');

// 1. Add useRef to react imports if not there. 
// services/page.tsx already imports useState, useEffect. Let's make sure useRef is imported.
content = content.replace(/import React, { useState, useEffect } from 'react';/, "import React, { useState, useEffect, useRef } from 'react';");

// 2. Add aiFileInputRef
content = content.replace(/const \[isAiScanning, setIsAiScanning\] = useState\(false\);/, "const [isAiScanning, setIsAiScanning] = useState(false);\n  const aiFileInputRef = useRef<HTMLInputElement>(null);");

// 3. Rewrite handleAiScan to handleAiFileChange and add trigger function
const oldAiLogic = `  // 模擬 AI 分析紙本案卡邏輯
  const handleAiScan = () => {
    setIsAiScanning(true);
    setTimeout(() => {`;

const newAiLogic = `  // 真實檔案上傳觸發 AI 邏輯
  const triggerAiScan = () => {
    if (aiFileInputRef.current) aiFileInputRef.current.click();
  };

  const handleAiFileChange = (e: any) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setIsAiScanning(true);
    // 這裡可以呼叫後端 API，將圖片傳給 OpenAI 進行結構化擷取
    // 目前模擬網路請求等待與擷取結果
    setTimeout(() => {`;

content = content.replace(oldAiLogic, newAiLogic);

// 4. Update the Button and insert hidden Input
const oldButton = `<button 
                         onClick={handleAiScan} 
                         disabled={isAiScanning} 
                         className={\`px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-widest transition-all \${isAiScanning ? 'bg-slate-100 text-slate-400 animate-pulse' : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white'}\`}
                       >
                          {isAiScanning ? 'AI 案卡掃描中...' : '✨ 上傳案卡附件 AI 分析'}
                       </button>`;

const newButton = `<input type="file" ref={aiFileInputRef} accept="image/*" capture="environment" onChange={handleAiFileChange} className="hidden" />
                       <button 
                         onClick={triggerAiScan} 
                         disabled={isAiScanning} 
                         className={\`px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-widest transition-all \${isAiScanning ? 'bg-slate-100 text-slate-400 animate-pulse' : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white'}\`}
                       >
                          {isAiScanning ? '連接總部 AI 引擎萃取中...' : '📸 拍攝/上傳 實體案卡 AI 分析'}
                       </button>`;

content = content.replace(oldButton, newButton);

fs.writeFileSync('src/app/[templeId]/admin/services/page.tsx', content, 'utf8');
console.log('AI scan file uploader added to services page.');
