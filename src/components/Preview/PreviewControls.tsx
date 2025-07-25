/**
 * 預覽控制組件
 * 提供上一張/下一張按鈕、投影片計數器、全螢幕切換和縮放控制
 */

'use client';

import React, { useState, useRef, useEffect } from 'react';
import type { SupportedTheme, PreviewMode } from '@/lib/marp/config';

// 預覽控制組件 Props
export interface PreviewControlsProps {
  // 投影片資訊
  currentSlide: number;
  totalSlides: number;

  // 當前設定
  theme: SupportedTheme;
  mode: PreviewMode;

  // 縮放和全螢幕
  zoom: number;
  isFullscreen: boolean;

  // 狀態
  isLoading?: boolean;
  canNavigate?: boolean;

  // 導航事件
  onPrevious?: () => void;
  onNext?: () => void;
  onGoToSlide?: (index: number) => void;

  // 控制事件
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  onZoomReset?: () => void;
  onFullscreenToggle?: () => void;

  // 模式和主題變更
  onModeChange?: (mode: PreviewMode) => void;
  onThemeChange?: (theme: SupportedTheme) => void;

  // 其他動作
  onRefresh?: () => void;
  onExport?: () => void;

  // 樣式
  className?: string;
  size?: 'small' | 'medium' | 'large';
}

// 導航按鈕組件
interface NavigationButtonsProps {
  currentSlide: number;
  totalSlides: number;
  onPrevious: () => void;
  onNext: () => void;
  canNavigate: boolean;
  size: 'small' | 'medium' | 'large';
}

function NavigationButtons({
  currentSlide,
  totalSlides,
  onPrevious,
  onNext,
  canNavigate,
  size,
}: NavigationButtonsProps) {
  const sizeClasses = {
    small: 'p-1.5 text-sm',
    medium: 'p-2 text-base',
    large: 'p-3 text-lg',
  };

  const iconSizes = {
    small: 'w-4 h-4',
    medium: 'w-5 h-5',
    large: 'w-6 h-6',
  };

  return (
    <div className="flex items-center gap-1">
      <button
        onClick={onPrevious}
        disabled={!canNavigate || currentSlide === 0}
        className={`${sizeClasses[size]} rounded-lg bg-white border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm`}
        title="上一張投影片 (←)"
      >
        <svg
          className={iconSizes[size]}
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

      <button
        onClick={onNext}
        disabled={!canNavigate || currentSlide >= totalSlides - 1}
        className={`${sizeClasses[size]} rounded-lg bg-white border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm`}
        title="下一張投影片 (→)"
      >
        <svg
          className={iconSizes[size]}
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
    </div>
  );
}

// 投影片計數器組件
interface SlideCounterProps {
  currentSlide: number;
  totalSlides: number;
  onGoToSlide: (index: number) => void;
  size: 'small' | 'medium' | 'large';
}

