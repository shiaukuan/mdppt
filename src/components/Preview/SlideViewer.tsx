/**
 * 投影片檢視器組件
 * 提供單張投影片顯示、導航控制和不同檢視模式
 */

'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import type { SlideData } from '@/lib/marp/client';
import type { PreviewMode } from '@/lib/marp/config';

// 投影片檢視器 Props
export interface SlideViewerProps {
  // 投影片資料
  slides: SlideData[];
  // 當前投影片索引
  currentSlideIndex: number;
  // 投影片 CSS
  css: string;
  // 檢視模式
  mode?: PreviewMode;
  // 是否顯示導航控制
  showControls?: boolean;
  // 是否顯示進度條
  showProgress?: boolean;
  // 是否顯示投影片編號
  showSlideNumber?: boolean;
  // 是否啟用鍵盤導航
  enableKeyboardNavigation?: boolean;
  // 是否自動適應大小
  autoFit?: boolean;
  // 自訂樣式類別
  className?: string;
  // 事件回調
  onSlideChange?: (slideIndex: number) => void;
  onModeChange?: (mode: PreviewMode) => void;
  onFullscreen?: (isFullscreen: boolean) => void;
}

// 導航控制組件
interface NavigationControlsProps {
  currentSlide: number;
  totalSlides: number;
  onPrevious: () => void;
  onNext: () => void;
  onGoToSlide: (index: number) => void;
  className?: string;
}

function NavigationControls({
  currentSlide,
  totalSlides,
  onPrevious,
  onNext,
  onGoToSlide,
  className = '',
}: NavigationControlsProps) {
  const [showSlideSelector, setShowSlideSelector] = useState(false);

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* 上一張投影片 */}
      <button
        onClick={onPrevious}
        disabled={currentSlide === 0}
        className="p-2 rounded-lg bg-black/80 text-white hover:bg-black/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        title="上一張投影片 (←)"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      {/* 投影片選擇器 */}
      <div className="relative">
        <button
          onClick={() => setShowSlideSelector(!showSlideSelector)}
          className="px-3 py-2 rounded-lg bg-black/80 text-white hover:bg-black/90 transition-all text-sm font-medium min-w-[80px]"
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

      {/* 下一張投影片 */}
      <button
        onClick={onNext}
        disabled={currentSlide >= totalSlides - 1}
        className="p-2 rounded-lg bg-black/80 text-white hover:bg-black/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        title="下一張投影片 (→)"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </div>
  );
}

// 進度條組件
interface ProgressBarProps {
  current: number;
  total: number;
  className?: string;
}

function ProgressBar({ current, total, className = '' }: ProgressBarProps) {
  const progress = total > 0 ? ((current + 1) / total) * 100 : 0;

  return (
    <div className={`w-full bg-gray-200 rounded-full h-1 ${className}`}>
      <div
        className="bg-blue-600 h-1 rounded-full transition-all duration-300 ease-out"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}

// 檢視模式切換器
interface ViewModeSwitcherProps {
  currentMode: PreviewMode;
  onModeChange: (mode: PreviewMode) => void;
  className?: string;
}

function ViewModeSwitcher({ currentMode, onModeChange, className = '' }: ViewModeSwitcherProps) {
  const modes: Array<{ mode: PreviewMode; icon: string; title: string }> = [
    { mode: 'single', icon: '📄', title: '單頁檢視' },
    { mode: 'grid', icon: '⚏', title: '格狀檢視' },
    { mode: 'presentation', icon: '🖥️', title: '簡報模式' },
  ];

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      {modes.map(({ mode, icon, title }) => (
        <button
          key={mode}
          onClick={() => onModeChange(mode)}
          className={`p-2 rounded-lg transition-all text-sm ${
            currentMode === mode
              ? 'bg-blue-600 text-white'
              : 'bg-black/80 text-white hover:bg-black/90'
          }`}
          title={title}
        >
          {icon}
        </button>
      ))}
    </div>
  );
}

