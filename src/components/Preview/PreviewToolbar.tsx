/**
 * 預覽工具列組件
 * 提供主題切換、檢視模式、導出選項和其他預覽控制功能
 */

'use client';

import React, { useState, useCallback } from 'react';
import type { SupportedTheme, PreviewMode, MarpConfig } from '@/lib/marp/config';
import { THEME_INFO, PREVIEW_MODES } from '@/lib/marp/config';
import { themeManager, generateThemePreview } from '@/lib/marp/themes';

// 工具列 Props
export interface PreviewToolbarProps {
  // 當前配置
  currentTheme: SupportedTheme;
  currentMode: PreviewMode;
  config: MarpConfig;
  
  // 投影片資訊
  totalSlides: number;
  currentSlideIndex: number;
  
  // 狀態
  isLoading?: boolean;
  isFullscreen?: boolean;
  
  // 事件回調
  onThemeChange?: (theme: SupportedTheme) => void;
  onModeChange?: (mode: PreviewMode) => void;
  onConfigChange?: (config: Partial<MarpConfig>) => void;
  onExport?: (format: 'pptx' | 'pdf' | 'html') => void;
  onRefresh?: () => void;
  onReset?: () => void;
  
  // 樣式
  className?: string;
  showAdvanced?: boolean;
}

// 主題選擇器組件
interface ThemeSelectorProps {
  currentTheme: SupportedTheme;
  onThemeChange: (theme: SupportedTheme) => void;
  className?: string;
}

