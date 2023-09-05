# 使用 Node.js 官方鏡像
FROM node:16.18-buster-slim

# 設定工作目錄
WORKDIR /app

# 複製 package.json 和 package-lock.json 到工作目錄
COPY package*.json ./

# 安裝依賴
RUN npm install

# 安裝 TypeScript
RUN npm install -g typescript

# 複製其他所有源代碼到工作目錄
COPY . .

# 編譯 TypeScript 到 JavaScript
RUN tsc

# 開放要使用的端口
EXPOSE 3000

# 執行應用
CMD [ "node", "dist/index.js" ]
