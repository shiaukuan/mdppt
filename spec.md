# Markdown 投影片產生器 — 技術規格

## 1. 目的與範圍

建立一個網頁應用程式，使使用者能 **產生、編輯、預覽並匯出以 Markdown 撰寫的投影片**。\
MVP 聚焦於：

- 透過 OpenAI 模型，由主題提示產生投影片 Markdown。
- 分割檢視編輯器 —— 左側：可編輯 Markdown；右側：使用 Marp 的即時投影片預覽。
- 匯出為 PPTX（中優先）。
- 主題切換（低優先），為後續擴充預留。

## 2. 利害關係人與角色

| 角色                           | 需求                                            |
| ------------------------------ | ----------------------------------------------- |
| **終端使用者（教師／開發者）** | 能快速建立教學投影片、UI 流程簡潔。             |
| **開發團隊**                   | 清晰 API 契約、可擴充架構、完善測試、便利維護。 |
| **產品負責人**                 | 低維運成本，架構可隨後端系統成長。              |

## 3. 需求

### 3.1 功能性

| ID   | 描述                                                          | 優先級 |
| ---- | ------------------------------------------------------------- | ------ |
| FR-1 | 輸入主題 + OpenAI API Key → 由 ChatGPT 產生 Markdown 投影片   | 高     |
| FR-2 | 分割檢視：左側 Markdown 編輯器，右側 Marp 即時預覽            | 高     |
| FR-3 | 提供預設 Prompt 範本（包含 `---` 分頁、程式碼區塊、圖片標記） | 高     |
| FR-4 | 將目前 Markdown 匯出為 PPTX                                   | 中     |
| FR-5 | 投影片主題（Theme）切換                                       | 低     |

### 3.2 非功能性

- **效能**：初始頁面 TTFB < 1.5 s；預覽重新渲染 < 300 ms（≤ 40 張投影片）。
- **安全**：使用者 API Key 不落地至後端；渲染結果防 XSS。
- **成本意識**：對相同請求 1 小時內去重；顯示 Token 使用量。
- **無障礙**：符合 WCAG AA 對比度；編輯器可鍵盤導航。

## 4. 高階架構

```text
┌────────────┐        POST /api/v1/slides (Next.js Route Handler)
│   Client   │ ───────────────────────────────────────────────▶ GPT Proxy
│  (Next.js) │                                           ┌─────────────┐
│            │ ◀──────── markdown + meta ─────────────── │  OpenAI API │
└────────────┘                                           └─────────────┘
   │  live preview (Marp-Core)                                  ▲
   └───────────── PPTX binary (via /api/v1/export) ──────────────┘
```

- **前端（Next.js 15）** — 使用 React Server Components，編輯器區塊為 Client Component。
- **Route Handler** — `/api/v1/*` 為薄控制器；日後可抽換成獨立後端服務。
- **Marp Core** — 用於 client 端即時預覽；在 `/api/v1/export` 伺服器端產生 PPTX。

## 5. 資料流程

1. 使用者輸入 Topic 與 API Key → 點擊 _Generate_。
2. 前端 POST 至 `/api/v1/slides` → 伺服器代理 → OpenAI → 回傳 Markdown + token 統計。
3. Markdown 放入編輯器；預覽窗以 debounce 重新執行 `marp.render`。
4. 使用者可編輯；點擊 _Export_ 呼叫 `/api/v1/export`（markdown → pptxgenjs）→ 下載檔案。

## 6. API 契約

### 6.1 產生投影片 — `POST /api/v1/slides`

```jsonc
{
  "topic": "python 爬蟲", // 必填
  "model": "gpt-4o-mini", // 選填，預設 "gpt-4o"
  "maxPages": 15, // 選填
  "style": "default", // 選填：default | dark | ...
  "includeCode": true, // 選填
  "includeImages": false, // 選填
}
```

**成功 200**

```jsonc
{
  "id": "sl_12345",
  "markdown": "---\\n# Python 爬蟲…",
  "tokenUsage": { "prompt": 123, "completion": 456, "total": 579 },
  "createdAt": "2025-07-23T10:00:00Z",
}
```

**失敗範例**

```jsonc
{ "error": "MESSAGE", "code": "INVALID_MODEL" }
```

常見 `code`：`INVALID_INPUT`, `OPENAI_ERROR`, `RATE_LIMIT`, `INTERNAL_ERROR`。

### 6.2 匯出投影片 — `POST /api/v1/export`

```jsonc
{ "markdown": "…", "format": "pptx" }
```

_回傳_：Binary 檔流（`Content-Disposition: attachment; filename=deck.pptx`）。

## 7. Prompt 範本（預設）

````md
You are SlideBuilderGPT. Produce a Markdown slide deck for the topic **{{topic}}**.
Rules:

- Use `---` to separate slides.
- First slide: title only.
- Each slide ≤ 5 bullet points.
- Insert code blocks where helpful (```lang).
- Use `![alt](image_url)` placeholders if `includeImages` is true.
- Maximum {{maxPages}} slides.
- Language: same as the topic language.
- End with a summary slide.
````

（前端在呼叫 `/api/v1/slides` 前插入變數。）

## 8. 安全與成本控制

| 領域         | 策略                                                      |
| ------------ | --------------------------------------------------------- |
| API Key 處理 | 僅存在 `localStorage` (`sg_user_key`)，不寫後端、不記錄。 |
| Rate limit   | 中介層限制 `/api/v1/slides` 每 IP 每分鐘 5 次。           |
| 快取         | 以 SHA-256(topic+options) 為鍵，Redis TTL 1 小時。        |
| XSS          | 使用 `DOMPurify` 清理產生的 HTML 預覽。                   |

## 9. 錯誤處理與 UX

- Toast 顯示 `error.message`。
- 網路錯誤提供重試提示。
- _Generate_ 進行中按鈕灰化。
- 編輯器下方顯示 token 使用量與預估成本。

## 10. 技術選型

- **Next.js 15** + TypeScript 5。
- **編輯器**：`<textarea>` + `highlight.js`（輕量），日後可升級 Monaco。
- **Marp Core**：`@marp-team/marp-core` 用 dynamic import 以確保 SSR 安全。
- **匯出**：Route Handler 內使用 `pptxgenjs`（Node 環境）；未來 PDF 使用 headless Chromium。
- **狀態管理**：React Context 儲存設定；Zustand 保存編輯內容。
- **測試**：Jest + Supertest（API）、React Testing Library（元件）、Playwright（E2E）。

## 11. 部署

- Node 20 LTS。
- `Dockerfile` 基底 `node:20-alpine`。
- CI：GitHub Actions —— Lint、單元測試、建置、部署至 Vercel 或 Container Registry。

## 12. 測試計畫

| 層級 | 工具                  | 重點案例                               |
| ---- | --------------------- | -------------------------------------- |
| 單元 | Jest                  | Prompt 產生器、token 解析、錯誤對應器  |
| API  | Supertest             | 200 正常、400 無效、429 超速、500 例外 |
| 元件 | React Testing Library | 編輯器變更觸發預覽、錯誤 Toast         |
| E2E  | Playwright            | 整個建立→編輯→匯出流程，跨瀏覽器       |
| 壓力 | k6（可選）            | 50 個並發 `/api/v1/slides` 仍於限制內  |

---

**已可進入開發階段。**
