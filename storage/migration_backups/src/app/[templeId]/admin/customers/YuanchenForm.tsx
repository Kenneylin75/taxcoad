"use client";

import React, { useState, useEffect } from 'react';

interface YuanchenFormProps {
  initialValues: any;
  onSubmit: (values: any) => void;
  isSaving: boolean;
  onBack: () => void;
}

export default function YuanchenForm({ initialValues, onSubmit, isSaving, onBack }: YuanchenFormProps) {
  // 建立對應紙本結構的 State
  const [formData, setFormData] = useState<any>({
    path: initialValues.path || "水泥路",
    house: initialValues.house || "磚房",
    fence: initialValues.fence || "",
    pond: initialValues.pond || "",
    destiny_tree: initialValues.destiny_tree || "",
    garden: initialValues.garden || {
      green: false, red: false, yellow: false, white: false, black: false,
      soil: false, yuanbao: false, bamboo: false, peach: false, gourd: false
    },
    hall: initialValues.hall || {
      candle: "", altar: "", chair: "", ceiling: "", floor: "", guardian: "", drawer: "",
      tian_ku: false, di_ku: false, shui_ku: false
    },
    table_shape: initialValues.table_shape || "正方",
    zodiac_note: initialValues.zodiac_note || "",
    kitchen: initialValues.kitchen || {
       fire: "中", water: "半滾", pot: "快炒鍋", wood: "",
       water_tank: "5分", rice_tank: "5分", tank_size: "標準"
    },
    bedroom: initialValues.bedroom || {
       bed: "", pillow: false, quilt: false, slippers: false, small_pillow: false,
       vase: "無花", window: "開"
    },
    advice: initialValues.advice || ""
  });

  const handleToggle = (section: string, field: string) => {
    setFormData((prev:any) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: !prev[section][field]
      }
    }));
  };

  const handleSelect = (section: string | null, field: string, value: string) => {
    if (section) {
      setFormData((prev:any) => ({
        ...prev,
        [section]: { ...prev[section], [field]: value }
      }));
    } else {
      setFormData((prev:any) => ({ ...prev, [field]: value }));
    }
  };

  return (
    <div className="h-full w-full bg-white overflow-y-auto p-4 md:p-8 custom-scrollbar relative animate-in fade-in duration-500">
      <div className="max-w-4xl mx-auto pb-24">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-8 border-b border-gray-200 pb-6">
           <div>
             <h3 className="text-3xl font-black text-gray-900 tracking-tighter flex items-center gap-3">
               <span className="w-10 h-10 bg-indigo-600 text-white rounded-xl flex items-center justify-center text-xl shadow-lg">元</span>
               元辰宮觀修深度紀錄表
             </h3>
             <p className="text-xs text-gray-500 mt-2 font-bold uppercase tracking-widest bg-gray-100 px-3 py-1 rounded-full inline-block">Professional Soul-House Inspection Record</p>
           </div>
           <button onClick={onBack} className="text-sm text-gray-400 hover:text-gray-900 font-bold transition flex items-center gap-1">
             ◀ 放棄並返回
           </button>
        </div>

        <div className="space-y-10">
          
          {/* Section 1: 前庭與運勢路 */}
          <section className="bg-indigo-50/50 p-6 rounded-2xl border border-indigo-100 shadow-sm relative overflow-hidden">
             <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                <svg className="w-24 h-24 text-indigo-900" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L16 4m0 13V4m0 0L9 7" /></svg>
             </div>
             <h4 className="text-sm font-black text-indigo-900 mb-6 flex items-center gap-2 border-b border-indigo-200/50 pb-3">
                <span className="w-6 h-6 bg-indigo-600 text-white rounded-lg flex items-center justify-center text-[10px]">01</span>
                前庭、運勢路與房屋外觀
             </h4>
             
             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
               <div>
                  <label className="block text-xs font-bold text-indigo-400 uppercase mb-3">運勢路狀況 (點選切換)</label>
                  <div className="flex flex-wrap gap-2">
                    {["柏油路", "水泥路", "石頭路", "爛泥路"].map(pathType => (
                      <button
                        key={pathType}
                        onClick={() => handleSelect(null, "path", pathType)}
                        className={`px-4 py-2 rounded-xl text-sm font-bold transition-all border ${
                          formData.path === pathType 
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg scale-105' 
                          : 'bg-white text-gray-500 border-gray-200 hover:border-indigo-400'
                        }`}
                      >{pathType}</button>
                    ))}
                  </div>
               </div>
               
               <div>
                  <label className="block text-xs font-bold text-indigo-400 uppercase mb-3">房屋建材狀況</label>
                  <div className="flex flex-wrap gap-2">
                    {["茅房", "竹房", "磚房", "城堡", "宮殿"].map(hType => (
                      <button
                        key={hType}
                        onClick={() => handleSelect(null, "house", hType)}
                        className={`px-4 py-2 rounded-xl text-sm font-bold transition-all border ${
                          formData.house === hType 
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg scale-105' 
                          : 'bg-white text-gray-500 border-gray-200 hover:border-indigo-400'
                        }`}
                      >{hType}</button>
                    ))}
                  </div>
               </div>
             </div>

             <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8">
                <div className="col-span-1">
                   <label className="block text-[10px] font-bold text-gray-400 mb-1 tracking-widest">圍牆描述</label>
                   <input type="text" value={formData.fence} onChange={e => setFormData({...formData, fence: e.target.value})} className="w-full bg-white border border-indigo-100 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="圍牆材質或是否有破損..." />
                </div>
                <div className="col-span-1">
                   <label className="block text-[10px] font-bold text-gray-400 mb-1 tracking-widest">水池狀況</label>
                   <input type="text" value={formData.pond} onChange={e => setFormData({...formData, pond: e.target.value})} className="w-full bg-white border border-indigo-100 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="水質清澈、乾枯..." />
                </div>
                <div className="col-span-1">
                   <label className="block text-[10px] font-bold text-gray-400 mb-1 tracking-widest">本命樹狀態</label>
                   <input type="text" value={formData.destiny_tree} onChange={e => setFormData({...formData, destiny_tree: e.target.value})} className="w-full bg-white border border-indigo-100 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="樹幹是否粗壯、有否開花..." />
                </div>
             </div>
          </section>

          {/* Section 2: 觀修花園 */}
          <section className="bg-emerald-50/50 p-6 rounded-2xl border border-emerald-100 shadow-sm">
             <h4 className="text-sm font-black text-emerald-900 mb-6 flex items-center gap-2 border-b border-emerald-200/50 pb-3">
                <span className="w-6 h-6 bg-emerald-600 text-white rounded-lg flex items-center justify-center text-[10px]">02</span>
                觀修花園與花朵狀態 (對應器官)
             </h4>
             
             <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-8">
                {[
                  { id: 'green', label: '綠花 (肝)', color: 'bg-emerald-500' },
                  { id: 'red', label: '紅花 (心)', color: 'bg-rose-500' },
                  { id: 'yellow', label: '黃花 (脾)', color: 'bg-amber-400' },
                  { id: 'white', label: '白花 (肺)', color: 'bg-zinc-100 text-gray-800' },
                  { id: 'black', label: '黑花 (腎)', color: 'bg-gray-800 text-white' }
                ].map(flower => (
                  <button
                    key={flower.id}
                    onClick={() => handleToggle("garden", flower.id)}
                    className={`flex flex-col items-center justify-center gap-2 p-3 rounded-2xl border transition-all ${
                      formData.garden[flower.id] 
                      ? `${flower.color} text-white shadow-md scale-105 border-transparent` 
                      : 'bg-white border-emerald-100 text-gray-400 grayscale'
                    }`}
                  >
                    <span className="text-xl">✿</span>
                    <span className="text-[10px] font-black">{flower.label}</span>
                  </button>
                ))}
             </div>

             <div className="bg-white/60 rounded-2xl p-4 border border-emerald-100/50">
                <label className="block text-xs font-bold text-emerald-700 uppercase mb-4 tracking-widest">花園環境與物件描述</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                   {[
                     { id: 'soil', label: '土壤狀況' },
                     { id: 'yuanbao', label: '元寶' },
                     { id: 'bamboo', label: '桂竹' },
                     { id: 'peach', label: '桃花' },
                     { id: 'gourd', label: '葫蘆' }
                   ].map(item => (
                     <button
                        key={item.id}
                        onClick={() => handleToggle("garden", item.id)}
                        className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all border ${
                          formData.garden[item.id]
                          ? 'bg-emerald-100 border-emerald-300 text-emerald-800'
                          : 'bg-white border-gray-100 text-gray-400'
                        }`}
                     >
                       <span className={`w-3 h-3 rounded-full ${formData.garden[item.id] ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-gray-200'}`}></span>
                       {item.label}
                     </button>
                   ))}
                </div>
             </div>
          </section>

          {/* Section 3: 靈魂廚房 */}
          <section className="bg-orange-50/50 p-6 rounded-2xl border border-orange-100 shadow-sm relative overflow-hidden">
             <div className="absolute bottom-0 right-0 p-4 opacity-5 pointer-events-none">
                <svg className="w-32 h-32 text-orange-900" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.99 7.99 0 0120 13a7.99 7.99 0 01-2.343 5.657z" /></svg>
             </div>
             <h4 className="text-sm font-black text-orange-900 mb-6 flex items-center gap-2 border-b border-orange-200/50 pb-3">
                <span className="w-6 h-6 bg-orange-500 text-white rounded-lg flex items-center justify-center text-[10px]">03</span>
                靈魂廚房 (生命能量與財庫)
             </h4>

             <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div>
                  <label className="block text-xs font-bold text-orange-500 uppercase mb-3">灶火大小</label>
                  <div className="flex gap-2">
                    {["大", "中", "小", "無"].map(v => (
                       <button
                         key={v}
                         onClick={() => handleSelect("kitchen", "fire", v)}
                         className={`flex-1 py-2 rounded-xl text-xs font-bold transition border ${formData.kitchen.fire === v ? 'bg-orange-500 text-white border-orange-500 shadow-lg font-black' : 'bg-white text-gray-400 border-gray-100 hover:border-orange-200'}`}
                       >{v}</button>
                    ))}
                  </div>
                </div>
                
                <div>
                   <label className="block text-xs font-bold text-orange-500 uppercase mb-3">灶水狀況</label>
                   <div className="flex gap-2">
                    {["沸騰", "半滾", "平靜"].map(v => (
                       <button
                         key={v}
                         onClick={() => handleSelect("kitchen", "water", v)}
                         className={`flex-1 py-2 rounded-xl text-xs font-bold transition border ${formData.kitchen.water === v ? 'bg-orange-500 text-white border-orange-500 shadow-lg font-black' : 'bg-white text-gray-400 border-gray-100 hover:border-orange-200'}`}
                       >{v}</button>
                    ))}
                  </div>
                </div>

                <div>
                   <label className="block text-xs font-bold text-orange-500 uppercase mb-3">鍋子類型</label>
                   <div className="flex gap-2">
                    {["蒸籠", "快炒鍋", "燉鍋"].map(v => (
                       <button
                         key={v}
                         onClick={() => handleSelect("kitchen", "pot", v)}
                         className={`flex-1 py-2 rounded-xl text-xs font-bold transition border ${formData.kitchen.pot === v ? 'bg-orange-500 text-white border-orange-500 shadow-lg font-black' : 'bg-white text-gray-400 border-gray-100 hover:border-orange-200'}`}
                       >
                         {v}
                       </button>
                    ))}
                  </div>
                  <div className="text-[10px] text-gray-400 font-medium mt-1 text-center">
                    {formData.kitchen.pot === "蒸籠" && "慢工出細活"}
                    {formData.kitchen.pot === "快炒鍋" && "速戰速決"}
                    {formData.kitchen.pot === "燉鍋" && "穩定發展"}
                  </div>
                </div>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8 bg-white/50 p-5 rounded-2xl border border-orange-100/50">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                     <label className="text-sm font-black text-gray-700">水缸裝載</label>
                     <div className="flex gap-1.5 flex-wrap justify-end max-w-[200px]">
                        {["全滿", "7分", "5分", "3分", "1分", "無"].map(v => (
                           <button key={v} onClick={() => handleSelect("kitchen", "water_tank", v)} className={`px-2 py-1 rounded-md text-[10px] font-bold border transition ${formData.kitchen.water_tank === v ? 'bg-blue-600 text-white border-transparent shadow' : 'bg-white text-gray-400 border-gray-100 hover:border-blue-200'}`}>{v}</button>
                        ))}
                     </div>
                  </div>
                  <div className="flex items-center justify-between">
                     <label className="text-sm font-black text-gray-700">米缸裝載</label>
                     <div className="flex gap-1.5 flex-wrap justify-end max-w-[200px]">
                        {["全滿", "7分", "5分", "3分", "1分", "無"].map(v => (
                           <button key={v} onClick={() => handleSelect("kitchen", "rice_tank", v)} className={`px-2 py-1 rounded-md text-[10px] font-bold border transition ${formData.kitchen.rice_tank === v ? 'bg-amber-600 text-white border-transparent shadow' : 'bg-white text-gray-400 border-gray-100 hover:border-amber-200'}`}>{v}</button>
                        ))}
                     </div>
                  </div>
                </div>

                <div className="flex items-start justify-between">
                   <div className="flex-1">
                      <label className="block text-xs font-bold text-orange-400 uppercase mb-2">米水缸容器規格</label>
                      <div className="flex gap-2">
                        {["標準", "大", "小"].map(v => (
                           <button key={v} onClick={() => handleSelect("kitchen", "tank_size", v)} className={`px-4 py-2 rounded-lg text-xs font-bold transition border ${formData.kitchen.tank_size === v ? 'bg-gray-800 text-white border-transparent' : 'bg-white text-gray-400 border-gray-100 hover:border-gray-300'}`}>{v}</button>
                        ))}
                      </div>
                   </div>
                   <div className="flex-1">
                      <label className="block text-xs font-bold text-orange-400 uppercase mb-2">柴火數量</label>
                      <input type="text" value={formData.kitchen.wood} onChange={e => handleSelect("kitchen", "wood", e.target.value)} className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-orange-300" placeholder="填寫木柴數量或狀況..." />
                   </div>
                </div>
             </div>
          </section>

          {/* Section 4: 正聽與臥房 (合併為其他空間) */}
          <section className="bg-amber-50/50 p-6 rounded-2xl border border-amber-100 shadow-sm relative overflow-hidden">
             <h4 className="text-sm font-black text-amber-900 mb-6 flex items-center gap-2 border-b border-amber-200/50 pb-3">
                <span className="w-6 h-6 bg-amber-500 text-white rounded-lg flex items-center justify-center text-[10px]">04</span>
                大廳供桌與神明廳
             </h4>
             
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-8 p-4 bg-white/50 rounded-xl border border-amber-100">
                <div>
                   <label className="block text-xs font-bold text-amber-600 mb-2 uppercase">信眾生肖 (與紀錄關聯)</label>
                   <input type="text" value={formData.zodiac_note} onChange={e => setFormData({...formData, zodiac_note: e.target.value})} className="w-full bg-white border border-amber-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-amber-500" placeholder="填寫信眾生肖或其對應物件狀況..." />
                </div>
                <div>
                   <label className="block text-xs font-bold text-amber-600 mb-2 uppercase">供桌桌面形狀</label>
                   <div className="flex gap-2">
                     {["圓", "正方", "三角"].map(v => (
                       <button
                         key={v}
                         onClick={() => handleSelect(null, "table_shape", v)}
                         className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition border ${formData.table_shape === v ? 'bg-amber-600 text-white border-transparent shadow' : 'bg-white text-gray-400 border-gray-100'}`}
                       >{v}</button>
                     ))}
                   </div>
                </div>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8 mt-8">
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { id: 'candle', label: '點燃蠟燭' },
                    { id: 'altar', label: '供桌內容' },
                    { id: 'chair', label: '椅子舒適' },
                    { id: 'ceiling', label: '天花板' },
                    { id: 'floor', label: '地板清潔' },
                    { id: 'guardian', label: '守護神' },
                    { id: 'drawer', label: '抽屜狀況' }
                  ].map(item => (
                    <div key={item.id}>
                       <label className="block text-[10px] font-bold text-gray-400 mb-1">{item.label}</label>
                       <input 
                         type="text" 
                         value={formData.hall[item.id]} 
                         onChange={e => handleSelect("hall", item.id, e.target.value)} 
                         className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-amber-500" 
                       />
                    </div>
                  ))}
                </div>
                <div>
                   <label className="block text-xs font-bold text-amber-600 uppercase mb-3">元辰財庫金 (天地水庫)</label>
                   <div className="space-y-3 bg-white p-4 rounded-xl border border-amber-100">
                      {[
                        { id: 'tian_ku', label: '天庫 (靈魂能量)', color: 'text-green-600' },
                        { id: 'di_ku', label: '地庫 (現實財報)', color: 'text-amber-600' },
                        { id: 'shui_ku', label: '水庫 (流動運勢)', color: 'text-blue-500' }
                      ].map(ku => (
                        <button
                          key={ku.id}
                          onClick={() => handleToggle("hall", ku.id)}
                          className={`w-full flex items-center justify-between p-2 rounded-lg border transition ${formData.hall[ku.id] ? 'bg-amber-50 border-amber-300' : 'bg-gray-50 border-transparent text-gray-400'}`}
                        >
                           <span className={`text-xs font-black ${formData.hall[ku.id] ? ku.color : ''}`}>{ku.label}</span>
                           <span className={`w-10 h-5 rounded-full relative transition-all ${formData.hall[ku.id] ? 'bg-amber-500' : 'bg-gray-300'}`}>
                              <span className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${formData.hall[ku.id] ? 'right-1' : 'left-1'}`}></span>
                           </span>
                        </button>
                      ))}
                   </div>
                </div>
             </div>

             <div className="border-t border-amber-200/50 pt-6 mt-4">
                <h4 className="text-xs font-bold text-amber-700 uppercase mb-4 tracking-widest flex items-center gap-2"><span>🏠</span> 靜謐臥房細部</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                   <div className="space-y-4">
                      <div>
                         <label className="block text-[10px] font-bold text-gray-400 mb-1">床鋪細節</label>
                         <input type="text" value={formData.bedroom.bed} onChange={e => handleSelect("bedroom", "bed", e.target.value)} className="w-full bg-white border border-amber-100 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-amber-500" placeholder="整潔度、是否有灰塵..." />
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {[
                          { id: 'pillow', label: '枕頭' },
                          { id: 'quilt', label: '棉被' },
                          { id: 'slippers', label: '拖鞋' },
                          { id: 'small_pillow', label: '小枕頭' }
                        ].map(item => (
                          <button
                            key={item.id}
                            onClick={() => handleToggle("bedroom", item.id)}
                            className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition border ${formData.bedroom[item.id] ? 'bg-amber-600 text-white border-transparent' : 'bg-white text-gray-400 border-gray-100 hover:border-amber-200'}`}
                          >
                             {item.label}
                          </button>
                        ))}
                      </div>
                   </div>
                   <div className="grid grid-cols-2 gap-4">
                      <div>
                         <label className="block text-[10px] font-bold text-gray-400 mb-1">窗戶狀態</label>
                         <div className="flex bg-gray-100 p-1 rounded-lg">
                           {["開", "沒開"].map(v => (
                             <button key={v} onClick={() => handleSelect("bedroom", "window", v)} className={`flex-1 py-1 rounded text-[10px] font-bold transition ${formData.bedroom.window === v ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400'}`}>{v}</button>
                           ))}
                         </div>
                      </div>
                      <div>
                         <label className="block text-[10px] font-bold text-gray-400 mb-1">花瓶花色</label>
                         <select value={formData.bedroom.vase} onChange={e => handleSelect("bedroom", "vase", e.target.value)} className="w-full bg-white border border-amber-100 rounded-lg px-2 py-1.5 text-[10px] font-bold outline-none">
                            {["無花", "紅花", "黑花"].map(v => <option key={v} value={v}>{v}</option>)}
                         </select>
                      </div>
                   </div>
                </div>
             </div>
          </section>

          {/* Master Suggestions */}
          <section className="bg-gray-900 p-6 rounded-2xl border border-gray-700 shadow-xl relative overflow-hidden">
             <div className="absolute top-0 right-0 p-4 opacity-10">
                <svg className="w-12 h-12 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
             </div>
             <h4 className="text-sm font-black text-amber-400 mb-4 flex items-center gap-2">師傅法教與建議事項 (法會交代)</h4>
             <textarea 
               rows={6} 
               value={formData.advice} 
               onChange={e => setFormData({...formData, advice: e.target.value})}
               className="w-full bg-gray-800/80 border border-gray-700 rounded-xl p-4 text-white text-sm outline-none focus:ring-2 focus:ring-amber-500 shadow-inner"
               placeholder="請輸入神明指示、需化解事項或建議信眾回宮日期..."
             ></textarea>
          </section>

        </div>

        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 w-full max-w-4xl px-4 z-40">
           <button 
             onClick={() => onSubmit(formData)}
             disabled={isSaving}
             className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black py-4 rounded-2xl shadow-[0_10px_30px_rgba(79,70,229,0.4)] transition transform hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-3 animate-in slide-in-from-bottom-5 duration-700"
           >
             {isSaving ? (
               <span className="flex items-center gap-2 animate-pulse">
                  <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                  正在將觀修數據歸檔中...
               </span>
             ) : (
               <>
                 <span className="text-lg">🗄️</span> 
                 <span className="tracking-widest">儲存元辰宮觀修紀錄 (入庫歸檔)</span>
               </>
             )}
           </button>
        </div>

      </div>
    </div>
  );
}