function SlideCounter({
  currentSlide,
  totalSlides,
  onGoToSlide,
  size,
}: SlideCounterProps) {
  const [showSlideSelector, setShowSlideSelector] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const sizeClasses = {
    small: 'px-2 py-1 text-xs',
    medium: 'px-3 py-2 text-sm',
    large: 'px-4 py-2 text-base',
  };

  // 點擊外部關閉下拉選單
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setShowSlideSelector(false);
      }
    };

    if (showSlideSelector) {
      document.addEventListener('mousedown', handleClickOutside);
      return () =>
        document.removeEventListener('mousedown', handleClickOutside);
    }

    return undefined;
  }, [showSlideSelector]);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setShowSlideSelector(!showSlideSelector)}
        className={`${sizeClasses[size]} rounded-lg bg-white border border-gray-300 hover:bg-gray-50 transition-all shadow-sm font-medium min-w-[60px]`}
        title="選擇投影片"
      >
        {currentSlide + 1} / {totalSlides}
      </button>

      {showSlideSelector && (
        <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-white border border-gray-200 rounded-lg shadow-lg p-3 z-20">
          <div className="text-xs text-gray-500 mb-2">跳到投影片</div>
          <div className="grid grid-cols-6 gap-1 max-h-40 overflow-y-auto">
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
                title={`投影片 ${index + 1}`}
              >
                {index + 1}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// 縮放控制組件
interface ZoomControlsProps {
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onZoomReset: () => void;
  size: 'small' | 'medium' | 'large';
}

function ZoomControls({
  zoom,
  onZoomIn,
  onZoomOut,
  onZoomReset,
  size,
}: ZoomControlsProps) {
  const sizeClasses = {
    small: 'p-1.5 text-xs',
    medium: 'p-2 text-sm',
    large: 'p-3 text-base',
  };

  const iconSizes = {
    small: 'w-3 h-3',
    medium: 'w-4 h-4',
    large: 'w-5 h-5',
  };

  return (
    <div className="flex items-center gap-1">
      <button
        onClick={onZoomOut}
        disabled={zoom <= 0.25}
        className={`${sizeClasses[size]} rounded-lg bg-white border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm`}
        title="縮小"
      >
        <svg
          className={iconSizes[size]}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M20 12H4"
          />
        </svg>
      </button>

      <button
        onClick={onZoomReset}
        className={`${sizeClasses[size]} rounded-lg bg-white border border-gray-300 hover:bg-gray-50 transition-all shadow-sm font-medium min-w-[48px]`}
        title="重置縮放"
      >
        {Math.round(zoom * 100)}%
      </button>

      <button
        onClick={onZoomIn}
        disabled={zoom >= 3}
        className={`${sizeClasses[size]} rounded-lg bg-white border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm`}
        title="放大"
      >
        <svg
          className={iconSizes[size]}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 4v16m8-8H4"
          />
        </svg>
      </button>
    </div>
  );
}

// 全螢幕切換按鈕
interface FullscreenButtonProps {
  isFullscreen: boolean;
  onToggle: () => void;
  size: 'small' | 'medium' | 'large';
}

function FullscreenButton({
  isFullscreen,
  onToggle,
  size,
}: FullscreenButtonProps) {
  const sizeClasses = {
    small: 'p-1.5',
    medium: 'p-2',
    large: 'p-3',
  };

  const iconSizes = {
    small: 'w-4 h-4',
    medium: 'w-5 h-5',
    large: 'w-6 h-6',
  };

  return (
    <button
      onClick={onToggle}
      className={`${sizeClasses[size]} rounded-lg bg-white border border-gray-300 hover:bg-gray-50 transition-all shadow-sm`}
      title={isFullscreen ? '退出全螢幕' : '全螢幕檢視'}
    >
      {isFullscreen ? (
        <svg
          className={iconSizes[size]}
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
          className={iconSizes[size]}
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
  );
}

// 快速動作按鈕組件
interface QuickActionsProps {
  isLoading: boolean;
  onRefresh: () => void;
  onExport: () => void;
  size: 'small' | 'medium' | 'large';
}

function QuickActions({
  isLoading,
  onRefresh,
  onExport,
  size,
}: QuickActionsProps) {
  const sizeClasses = {
    small: 'p-1.5',
    medium: 'p-2',
    large: 'p-3',
  };

  const iconSizes = {
    small: 'w-4 h-4',
    medium: 'w-5 h-5',
    large: 'w-6 h-6',
  };

  return (
    <div className="flex items-center gap-1">
      <button
        onClick={onRefresh}
        disabled={isLoading}
        className={`${sizeClasses[size]} rounded-lg bg-white border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm`}
        title="重新整理"
      >
        <svg
          className={`${iconSizes[size]} ${isLoading ? 'animate-spin' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
          />
        </svg>
      </button>

      <button
        onClick={onExport}
        className={`${sizeClasses[size]} rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-all shadow-sm`}
        title="匯出投影片"
      >
        <svg
          className={iconSizes[size]}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
      </button>
    </div>
  );
}

/**
 * 主要預覽控制組件
 */
export function PreviewControls({
  currentSlide,
  totalSlides,
  theme: _theme,
  mode: _mode,
  zoom,
  isFullscreen,
  isLoading = false,
  canNavigate = true,
  onPrevious = () => {},
  onNext = () => {},
  onGoToSlide = () => {},
  onZoomIn = () => {},
  onZoomOut = () => {},
  onZoomReset = () => {},
  onFullscreenToggle = () => {},
  onModeChange: _onModeChange = () => {},
  onThemeChange: _onThemeChange = () => {},
  onRefresh = () => {},
  onExport = () => {},
  className = '',
  size = 'medium',
}: PreviewControlsProps) {
  return (
    <div
      className={`preview-controls flex items-center justify-between gap-4 p-3 bg-gray-50 border-t border-gray-200 ${className}`}
    >
      {/* 左側：導航控制 */}
      <div className="flex items-center gap-3">
        {totalSlides > 0 && (
          <>
            <NavigationButtons
              currentSlide={currentSlide}
              totalSlides={totalSlides}
              onPrevious={onPrevious}
              onNext={onNext}
              canNavigate={canNavigate}
              size={size}
            />

            <div className="w-px h-6 bg-gray-300" />

            <SlideCounter
              currentSlide={currentSlide}
              totalSlides={totalSlides}
              onGoToSlide={onGoToSlide}
              size={size}
            />
          </>
        )}
      </div>

      {/* 中間：縮放控制 */}
      <div className="flex items-center gap-3">
        <ZoomControls
          zoom={zoom}
          onZoomIn={onZoomIn}
          onZoomOut={onZoomOut}
          onZoomReset={onZoomReset}
          size={size}
        />

        <div className="w-px h-6 bg-gray-300" />

        <FullscreenButton
          isFullscreen={isFullscreen}
          onToggle={onFullscreenToggle}
          size={size}
        />
      </div>

      {/* 右側：快速動作 */}
      <div className="flex items-center gap-3">
        <QuickActions
          isLoading={isLoading}
          onRefresh={onRefresh}
          onExport={onExport}
          size={size}
        />
      </div>
    </div>
  );
}

// 簡化版控制組件
export interface SimplePreviewControlsProps {
  currentSlide: number;
  totalSlides: number;
  onPrevious: () => void;
  onNext: () => void;
  onGoToSlide: (index: number) => void;
  className?: string;
}

export function SimplePreviewControls({
  currentSlide,
  totalSlides,
  onPrevious,
  onNext,
  onGoToSlide,
  className = '',
}: SimplePreviewControlsProps) {
  return (
    <div
      className={`flex items-center justify-center gap-4 p-3 bg-gray-50 border-t border-gray-200 ${className}`}
    >
      <NavigationButtons
        currentSlide={currentSlide}
        totalSlides={totalSlides}
        onPrevious={onPrevious}
        onNext={onNext}
        canNavigate={true}
        size="medium"
      />

      <SlideCounter
        currentSlide={currentSlide}
        totalSlides={totalSlides}
        onGoToSlide={onGoToSlide}
        size="medium"
      />
    </div>
  );
}

// 浮動控制組件（覆蓋在預覽上方）
export interface FloatingPreviewControlsProps {
  currentSlide: number;
  totalSlides: number;
  onPrevious: () => void;
  onNext: () => void;
  onGoToSlide: (index: number) => void;
  onFullscreenToggle: () => void;
  isFullscreen: boolean;
  className?: string;
}

export function FloatingPreviewControls({
  currentSlide,
  totalSlides,
  onPrevious,
  onNext,
  onGoToSlide,
  onFullscreenToggle,
  isFullscreen,
  className = '',
}: FloatingPreviewControlsProps) {
  const [isVisible, setIsVisible] = useState(true);
  const hideTimeoutRef = useRef<NodeJS.Timeout>();

  // 自動隱藏控制項
  useEffect(() => {
    const resetHideTimer = () => {
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
      }
      setIsVisible(true);
      hideTimeoutRef.current = setTimeout(() => {
        setIsVisible(false);
      }, 3000);
    };

    const handleMouseMove = () => resetHideTimer();
    const handleKeyDown = () => resetHideTimer();

    resetHideTimer();
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
      }
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  return (
    <div
      className={`absolute bottom-4 left-1/2 transform -translate-x-1/2 transition-opacity duration-300 z-10 ${
        isVisible ? 'opacity-100' : 'opacity-0'
      } ${className}`}
    >
      <div className="flex items-center gap-2 bg-black/80 text-white px-4 py-2 rounded-lg shadow-lg">
        <NavigationButtons
          currentSlide={currentSlide}
          totalSlides={totalSlides}
          onPrevious={onPrevious}
          onNext={onNext}
          canNavigate={true}
          size="small"
        />

        <div className="w-px h-4 bg-white/30" />

        <SlideCounter
          currentSlide={currentSlide}
          totalSlides={totalSlides}
          onGoToSlide={onGoToSlide}
          size="small"
        />

        <div className="w-px h-4 bg-white/30" />

        <FullscreenButton
          isFullscreen={isFullscreen}
          onToggle={onFullscreenToggle}
          size="small"
        />
      </div>
    </div>
  );
}

export default PreviewControls;
