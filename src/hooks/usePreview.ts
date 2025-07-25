/**
 * 預覽狀態管理 Hook
 * 管理預覽狀態、處理 Markdown 變更、投影片導航邏輯
 */

'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useMarpPreview, type UseMarpPreviewOptions } from './useMarpPreview';
import type { SupportedTheme, PreviewMode, MarpConfig } from '@/lib/marp/config';
import type { SlideData } from '@/lib/marp/client';

// 預覽狀態介面
export interface PreviewState {
  // 基本狀態
  markdown: string;
  theme: SupportedTheme;
  mode: PreviewMode;
  
  // 導航狀態
  currentSlideIndex: number;
  totalSlides: number;
  
  // 視圖狀態
  zoom: number;
  isFullscreen: boolean;
  
  // 載入和錯誤狀態
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;
  
  // 投影片資料
  slides: SlideData[];
  currentSlide: SlideData | null;
}

// 預覽動作介面
export interface PreviewActions {
  // 內容更新
  updateMarkdown: (markdown: string) => void;
  setTheme: (theme: SupportedTheme) => void;
  setMode: (mode: PreviewMode) => void;
  updateConfig: (config: Partial<MarpConfig>) => void;
  
  // 導航控制
  goToSlide: (index: number) => void;
  nextSlide: () => void;
  previousSlide: () => void;
  goToFirstSlide: () => void;
  goToLastSlide: () => void;
  
  // 視圖控制
  zoomIn: () => void;
  zoomOut: () => void;
  resetZoom: () => void;
  setZoom: (zoom: number) => void;
  toggleFullscreen: () => void;
  setFullscreen: (fullscreen: boolean) => void;
  
  // 其他動作
  refresh: () => void;
  reset: () => void;
  clearError: () => void;
}

// Hook 選項
export interface UsePreviewOptions extends Partial<UseMarpPreviewOptions> {
  // 初始狀態
  initialMarkdown?: string;
  initialTheme?: SupportedTheme;
  initialMode?: PreviewMode;
  initialZoom?: number;
  
  // 縮放設定
  minZoom?: number;
  maxZoom?: number;
  zoomStep?: number;
  
  // 全螢幕設定
  fullscreenElement?: HTMLElement | null;
  
  // 回調函數
  onSlideChange?: (slideIndex: number, slide: SlideData) => void;
  onModeChange?: (mode: PreviewMode) => void;
  onThemeChange?: (theme: SupportedTheme) => void;
  onZoomChange?: (zoom: number) => void;
  onFullscreenChange?: (isFullscreen: boolean) => void;
  onError?: (error: string) => void;
  onReady?: (totalSlides: number) => void;
}

// Hook 返回值
export interface UsePreviewReturn extends PreviewState, PreviewActions {
  // 輔助計算屬性
  hasSlides: boolean;
  isFirstSlide: boolean;
  isLastSlide: boolean;
  progress: number;
  canNavigate: boolean;
}

/**
 * 全螢幕管理 Hook
 */
function useFullscreen(element?: HTMLElement | null) {
  const [isFullscreen, setIsFullscreen] = useState(false);

  const enterFullscreen = useCallback(async () => {
    const target = element || document.documentElement;
    
    try {
      if (target.requestFullscreen) {
        await target.requestFullscreen();
      } else if ((target as any).webkitRequestFullscreen) {
        await (target as any).webkitRequestFullscreen();
      } else if ((target as any).msRequestFullscreen) {
        await (target as any).msRequestFullscreen();
      }
    } catch (error) {
      console.error('無法進入全螢幕模式:', error);
    }
  }, [element]);

  const exitFullscreen = useCallback(async () => {
    if (!document.fullscreenElement) return;
    
    try {
      if (document.exitFullscreen) {
        await document.exitFullscreen();
      } else if ((document as any).webkitExitFullscreen) {
        await (document as any).webkitExitFullscreen();
      } else if ((document as any).msExitFullscreen) {
        await (document as any).msExitFullscreen();
      }
    } catch (error) {
      console.error('無法退出全螢幕模式:', error);
    }
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (isFullscreen) {
      exitFullscreen();
    } else {
      enterFullscreen();
    }
  }, [isFullscreen, enterFullscreen, exitFullscreen]);

  // 監聽全螢幕狀態變化
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('msfullscreenchange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('msfullscreenchange', handleFullscreenChange);
    };
  }, []);

  return {
    isFullscreen,
    enterFullscreen,
    exitFullscreen,
    toggleFullscreen,
    setFullscreen: (fullscreen: boolean) => {
      if (fullscreen !== isFullscreen) {
        toggleFullscreen();
      }
    },
  };
}

