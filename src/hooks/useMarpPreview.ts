/**
 * Marp 預覽 Hook
 * 提供 Markdown → HTML 轉換、防抖優化、錯誤處理和主題動態切換
 */

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { getMarpClient, type SlideRenderResult } from '@/lib/marp/client';
import type { MarpConfig, SupportedTheme } from '@/lib/marp/config';
import { DEFAULT_MARP_CONFIG, PERFORMANCE_CONFIG } from '@/lib/marp/config';

// Hook 狀態介面
export interface UseMarpPreviewState {
  // 渲染結果
  result: SlideRenderResult;
  // 載入狀態
  isLoading: boolean;
  // 錯誤狀態
  error: string | null;
  // 當前投影片索引
  currentSlideIndex: number;
  // 配置
  config: MarpConfig;
  // 是否已初始化
  isInitialized: boolean;
}

// Hook 動作介面
export interface UseMarpPreviewActions {
  // 更新 Markdown 內容
  updateMarkdown: (markdown: string) => void;
  // 切換主題
  changeTheme: (theme: SupportedTheme) => void;
  // 更新配置
  updateConfig: (config: Partial<MarpConfig>) => void;
  // 跳到指定投影片
  goToSlide: (index: number) => void;
  // 下一張投影片
  nextSlide: () => void;
  // 上一張投影片
  previousSlide: () => void;
  // 重新渲染
  refresh: () => void;
  // 清除錯誤
  clearError: () => void;
  // 重置狀態
  reset: () => void;
}

// Hook 返回值
export interface UseMarpPreviewReturn extends UseMarpPreviewState, UseMarpPreviewActions {}

// Hook 選項
export interface UseMarpPreviewOptions {
  // 初始 Markdown 內容
  initialMarkdown?: string;
  // 初始配置
  initialConfig?: Partial<MarpConfig>;
  // 防抖延遲 (ms)
  debounceDelay?: number;
  // 是否自動初始化
  autoInitialize?: boolean;
  // 錯誤回調
  onError?: (error: string) => void;
  // 渲染完成回調
  onRenderComplete?: (result: SlideRenderResult) => void;
}

/**
 * Marp 預覽 Hook
 */
