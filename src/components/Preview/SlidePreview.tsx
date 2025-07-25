/**
 * 投影片預覽組件
 * 整合 Marp 渲染、debounced 更新、投影片導航和錯誤處理
 */

'use client';

import React, { useEffect, useCallback, useRef, useState, useMemo } from 'react';
import { useMarpPreview, useMarpPreviewUtils } from '@/hooks/useMarpPreview';
import type { SupportedTheme, PreviewMode } from '@/lib/marp/config';
import type { SlideData } from '@/lib/marp/client';

// 預覽選項介面
export interface SlidePreviewOptions {
  // 防抖延遲
  debounceDelay?: number;
  // 自動適應尺寸
  autoFit?: boolean;
  // 顯示導航控制
  showNavigation?: boolean;
  // 顯示進度指示器
  showProgress?: boolean;
  // 顯示投影片編號
  showSlideNumber?: boolean;
  // 啟用鍵盤導航
  enableKeyboardNav?: boolean;
  // 預覽模式
  mode?: PreviewMode;
}

// 投影片預覽組件 Props
export interface SlidePreviewProps {
  // Markdown 內容
  markdown: string;
  // 當前主題
  theme?: SupportedTheme;
  // 預覽選項
  options?: SlidePreviewOptions;
  // 樣式類名
  className?: string;
  // 事件回調
  onSlideChange?: (slideIndex: number, slide: SlideData) => void;
  onThemeChange?: (theme: SupportedTheme) => void;
  onError?: (error: string) => void;
  onReady?: (totalSlides: number) => void;
}

// 載入狀態組件
function LoadingState() {
  return (
    <div className="flex flex-col items-center justify-center h-full bg-gray-50 rounded-lg">
      <div className="animate-spin w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full mb-4" />
      <div className="text-sm text-gray-600">正在渲染投影片...</div>
    </div>
  );
}

// 錯誤狀態組件
interface ErrorStateProps {
  error: string;
  onRetry: () => void;
  onClear: () => void;
}

function ErrorState({ error, onRetry, onClear }: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center h-full bg-red-50 border border-red-200 rounded-lg p-8">
      <div className="text-red-600 text-2xl mb-4">⚠️</div>
      <div className="text-red-800 font-semibold mb-2">預覽錯誤</div>
      <div className="text-red-700 text-sm text-center mb-4 max-w-md">
        {error}
      </div>
      <div className="flex gap-2">
        <button
          onClick={onRetry}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
        >
          重新嘗試
        </button>
        <button
          onClick={onClear}
          className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm"
        >
          清除錯誤
        </button>
      </div>
    </div>
  );
}

// 空狀態組件
function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-full bg-gray-50 rounded-lg p-8">
      <div className="text-gray-400 text-4xl mb-4">📝</div>
      <div className="text-gray-600 font-semibold mb-2">開始撰寫投影片</div>
      <div className="text-gray-500 text-sm text-center max-w-md">
        在左側編輯器中輸入 Markdown 內容<br />
        使用 <code className="bg-gray-200 px-1 rounded text-xs">---</code> 分隔投影片
      </div>
    </div>
  );
}

// 投影片導航組件
interface SlideNavigationProps {
  currentSlide: number;
  totalSlides: number;
  onPrevious: () => void;
  onNext: () => void;
  onGoToSlide: (index: number) => void;
  className?: string;
}

