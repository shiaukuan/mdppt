/**
 * Marp 核心配置和常數定義
 */

// Marp 預設配置選項
export const MARP_DEFAULT_OPTIONS = {
  // 啟用 HTML 標籤支援
  html: true,
  // 啟用分頁符號
  pagination: true,
  // 允許本地檔案參考
  allowLocalFiles: false,
  // 預設主題
  theme: 'default',
  // 投影片尺寸 (16:9)
  size: [1280, 720] as [number, number],
  // 啟用數學公式支援
  math: 'mathjax',
  // 預設方向
  inlineSVG: false,
} as const;

// 支援的主題列表
export const SUPPORTED_THEMES = [
  'default',
  'uncover', 
  'gaia',
  'academic',
  'business',
] as const;

export type SupportedTheme = typeof SUPPORTED_THEMES[number];

// 投影片尺寸選項
export const SLIDE_SIZES = {
  '16:9': [1280, 720],
  '4:3': [1024, 768],
  'A4': [794, 1123],
  'custom': [1280, 720], // 預設為 16:9
} as const;

export type SlideSizeRatio = keyof typeof SLIDE_SIZES;

// Marp 功能配置
export interface MarpConfig {
  theme: SupportedTheme;
  size: SlideSizeRatio;
  customSize?: [number, number];
  html: boolean;
  pagination: boolean;
  math: boolean | 'mathjax' | 'katex';
  allowLocalFiles: boolean;
  inlineSVG: boolean;
  backgroundImage?: string;
  customCSS?: string;
}

// 預設配置
export const DEFAULT_MARP_CONFIG: MarpConfig = {
  theme: 'default',
  size: '16:9',
  html: true,
  pagination: true,
  math: 'mathjax',
  allowLocalFiles: false,
  inlineSVG: false,
};

// 主題資料結構
export interface ThemeInfo {
  id: SupportedTheme;
  name: string;
  description: string;
  preview: string; // Base64 或 URL
  category: 'built-in' | 'custom';
  colors: {
    primary: string;
    secondary: string;
    background: string;
    text: string;
  };
}

// 內建主題資訊
export const THEME_INFO: Record<SupportedTheme, ThemeInfo> = {
  default: {
    id: 'default',
    name: '預設主題',
    description: 'Marp 的經典預設主題，簡潔專業',
    preview: '',
    category: 'built-in',
    colors: {
      primary: '#1e3a8a',
      secondary: '#3b82f6',
      background: '#ffffff',
      text: '#1f2937',
    },
  },
  uncover: {
    id: 'uncover',
    name: '現代簡約',
    description: '現代設計風格，適合科技和創新主題',
    preview: '',
    category: 'built-in',
    colors: {
      primary: '#2563eb',
      secondary: '#60a5fa',
      background: '#f8fafc',
      text: '#0f172a',
    },
  },
  gaia: {
    id: 'gaia',
    name: '優雅專業',
    description: '優雅的專業風格，適合商務簡報',
    preview: '',
    category: 'built-in',
    colors: {
      primary: '#7c3aed',
      secondary: '#a78bfa',
      background: '#fdfcff',
      text: '#1e1b4b',
    },
  },
  academic: {
    id: 'academic',
    name: '學術風格',
    description: '學術報告專用，清晰易讀',
    preview: '',
    category: 'built-in',
    colors: {
      primary: '#059669',
      secondary: '#34d399',
      background: '#f0fdf4',
      text: '#064e3b',
    },
  },
  business: {
    id: 'business',
    name: '商務風格',
    description: '商務簡報專用，穩重大方',
    preview: '',
    category: 'built-in',
    colors: {
      primary: '#dc2626',
      secondary: '#f87171',
      background: '#fefefe',
      text: '#7f1d1d',
    },
  },
};

// 錯誤訊息常數
export const MARP_ERROR_MESSAGES = {
  INITIALIZATION_FAILED: 'Marp 初始化失敗',
  THEME_NOT_FOUND: '找不到指定的主題',
  RENDER_FAILED: '投影片渲染失敗',
  INVALID_MARKDOWN: 'Markdown 格式錯誤',
  THEME_LOAD_FAILED: '主題載入失敗',
  CONFIG_INVALID: '配置參數無效',
} as const;

// 效能配置
export const PERFORMANCE_CONFIG = {
  // 防抖延遲 (ms)
  DEBOUNCE_DELAY: 300,
  // 最大渲染時間 (ms)
  MAX_RENDER_TIME: 5000,
  // 快取大小限制
  CACHE_SIZE_LIMIT: 50,
  // 自動清理間隔 (ms)  
  CLEANUP_INTERVAL: 60000,
} as const;

// CSS 選擇器常數
export const MARP_SELECTORS = {
  SLIDE_CONTAINER: '.marp-container',
  SLIDE_DECK: '.marp-deck',
  SLIDE: '.marp-slide',
  PAGINATION: '.marp-pagination',
  PROGRESS: '.marp-progress',
} as const;

// 預覽模式
export type PreviewMode = 'single' | 'grid' | 'presentation';

export const PREVIEW_MODES = {
  single: {
    name: '單頁檢視',
    description: '一次檢視一張投影片',
    icon: 'single-slide',
  },
  grid: {
    name: '格狀檢視', 
    description: '網格形式檢視所有投影片',
    icon: 'grid',
  },
  presentation: {
    name: '簡報模式',
    description: '全螢幕簡報模式',
    icon: 'presentation',
  },
} as const;