function ThemeSelector({ currentTheme, onThemeChange, className = '' }: ThemeSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const themes = themeManager.getAvailableThemes();
  const currentThemeInfo = THEME_INFO[currentTheme];

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-300 rounded-lg hover:border-gray-400 transition-all text-sm"
        title="選擇主題"
      >
        <div
          className="w-4 h-4 rounded border"
          style={{ backgroundColor: currentThemeInfo.colors.primary }}
        />
        <span>{currentThemeInfo.name}</span>
        <svg 
          className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute top-full mt-2 left-0 bg-white border border-gray-200 rounded-lg shadow-lg z-10 p-2 min-w-[280px]">
          <div className="max-h-64 overflow-y-auto">
            {themes.map((theme) => (
              <button
                key={theme.id}
                onClick={() => {
                  onThemeChange(theme.id);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-all text-left ${
                  theme.id === currentTheme ? 'bg-blue-50 border-2 border-blue-200' : 'border-2 border-transparent'
                }`}
              >
                {/* 主題預覽 */}
                <div
                  className="w-16 h-10 rounded border border-gray-200 flex-shrink-0 overflow-hidden"
                  dangerouslySetInnerHTML={{ __html: generateThemePreview(theme.id) }}
                />
                
                {/* 主題資訊 */}
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-gray-900 truncate">{theme.name}</div>
                  <div className="text-xs text-gray-500 truncate">{theme.description}</div>
                  
                  {/* 顏色指示器 */}
                  <div className="flex gap-1 mt-1">
                    {Object.values(theme.colors).map((color, index) => (
                      <div
                        key={index}
                        className="w-3 h-3 rounded-full border border-gray-200"
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>

                {/* 選中狀態 */}
                {theme.id === currentTheme && (
                  <div className="text-blue-600">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
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
  const modes = Object.entries(PREVIEW_MODES) as Array<[PreviewMode, typeof PREVIEW_MODES[PreviewMode]]>;

  return (
    <div className={`flex items-center border border-gray-300 rounded-lg overflow-hidden ${className}`}>
      {modes.map(([mode, info]) => (
        <button
          key={mode}
          onClick={() => onModeChange(mode)}
          className={`px-3 py-2 text-sm font-medium transition-all ${
            currentMode === mode
              ? 'bg-blue-600 text-white'
              : 'bg-white text-gray-700 hover:bg-gray-50'
          }`}
          title={info.description}
        >
          {info.name}
        </button>
      ))}
    </div>
  );
}

// 導出選項組件
interface ExportOptionsProps {
  onExport: (format: 'pptx' | 'pdf' | 'html') => void;
  isLoading?: boolean;
  className?: string;
}

function ExportOptions({ onExport, isLoading = false, className = '' }: ExportOptionsProps) {
  const [isOpen, setIsOpen] = useState(false);

  const exportFormats = [
    { format: 'pptx' as const, name: 'PowerPoint', icon: '📊', description: '匯出為 PPTX 檔案' },
    { format: 'pdf' as const, name: 'PDF', icon: '📄', description: '匯出為 PDF 檔案' },
    { format: 'html' as const, name: 'HTML', icon: '🌐', description: '匯出為 HTML 檔案' },
  ];

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isLoading}
        className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm"
        title="匯出投影片"
      >
        {isLoading ? (
          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        ) : (
          <span>📤</span>
        )}
        <span>匯出</span>
        <svg 
          className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute top-full mt-2 right-0 bg-white border border-gray-200 rounded-lg shadow-lg z-10 p-2 min-w-[200px]">
          {exportFormats.map(({ format, name, icon, description }) => (
            <button
              key={format}
              onClick={() => {
                onExport(format);
                setIsOpen(false);
              }}
              disabled={isLoading}
              className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-left"
              title={description}
            >
              <span className="text-lg">{icon}</span>
              <div>
                <div className="font-medium text-gray-900">{name}</div>
                <div className="text-xs text-gray-500">{description}</div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// 進階設定組件
interface AdvancedSettingsProps {
  config: MarpConfig;
  onConfigChange: (config: Partial<MarpConfig>) => void;
  className?: string;
}

function AdvancedSettings({ config, onConfigChange, className = '' }: AdvancedSettingsProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-lg transition-all"
        title="進階設定"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute top-full mt-2 right-0 bg-white border border-gray-200 rounded-lg shadow-lg z-10 p-4 min-w-[300px]">
          <h3 className="font-medium text-gray-900 mb-3">進階設定</h3>
          
          <div className="space-y-4">
            {/* 投影片尺寸 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">投影片尺寸</label>
              <select
                value={config.size}
                onChange={(e) => onConfigChange({ size: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="16:9">16:9 (1280×720)</option>
                <option value="4:3">4:3 (1024×768)</option>
                <option value="A4">A4 (794×1123)</option>
                <option value="custom">自訂</option>
              </select>
            </div>

            {/* 分頁 */}
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-700">顯示頁碼</label>
              <input
                type="checkbox"
                checked={config.pagination}
                onChange={(e) => onConfigChange({ pagination: e.target.checked })}
                className="rounded border-gray-300"
              />
            </div>

            {/* HTML 支援 */}
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-700">HTML 標籤支援</label>
              <input
                type="checkbox"
                checked={config.html}
                onChange={(e) => onConfigChange({ html: e.target.checked })}
                className="rounded border-gray-300"
              />
            </div>

            {/* 數學公式 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">數學公式引擎</label>
              <select
                value={config.math.toString()}
                onChange={(e) => onConfigChange({ math: e.target.value === 'false' ? false : e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="false">停用</option>
                <option value="mathjax">MathJax</option>
                <option value="katex">KaTeX</option>
              </select>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * 預覽工具列組件
 */
export function PreviewToolbar({
  currentTheme,
  currentMode,
  config,
  totalSlides,
  currentSlideIndex,
  isLoading = false,
  isFullscreen = false,
  onThemeChange,
  onModeChange,
  onConfigChange,
  onExport,
  onRefresh,
  onReset,
  className = '',
  showAdvanced = true,
}: PreviewToolbarProps) {
  
  // 處理快速動作
  const handleQuickRefresh = useCallback(() => {
    onRefresh?.();
  }, [onRefresh]);

  const handleQuickReset = useCallback(() => {
    if (confirm('確定要重置所有設定嗎？')) {
      onReset?.();
    }
  }, [onReset]);

  return (
    <div className={`preview-toolbar flex items-center justify-between gap-4 p-4 bg-gray-50 border-b border-gray-200 ${className}`}>
      {/* 左側：主要控制 */}
      <div className="flex items-center gap-3">
        {/* 主題選擇器 */}
        {onThemeChange && (
          <ThemeSelector
            currentTheme={currentTheme}
            onThemeChange={onThemeChange}
          />
        )}

        {/* 檢視模式 */}
        {onModeChange && (
          <ViewModeSwitcher
            currentMode={currentMode}
            onModeChange={onModeChange}
          />
        )}

        {/* 分隔線 */}
        <div className="w-px h-6 bg-gray-300" />

        {/* 快速動作 */}
        <div className="flex items-center gap-1">
          <button
            onClick={handleQuickRefresh}
            disabled={isLoading}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            title="重新渲染"
          >
            <svg className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>

          <button
            onClick={handleQuickReset}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded-lg transition-all"
            title="重置設定"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
            </svg>
          </button>
        </div>
      </div>

      {/* 中間：投影片資訊 */}
      <div className="flex items-center gap-4 text-sm text-gray-600">
        <div className="flex items-center gap-2">
          <span>📄</span>
          <span>{totalSlides} 張投影片</span>
        </div>
        
        {totalSlides > 0 && (
          <div className="flex items-center gap-2">
            <span>👁️</span>
            <span>第 {currentSlideIndex + 1} 張</span>
          </div>
        )}

        {isFullscreen && (
          <div className="flex items-center gap-2 text-blue-600">
            <span>⛶</span>
            <span>全螢幕</span>
          </div>
        )}
      </div>

      {/* 右側：導出和設定 */}
      <div className="flex items-center gap-3">
        {/* 導出選項 */}
        {onExport && totalSlides > 0 && (
          <ExportOptions
            onExport={onExport}
            isLoading={isLoading}
          />
        )}

        {/* 進階設定 */}
        {showAdvanced && onConfigChange && (
          <AdvancedSettings
            config={config}
            onConfigChange={onConfigChange}
          />
        )}
      </div>
    </div>
  );
}

// 簡化版工具列
export function SimplePreviewToolbar({
  currentTheme,
  onThemeChange,
  totalSlides,
}: {
  currentTheme: SupportedTheme;
  onThemeChange?: (theme: SupportedTheme) => void;
  totalSlides: number;
}) {
  return (
    <div className="flex items-center justify-between p-3 bg-gray-50 border-b border-gray-200">
      <div className="flex items-center gap-3">
        {onThemeChange && (
          <ThemeSelector
            currentTheme={currentTheme}
            onThemeChange={onThemeChange}
          />
        )}
      </div>
      
      <div className="text-sm text-gray-600">
        {totalSlides} 張投影片
      </div>
    </div>
  );
}

export default PreviewToolbar;