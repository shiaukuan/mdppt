# Markdown 投影片產生器 - 實作 Prompts

## 步驟 1：初始化 Next.js 專案

### 背景

我們正在建立一個 Markdown 投影片產生器，使用 Next.js 15、TypeScript 5，並採用 App Router。這是專案的第一步。

### Prompt

```text
建立一個新的 Next.js 15 專案，具有以下配置：

1. 使用 TypeScript 5 和嚴格模式
2. 設定 App Router
3. 整合 Tailwind CSS
4. 配置 ESLint 和 Prettier
5. 建立以下資料夾結構：
   - src/app/ (路由)
   - src/components/ (UI 元件)
   - src/lib/ (工具函數和服務)
   - src/types/ (TypeScript 型別)
   - src/hooks/ (自訂 hooks)

請提供：
- package.json 完整配置
- tsconfig.json 嚴格設定
- .eslintrc.json 和 .prettierrc
- tailwind.config.ts
- .env.example (包含 OPENAI_API_KEY)
- 基本的 app/layout.tsx 和 app/page.tsx

確保專案可以使用 `npm run dev` 成功執行。
```

---

## 步驟 2：建立 API 路由骨架

### 背景

基於步驟 1 的專案結構，我們現在需要建立 API 路由的基礎架構。

### Prompt

```text
在現有的 Next.js 專案中，建立 API 路由結構：

1. 建立 app/api/v1/slides/route.ts
   - 支援 POST 方法
   - 回傳 JSON 格式
   - 包含基本的請求驗證

2. 建立 app/api/v1/export/route.ts
   - 支援 POST 方法
   - 準備回傳二進位資料

3. 建立共用的中介層：
   - src/lib/api/middleware.ts
   - 處理 CORS
   - 統一錯誤回應格式
   - 請求日誌記錄

4. 建立 API 回應工具：
   - src/lib/api/responses.ts
   - 標準化成功和錯誤回應

為每個檔案提供完整程式碼，包含適當的 TypeScript 型別。確保可以使用 curl 測試這些端點。
```

---

## 步驟 3：實作資料模型和型別定義

### 背景

有了 API 路由骨架後，我們需要定義清晰的資料結構和型別。

### Prompt

```text
建立完整的 TypeScript 型別系統：

1. 在 src/types/api.ts 中定義：
   - SlideGenerationRequest 介面
   - SlideGenerationResponse 介面
   - ExportRequest 介面
   - ErrorResponse 介面
   - TokenUsage 介面

2. 在 src/types/slides.ts 中定義：
   - Slide 資料結構
   - SlideTheme 列舉
   - SlideStyle 型別

3. 在 src/lib/constants.ts 中定義：
   - API 錯誤碼常數
   - 預設值（最大頁數、模型等）
   - Prompt 模板

4. 建立驗證工具 src/lib/validation.ts：
   - 請求資料驗證函數
   - 使用 zod 進行 schema 驗證

提供所有檔案的完整程式碼，確保型別安全且可擴充。
```

---

## 步驟 4：建立基礎 UI 佈局

### 背景

有了後端結構，現在建立前端的基礎佈局。

### Prompt

```text
實作主要的 UI 佈局結構：

1. 更新 app/page.tsx：
   - 建立分割檢視佈局（左側編輯器、右側預覽）
   - 使用 CSS Grid 或 Flexbox
   - 加入可調整的分割線

2. 建立 components/Layout/Header.tsx：
   - 應用程式標題
   - 主要操作按鈕區域
   - 響應式設計

3. 建立 components/Layout/SplitView.tsx：
   - 可重用的分割檢視容器
   - 支援垂直分割
   - 處理調整大小邏輯

4. 建立 components/Layout/Container.tsx：
   - 標準內容容器
   - 一致的間距和最大寬度

使用 Tailwind CSS 類別，確保響應式設計。提供所有元件程式碼。
```

---

## 步驟 5：OpenAI 整合 - 基礎

### 背景

佈局完成後，開始實作核心功能 - OpenAI 整合。

### Prompt

```text
建立 OpenAI 服務層：

1. 建立 src/lib/openai/client.ts：
   - OpenAI 客戶端包裝器
   - API Key 驗證
   - 錯誤處理和重試邏輯
   - 請求/回應日誌

2. 建立 src/lib/openai/prompts.ts：
   - Prompt 模板管理
   - 變數替換系統
   - 不同樣式的 prompt 變體

3. 建立 src/lib/openai/types.ts：
   - OpenAI 特定的型別定義
   - 完成選項介面
   - 錯誤型別

4. 編寫單元測試 src/lib/openai/__tests__/client.test.ts：
   - 測試 API Key 驗證
   - 測試錯誤處理
   - 模擬 API 回應

確保不會將 API Key 硬編碼，使用頁面輸入。提供完整的實作和測試。
API Key:sk-your-openai-api-key
```

