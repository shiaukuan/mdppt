# 狀態管理架構指南

本文檔說明 Markdown Slide Generator 應用程式的完整狀態管理架構實作。

## 🏗️ 架構概覽

### 技術棧
- **React Context**: 應用程式全域設定和偏好
- **Zustand**: 編輯器狀態管理
- **LocalStorage**: 資料持久化
- **Custom Hooks**: 重用邏輯封裝

### 狀態分層
```
├── 應用程式層 (React Context)
│   ├── API Key 管理
│   ├── 主題設定
│   ├── 編輯器偏好
│   └── 一般設定
│
├── 編輯器層 (Zustand)
│   ├── Markdown 內容
│   ├── 編輯歷史
│   ├── UI 狀態
│   └── 錯誤處理
│
└── 持久化層 (LocalStorage)
    ├── 設定保存
    ├── 內容自動儲存
    └── 狀態恢復
```

## 📁 檔案結構

```
src/
├── contexts/
│   ├── SettingsContext.tsx    # 應用程式設定 Context
│   └── index.ts               # 匯出檔案
├── stores/
│   ├── editorStore.ts         # Zustand 編輯器 Store
│   └── index.ts               # 匯出檔案
├── hooks/
│   ├── useLocalStorage.ts     # LocalStorage Hook
│   ├── useDebounce.ts         # Debounce Hook
│   └── index.ts               # 匯出檔案
└── app/
    ├── layout.tsx             # Root Layout with Providers
    └── RootLayoutClient.tsx   # Client-side Layout Logic
```

## 🎯 核心元件詳解

### 1. SettingsContext (應用程式設定)

#### 功能
- API Key 管理和驗證
- 主題切換 (明亮/深色/系統)
- 編輯器偏好設定
- 應用程式一般設定

#### 使用範例
```typescript
import { useSettings, useApiKey, useTheme } from '@/contexts/SettingsContext';

function MyComponent() {
  const { settings, isLoading } = useSettings();
  const { apiKey, setApiKey, isValid } = useApiKey();
  const { theme, setTheme } = useTheme();
  
  return (
    <div>
      <p>目前主題: {theme}</p>
      <p>API Key 狀態: {isValid ? '有效' : '無效'}</p>
    </div>
  );
}
```

#### 設定結構
```typescript
interface AppSettings {
  openaiApiKey: string;
  theme: 'light' | 'dark' | 'system';
  editor: {
    fontSize: number;
    wordWrap: boolean;
    minimap: boolean;
    lineNumbers: boolean;
    tabSize: number;
  };
  preferences: {
    autoSave: boolean;
    previewDelay: number;
    defaultLanguage: string;
    defaultTemplateType: 'basic' | 'academic' | 'business' | 'creative';
    showWelcome: boolean;
  };
}
```

### 2. EditorStore (編輯器狀態)

#### 功能
- Markdown 內容管理
- 復原/重做歷史
- UI 狀態控制
- 自動儲存
- 錯誤處理

#### 使用範例
```typescript
import { 
  useEditorStore, 
  useMarkdown, 
  useEditorHistory, 
  useEditorUI 
} from '@/stores/editorStore';

function Editor() {
  const markdown = useMarkdown();
  const { canUndo, canRedo, undo, redo } = useEditorHistory();
  const { isPreviewVisible, togglePreview } = useEditorUI();
  const setMarkdown = useEditorStore(state => state.setMarkdown);
  
  return (
    <div>
      <button onClick={undo} disabled={!canUndo}>復原</button>
      <button onClick={redo} disabled={!canRedo}>重做</button>
      <button onClick={togglePreview}>
        {isPreviewVisible ? '隱藏' : '顯示'}預覽
      </button>
      <textarea 
        value={markdown}
        onChange={(e) => setMarkdown(e.target.value)}
      />
    </div>
  );
}
```

