/**
 * Marp 預覽 Hook - 簡化版本
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
export interface UseMarpPreviewReturn
  extends UseMarpPreviewState,
    UseMarpPreviewActions {}

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
 * Marp 預覽 Hook - 簡化版本
 */
export function useMarpPreview(
  options: UseMarpPreviewOptions = {}
): UseMarpPreviewReturn {
  const {
    initialMarkdown = '',
    initialConfig = {},
    debounceDelay = 300,
    autoInitialize = true,
    onError,
    onRenderComplete,
  } = options;

  // 合併配置
  const fullConfig: MarpConfig = { ...DEFAULT_MARP_CONFIG, ...initialConfig };

  console.log('🎯 useMarpPreview: Hook 初始化', {
    initialMarkdown: initialMarkdown.substring(0, 50) + '...',
    autoInitialize,
    fullConfig,
  });

  // 簡單的狀態管理
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<SlideRenderResult>({
    html: '',
    css: '',
    slides: [],
    totalSlides: 0,
  });
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [config, setConfig] = useState<MarpConfig>(fullConfig);

  // Refs
  const markdownRef = useRef(initialMarkdown || '');
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const marpClientRef = useRef(getMarpClient());

  // 清理防抖計時器
  const clearDebounceTimer = useCallback(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }
  }, []);

  // 渲染函數
  const renderSlides = useCallback(
    async (markdown: string, renderConfig: MarpConfig) => {
      console.log('🎬 開始渲染投影片', { markdownLength: markdown.length });

      setIsLoading(true);
      setError(null);

      try {
        const client = marpClientRef.current;
        const renderResult = await client.render(markdown, renderConfig);

        console.log('✅ 渲染完成', {
          totalSlides: renderResult.totalSlides,
          hasError: !!renderResult.error,
        });

        setResult(renderResult);
        setIsLoading(false);

        if (renderResult.error) {
          setError(renderResult.error);
          onError?.(renderResult.error);
        } else {
          onRenderComplete?.(renderResult);
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : '渲染失敗';
        console.error('❌ 渲染錯誤:', errorMessage);

        setError(errorMessage);
        setIsLoading(false);
        onError?.(errorMessage);
      }
    },
    [onError, onRenderComplete]
  );

  // 防抖渲染
  const debouncedRender = useCallback(
    (markdown: string, renderConfig: MarpConfig) => {
      clearDebounceTimer();
      debounceTimerRef.current = setTimeout(() => {
        renderSlides(markdown, renderConfig);
      }, debounceDelay);
    },
    [clearDebounceTimer, renderSlides, debounceDelay]
  );

  // 初始化 Marp
  useEffect(() => {
    if (!autoInitialize) {
      console.log('❌ autoInitialize 為 false，跳過初始化');
      return;
    }

    let mounted = true;

    const initialize = async () => {
      console.log('🚀 開始初始化 Marp Core...');

      try {
        setIsLoading(true);
        const client = marpClientRef.current;
        await client.waitForInitialization();

        if (!mounted) return;

        console.log('✅ Marp Core 初始化完成');
        setIsInitialized(true);
        setIsLoading(false);

        // 如果有初始內容，立即渲染
        if (markdownRef.current.trim()) {
          console.log('📝 渲染初始內容');
          renderSlides(markdownRef.current, config);
        } else {
          setIsLoading(false);
        }
      } catch (err) {
        if (!mounted) return;

        const errorMessage =
          err instanceof Error ? err.message : 'Marp 初始化失敗';
        console.error('❌ 初始化失敗:', errorMessage);

        setError(errorMessage);
        setIsLoading(false);
        onError?.(errorMessage);
      }
    };

    initialize();

    return () => {
      mounted = false;
    };
  }, [autoInitialize]); // 只依賴 autoInitialize

  // 清理函數
  useEffect(() => {
    return () => {
      clearDebounceTimer();
    };
  }, [clearDebounceTimer]);

  // Hook 動作
  const updateMarkdown = useCallback(
    (markdown: string) => {
      // 只有當 markdown 內容真的改變時才觸發渲染
      if (markdown === markdownRef.current) {
        return;
      }

      console.log('📝 updateMarkdown 被調用', {
        markdownLength: markdown.length,
        isInitialized,
      });

      markdownRef.current = markdown;

      if (isInitialized) {
        debouncedRender(markdown, config);
      } else {
        console.log('⏳ Marp 尚未初始化，跳過渲染');
      }
    },
    [isInitialized, config, debouncedRender]
  );

  const changeTheme = useCallback(
    (theme: SupportedTheme) => {
      const newConfig = { ...config, theme };
      setConfig(newConfig);

      if (isInitialized && markdownRef.current) {
        debouncedRender(markdownRef.current, newConfig);
      }
    },
    [config, isInitialized, debouncedRender]
  );

  const updateConfig = useCallback(
    (configUpdate: Partial<MarpConfig>) => {
      const newConfig = { ...config, ...configUpdate };
      setConfig(newConfig);

      if (isInitialized && markdownRef.current) {
        debouncedRender(markdownRef.current, newConfig);
      }
    },
    [config, isInitialized, debouncedRender]
  );

  const goToSlide = useCallback(
    (index: number) => {
      const maxIndex = Math.max(0, result.totalSlides - 1);
      const validIndex = Math.max(0, Math.min(index, maxIndex));
      setCurrentSlideIndex(validIndex);
    },
    [result.totalSlides]
  );

  const nextSlide = useCallback(() => {
    goToSlide(currentSlideIndex + 1);
  }, [currentSlideIndex, goToSlide]);

  const previousSlide = useCallback(() => {
    goToSlide(currentSlideIndex - 1);
  }, [currentSlideIndex, goToSlide]);

  const refresh = useCallback(() => {
    if (isInitialized && markdownRef.current) {
      clearDebounceTimer();
      renderSlides(markdownRef.current, config);
    }
  }, [isInitialized, config, clearDebounceTimer, renderSlides]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const reset = useCallback(() => {
    clearDebounceTimer();
    setIsInitialized(false);
    setIsLoading(false);
    setError(null);
    setResult({
      html: '',
      css: '',
      slides: [],
      totalSlides: 0,
    });
    setCurrentSlideIndex(0);
    setConfig({ ...DEFAULT_MARP_CONFIG, ...initialConfig });
    markdownRef.current = '';
  }, [clearDebounceTimer, initialConfig]);

  return {
    // 狀態
    result,
    isLoading,
    error,
    currentSlideIndex,
    config,
    isInitialized,
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
export function useSimpleMarpPreview(
  markdown: string,
  theme: SupportedTheme = 'default'
) {
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
      ? Math.round(
          ((state.currentSlideIndex + 1) / state.result.totalSlides) * 100
        )
      : 0,
};