---

## 步驟 6：實作投影片產生 API

### 背景

OpenAI 服務準備好後，實作完整的投影片產生端點。

### Prompt

```text
完成 /api/v1/slides 端點實作：

1. 更新 app/api/v1/slides/route.ts：
   - 整合 OpenAI 服務
   - 實作請求驗證
   - Token 使用追蹤
   - 錯誤處理

2. 建立 src/lib/cache/memory-cache.ts：
   - 簡單的記憶體快取實作
   - 使用 SHA-256 產生快取鍵
   - TTL 支援

3. 建立整合測試 app/api/v1/slides/__tests__/route.test.ts：
   - 測試成功產生
   - 測試驗證錯誤
   - 測試快取命中
   - 測試 OpenAI 錯誤

4. 加入請求範例和 cURL 測試命令

提供完整的實作，包含所有錯誤情況的處理。
```

---

## 步驟 7：前端狀態管理設定

### 背景

API 完成後，設定前端的狀態管理。

### Prompt

```text
實作狀態管理架構：

1. 建立 src/contexts/SettingsContext.tsx：
   - React Context for 應用程式設定
   - API Key 管理（從 localStorage）
   - 主題偏好設定
   - Provider 元件

2. 建立 src/stores/editorStore.ts：
   - 使用 Zustand 管理編輯器狀態
   - Markdown 內容
   - 編輯歷史（復原/重做）
   - 自動儲存邏輯

3. 建立自訂 hooks src/hooks/useLocalStorage.ts：
   - 類型安全的 localStorage hook
   - 支援 JSON 序列化
   - 錯誤處理

4. 建立 src/hooks/useDebounce.ts：
   - Debounce hook for 預覽更新
   - 可配置的延遲

整合到 app/layout.tsx，確保狀態在頁面重新載入後持續存在。
```

---

## 步驟 8：建立投影片產生表單

### 背景

狀態管理就緒，建立使用者介面來觸發投影片產生。

### Prompt

```text
實作投影片產生表單：

1. 建立 components/SlideGenerator/GeneratorForm.tsx：
   - 主題輸入欄位
   - 可折疊的進階選項
   - 模型選擇、頁數、樣式
   - 表單驗證

2. 建立 components/SlideGenerator/ApiKeyInput.tsx：
   - 安全的 API Key 輸入
   - 顯示/隱藏切換
   - 儲存到 localStorage
   - 驗證指示器

3. 建立 components/UI/Button.tsx：
   - 可重用的按鈕元件
   - 載入狀態
   - 變體（primary, secondary）
   - 無障礙屬性

4. 建立 components/UI/Input.tsx：
   - 基礎輸入元件
   - 錯誤狀態
   - 標籤和說明文字

5. 整合表單到主頁面，連接到 API

提供所有元件和整合程式碼。
```

---

## 步驟 9：Markdown 編輯器實作

### 背景

表單完成後，建立 Markdown 編輯器。

### Prompt

```text
建立功能完整的 Markdown 編輯器：

1. 建立 components/Editor/MarkdownEditor.tsx：
   - 基於 textarea 的編輯器
   - 行號顯示
   - 語法高亮（使用 highlight.js）
   - 自動縮排支援

2. 建立 components/Editor/EditorToolbar.tsx：
   - 基本格式化按鈕
   - 復原/重做
   - 插入投影片分隔符
   - 字數統計

3. 建立 src/lib/editor/markdown-utils.ts：
   - Markdown 處理工具
   - 投影片計數
   - 格式化輔助函數

4. 整合編輯器與 Zustand store：
   - 即時更新
   - 自動儲存
   - 歷史管理

確保編輯器效能良好，即使處理大型文件。
```

---

## 步驟 10：整合投影片產生流程

### 背景

連接所有部分，使產生流程運作。

### Prompt

```text
整合完整的投影片產生流程：

1. 建立 src/hooks/useSlideGeneration.ts：
   - 處理 API 呼叫
   - 載入和錯誤狀態
   - 成功時更新編輯器
   - Token 使用追蹤

2. 更新 components/SlideGenerator/GeneratorForm.tsx：
   - 連接到 useSlideGeneration
   - 顯示載入狀態
   - 錯誤處理
   - 成功回饋

3. 建立 components/UI/LoadingSpinner.tsx：
   - 載入動畫元件
   - 可選的載入文字

4. 建立 components/UI/TokenUsage.tsx：
   - 顯示 token 使用情況
   - 估計成本
   - 格式化數字

測試完整流程：輸入主題 → 呼叫 API → 更新編輯器。
```

---

## 步驟 11：Marp Core 整合準備

### 背景