#### 狀態結構
```typescript
interface EditorState {
  // 內容狀態
  markdown: string;
  isModified: boolean;
  lastSaved: Date | null;
  
  // 編輯歷史
  history: {
    past: string[];
    present: string;
    future: string[];
  };
  
  // UI 狀態
  isPreviewVisible: boolean;
  isSplitView: boolean;
  isFullscreen: boolean;
  
  // 游標和選擇
  cursor: { line: number; column: number };
  selection: { start: Position; end: Position } | null;
  
  // 自動儲存狀態
  autoSave: {
    enabled: boolean;
    interval: number;
    lastAutoSave: Date | null;
  };
  
  // 錯誤狀態
  errors: Array<{
    line: number;
    message: string;
    type: 'error' | 'warning';
  }>;
}
```

### 3. Custom Hooks

#### useLocalStorage
類型安全的 localStorage 管理

```typescript
// 基本使用
const [value, setValue, removeValue] = useLocalStorage('key', defaultValue);

// 特化 hooks
const [apiKey, setApiKey] = useApiKeyStorage();
const [theme, setTheme] = useThemeStorage();
const [editorSettings, setEditorSettings] = useEditorSettingsStorage();
const [recentTopics, setRecentTopics] = useRecentTopicsStorage();
```

#### useDebounce
防抖處理和自動儲存

```typescript
// 值防抖
const debouncedValue = useDebounce(value, 300);

// 回調防抖
const debouncedCallback = useDebouncedCallback(callback, 500);

// 異步回調防抖
const [debouncedAsyncCallback, isExecuting] = useDebouncedAsyncCallback(
  asyncCallback, 
  1000
);

// 預覽防抖
const [debouncedMarkdown, isUpdating] = usePreviewDebounce(markdown, 300);

// 自動儲存
const { isSaving, lastSaved, forceSave } = useAutoSave(
  data, 
  saveFunction, 
  2000, 
  true
);
```

## 🔄 資料流程

### 1. 應用程式啟動流程
```
1. layout.tsx 載入 SettingsProvider
2. RootLayoutClient 檢查載入狀態
3. 從 localStorage 載入設定
4. 應用主題設定
5. 載入編輯器狀態
6. 渲染應用程式
```

### 2. 設定更新流程
```
用戶操作 → Context Action → State Update → localStorage Sync → UI Update
```

### 3. 編輯器內容流程
```
輸入內容 → Zustand Action → History Update → Auto Save → UI Update
```

### 4. 主題切換流程
```
用戶點擊 → Context Update → localStorage Save → CSS Class Update → 視覺變化
```

## 🛠️ 整合說明

### 在 layout.tsx 中的整合
```typescript
export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="zh-TW" suppressHydrationWarning>
      <body className="antialiased" suppressHydrationWarning>
        <SettingsProvider>
          <RootLayoutClient>{children}</RootLayoutClient>
        </SettingsProvider>
      </body>
    </html>
  );
}
```

### 主題系統整合
```typescript
// 自動應用主題類別到 document.documentElement
useEffect(() => {
  const root = window.document.documentElement;
  root.classList.remove('light', 'dark');
  
  if (theme === 'system') {
    const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches 
      ? 'dark' : 'light';
    root.classList.add(systemTheme);
  } else {
    root.classList.add(theme);
  }
}, [theme]);
```

### 自動儲存整合
```typescript
// Zustand 訂閱器自動儲存內容到 localStorage
useEditorStore.subscribe(
  (state) => state.markdown,
  () => {
    const state = useEditorStore.getState();
    if (state.autoSave.enabled) {
      state.saveToStorage();
    }
  }
);
```

## 🎨 使用模式

### 1. 新增設定項目
```typescript
// 1. 在 AppSettings 介面中新增屬性
interface AppSettings {
  // ... 現有設定
  newSetting: boolean;
}

// 2. 在 DEFAULT_SETTINGS 中提供預設值
const DEFAULT_SETTINGS = {
  // ... 現有預設值
  newSetting: false,
};

// 3. 在 SettingsContext 中新增更新函數
const updateNewSetting = (value: boolean) => {
  // 更新邏輯
};

// 4. 建立專用 hook (可選)
export function useNewSetting() {
  const { settings, updateNewSetting } = useSettings();
  return { value: settings.newSetting, setValue: updateNewSetting };
}
```

