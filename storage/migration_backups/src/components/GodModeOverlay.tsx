"use client";

import { useEffect, useState } from "react";

export default function GodModeOverlay() {
  const [isGodMode, setIsGodMode] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      if (window.location.search.includes("godMode=true")) {
        setIsGodMode(true);
      }
    }
  }, []);

  if (!isGodMode) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[9999] animate-in fade-in slide-in-from-bottom-4 duration-500">
      <button
        onClick={() => {
          window.location.href = "/super-admin";
        }}
        className="px-6 py-4 bg-rose-600 text-white rounded-full font-black text-sm uppercase tracking-widest shadow-2xl hover:bg-rose-500 hover:scale-105 transition-all flex items-center gap-3 border-4 border-rose-400/30"
      >
        <span className="text-xl">🔙</span>
        返回超級管理員
      </button>
    </div>
  );
}