export function useMarpPreview(options: UseMarpPreviewOptions = {}): UseMarpPreviewReturn {
  const {
    initialMarkdown = '',
    initialConfig = {},
    debounceDelay = PERFORMANCE_CONFIG.DEBOUNCE_DELAY,
    autoInitialize = true,
    onError,
    onRenderComplete,
  } = options;

  // 合併配置
  const fullConfig: MarpConfig = { ...DEFAULT_MARP_CONFIG, ...initialConfig };

  // 狀態管理
  const [state, setState] = useState<UseMarpPreviewState>({
    result: {
      html: '',
      css: '',
      slides: [],
      totalSlides: 0,
    },
    isLoading: false,
    error: null,
    currentSlideIndex: 0,
    config: fullConfig,
    isInitialized: false,
  });

  // Refs
  const markdownRef = useRef<string>(initialMarkdown);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const renderCountRef = useRef<number>(0);
  const marpClientRef = useRef(getMarpClient());
  const isUnmountedRef = useRef<boolean>(false);

  // 清理防抖計時器
  const clearDebounceTimer = useCallback(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }
  }, []);

  // 渲染投影片
  const renderSlides = useCallback(async (markdown: string, config: MarpConfig) => {
    if (isUnmountedRef.current) return;

    const currentRenderCount = ++renderCountRef.current;

    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));

      const client = marpClientRef.current;
      const result = await client.render(markdown, config);

      // 檢查是否是最新的渲染請求
      if (currentRenderCount !== renderCountRef.current || isUnmountedRef.current) {
        return;
      }

      setState(prev => ({
        ...prev,
        result,
        isLoading: false,
        error: result.error || null,
      }));

      // 呼叫回調
      if (result.error && onError) {
        onError(result.error);
      } else if (!result.error && onRenderComplete) {
        onRenderComplete(result);
      }

    } catch (error) {
      if (currentRenderCount !== renderCountRef.current || isUnmountedRef.current) {
        return;
      }

      const errorMessage = error instanceof Error ? error.message : '渲染失敗';
      
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));

      if (onError) {
        onError(errorMessage);
      }
    }
  }, [onError, onRenderComplete]);

  // 防抖渲染
  const debouncedRender = useCallback((markdown: string, config: MarpConfig) => {
    clearDebounceTimer();
    
    debounceTimerRef.current = setTimeout(() => {
      renderSlides(markdown, config);
    }, debounceDelay);
  }, [clearDebounceTimer, renderSlides, debounceDelay]);

  // 初始化 Marp
  const initializeMarp = useCallback(async () => {
    if (state.isInitialized || isUnmountedRef.current) return;

    try {
      setState(prev => ({ ...prev, isLoading: true }));
      
      const client = marpClientRef.current;
      await client.waitForInitialization();
      
      if (isUnmountedRef.current) return;

      setState(prev => ({ 
        ...prev, 
        isInitialized: true,
        isLoading: false,
      }));

      // 如果有初始內容，開始渲染
      if (markdownRef.current) {
        debouncedRender(markdownRef.current, state.config);
      }

    } catch (error) {
      if (isUnmountedRef.current) return;

      const errorMessage = error instanceof Error ? error.message : 'Marp 初始化失敗';
      
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
        isInitialized: false,
      }));

      if (onError) {
        onError(errorMessage);
      }
    }
  }, [state.isInitialized, state.config, debouncedRender, onError]);

  // 自動初始化
  useEffect(() => {
    if (autoInitialize) {
      initializeMarp();
    }
  }, [autoInitialize, initializeMarp]);

  // 清理函數
  useEffect(() => {
    return () => {
      isUnmountedRef.current = true;
      clearDebounceTimer();
    };
  }, [clearDebounceTimer]);

  // 更新 Markdown 內容
  const updateMarkdown = useCallback((markdown: string) => {
    markdownRef.current = markdown;
    
    if (state.isInitialized) {
      debouncedRender(markdown, state.config);
    }
  }, [state.isInitialized, state.config, debouncedRender]);

  // 切換主題
  const changeTheme = useCallback((theme: SupportedTheme) => {
    const newConfig = { ...state.config, theme };
    
    setState(prev => ({ ...prev, config: newConfig }));
    
    if (state.isInitialized && markdownRef.current) {
      debouncedRender(markdownRef.current, newConfig);
    }
  }, [state.config, state.isInitialized, debouncedRender]);

  // 更新配置
  const updateConfig = useCallback((configUpdate: Partial<MarpConfig>) => {
    const newConfig = { ...state.config, ...configUpdate };
    
    setState(prev => ({ ...prev, config: newConfig }));
    
    if (state.isInitialized && markdownRef.current) {
      debouncedRender(markdownRef.current, newConfig);
    }
  }, [state.config, state.isInitialized, debouncedRender]);

  // 跳到指定投影片
  const goToSlide = useCallback((index: number) => {
    const maxIndex = Math.max(0, state.result.totalSlides - 1);
    const validIndex = Math.max(0, Math.min(index, maxIndex));
    
    setState(prev => ({ ...prev, currentSlideIndex: validIndex }));
  }, [state.result.totalSlides]);

  // 下一張投影片
  const nextSlide = useCallback(() => {
    goToSlide(state.currentSlideIndex + 1);
  }, [state.currentSlideIndex, goToSlide]);

  // 上一張投影片
  const previousSlide = useCallback(() => {
    goToSlide(state.currentSlideIndex - 1);
  }, [state.currentSlideIndex, goToSlide]);

  // 重新渲染
  const refresh = useCallback(() => {
    if (state.isInitialized && markdownRef.current) {
      clearDebounceTimer();
      renderSlides(markdownRef.current, state.config);
    }
  }, [state.isInitialized, state.config, clearDebounceTimer, renderSlides]);

  // 清除錯誤
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  // 重置狀態
  const reset = useCallback(() => {
    clearDebounceTimer();
    markdownRef.current = '';
    renderCountRef.current = 0;
    
    setState({
      result: {
        html: '',
        css: '',
        slides: [],
        totalSlides: 0,
      },
      isLoading: false,
      error: null,
      currentSlideIndex: 0,
      config: { ...DEFAULT_MARP_CONFIG, ...initialConfig },
      isInitialized: false,
    });

    if (autoInitialize) {
      initializeMarp();
    }
  }, [clearDebounceTimer, initialConfig, autoInitialize, initializeMarp]);

  return {
    // 狀態
    ...state,
    // 動作
    updateMarkdown,
    changeTheme,
    updateConfig,
    goToSlide,
    nextSlide,
    previousSlide,
    refresh,
    clearError,
    reset,
  };
}

// 預設 Hook（簡化版本）
export function useSimpleMarpPreview(markdown: string, theme: SupportedTheme = 'default') {
  return useMarpPreview({
    initialMarkdown: markdown,
    initialConfig: { theme },
    autoInitialize: true,
  });
}

// Hook 工具函數
export const useMarpPreviewUtils = {
  // 檢查是否有投影片
  hasSlides: (state: UseMarpPreviewState) => state.result.totalSlides > 0,
  
  // 檢查是否在第一張投影片
  isFirstSlide: (state: UseMarpPreviewState) => state.currentSlideIndex === 0,
  
  // 檢查是否在最後一張投影片
  isLastSlide: (state: UseMarpPreviewState) => 
    state.currentSlideIndex >= state.result.totalSlides - 1,
  
  // 獲取當前投影片
  getCurrentSlide: (state: UseMarpPreviewState) => 
    state.result.slides[state.currentSlideIndex] || null,
  
  // 獲取進度百分比
  getProgress: (state: UseMarpPreviewState) => 
    state.result.totalSlides > 0 
      ? Math.round(((state.currentSlideIndex + 1) / state.result.totalSlides) * 100)
      : 0,
};