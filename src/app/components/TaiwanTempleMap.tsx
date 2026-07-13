"use client";

import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css';
import 'leaflet-defaulticon-compatibility';

const regionCoordinates: Record<string, [number, number]> = {
  '基隆': [25.1276, 121.7392],
  '台北': [25.0330, 121.5654],
  '新北': [25.0110, 121.4653],
  '桃園': [24.9936, 121.3010],
  '新竹': [24.8138, 120.9675],
  '苗栗': [24.5602, 120.8214],
  '台中': [24.1477, 120.6736],
  '彰化': [24.0518, 120.5393],
  '南投': [23.9037, 120.6839],
  '雲林': [23.7092, 120.4313],
  '嘉義': [23.4801, 120.4491],
  '台南': [22.9999, 120.2269],
  '高雄': [22.6273, 120.3014],
  '屏東': [22.6719, 120.4862],
  '花蓮': [23.9770, 121.6068],
  '台東': [22.7583, 121.1444],
  '宜蘭': [24.7315, 121.7627],
  '澎湖': [23.5711, 119.5793],
  '金門': [24.4492, 118.3771],
  '連江': [26.1505, 119.9334],
  '其他': [23.6978, 120.9605],
};

interface MapProps {
  distribution: { region: string; count: number }[];
}

export default function TaiwanTempleMap({ distribution }: MapProps) {
  const [mapId, setMapId] = useState("");

  useEffect(() => {
    // 解決 React 18 嚴格模式下 Leaflet MapContainer 雙重掛載導致的 appendChild 錯誤
    // 透過在每次 useEffect 觸發時給予全新的 mapId，強制 MapContainer 徹底重新渲染
    setMapId(Math.random().toString());
    
    // 解決 Leaflet 圖標載入的預設問題
    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
      iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
    });
  }, []);

  if (!mapId) return <div style={{ minHeight: '300px' }} className="w-full h-full flex items-center justify-center text-slate-400">Loading Map...</div>;

  return (
    <div className="w-full h-full rounded-[40px] overflow-hidden relative z-10 isolate" style={{ minHeight: '300px' }}>
      <MapContainer
        key={mapId}
        center={[23.6978, 120.9605]} // 台灣中心
        zoom={7}
        scrollWheelZoom={true}
        style={{ height: '100%', width: '100%', background: '#f8fafc' }} // Tailwind slate-50 色系
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        />
        
        {distribution.map((item, idx) => {
          const position = regionCoordinates[item.region] || regionCoordinates['其他'];
          
          // 使用自訂 HTML Icon，創造質感茅點 (Pulse effect)
          const customIcon = L.divIcon({
            className: 'custom-div-icon bg-transparent border-none', // 移除預設的白底與邊框
            html: `
              <div class="relative flex items-center justify-center w-10 h-10 -ml-2 -mt-2">
                <div class="absolute inline-flex w-full h-full rounded-full opacity-60 animate-ping bg-indigo-500"></div>
                <div class="relative inline-flex items-center justify-center w-6 h-6 text-[10px] font-black text-white rounded-full bg-indigo-600 shadow-[0_0_15px_rgba(79,70,229,0.8)] border border-indigo-300">
                  ${item.count}
                </div>
              </div>
            `,
            iconSize: [40, 40],
            iconAnchor: [20, 20],
          });

          return (
            <Marker key={idx} position={position} icon={customIcon}>
              <Popup className="rounded-2xl">
                <div className="font-sans text-center px-2 py-1">
                  <div className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mb-1">Region</div>
                  <div className="text-xl font-black text-slate-800 mb-1">{item.region}</div>
                  <div className="text-sm font-bold text-slate-500">活動宮廟: <span className="text-indigo-600 font-black text-lg">{item.count}</span> 間</div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}
