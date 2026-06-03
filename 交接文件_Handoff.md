# 全方位雲端宮廟管理系統 - 核心工程師交接白皮書 (Developer Handoff Guide)

嗨！接手的工程師您好！這份文件將幫助您在最短時間內，無痛接手並完成本系統的正式商轉部署。

目前的系統已經完成了 **95% 的核心業務邏輯與前端 UI (App Router 架構)**。
您接下來唯一的任務就是**「拔除記憶體假資料，接上真實的關聯式資料庫」**以及**「將金流/推播 API 填入正式鑰匙」**。

---

## 🏗️ 第一部分：系統架構總覽 (Architecture)

本系統使用 **Next.js (App Router)** 開發，並採用**企業級多租戶 (Multi-tenant) 路由架構**。

### 路由對照表
*   `src/app/[templeId]/admin/*`：**各宮廟專屬的「管理後台」**。所有預約、點燈、法會設定皆在此處操作。
*   `src/app/[templeId]/page.tsx`：**各宮廟專屬的「信眾前台 (Guest App)」**。信眾會透過此專屬網址進行報名與結帳。
*   `src/app/[templeId]/login/page.tsx`：**信眾專屬登入頁面**。
*   `src/app/admin/*` 或 `src/app/super-admin/*`：**超級管理員 / 系統經銷商總後台**。負責開通新宮廟帳號。

👉 **注意**：系統是靠著 URL 的 `[templeId]` 來區分不同宮廟的資料，當信眾進入 `/[templeId]` 時，系統會在 HTTP-only Cookie 中寫入 `templeId`，供後續 API 呼叫使用。

---

## 💾 第二部分：資料庫替換指南 (Database Migration)

目前所有的資料存取都集中在 **`src/app/actions.ts`** 這支檔案中，採用的是 `In-Memory Arrays` (記憶體陣列)。
在 VPS 重啟時，這些陣列會全部清空。因此您的首要任務是將其替換為 Prisma ORM。

### 步驟 1：匯入 Prisma Schema
我已經為您寫好了一份 `schema.prisma`。
1. 請執行 `npm install prisma -D` 與 `npm install @prisma/client`
2. 將 `schema.prisma` 放入 `prisma/` 資料夾中。
3. 執行 `npx prisma db push`，就能立刻在您的 PostgreSQL 建立好所有關聯式資料表！

### 步驟 2：改寫 `actions.ts` 內的函數
打開 `src/app/actions.ts`，您會看到很多類似以下的寫法：

**【修改前 (In-Memory 版)】**
```typescript
let db_appointments: any[] = initGlobal("db_appointments", []);

export async function bookAppointment(fd: FormData) {
  // ... 略過參數解析
  const newAppointment = { id: Date.now().toString(), templeId, guestId, amount };
  db_appointments.push(newAppointment);
  return { success: true };
}
```

**【修改後 (Prisma 版)】**
您只需將陣列的 `push`, `find`, `filter` 替換為 Prisma 語法即可（完全不需要動到 React 元件！）：
```typescript
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export async function bookAppointment(fd: FormData) {
  // ... 略過參數解析
  await prisma.appointment.create({
    data: { templeId, guestId, amount }
  });
  return { success: true };
}
```

---

## 💳 第三部分：金流與 API 串接點 (API Integrations)

### 1. 綠界科技 / LINE Pay
*   **路徑**：`src/app/api/payment/ecpay/route.ts` 與 `src/app/api/payment/linepay/route.ts`
*   **現狀**：目前為了方便前端測試，結帳流程可能導向我們自製的 `mock-gateway` 或直接回傳成功。
*   **任務**：請在環境變數 (`.env`) 中填入正式的 HashKey 等參數，並在此路由實作真實的 SDK 呼叫與金流回傳 (ReturnURL) 邏輯。

### 2. LINE 推播通知
*   **路徑**：請搜尋 `actions.ts` 中的 `pushNotificationToLine` 函數。
*   **現狀**：目前該函數只是一個空白的 `console.log` 佔位符。
*   **任務**：請串接 LINE Messaging API (Message Push)，讀取使用者的 `lineId`，並透過官方帳號發送真實的預約成功推播。

---

## 🚀 第四部分：VPS 部署建議 (Deployment)

1. 請使用 **PM2** 來守護 Next.js 的 Node 執行緒，確保其穩定常駐。
2. 資料庫強烈建議使用 **PostgreSQL**，能完美支援 Prisma 以及我們系統複雜的關聯邏輯。
3. 如果 VPS 記憶體 (RAM) 小於 2GB，請在編譯 `npm run build` 時留意 Node 的記憶體上限設定。

祝您接手順利！這是一套體質極佳的現代化 Web App，期待在您的手上正式上線運轉！
