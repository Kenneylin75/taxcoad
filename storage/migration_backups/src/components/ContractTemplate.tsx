"use client";
import React from 'react';

export default function ContractTemplate({ templeName, agentName }: { templeName: string, agentName: string }) {
  return (
    <div className="bg-white p-16 shadow-2xl max-w-[800px] mx-auto border border-gray-100 font-serif text-gray-900 leading-loose" id="printable-contract">
      {/* 浮水印 */}
      <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none select-none overflow-hidden">
        <div className="text-[150px] font-black -rotate-45 uppercase">Pivot</div>
      </div>

      <div className="relative z-10">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold tracking-widest mb-2">Pivot 雲端宮廟管理系統服務合約</h1>
          <div className="text-xs text-gray-400 uppercase tracking-widest">Digital Service Agreement</div>
        </div>

        <div className="space-y-6 text-sm">
          <div className="grid grid-cols-2 gap-8 border-b border-gray-100 pb-8">
            <div>
              <p className="font-bold mb-2">甲方：Pivot 雲端科技管理總部</p>
              <p className="text-xs text-gray-500 font-sans">代表人：{agentName}</p>
            </div>
            <div>
              <p className="font-bold mb-2">乙方：{templeName}</p>
              <p className="text-xs text-gray-500 font-sans">授權宮廟代表人：________________</p>
            </div>
          </div>

          <section>
            <h2 className="font-bold text-base mb-3 border-l-4 border-gray-900 pl-3">第一條：合約標的</h2>
            <p>
              茲因乙方申請使用甲方提供之「Pivot 雲端宮廟管理系統」（以下簡稱本系統），經甲乙雙方協議，由甲方提供系統服務，乙方支付相關費用，雙方本於誠信原則訂立條款如下：
            </p>
          </section>

          <section>
            <h2 className="font-bold text-base mb-3 border-l-4 border-gray-900 pl-3">第二條：服務費用</h2>
            <ul className="list-disc ml-5 space-y-2">
              <li>系統開辦建設費：新臺幣 12,000 元整。</li>
              <li>每月系統維護費：新臺幣 3,600 元整。</li>
            </ul>
          </section>

          <section className="pt-10 border-t border-gray-100 grid grid-cols-2 gap-10">
            <div className="space-y-4">
              <p className="font-bold">甲方（簽章）</p>
              <div className="h-20 border-b border-gray-200"></div>
              <p className="text-sm">Pivot 雲端科技管理總部</p>
            </div>
            <div className="space-y-4">
              <p className="font-bold">乙方（簽章）</p>
              <div className="h-20 border-b border-gray-200"></div>
              <p className="text-sm">{templeName}</p>
            </div>
          </section>

          <div className="pt-10 text-center text-[10px] text-gray-400 font-sans tracking-widest uppercase">
            Pivot CLOUD TECHNOLOGY - SYSTEM SERVICE AGREEMENT V2026
          </div>
        </div>
      </div>
    </div>
  );
}
