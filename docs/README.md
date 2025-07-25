# Markdown 投影片產生器

🚀 使用 AI 快速生成專業投影片的現代化應用

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-15-black?style=for-the-badge&logo=next.js&logoColor=white" alt="Next.js"/>
  <img src="https://img.shields.io/badge/React-18-blue?style=for-the-badge&logo=react&logoColor=white" alt="React"/>
  <img src="https://img.shields.io/badge/TypeScript-5-blue?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript"/>
  <img src="https://img.shields.io/badge/Tailwind-3-cyan?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind"/>
  <img src="https://img.shields.io/badge/OpenAI-GPT--4-green?style=for-the-badge&logo=openai&logoColor=white" alt="OpenAI"/>
</p>

## ✨ 功能特色

- 🤖 **AI 驅動生成** - 使用 OpenAI GPT 模型自動生成投影片內容
- ✏️ **即時編輯預覽** - Markdown 編輯器與投影片預覽即時同步
- 🎨 **多樣主題選擇** - 內建多種專業投影片主題
- 📱 **響應式設計** - 支援桌面、平板、手機多種裝置
- 📤 **多格式匯出** - 支援 HTML、PDF、PPTX、Markdown 格式
- 🌙 **深色模式** - 明亮/深色/系統主題切換
- ⚡ **高效快取** - 智慧快取機制提升使用體驗
- 🔧 **進階功能** - 語法高亮、自動縮排、快捷鍵支援

## 🏗️ 技術架構

```
前端框架: Next.js 15 + React 18 + TypeScript
樣式系統: Tailwind CSS + 響應式設計
狀態管理: Zustand + React Context
投影片引擎: Marp Core
AI 服務: OpenAI API (GPT-4/3.5-turbo)
```

## 🚀 快速開始

### 系統需求

- Node.js 18.0.0 或更高版本
- npm 8.0.0 或 yarn 1.22.0+
- 有效的 OpenAI API 金鑰

### 安裝步驟

1. **克隆專案**

```bash
git clone <repository-url>
cd markdown-slide-generator
```

2. **安裝依賴**

```bash
npm install
```

3. **環境設置**

```bash
cp .env.example .env.local
```

編輯 `.env.local` 檔案：

```env
# 可選：OpenAI API 金鑰（也可在應用內設置）
OPENAI_API_KEY=sk-your-openai-api-key-here

# 應用設置
NEXT_PUBLIC_APP_ENV=development
NEXT_PUBLIC_DEBUG=true
```

4. **啟動應用**

```bash
npm run dev
```

5. **開啟瀏覽器**
   - 開發模式：http://localhost:3000

## 📖 使用說明

### 1. 設置 API 金鑰

- 在應用右上角點擊設定按鈕 ⚙️
- 輸入您的 OpenAI API 金鑰
- 金鑰格式：`sk-...`

### 2. 生成投影片

- 點擊「生成投影片」按鈕
- 輸入投影片主題（例如：「React 入門教學」）
- 選擇模型、風格、語言等設置
- 點擊「生成」等待結果

### 3. 編輯內容

- 在左側編輯器中修改 Markdown 內容
- 右側預覽會即時更新
- 使用工具列按鈕快速格式化文字
- 支援快捷鍵：Ctrl+B（粗體）、Ctrl+I（斜體）等

### 4. 預覽投影片

- 使用右側預覽面板檢視投影片
- 點擊導航按鈕切換投影片
- 測試不同主題效果
- 支援全螢幕預覽模式

### 5. 匯出檔案

- 點擊「匯出」按鈕
- 選擇所需格式：HTML、PDF、PPTX、Markdown
- 自訂檔案名稱和選項
- 下載生成的檔案

## 🎨 主題預覽

| 主題名稱     | 適用場景 | 特色                   |
| ------------ | -------- | ---------------------- |
| **Default**  | 通用簡報 | 簡潔明亮，適合各種主題 |
| **Gaia**     | 現代設計 | 時尚漸層，視覺衝擊力強 |
| **Uncover**  | 商務簡報 | 專業穩重，適合正式場合 |
| **Academic** | 學術研究 | 學術風格，適合論文發表 |

## 📝 Markdown 語法支援

````markdown
# 主標題

## 副標題

### 小標題

**粗體文字** 和 _斜體文字_

- 項目符號列表
- 另一個項目

1. 有序列表
2. 編號項目

> 引用文字

`內聯程式碼`

```javascript
// 程式碼區塊
function hello() {
  console.log('Hello World!');
}
```
````

[連結文字](URL)

---

# 新投影片分隔符

````

## 🔧 進階設置

### 自訂主題
可以在預覽工具列中選擇不同主題，或在匯出時指定主題。

### API 設置選項
- **模型選擇**：GPT-4o、GPT-4o-mini、GPT-3.5-turbo
- **目標受眾**：初學者、中級、進階、專家
- **投影片格式**：簡報、教學、工作坊、學術
- **語調風格**：正式、休閒、學術、友善

### 匯出選項
- **檔案格式**：HTML、PDF、PPTX、Markdown
- **投影片尺寸**：標準、寬螢幕
- **品質設置**：低、中、高
- **包含選項**：備註、頁碼、頁首頁尾

## 🛠️ 開發模式

### 開發指令
```bash
npm run dev          # 啟動開發伺服器
npm run build        # 建置生產版本
npm run start        # 啟動生產模式
npm run lint         # 程式碼品質檢查
npm run type-check   # TypeScript 類型檢查
````

### 項目結構

```
src/
├── app/           # Next.js 應用路由
├── components/    # React 組件
├── contexts/      # React Context
├── hooks/         # 自訂 Hooks
├── lib/           # 工具函數與核心邏輯
├── stores/        # 狀態管理
└── types/         # TypeScript 類型定義
```

## 📚 文檔

- **[用戶手冊](./用戶手冊.md)** - 詳細的功能使用說明
- **[開發者指南](./開發者指南.md)** - 技術架構與開發指南
- **[API 文檔](./開發者指南.md#api-文檔)** - API 端點詳細說明

## 🤝 貢獻

歡迎貢獻代碼！請閱讀 [開發者指南](./開發者指南.md#貢獻指南) 了解詳細的貢獻流程。

1. Fork 此專案
2. 創建功能分支：`git checkout -b feature/amazing-feature`
3. 提交變更：`git commit -m 'feat: add amazing feature'`
4. 推送分支：`git push origin feature/amazing-feature`
5. 開啟 Pull Request

## 📄 授權

本專案採用 MIT 授權條款 - 詳見 [LICENSE](LICENSE) 檔案

## 🆘 支援

如果遇到問題：

1. 查看 [用戶手冊](./用戶手冊.md#故障排除) 的故障排除部分
2. 檢查 [Issues](../../issues) 中是否有類似問題
3. 創建新的 Issue 描述問題詳情

## 🔗 相關連結

- [Marp 官方網站](https://marp.app/) - Markdown 投影片引擎
- [OpenAI API 文檔](https://platform.openai.com/docs) - AI 生成服務
- [Next.js 文檔](https://nextjs.org/docs) - 前端框架
- [Tailwind CSS](https://tailwindcss.com/) - CSS 框架

---

<p align="center">
  <b>使用 ❤️ 和 ☕ 製作</b>
</p>
