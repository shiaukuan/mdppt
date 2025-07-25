/**
 * 整合預覽組件
 * 將 SlidePreview 和 PreviewControls 整合為完整的預覽系統
 */

'use client';

import React, { useState, useCallback, useRef } from 'react';
import { SlidePreview } from './SlidePreview';
import { PreviewControls } from './PreviewControls';
import { PreviewToolbar } from './PreviewToolbar';
import { usePreview } from '@/hooks/usePreview';
import type { SupportedTheme, PreviewMode } from '@/lib/marp/config';

// 整合預覽組件 Props
export interface IntegratedPreviewProps {
  // 內容
  markdown: string;

  // 初始設定
  initialTheme?: SupportedTheme;
  initialMode?: PreviewMode;

  // 顯示選項
  showToolbar?: boolean;
  showControls?: boolean;
  showProgress?: boolean;
  toolbarPosition?: 'top' | 'bottom';
  controlsPosition?: 'top' | 'bottom' | 'floating';

  // 樣式
  className?: string;

  // 事件回調
  onThemeChange?: (theme: SupportedTheme) => void;
  onModeChange?: (mode: PreviewMode) => void;
  onExport?: (format: 'pptx' | 'pdf' | 'html') => void;
  onError?: (error: string) => void;
  onReady?: (totalSlides: number) => void;
}

/**
 * 整合預覽組件
 * 提供完整的投影片預覽體驗，包含工具列、預覽區域和控制面板
 */
