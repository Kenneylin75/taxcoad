// 本文件為備用參考資料，目前系統已全面改用 PostgreSQL 資料庫，不再使用此處的 Mock Data。
// 僅保留作未來擴充資料庫欄位或設計介面結構時的參考。

export const mockTemples = [
  {
    id: "t-1",
    name: "測試宮廟",
    templeName: "測試宮廟",
    account: "admin",
    password: "password",
    region: "北區",
    city: "台北市",
    address: "測試路1號",
    phone: "02-12345678",
    status: "Active",
    setupFee: 10000,
    monthlyRent: 1000,
    paymentCycle: "Monthly",
    distributorId: "d-1",
    salesId: "s-1",
    createdAt: new Date().toISOString(),
  }
];

export const mockGuests = [
  {
    id: "g-1",
    templeId: "t-1",
    name: "測試信眾",
    phone: "0912345678",
    gender: "男",
    birthday: "1980-01-01",
    address: "台北市信義區",
    status: "Active",
    createdAt: new Date().toISOString(),
  }
];

export const mockLampRecords = [
  {
    id: "l-1",
    templeId: "t-1",
    categoryId: "c-1",
    categoryName: "光明燈",
    guestId: "g-1",
    guestName: "測試信眾",
    phone: "0912345678",
    actualPrice: 500,
    paymentStatus: "Paid",
    status: "Active",
    createdAt: new Date().toISOString(),
  }
];

export const mockQueueEvents = [
  {
    id: "q-1",
    templeId: "t-1",
    title: "每日問事",
    date: new Date().toISOString().split('T')[0],
    startTime: "09:00",
    endTime: "12:00",
    location: "正殿",
    serviceType: "一般問事",
    price: 300,
    maxCapacity: 50,
    status: "Active",
  }
];

export const mockFinanceRecords = [
  {
    id: "f-1",
    templeId: "t-1",
    type: "INCOME",
    category: "SERVICE",
    amount: 1000,
    source: "問事服務",
    date: new Date(),
  }
];

export const mockSystemConfig = {
  id: "cfg-1",
  key: "GLOBAL_SETTINGS",
  value: {
    maintenance: false,
    version: "1.0.0"
  }
};