準備整合 Marp 進行投影片預覽。

### Prompt

```text
設定 Marp Core 整合：

1. 建立 src/lib/marp/client.ts：
   - 動態匯入 Marp Core
   - 初始化 Marp 實例
   - 配置選項
   - SSR 安全包裝

2. 建立 src/lib/marp/themes.ts：
   - 預設主題定義
   - 主題載入邏輯
   - 自訂 CSS 支援

3. 建立 components/Preview/PreviewContainer.tsx：
   - 預覽容器元件
   - 錯誤邊界
   - 載入狀態
   - 'use client' 指令

4. 處理 Next.js 配置：
   - 更新 next.config.js
   - 處理 Marp 的 CSS 匯入
   - 確保客戶端渲染

提供所有必要的配置和程式碼。
```

---

## 步驟 12：實作即時預覽

### 背景

Marp 設定完成，實作即時預覽功能。

### Prompt

```text
建立功能完整的投影片預覽：

1. 建立 components/Preview/SlidePreview.tsx：
   - 整合 Marp 渲染
   - Debounced 更新
   - 投影片導航
   - 錯誤處理

2. 建立 components/Preview/PreviewControls.tsx：
   - 上一張/下一張按鈕
   - 投影片計數器
   - 全螢幕切換
   - 縮放控制

3. 更新 src/hooks/usePreview.ts：
   - 管理預覽狀態
   - 處理 Markdown 變更
   - 投影片導航邏輯

4. 整合預覽到主佈局：
   - 連接到編輯器
   - 同步滾動（可選）
   - 響應式行為

確保預覽即時更新且效能良好。
```

---

## 步驟 13：錯誤處理和 Toast 通知

### 背景

加入使用者友善的錯誤處理和通知。

### Prompt

```text
實作全面的錯誤處理系統：

1. 建立 components/UI/Toast.tsx：
   - Toast 通知元件
   - 成功/錯誤/資訊變體
   - 自動關閉
   - 堆疊多個 toasts

2. 建立 src/contexts/ToastContext.tsx：
   - Toast 管理 context
   - 顯示/隱藏 toasts
   - 佇列管理

3. 建立 components/ErrorBoundary.tsx：
   - React 錯誤邊界
   - 友善的錯誤訊息
   - 重試選項

4. 更新所有 API 呼叫和元件：
   - 加入適當的錯誤處理
   - 顯示有意義的錯誤訊息
   - 網路錯誤的重試邏輯

提供完整的錯誤處理整合。
```

---

## 步驟 14：PPTX 匯出基礎

### 背景

開始實作 PPTX 匯出功能。

### Prompt

```text
建立 PPTX 匯出基礎：

1. 建立 src/lib/export/pptx-generator.ts：
   - 整合 pptxgenjs
   - Markdown 解析邏輯
   - 投影片建立函數
   - 基本文字處理

2. 建立 src/lib/export/markdown-parser.ts：
   - 解析 Markdown 結構
   - 提取投影片內容
   - 識別標題和內容
   - 處理列表

3. 建立基本測試 src/lib/export/__tests__/：
   - 測試 Markdown 解析
   - 測試 PPTX 產生
   - 驗證輸出結構

4. 建立簡單的匯出按鈕整合

專注於基本文字投影片，進階功能留到下一步。
```

---

## 步驟 15：進階 PPTX 功能

### 背景

擴充 PPTX 匯出以支援更多功能。

### Prompt

```text
增強 PPTX 匯出功能：

1. 更新 src/lib/export/pptx-generator.ts：
   - 支援程式碼區塊（語法高亮）
   - 處理圖片佔位符
   - 套用樣式（粗體、斜體）
   - 不同的版面配置

2. 建立 src/lib/export/styles.ts：
   - 定義 PPTX 樣式
   - 顏色主題
   - 字型設定
   - 版面配置模板

3. 更新解析器以處理：
   - 巢狀列表
   - 表格（如果存在）
   - 連結
   - 區塊引用

4. 加入進度追蹤：
   - 匯出進度回呼
   - 取消支援

確保匯出的 PPTX 看起來專業且格式正確。
```

---

## 步驟 16：實作匯出 API 端點

### 背景

完成匯出 API 端點。

### Prompt

```text
完成 /api/v1/export 端點：

1. 更新 app/api/v1/export/route.ts：
   - 整合 PPTX 產生器
   - 處理大型 Markdown
   - 串流回應
   - 正確的標頭

2. 建立 components/Export/ExportButton.tsx：
   - 觸發匯出
   - 顯示進度
   - 處理下載
   - 錯誤處理

3. 建立 src/hooks/useExport.ts：
   - 管理匯出流程
   - 處理 blob 下載
   - 進度追蹤

4. 加入整合測試：
   - 測試不同的 Markdown 輸入
   - 驗證檔案下載
   - 錯誤情況

確保大型文件的匯出順暢。
```