export function IntegratedPreview({
  markdown,
  initialTheme = 'default',
  initialMode = 'single',
  showToolbar = true,
  showControls = true,
  showProgress = true,
  toolbarPosition = 'top',
  controlsPosition = 'bottom',
  className = '',
  onThemeChange,
  onModeChange,
  onExport,
  onError,
  onReady,
}: IntegratedPreviewProps) {
  const previewContainerRef = useRef<HTMLDivElement>(null);

  // 使用預覽狀態管理
  const preview = usePreview({
    initialMarkdown: markdown,
    initialTheme,
    initialMode,
    autoInitialize: true,
    fullscreenElement: previewContainerRef.current,
    ...(onThemeChange && { onThemeChange }),
    ...(onModeChange && { onModeChange }),
    ...(onError && { onError }),
    ...(onReady && { onReady }),
  });

  // 同步 Markdown 內容
  React.useEffect(() => {
    if (markdown !== preview.markdown) {
      preview.updateMarkdown(markdown);
    }
  }, [markdown, preview.markdown, preview.updateMarkdown]);

  // 導出處理
  const handleExport = useCallback(
    (format: 'pptx' | 'pdf' | 'html') => {
      onExport?.(format);
    },
    [onExport]
  );

  // 工具列組件
  const toolbar = showToolbar && (
    <PreviewToolbar
      currentTheme={preview.theme}
      currentMode={preview.mode}
      config={{
        theme: preview.theme,
        size: '16:9',
        html: true,
        pagination: true,
        math: 'mathjax',
        allowLocalFiles: false,
        inlineSVG: false,
      }}
      totalSlides={preview.totalSlides}
      currentSlideIndex={preview.currentSlideIndex}
      isLoading={preview.isLoading}
      isFullscreen={preview.isFullscreen}
      onThemeChange={preview.setTheme}
      onModeChange={preview.setMode}
      onConfigChange={preview.updateConfig}
      onExport={handleExport}
      onRefresh={preview.refresh}
      onReset={preview.reset}
      showAdvanced={true}
    />
  );

  // 控制面板組件
  const controls = showControls && preview.hasSlides && (
    <PreviewControls
      currentSlide={preview.currentSlideIndex}
      totalSlides={preview.totalSlides}
      theme={preview.theme}
      mode={preview.mode}
      zoom={preview.zoom}
      isFullscreen={preview.isFullscreen}
      isLoading={preview.isLoading}
      canNavigate={preview.canNavigate}
      onPrevious={preview.previousSlide}
      onNext={preview.nextSlide}
      onGoToSlide={preview.goToSlide}
      onZoomIn={preview.zoomIn}
      onZoomOut={preview.zoomOut}
      onZoomReset={preview.resetZoom}
      onFullscreenToggle={preview.toggleFullscreen}
      onModeChange={preview.setMode}
      onThemeChange={preview.setTheme}
      onRefresh={preview.refresh}
      onExport={() => handleExport('pptx')}
      size="medium"
    />
  );

  // 浮動控制組件（用於全螢幕模式）
  const floatingControls = controlsPosition === 'floating' &&
    preview.hasSlides && (
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 pointer-events-auto">
          <div className="flex items-center gap-2 bg-black/80 text-white px-4 py-2 rounded-lg shadow-lg">
            <button
              onClick={preview.previousSlide}
              disabled={preview.isFirstSlide}
              className="p-1.5 rounded hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              title="上一張"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>

            <span className="px-2 text-sm font-medium">
              {preview.currentSlideIndex + 1} / {preview.totalSlides}
            </span>

            <button
              onClick={preview.nextSlide}
              disabled={preview.isLastSlide}
              className="p-1.5 rounded hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              title="下一張"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>

            <div className="w-px h-4 bg-white/30 mx-1" />

            <button
              onClick={preview.toggleFullscreen}
              className="p-1.5 rounded hover:bg-white/20 transition-all"
              title={preview.isFullscreen ? '退出全螢幕' : '全螢幕'}
            >
              {preview.isFullscreen ? (
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 9V4.5M9 9H4.5M9 9L3.5 3.5m5.5 11v4.5M9 15H4.5M9 15l-5.5 5.5m11-5.5v4.5m0-4.5h4.5m0 0l-5.5 5.5m5.5-11V4.5m0 4.5h-4.5m4.5 0l-5.5-5.5"
                  />
                </svg>
              ) : (
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"
                  />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>
    );

  return (
    <div
      ref={previewContainerRef}
      className={`integrated-preview flex flex-col h-full bg-gray-50 ${className}`}
    >
      {/* 頂部工具列 */}
      {toolbarPosition === 'top' && toolbar}

      {/* 頂部控制面板 */}
      {controlsPosition === 'top' && controls}

      {/* 主要預覽區域 */}
      <div className="flex-1 relative overflow-hidden">
        <SlidePreview
          markdown={preview.markdown}
          theme={preview.theme}
          options={{
            mode: preview.mode,
            showNavigation: controlsPosition !== 'floating',
            showProgress: showProgress,
            showSlideNumber: true,
            enableKeyboardNav: true,
            autoFit: true,
            debounceDelay: 300,
          }}
          onSlideChange={(slideIndex, slide) => {
            // 可以在這裡處理投影片變化
            console.log(`切換到投影片 ${slideIndex + 1}:`, slide.title);
          }}
          {...(onError && { onError })}
          {...(onReady && { onReady })}
          className="h-full"
        />

        {/* 浮動控制組件 */}
        {floatingControls}

        {/* 載入指示器 */}
        {preview.isLoading && (
          <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-10">
            <div className="flex flex-col items-center gap-3">
              <div className="animate-spin w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full" />
              <div className="text-sm text-gray-600">正在渲染投影片...</div>
            </div>
          </div>
        )}

        {/* 狀態指示器 */}
        {preview.hasSlides && !preview.isLoading && (
          <div className="absolute top-4 left-4 bg-black/75 text-white px-2 py-1 rounded text-xs">
            {preview.progress}% ({preview.currentSlideIndex + 1}/
            {preview.totalSlides})
          </div>
        )}
      </div>

      {/* 底部控制面板 */}
      {controlsPosition === 'bottom' && controls}

      {/* 底部工具列 */}
      {toolbarPosition === 'bottom' && toolbar}

      {/* 縮放指示器 */}
      {preview.zoom !== 1 && (
        <div className="absolute bottom-4 right-4 bg-black/75 text-white px-2 py-1 rounded text-xs">
          {Math.round(preview.zoom * 100)}%
        </div>
      )}

      {/* 調試資訊（開發模式） */}
      {process.env.NODE_ENV === 'development' && (
        <div className="absolute top-2 right-2 bg-black/75 text-white text-xs px-2 py-1 rounded">
          <div>Theme: {preview.theme}</div>
          <div>Mode: {preview.mode}</div>
          <div>Slides: {preview.totalSlides}</div>
          <div>Current: {preview.currentSlideIndex + 1}</div>
          <div>Zoom: {Math.round(preview.zoom * 100)}%</div>
          <div>Fullscreen: {preview.isFullscreen ? 'Yes' : 'No'}</div>
        </div>
      )}
    </div>
  );
}

// 簡化版整合預覽（僅包含基本功能）
export interface SimpleIntegratedPreviewProps {
  markdown: string;
  theme?: SupportedTheme;
  className?: string;
  onThemeChange?: (theme: SupportedTheme) => void;
  onExport?: (format: 'pptx' | 'pdf' | 'html') => void;
}

export function SimpleIntegratedPreview({
  markdown,
  theme = 'default',
  className = '',
  onThemeChange,
  onExport,
}: SimpleIntegratedPreviewProps) {
  return (
    <IntegratedPreview
      markdown={markdown}
      initialTheme={theme}
      initialMode="single"
      showToolbar={false}
      showControls={true}
      controlsPosition="bottom"
      className={className}
      {...(onThemeChange && { onThemeChange })}
      {...(onExport && { onExport })}
    />
  );
}

// 響應式整合預覽（根據螢幕大小調整佈局）
export interface ResponsiveIntegratedPreviewProps
  extends IntegratedPreviewProps {
  mobileBreakpoint?: number;
}

export function ResponsiveIntegratedPreview({
  mobileBreakpoint = 768,
  ...props
}: ResponsiveIntegratedPreviewProps) {
  const [isMobile, setIsMobile] = useState(false);

  React.useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < mobileBreakpoint);
    };

    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);

    return () => window.removeEventListener('resize', checkIsMobile);
  }, [mobileBreakpoint]);

  return (
    <IntegratedPreview
      {...props}
      showToolbar={!isMobile}
      controlsPosition={isMobile ? 'floating' : 'bottom'}
      toolbarPosition="top"
    />
  );
}

export default IntegratedPreview;
