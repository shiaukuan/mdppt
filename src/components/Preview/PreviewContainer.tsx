/**
 * Marp 預覽容器組件
 * 提供預覽容器、錯誤邊界、載入狀態和客戶端渲染
 */

'use client';

import React, { Component, ReactNode, Suspense } from 'react';
import {
  useMarpPreview,
  type UseMarpPreviewOptions,
} from '@/hooks/useMarpPreview';
import type { SupportedTheme } from '@/lib/marp/config';

// 錯誤邊界狀態
interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

// 錯誤邊界 Props
interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

/**
 * 錯誤邊界組件
 */
class PreviewErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error,
    };
  }

  override componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({
      error,
      errorInfo,
    });

    // 呼叫錯誤回調
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    console.error('Preview Error Boundary caught an error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  override render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex flex-col items-center justify-center p-8 bg-red-50 border border-red-200 rounded-lg">
          <div className="text-red-600 text-xl font-semibold mb-4">
            🚨 預覽載入失敗
          </div>
          <div className="text-red-700 text-sm mb-4 max-w-lg text-center">
            {this.state.error?.message || '發生未知錯誤'}
          </div>
          <button
            onClick={this.handleReset}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
          >
            重新嘗試
          </button>
          {process.env.NODE_ENV === 'development' && this.state.errorInfo && (
            <details className="mt-4 p-4 bg-red-100 rounded max-w-2xl overflow-auto">
              <summary className="cursor-pointer text-red-800 font-medium">
                詳細錯誤資訊 (開發模式)
              </summary>
              <pre className="mt-2 text-xs text-red-700 whitespace-pre-wrap">
                {this.state.error?.stack}
                {'\n\n'}
                {this.state.errorInfo.componentStack}
              </pre>
            </details>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

// 載入狀態組件
interface LoadingSpinnerProps {
  message?: string;
  size?: 'small' | 'medium' | 'large';
}

function LoadingSpinner({
  message = '載入中...',
  size = 'medium',
}: LoadingSpinnerProps) {
  const sizeClasses = {
    small: 'w-4 h-4',
    medium: 'w-8 h-8',
    large: 'w-12 h-12',
  };

  return (
    <div className="flex flex-col items-center justify-center p-8 bg-blue-50 border border-blue-200 rounded-lg">
      <div
        className={`animate-spin rounded-full border-4 border-blue-200 border-t-blue-600 ${sizeClasses[size]} mb-4`}
      />
      <div className="text-blue-700 text-sm font-medium">{message}</div>
    </div>
  );
}

// 預覽內容組件 Props
interface PreviewContentProps {
  markdown: string;
  theme?: SupportedTheme;
  options?: Partial<UseMarpPreviewOptions>;
  className?: string;
  onSlideChange?: (slideIndex: number) => void;
  onError?: (error: string) => void;
}

/**
 * 預覽內容組件
 */
function PreviewContent({
  markdown,
  theme = 'default',
  options = {},
  className = '',
  onSlideChange,
  onError,
}: PreviewContentProps) {
  const marpPreview = useMarpPreview({
    initialMarkdown: markdown,
    initialConfig: { theme },
    autoInitialize: true,
    ...(onError && { onError }),
    ...options,
  });

  // 監聽投影片變化
  React.useEffect(() => {
    if (onSlideChange) {
      onSlideChange(marpPreview.currentSlideIndex);
    }
  }, [marpPreview.currentSlideIndex, onSlideChange]);

  // 更新 Markdown 內容
  React.useEffect(() => {
    marpPreview.updateMarkdown(markdown);
  }, [markdown, marpPreview.updateMarkdown]);

  // 切換主題
  React.useEffect(() => {
    if (theme !== marpPreview.config.theme) {
      marpPreview.changeTheme(theme);
    }
  }, [theme, marpPreview.config.theme, marpPreview.changeTheme]);

  // 載入狀態
  if (!marpPreview.isInitialized) {
    return <LoadingSpinner message="初始化投影片引擎..." size="large" />;
  }

  if (marpPreview.isLoading) {
    return <LoadingSpinner message="渲染投影片中..." />;
  }

  // 錯誤狀態
  if (marpPreview.error) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-yellow-50 border border-yellow-200 rounded-lg">
        <div className="text-yellow-600 text-xl font-semibold mb-4">
          ⚠️ 渲染錯誤
        </div>
        <div className="text-yellow-700 text-sm mb-4 max-w-lg text-center">
          {marpPreview.error}
        </div>
        <div className="flex gap-2">
          <button
            onClick={marpPreview.clearError}
            className="px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700 transition-colors"
          >
            清除錯誤
          </button>
          <button
            onClick={marpPreview.refresh}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            重新渲染
          </button>
        </div>
      </div>
    );
  }

  // 無內容狀態
  if (!marpPreview.result.totalSlides) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-gray-50 border border-gray-200 rounded-lg">
        <div className="text-gray-500 text-xl font-semibold mb-4">
          📝 開始撰寫投影片
        </div>
        <div className="text-gray-600 text-sm text-center max-w-md">
          請在左側編輯器中輸入 Markdown 內容，
          <br />
          使用 <code className="bg-gray-200 px-1 rounded">---</code> 分隔投影片
        </div>
      </div>
    );
  }

  // 渲染投影片內容
  const currentSlide = marpPreview.result.slides[marpPreview.currentSlideIndex];

  return (
    <div className={`marp-preview-container ${className}`}>
      {/* 投影片樣式 */}
      <style dangerouslySetInnerHTML={{ __html: marpPreview.result.css }} />

      {/* 投影片內容 */}
      <div className="marp-slide-container relative overflow-hidden rounded-lg border border-gray-200 bg-white shadow-lg">
        {currentSlide && (
          <div
            className="marp-slide-content"
            dangerouslySetInnerHTML={{ __html: currentSlide.html }}
          />
        )}

        {/* 投影片導航 */}
        {marpPreview.result.totalSlides > 1 && (
          <div className="absolute bottom-4 right-4 flex items-center gap-2 bg-black/80 text-white px-3 py-1 rounded-full text-sm">
            <button
              onClick={marpPreview.previousSlide}
              disabled={marpPreview.currentSlideIndex === 0}
              className="hover:bg-white/20 p-1 rounded disabled:opacity-50 disabled:cursor-not-allowed"
              title="上一張投影片"
            >
              ←
            </button>

            <span className="px-2">
              {marpPreview.currentSlideIndex + 1} /{' '}
              {marpPreview.result.totalSlides}
            </span>

            <button
              onClick={marpPreview.nextSlide}
              disabled={
                marpPreview.currentSlideIndex >=
                marpPreview.result.totalSlides - 1
              }
              className="hover:bg-white/20 p-1 rounded disabled:opacity-50 disabled:cursor-not-allowed"
              title="下一張投影片"
            >
              →
            </button>
          </div>
        )}
      </div>

      {/* 投影片進度條 */}
      {marpPreview.result.totalSlides > 1 && (
        <div className="mt-4 bg-gray-200 rounded-full h-2 overflow-hidden">
          <div
            className="bg-blue-600 h-full transition-all duration-300 ease-out"
            style={{
              width: `${((marpPreview.currentSlideIndex + 1) / marpPreview.result.totalSlides) * 100}%`,
            }}
          />
        </div>
      )}

      {/* 投影片縮圖（開發用） */}
      {process.env.NODE_ENV === 'development' && (
        <details className="mt-4">
          <summary className="cursor-pointer text-sm text-gray-600">
            投影片縮圖 ({marpPreview.result.totalSlides} 張)
          </summary>
          <div className="mt-2 grid grid-cols-4 gap-2 max-h-40 overflow-y-auto">
            {marpPreview.result.slides.map((slide, index) => (
              <button
                key={index}
                onClick={() => marpPreview.goToSlide(index)}
                className={`relative border rounded overflow-hidden hover:border-blue-500 transition-colors ${
                  index === marpPreview.currentSlideIndex
                    ? 'border-blue-500 ring-2 ring-blue-200'
                    : 'border-gray-200'
                }`}
                title={`投影片 ${index + 1}: ${slide.title || '無標題'}`}
              >
                <div
                  className="w-full h-16 text-xs transform scale-50 origin-top-left"
                  dangerouslySetInnerHTML={{ __html: slide.html }}
                />
                <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white text-xs px-1 py-0.5">
                  {index + 1}
                </div>
              </button>
            ))}
          </div>
        </details>
      )}
    </div>
  );
}