function SlideNavigation({
  currentSlide,
  totalSlides,
  onPrevious,
  onNext,
  onGoToSlide,
  className = '',
}: SlideNavigationProps) {
  const [showSlideSelector, setShowSlideSelector] = useState(false);

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* 上一張 */}
      <button
        onClick={onPrevious}
        disabled={currentSlide === 0}
        className="p-2 rounded-lg bg-white/90 hover:bg-white shadow-sm border border-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        title="上一張投影片 (←)"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      {/* 投影片選擇器 */}
      <div className="relative">
        <button
          onClick={() => setShowSlideSelector(!showSlideSelector)}
          className="px-3 py-2 rounded-lg bg-white/90 hover:bg-white shadow-sm border border-gray-200 transition-all text-sm font-medium min-w-[70px]"
          title="選擇投影片"
        >
          {currentSlide + 1} / {totalSlides}
        </button>

        {showSlideSelector && (
          <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-white border border-gray-200 rounded-lg shadow-lg p-2 z-10">
            <div className="grid grid-cols-5 gap-1 max-h-32 overflow-y-auto">
              {Array.from({ length: totalSlides }, (_, index) => (
                <button
                  key={index}
                  onClick={() => {
                    onGoToSlide(index);
                    setShowSlideSelector(false);
                  }}
                  className={`w-8 h-8 text-xs rounded border transition-all ${
                    index === currentSlide
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  {index + 1}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 下一張 */}
      <button
        onClick={onNext}
        disabled={currentSlide >= totalSlides - 1}
        className="p-2 rounded-lg bg-white/90 hover:bg-white shadow-sm border border-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        title="下一張投影片 (→)"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </div>
  );
}

// 進度指示器組件
interface ProgressIndicatorProps {
  current: number;
  total: number;
  className?: string;
}

function ProgressIndicator({ current, total, className = '' }: ProgressIndicatorProps) {
  const progress = total > 0 ? ((current + 1) / total) * 100 : 0;

  return (
    <div className={`w-full bg-gray-200 rounded-full h-1 overflow-hidden ${className}`}>
      <div
        className="bg-blue-600 h-full transition-all duration-300 ease-out rounded-full"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}

/**
 * 主要投影片預覽組件
 */
export function SlidePreview({
  markdown,
  theme = 'default',
  options = {},
  className = '',
  onSlideChange,
  onThemeChange,
  onError,
  onReady,
}: SlidePreviewProps) {
  const {
    debounceDelay = 300,
    autoFit = true,
    showNavigation = true,
    showProgress = true,
    showSlideNumber = true,
    enableKeyboardNav = true,
    mode = 'single',
  } = options;

  const containerRef = useRef<HTMLDivElement>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // 使用 Marp 預覽 Hook
  const marpPreview = useMarpPreview({
    initialMarkdown: markdown,
    initialConfig: { theme },
    debounceDelay,
    autoInitialize: true,
    onError,
    onRenderComplete: (result) => {
      if (!isInitialized) {
        setIsInitialized(true);
        onReady?.(result.totalSlides);
      }
    },
  });

  // 更新 Markdown 內容
  useEffect(() => {
    marpPreview.updateMarkdown(markdown);
  }, [markdown, marpPreview.updateMarkdown]);

  // 切換主題
  useEffect(() => {
    if (theme !== marpPreview.config.theme) {
      marpPreview.changeTheme(theme);
      onThemeChange?.(theme);
    }
  }, [theme, marpPreview.config.theme, marpPreview.changeTheme, onThemeChange]);

  // 監聽投影片變化
  useEffect(() => {
    const currentSlide = useMarpPreviewUtils.getCurrentSlide(marpPreview);
    if (currentSlide && onSlideChange) {
      onSlideChange(marpPreview.currentSlideIndex, currentSlide);
    }
  }, [marpPreview.currentSlideIndex, marpPreview.result.slides, onSlideChange]);

  // 鍵盤導航
  useEffect(() => {
    if (!enableKeyboardNav || !containerRef.current) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      // 只在預覽容器聚焦時處理鍵盤事件
      if (!containerRef.current?.contains(document.activeElement)) return;

      switch (event.key) {
        case 'ArrowLeft':
        case 'ArrowUp':
          event.preventDefault();
          marpPreview.previousSlide();
          break;
        case 'ArrowRight':
        case 'ArrowDown':
        case ' ':
          event.preventDefault();
          marpPreview.nextSlide();
          break;
        case 'Home':
          event.preventDefault();
          marpPreview.goToSlide(0);
          break;
        case 'End':
          event.preventDefault();
          marpPreview.goToSlide(marpPreview.result.totalSlides - 1);
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [enableKeyboardNav, marpPreview]);

  // 計算當前投影片
  const currentSlide = useMemo(() => {
    return useMarpPreviewUtils.getCurrentSlide(marpPreview);
  }, [marpPreview]);

  // 渲染狀態處理
  if (!marpPreview.isInitialized || marpPreview.isLoading) {
    return <LoadingState />;
  }

  if (marpPreview.error) {
    return (
      <ErrorState
        error={marpPreview.error}
        onRetry={marpPreview.refresh}
        onClear={marpPreview.clearError}
      />
    );
  }

  if (!useMarpPreviewUtils.hasSlides(marpPreview)) {
    return <EmptyState />;
  }

  return (
    <div
      ref={containerRef}
      className={`slide-preview relative h-full flex flex-col bg-white rounded-lg overflow-hidden ${className}`}
      tabIndex={0} // 使容器可聚焦以接收鍵盤事件
    >
      {/* 投影片樣式 */}
      <style dangerouslySetInnerHTML={{ __html: marpPreview.result.css }} />

      {/* 主要內容區域 */}
      <div className="flex-1 relative overflow-hidden">
        {/* 投影片內容 */}
        {currentSlide && (
          <div className={`h-full flex items-center justify-center p-4 ${autoFit ? '' : 'overflow-auto'}`}>
            <div
              className={`marp-slide-content border border-gray-200 rounded-lg shadow-sm bg-white overflow-hidden ${
                autoFit ? 'max-w-full max-h-full' : 'w-full h-full'
              }`}
              style={{
                aspectRatio: '16/9', // 預設投影片比例
                maxWidth: autoFit ? '100%' : undefined,
                maxHeight: autoFit ? '100%' : undefined,
              }}
              dangerouslySetInnerHTML={{ __html: currentSlide.html }}
            />
          </div>
        )}

        {/* 投影片編號 */}
        {showSlideNumber && (
          <div className="absolute top-4 right-4 bg-black/75 text-white px-2 py-1 rounded text-sm font-medium">
            {marpPreview.currentSlideIndex + 1} / {marpPreview.result.totalSlides}
          </div>
        )}

        {/* 導航控制 */}
        {showNavigation && marpPreview.result.totalSlides > 1 && (
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
            <SlideNavigation
              currentSlide={marpPreview.currentSlideIndex}
              totalSlides={marpPreview.result.totalSlides}
              onPrevious={marpPreview.previousSlide}
              onNext={marpPreview.nextSlide}
              onGoToSlide={marpPreview.goToSlide}
            />
          </div>
        )}
      </div>

      {/* 底部進度條 */}
      {showProgress && marpPreview.result.totalSlides > 1 && (
        <div className="flex-shrink-0 p-2">
          <ProgressIndicator
            current={marpPreview.currentSlideIndex}
            total={marpPreview.result.totalSlides}
          />
        </div>
      )}

      {/* 調試資訊（開發模式） */}
      {process.env.NODE_ENV === 'development' && (
        <div className="absolute top-2 left-2 bg-black/75 text-white text-xs px-2 py-1 rounded">
          Debug: Slide {marpPreview.currentSlideIndex + 1}, Theme: {theme}
        </div>
      )}
    </div>
  );
}

// 簡化版預覽組件
export interface SimpleSlidePreviewProps {
  markdown: string;
  theme?: SupportedTheme;
  className?: string;
}

export function SimpleSlidePreview({ 
  markdown, 
  theme = 'default',
  className = '' 
}: SimpleSlidePreviewProps) {
  return (
    <SlidePreview
      markdown={markdown}
      theme={theme}
      className={className}
      options={{
        showNavigation: true,
        showProgress: true,
        showSlideNumber: true,
        enableKeyboardNav: true,
      }}
    />
  );
}

export default SlidePreview;