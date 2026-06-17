import React from "react";

export default function RootPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
      <div className="text-6xl mb-6">🏛️</div>
      <h1 className="text-3xl font-black text-slate-800 mb-2">營運主控台</h1>
      <p className="text-slate-500 font-medium mb-8 max-w-md">
        歡迎使用全方位雲端營運主控台。請使用您所屬宮廟的專屬連結進入系統。
      </p>
      <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm text-sm font-bold text-slate-600">
        如果您是信眾，請向宮廟索取專屬網址。<br/>
        例如：<span className="text-amber-600">http://localhost:3000/您的宮廟ID</span>
      </div>
    </div>
  );
}
