#!/bin/bash

# ========================================================================
# 宮廟管理系統 v10 部署腳本 (Safe Deployment Script)
# 
# 這個腳本用來在 Linux 正式環境安全地更新應用程式與資料庫結構，
# 保證絕對不會重置 (Reset) 或清空 (Truncate) 任何正式資料庫內容。
# ========================================================================

echo "開始部署..."

# 1. 確保拿到最新的程式碼
echo "正在拉取最新程式碼..."
git pull origin main

# 2. 安裝最新套件
echo "安裝 NPM 套件..."
npm install

# 3. 重新產生 Prisma Client，確保 ORM Mapping 更新
echo "產生 Prisma Client..."
npx prisma generate

# 4. 安全地執行資料庫遷移
# 注意：絕對禁止在這裡使用 `npx prisma migrate dev` 或 `npx prisma db push`
#       使用 `migrate deploy` 會確保只執行尚未執行過的 migration sql 檔，不會重置資料。
echo "執行資料庫安全遷移 (migrate deploy)..."
npx prisma migrate deploy

# 5. Build 專案
echo "建置 Next.js 應用程式..."
npm run build

# 6. 重啟服務 (使用 pm2)
echo "重新啟動 pm2 服務..."
pm2 reload all

echo "部署完成！"