// 主要預覽容器組件 Props
export interface PreviewContainerProps {
  markdown: string;
  theme?: SupportedTheme;
  className?: string;
  options?: Partial<UseMarpPreviewOptions>;
  onSlideChange?: (slideIndex: number) => void;
  onError?: (error: string) => void;
  showErrorBoundary?: boolean;
  loadingComponent?: ReactNode;
  errorComponent?: ReactNode;
}

/**
 * Marp 預覽容器組件
 *
 * 提供完整的投影片預覽功能，包含：
 * - 錯誤邊界處理
 * - 載入狀態顯示
 * - 投影片導航
 * - 進度顯示
 * - 響應式設計
 */
export function PreviewContainer({
  markdown,
  theme = 'default',
  className = '',
  options = {},
  onSlideChange,
  onError,
  showErrorBoundary = true,
  loadingComponent,
  errorComponent,
}: PreviewContainerProps) {
  const previewContent = (
    <Suspense
      fallback={
        loadingComponent || <LoadingSpinner message="載入預覽組件..." />
      }
    >
      <PreviewContent
        markdown={markdown}
        theme={theme}
        options={options}
        className={className}
        {...(onSlideChange && { onSlideChange })}
        {...(onError && { onError })}
      />
    </Suspense>
  );

  if (!showErrorBoundary) {
    return previewContent;
  }

  return (
    <PreviewErrorBoundary
      fallback={errorComponent}
      onError={(error, errorInfo) => {
        console.error('Preview Error:', error, errorInfo);
        if (onError) {
          onError(error.message);
        }
      }}
    >
      {previewContent}
    </PreviewErrorBoundary>
  );
}

// 簡化版預覽容器（僅接受必要 props）
export function SimplePreviewContainer({
  markdown,
  theme = 'default',
}: {
  markdown: string;
  theme?: SupportedTheme;
}) {
  return (
    <PreviewContainer
      markdown={markdown}
      theme={theme}
      className="w-full h-full"
    />
  );
}

export default PreviewContainer;