/**
 * 主要預覽管理 Hook
 */
export function usePreview(options: UsePreviewOptions = {}): UsePreviewReturn {
  const {
    initialMarkdown = '',
    initialTheme = 'default',
    initialMode = 'single',
    initialZoom = 1,
    minZoom = 0.25,
    maxZoom = 3,
    zoomStep = 0.25,
    fullscreenElement,
    onSlideChange,
    onModeChange,
    onThemeChange,
    onZoomChange,
    onFullscreenChange,
    onError,
    onReady,
    ...marpOptions
  } = options;

  // 基本狀態
  const [markdown, setMarkdown] = useState(initialMarkdown);
  const [theme, setThemeState] = useState<SupportedTheme>(initialTheme);
  const [mode, setModeState] = useState<PreviewMode>(initialMode);
  const [zoom, setZoomState] = useState(initialZoom);

  // 全螢幕管理
  const {
    isFullscreen,
    toggleFullscreen,
    setFullscreen,
  } = useFullscreen(fullscreenElement);

  // Marp 預覽狀態
  const marpPreview = useMarpPreview({
    initialMarkdown: markdown,
    initialConfig: { theme },
    onError,
    onRenderComplete: (result) => {
      onReady?.(result.totalSlides);
    },
    ...marpOptions,
  });

  // 追蹤變化的 ref
  const prevSlideIndexRef = useRef(marpPreview.currentSlideIndex);
  const prevModeRef = useRef(mode);
  const prevThemeRef = useRef(theme);
  const prevZoomRef = useRef(zoom);
  const prevFullscreenRef = useRef(isFullscreen);

  // 同步 Markdown 內容
  useEffect(() => {
    marpPreview.updateMarkdown(markdown);
  }, [markdown, marpPreview.updateMarkdown]);

  // 同步主題
  useEffect(() => {
    if (theme !== marpPreview.config.theme) {
      marpPreview.changeTheme(theme);
    }
  }, [theme, marpPreview.config.theme, marpPreview.changeTheme]);

  // 監聽投影片變化
  useEffect(() => {
    if (marpPreview.currentSlideIndex !== prevSlideIndexRef.current) {
      const currentSlide = marpPreview.result.slides[marpPreview.currentSlideIndex];
      if (currentSlide && onSlideChange) {
        onSlideChange(marpPreview.currentSlideIndex, currentSlide);
      }
      prevSlideIndexRef.current = marpPreview.currentSlideIndex;
    }
  }, [marpPreview.currentSlideIndex, marpPreview.result.slides, onSlideChange]);

  // 監聽模式變化
  useEffect(() => {
    if (mode !== prevModeRef.current) {
      onModeChange?.(mode);
      prevModeRef.current = mode;
    }
  }, [mode, onModeChange]);

  // 監聽主題變化
  useEffect(() => {
    if (theme !== prevThemeRef.current) {
      onThemeChange?.(theme);
      prevThemeRef.current = theme;
    }
  }, [theme, onThemeChange]);

  // 監聽縮放變化
  useEffect(() => {
    if (zoom !== prevZoomRef.current) {
      onZoomChange?.(zoom);
      prevZoomRef.current = zoom;
    }
  }, [zoom, onZoomChange]);

  // 監聽全螢幕變化
  useEffect(() => {
    if (isFullscreen !== prevFullscreenRef.current) {
      onFullscreenChange?.(isFullscreen);
      prevFullscreenRef.current = isFullscreen;
    }
  }, [isFullscreen, onFullscreenChange]);

  // 內容更新動作
  const updateMarkdown = useCallback((newMarkdown: string) => {
    setMarkdown(newMarkdown);
  }, []);

  const setTheme = useCallback((newTheme: SupportedTheme) => {
    setThemeState(newTheme);
  }, []);

  const setMode = useCallback((newMode: PreviewMode) => {
    setModeState(newMode);
  }, []);

  const updateConfig = useCallback((config: Partial<MarpConfig>) => {
    marpPreview.updateConfig(config);
    if (config.theme) {
      setThemeState(config.theme);
    }
  }, [marpPreview.updateConfig]);

  // 導航控制動作
  const goToSlide = useCallback((index: number) => {
    marpPreview.goToSlide(index);
  }, [marpPreview.goToSlide]);

  const nextSlide = useCallback(() => {
    marpPreview.nextSlide();
  }, [marpPreview.nextSlide]);

  const previousSlide = useCallback(() => {
    marpPreview.previousSlide();
  }, [marpPreview.previousSlide]);

  const goToFirstSlide = useCallback(() => {
    marpPreview.goToSlide(0);
  }, [marpPreview.goToSlide]);

  const goToLastSlide = useCallback(() => {
    marpPreview.goToSlide(marpPreview.result.totalSlides - 1);
  }, [marpPreview.goToSlide, marpPreview.result.totalSlides]);

  // 縮放控制動作
  const zoomIn = useCallback(() => {
    setZoomState(prev => Math.min(maxZoom, prev + zoomStep));
  }, [maxZoom, zoomStep]);

  const zoomOut = useCallback(() => {
    setZoomState(prev => Math.max(minZoom, prev - zoomStep));
  }, [minZoom, zoomStep]);

  const resetZoom = useCallback(() => {
    setZoomState(1);
  }, []);

  const setZoom = useCallback((newZoom: number) => {
    setZoomState(Math.max(minZoom, Math.min(maxZoom, newZoom)));
  }, [minZoom, maxZoom]);

  // 其他動作
  const refresh = useCallback(() => {
    marpPreview.refresh();
  }, [marpPreview.refresh]);

  const reset = useCallback(() => {
    setMarkdown(initialMarkdown);
    setThemeState(initialTheme);
    setModeState(initialMode);
    setZoomState(initialZoom);
    marpPreview.reset();
  }, [initialMarkdown, initialTheme, initialMode, initialZoom, marpPreview.reset]);

  const clearError = useCallback(() => {
    marpPreview.clearError();
  }, [marpPreview.clearError]);

  // 計算屬性
  const hasSlides = marpPreview.result.totalSlides > 0;
  const isFirstSlide = marpPreview.currentSlideIndex === 0;
  const isLastSlide = marpPreview.currentSlideIndex >= marpPreview.result.totalSlides - 1;
  const progress = hasSlides ? Math.round(((marpPreview.currentSlideIndex + 1) / marpPreview.result.totalSlides) * 100) : 0;
  const canNavigate = hasSlides && !marpPreview.isLoading;
  const currentSlide = marpPreview.result.slides[marpPreview.currentSlideIndex] || null;

  return {
    // 狀態
    markdown,
    theme,
    mode,
    currentSlideIndex: marpPreview.currentSlideIndex,
    totalSlides: marpPreview.result.totalSlides,
    zoom,
    isFullscreen,
    isLoading: marpPreview.isLoading,
    error: marpPreview.error,
    isInitialized: marpPreview.isInitialized,
    slides: marpPreview.result.slides,
    currentSlide,

    // 內容更新動作
    updateMarkdown,
    setTheme,
    setMode,
    updateConfig,

    // 導航控制動作
    goToSlide,
    nextSlide,
    previousSlide,
    goToFirstSlide,
    goToLastSlide,

    // 視圖控制動作
    zoomIn,
    zoomOut,
    resetZoom,
    setZoom,
    toggleFullscreen,
    setFullscreen,

    // 其他動作
    refresh,
    reset,
    clearError,

    // 計算屬性
    hasSlides,
    isFirstSlide,
    isLastSlide,
    progress,
    canNavigate,
  };
}