// 全螢幕控制
function useFullscreen(elementRef: React.RefObject<HTMLElement>) {
  const [isFullscreen, setIsFullscreen] = useState(false);

  const enterFullscreen = useCallback(async () => {
    if (!elementRef.current) return;

    try {
      if (elementRef.current.requestFullscreen) {
        await elementRef.current.requestFullscreen();
      } else if ((elementRef.current as any).webkitRequestFullscreen) {
        await (elementRef.current as any).webkitRequestFullscreen();
      } else if ((elementRef.current as any).msRequestFullscreen) {
        await (elementRef.current as any).msRequestFullscreen();
      }
      setIsFullscreen(true);
    } catch (error) {
      console.error('無法進入全螢幕模式:', error);
    }
  }, [elementRef]);

  const exitFullscreen = useCallback(async () => {
    try {
      if (document.exitFullscreen) {
        await document.exitFullscreen();
      } else if ((document as any).webkitExitFullscreen) {
        await (document as any).webkitExitFullscreen();
      } else if ((document as any).msExitFullscreen) {
        await (document as any).msExitFullscreen();
      }
      setIsFullscreen(false);
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
  };
}

/**
 * 投影片檢視器組件
 */
export function SlideViewer({
  slides,
  currentSlideIndex,
  css,
  mode = 'single',
  showControls = true,
  showProgress = true,
  showSlideNumber = true,
  enableKeyboardNavigation = true,
  autoFit = true,
  className = '',
  onSlideChange,
  onModeChange,
  onFullscreen,
}: SlideViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [currentMode, setCurrentMode] = useState<PreviewMode>(mode);
  const { isFullscreen, toggleFullscreen } = useFullscreen(containerRef);

  // 確保索引有效
  const validSlideIndex = Math.max(0, Math.min(currentSlideIndex, slides.length - 1));
  const currentSlide = slides[validSlideIndex];

  // 導航函數
  const goToPrevious = useCallback(() => {
    if (validSlideIndex > 0) {
      const newIndex = validSlideIndex - 1;
      onSlideChange?.(newIndex);
    }
  }, [validSlideIndex, onSlideChange]);

  const goToNext = useCallback(() => {
    if (validSlideIndex < slides.length - 1) {
      const newIndex = validSlideIndex + 1;
      onSlideChange?.(newIndex);
    }
  }, [validSlideIndex, slides.length, onSlideChange]);

  const goToSlide = useCallback((index: number) => {
    const validIndex = Math.max(0, Math.min(index, slides.length - 1));
    onSlideChange?.(validIndex);
  }, [slides.length, onSlideChange]);

  // 鍵盤導航
  useEffect(() => {
    if (!enableKeyboardNavigation) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      switch (event.key) {
        case 'ArrowLeft':
        case 'ArrowUp':
          event.preventDefault();
          goToPrevious();
          break;
        case 'ArrowRight':
        case 'ArrowDown':
        case ' ':
          event.preventDefault();
          goToNext();
          break;
        case 'Home':
          event.preventDefault();
          goToSlide(0);
          break;
        case 'End':
          event.preventDefault();
          goToSlide(slides.length - 1);
          break;
        case 'Escape':
          if (isFullscreen) {
            toggleFullscreen();
          }
          break;
        case 'f':
        case 'F11':
          event.preventDefault();
          toggleFullscreen();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [enableKeyboardNavigation, goToPrevious, goToNext, goToSlide, slides.length, isFullscreen, toggleFullscreen]);

  // 模式變化處理
  const handleModeChange = useCallback((newMode: PreviewMode) => {
    setCurrentMode(newMode);
    onModeChange?.(newMode);
  }, [onModeChange]);

  // 全螢幕狀態變化
  useEffect(() => {
    onFullscreen?.(isFullscreen);
  }, [isFullscreen, onFullscreen]);

  // 如果沒有投影片
  if (!slides.length) {
    return (
      <div className={`flex items-center justify-center p-8 bg-gray-50 border border-gray-200 rounded-lg ${className}`}>
        <div className="text-center text-gray-500">
          <div className="text-4xl mb-4">📝</div>
          <div className="text-lg font-medium mb-2">無投影片內容</div>
          <div className="text-sm">請先輸入 Markdown 內容</div>
        </div>
      </div>
    );
  }

  // 格狀檢視模式
  if (currentMode === 'grid') {
    return (
      <div 
        ref={containerRef}
        className={`slide-viewer grid-mode ${className} ${isFullscreen ? 'fullscreen' : ''}`}
      >
        <style dangerouslySetInnerHTML={{ __html: css }} />
        
        {/* 控制列 */}
        {showControls && (
          <div className="sticky top-0 z-10 bg-white border-b border-gray-200 p-4 flex items-center justify-between">
            <ViewModeSwitcher 
              currentMode={currentMode} 
              onModeChange={handleModeChange}
            />
            
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">
                共 {slides.length} 張投影片
              </span>
              <button
                onClick={toggleFullscreen}
                className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-all"
                title={isFullscreen ? '退出全螢幕' : '全螢幕'}
              >
                {isFullscreen ? '🗗' : '⛶'}
              </button>
            </div>
          </div>
        )}

        {/* 投影片格狀佈局 */}
        <div className="p-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 max-h-full overflow-y-auto">
          {slides.map((slide, index) => (
            <button
              key={index}
              onClick={() => {
                goToSlide(index);
                handleModeChange('single');
              }}
              className={`relative border rounded-lg overflow-hidden hover:border-blue-500 transition-all group ${
                index === validSlideIndex 
                  ? 'border-blue-500 ring-2 ring-blue-200' 
                  : 'border-gray-200'
              }`}
              title={`投影片 ${index + 1}: ${slide.title || '無標題'}`}
            >
              <div 
                className="w-full aspect-video text-xs transform scale-50 origin-top-left bg-white"
                style={{ width: '200%', height: '200%' }}
                dangerouslySetInnerHTML={{ __html: slide.html }}
              />
              
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all" />
              
              <div className="absolute bottom-2 left-2 right-2 bg-black/80 text-white text-xs px-2 py-1 rounded">
                {index + 1}. {slide.title || '無標題'}
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // 單頁檢視和簡報模式
  return (
    <div 
      ref={containerRef}
      className={`slide-viewer single-mode relative ${className} ${isFullscreen ? 'fullscreen' : ''} ${
        currentMode === 'presentation' ? 'presentation-mode bg-black' : 'bg-white'
      }`}
    >
      <style dangerouslySetInnerHTML={{ __html: css }} />
      
      {/* 投影片內容 */}
      {currentSlide && (
        <div className={`slide-content relative overflow-hidden ${
          autoFit ? 'flex items-center justify-center' : ''
        } ${currentMode === 'presentation' ? 'h-screen' : 'border border-gray-200 rounded-lg'}`}>
          <div
            className={`marp-slide ${autoFit ? 'max-w-full max-h-full' : ''}`}
            dangerouslySetInnerHTML={{ __html: currentSlide.html }}
          />
        </div>
      )}

      {/* 控制面板 */}
      {showControls && (
        <div className={`absolute bottom-4 left-1/2 transform -translate-x-1/2 flex items-center gap-4 ${
          currentMode === 'presentation' ? 'bg-black/80 text-white p-3 rounded-lg' : 'bg-white'
        }`}>
          <NavigationControls
            currentSlide={validSlideIndex}
            totalSlides={slides.length}
            onPrevious={goToPrevious}
            onNext={goToNext}
            onGoToSlide={goToSlide}
          />

          <ViewModeSwitcher 
            currentMode={currentMode} 
            onModeChange={handleModeChange}
          />

          <button
            onClick={toggleFullscreen}
            className="p-2 rounded-lg bg-black/80 text-white hover:bg-black/90 transition-all"
            title={isFullscreen ? '退出全螢幕 (Esc)' : '全螢幕 (F)'}
          >
            {isFullscreen ? '🗗' : '⛶'}
          </button>
        </div>
      )}

      {/* 進度條 */}
      {showProgress && slides.length > 1 && (
        <ProgressBar
          current={validSlideIndex}
          total={slides.length}
          className={`absolute bottom-0 left-0 right-0 ${
            currentMode === 'presentation' ? 'opacity-50' : ''
          }`}
        />
      )}

      {/* 投影片編號 */}
      {showSlideNumber && (
        <div className={`absolute top-4 right-4 text-sm font-medium ${
          currentMode === 'presentation' 
            ? 'text-white bg-black/50 px-2 py-1 rounded' 
            : 'text-gray-600'
        }`}>
          {validSlideIndex + 1} / {slides.length}
        </div>
      )}

      {/* 鍵盤快捷鍵提示 */}
      {currentMode === 'presentation' && (
        <div className="absolute top-4 left-4 text-white/70 text-xs">
          <div>← → 導航</div>
          <div>F 全螢幕</div>
          <div>Esc 退出</div>
        </div>
      )}
    </div>
  );
}

export default SlideViewer;