### 2. 新增編輯器功能
```typescript
// 1. 在 EditorState 中新增狀態
interface EditorState {
  // ... 現有狀態
  newFeature: boolean;
}

// 2. 在 EditorActions 中新增動作
interface EditorActions {
  // ... 現有動作
  toggleNewFeature: () => void;
}

// 3. 在 Store 中實作動作
toggleNewFeature: () => {
  set((state) => {
    state.newFeature = !state.newFeature;
  });
},

// 4. 建立選擇器 hook
export const useNewFeature = () => useEditorStore((state) => ({
  isEnabled: state.newFeature,
  toggle: state.toggleNewFeature,
}));
```

### 3. 新增 LocalStorage Hook
```typescript
export function useCustomStorage<T>(key: string, defaultValue: T) {
  return useLocalStorage(key, defaultValue, {
    onError: (error) => {
      console.error(`Custom storage error for ${key}:`, error);
    },
  });
}
```

## 🧪 測試建議

### Context 測試
```typescript
import { render, screen } from '@testing-library/react';
import { SettingsProvider, useSettings } from '@/contexts/SettingsContext';

function TestComponent() {
  const { isApiKeyValid } = useSettings();
  return <div>{isApiKeyValid() ? '有效' : '無效'}</div>;
}

test('should validate API key', () => {
  render(
    <SettingsProvider>
      <TestComponent />
    </SettingsProvider>
  );
  expect(screen.getByText('無效')).toBeInTheDocument();
});
```

### Store 測試
```typescript
import { renderHook, act } from '@testing-library/react';
import { useEditorStore } from '@/stores/editorStore';

test('should update markdown content', () => {
  const { result } = renderHook(() => useEditorStore());
  
  act(() => {
    result.current.setMarkdown('# Hello World');
  });
  
  expect(result.current.markdown).toBe('# Hello World');
  expect(result.current.isModified).toBe(true);
});
```

### Hooks 測試
```typescript
import { renderHook } from '@testing-library/react';
import { useDebounce } from '@/hooks/useDebounce';

test('should debounce value updates', async () => {
  const { result, rerender } = renderHook(
    ({ value, delay }) => useDebounce(value, delay),
    { initialProps: { value: 'initial', delay: 100 } }
  );
  
  expect(result.current).toBe('initial');
  
  rerender({ value: 'updated', delay: 100 });
  expect(result.current).toBe('initial'); // Still old value
  
  await new Promise(resolve => setTimeout(resolve, 150));
  expect(result.current).toBe('updated'); // Now updated
});
```

## 🔧 維護指南

### 性能優化
1. **選擇器優化**: 使用具體的 Zustand 選擇器避免不必要的重新渲染
2. **Context 分割**: 將頻繁變化的狀態從不常變化的設定中分離
3. **記憶化**: 對複雜計算使用 useMemo 和 useCallback

### 除錯技巧
1. **Redux DevTools**: Zustand 支援 Redux DevTools 擴展
2. **Console 日誌**: 在關鍵狀態變化處添加 console.log
3. **React DevTools**: 使用 React DevTools 檢查 Context 和狀態

### 常見問題
1. **SSR 問題**: 使用 suppressHydrationWarning 處理 localStorage 的 hydration 不匹配
2. **記憶體洩漏**: 確保清理 localStorage 監聽器和 Zustand 訂閱
3. **狀態同步**: 使用 storage 事件同步跨分頁的狀態變化

## 📋 最佳實踐

### 1. 狀態設計
- **單一責任**: 每個 store 只負責一個特定領域
- **不可變性**: 使用 Immer 確保狀態更新的不可變性
- **型別安全**: 定義完整的 TypeScript 介面

### 2. 錯誤處理
- **邊界處理**: 在所有 localStorage 操作中添加 try-catch
- **預設值**: 為所有設定提供合理的預設值
- **錯誤回復**: 在載入失敗時能夠重置到預設狀態

### 3. 用戶體驗
- **載入狀態**: 顯示明確的載入指示器
- **自動儲存**: 實作可靠的自動儲存機制
- **狀態持久化**: 確保重要狀態在頁面重新載入後保持

---

這個狀態管理架構為 Markdown Slide Generator 提供了堅實的基礎，支援複雜的編輯器功能、用戶偏好管理和優秀的用戶體驗。