// 簡化版 Hook（只包含基本功能）
export function useSimplePreview(markdown: string, theme: SupportedTheme = 'default') {
  return usePreview({
    initialMarkdown: markdown,
    initialTheme: theme,
    autoInitialize: true,
  });
}

// 編輯器整合版 Hook（包含編輯器同步功能）
export interface UseEditorPreviewOptions extends UsePreviewOptions {
  // 編輯器同步
  syncScrolling?: boolean;
  syncCursor?: boolean;
  
  // 編輯器回調
  onMarkdownChange?: (markdown: string) => void;
  onCursorChange?: (line: number, column: number) => void;
}

export function useEditorPreview(options: UseEditorPreviewOptions = {}) {
  const {
    syncScrolling = false,
    syncCursor = false,
    onMarkdownChange,
    onCursorChange,
    ...previewOptions
  } = options;

  const preview = usePreview(previewOptions);

  // 編輯器同步邏輯（可以根據需要擴展）
  const syncWithEditor = useCallback((line: number, column: number) => {
    if (syncCursor && onCursorChange) {
      onCursorChange(line, column);
    }
  }, [syncCursor, onCursorChange]);

  const handleMarkdownChange = useCallback((newMarkdown: string) => {
    preview.updateMarkdown(newMarkdown);
    onMarkdownChange?.(newMarkdown);
  }, [preview.updateMarkdown, onMarkdownChange]);

  return {
    ...preview,
    // 編輯器專用方法
    syncWithEditor,
    handleMarkdownChange,
  };
}

export default usePreview;