---

## 步驟 17：安全性實作

### 背景

加入必要的安全措施。

### Prompt

```text
實作安全功能：

1. 建立 src/lib/security/rate-limiter.ts：
   - IP 基礎的速率限制
   - 記憶體儲存（開發用）
   - 可配置的限制

2. 建立 src/lib/security/sanitizer.ts：
   - 整合 DOMPurify
   - 清理預覽 HTML
   - 防止 XSS 攻擊

3. 更新 API 路由：
   - 加入速率限制中介層
   - 輸入驗證
   - 清理使用者內容

4. 建立 src/lib/security/validation.ts：
   - 增強輸入驗證
   - 檔案大小限制
   - 內容長度檢查

5. 加入安全標頭：
   - CSP 政策
   - CORS 配置
   - 安全 cookies

提供完整的安全實作。
```

---

## 步驟 18：Redis 快取整合

### 背景

升級到生產級快取。

### Prompt

```text
實作 Redis 快取：

1. 建立 src/lib/cache/redis-client.ts：
   - Redis 連線管理
   - 錯誤處理
   - 連線池

2. 建立 src/lib/cache/cache-service.ts：
   - 統一的快取介面
   - Redis 和記憶體快取切換
   - TTL 管理
   - 快取失效

3. 更新 API 路由以使用快取：
   - 快取鍵產生
   - 快取命中/未命中日誌
   - 條件式快取

4. 加入快取管理工具：
   - 清除快取端點
   - 快取統計
   - 監控 hooks

確保優雅地降級到記憶體快取。
```

---

## 步驟 19：主題系統

### 背景

實作投影片主題功能（低優先）。

### Prompt

```text
建立主題系統：

1. 建立 src/lib/themes/theme-definitions.ts：
   - 預設主題集合
   - 主題結構定義
   - 顏色和字型

2. 建立 components/Theme/ThemeSelector.tsx：
   - 主題選擇下拉選單
   - 即時預覽更新
   - 儲存偏好設定

3. 更新 Marp 和 PPTX：
   - 套用選定的主題
   - 主題 CSS 注入
   - PPTX 樣式對應

4. 建立自訂主題支援：
   - 主題編輯器（基本）
   - 匯入/匯出主題

保持簡單，專注於核心主題功能。
```

---

## 步驟 20：效能優化

### 背景

優化應用程式效能。

### Prompt

```text
實作效能優化：

1. 程式碼分割：
   - 動態匯入大型相依套件
   - 路由層級分割
   - 元件延遲載入

2. 優化重新渲染：
   - React.memo 適當使用
   - useMemo/useCallback
   - 虛擬化長列表

3. 資源優化：
   - 影像優化
   - 字型載入策略
   - CSS 優化

4. 建立效能監控：
   - Web Vitals 追蹤
   - 自訂效能指標
   - 效能預算

5. 套件優化：
   - 分析套件大小
   - Tree shaking
   - 移除未使用的程式碼

提供具體的優化實作和測量。
```

---

## 步驟 21-25：測試和部署

### 背景

最後階段專注於全面測試和部署準備。

### Prompt

```text
建立完整的測試套件和部署設定：

步驟 21 - 單元測試：
1. 設定 Jest 配置
2. 測試所有工具函數
3. 測試 React hooks
4. 測試 API 處理邏輯
5. 達到 80% 覆蓋率

步驟 22 - 整合測試：
1. 設定 Supertest
2. 測試所有 API 端點
3. 測試認證流程
4. 測試錯誤情況

步驟 23 - 元件測試：
1. 設定 React Testing Library
2. 測試所有互動元件
3. 測試表單驗證
4. 測試狀態更新

步驟 24 - E2E 測試：
1. 設定 Playwright
2. 測試完整使用者旅程
3. 跨瀏覽器測試
4. 響應式測試

步驟 25 - 部署：
1. 建立多階段 Dockerfile
2. GitHub Actions CI/CD
3. 環境配置
4. 部署文件
5. 監控設定

為每個測試層級提供範例測試和配置。
```

---

## 實作檢查清單

每個步驟完成後，確認：

- [ ] 程式碼可編譯且無 TypeScript 錯誤
- [ ] 新功能與現有程式碼整合
- [ ] 適當的錯誤處理
- [ ] 測試通過
- [ ] 效能可接受
- [ ] 無安全漏洞
- [ ] 程式碼已註解和文件化
- [ ] 可由其他開發者審查

## 下一步

1. 從步驟 1 開始實作
2. 每個步驟建立新分支
3. 完成後合併到主分支
4. 更新 todo.md 追蹤進度
5. 遇到問題時調整計劃
