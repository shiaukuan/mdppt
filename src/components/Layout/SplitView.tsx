/**
 * SplitView 元件 - 可調整大小的分割視圖
 */

'use client';

import { ReactNode, useRef, useState, useCallback, useEffect } from 'react';
import { cn } from '@/lib/utils';

export interface SplitViewProps {
  leftPanel: ReactNode;
  rightPanel: ReactNode;
  defaultSplit?: number; // 0-100 的百分比
  minLeftWidth?: number; // 像素
  minRightWidth?: number; // 像素
  direction?: 'horizontal' | 'vertical';
  className?: string;
  showResizer?: boolean;
  onSplitChange?: (split: number) => void;
}

export function SplitView({
  leftPanel,
  rightPanel,
  defaultSplit = 50,
  minLeftWidth = 200,
  minRightWidth = 200,
  direction = 'horizontal',
  className,
  showResizer = true,
  onSplitChange,
}: SplitViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [split, setSplit] = useState(defaultSplit);
  const [isDragging, setIsDragging] = useState(false);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!showResizer) return;
    e.preventDefault();
    setIsDragging(true);
  }, [showResizer]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging || !containerRef.current) return;

    const container = containerRef.current;
    const rect = container.getBoundingClientRect();
    
    let newSplit: number;
    if (direction === 'horizontal') {
      const mouseX = e.clientX - rect.left;
      newSplit = (mouseX / rect.width) * 100;
      
      // 計算最小寬度限制
      const minLeftPercent = (minLeftWidth / rect.width) * 100;
      const minRightPercent = (minRightWidth / rect.width) * 100;
      
      newSplit = Math.max(minLeftPercent, Math.min(100 - minRightPercent, newSplit));
    } else {
      const mouseY = e.clientY - rect.top;
      newSplit = (mouseY / rect.height) * 100;
      
      // 計算最小高度限制
      const minLeftPercent = (minLeftWidth / rect.height) * 100;
      const minRightPercent = (minRightWidth / rect.height) * 100;
      
      newSplit = Math.max(minLeftPercent, Math.min(100 - minRightPercent, newSplit));
    }

    setSplit(newSplit);
    onSplitChange?.(newSplit);
  }, [isDragging, direction, minLeftWidth, minRightWidth, onSplitChange]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.userSelect = 'none';
      document.body.style.cursor = direction === 'horizontal' ? 'col-resize' : 'row-resize';
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.body.style.userSelect = '';
        document.body.style.cursor = '';
      };
    }
    
    return undefined;
  }, [isDragging, handleMouseMove, handleMouseUp, direction]);

  const isHorizontal = direction === 'horizontal';
  
  return (
    <div
      ref={containerRef}
      className={cn(
        'flex overflow-hidden',
        isHorizontal ? 'flex-row h-full' : 'flex-col w-full',
        className
      )}
    >
      {/* 左側/上方面板 */}
      <div
        className={cn(
          'overflow-hidden',
          isHorizontal ? 'h-full' : 'w-full'
        )}
        style={{
          [isHorizontal ? 'width' : 'height']: `${split}%`,
        }}
      >
        {leftPanel}
      </div>

      {/* 調整器 */}
      {showResizer && (
        <div
          className={cn(
            'bg-gray-200 hover:bg-gray-300 transition-colors cursor-pointer select-none',
            'flex items-center justify-center group',
            isHorizontal 
              ? 'w-1 h-full cursor-col-resize hover:w-2' 
              : 'h-1 w-full cursor-row-resize hover:h-2',
            isDragging && (isHorizontal ? 'w-2 bg-blue-400' : 'h-2 bg-blue-400')
          )}
          onMouseDown={handleMouseDown}
        >
          {/* 調整器把手 */}
          <div
            className={cn(
              'bg-gray-400 group-hover:bg-gray-500 transition-colors',
              isHorizontal ? 'w-0.5 h-8' : 'h-0.5 w-8'
            )}
          />
        </div>
      )}

      {/* 右側/下方面板 */}
      <div
        className={cn(
          'overflow-hidden',
          isHorizontal ? 'h-full' : 'w-full'
        )}
        style={{
          [isHorizontal ? 'width' : 'height']: `${100 - split}%`,
        }}
      >
        {rightPanel}
      </div>
    </div>
  );
}

/**
 * 預定義的編輯器分割視圖
 */
export interface EditorSplitViewProps {
  editor: ReactNode;
  preview: ReactNode;
  defaultSplit?: number;
  className?: string;
  onSplitChange?: (split: number) => void;
}

export function EditorSplitView({
  editor,
  preview,
  defaultSplit = 50,
  className,
  onSplitChange,
}: EditorSplitViewProps) {
  const splitViewProps = {
    leftPanel: (
      <div className="h-full flex flex-col">
        <div className="flex-shrink-0 px-4 py-2 bg-gray-50 border-b border-gray-200">
          <h3 className="text-sm font-medium text-gray-700">Markdown 編輯器</h3>
        </div>
        <div className="flex-1 overflow-hidden">
          {editor}
        </div>
      </div>
    ),
    rightPanel: (
      <div className="h-full flex flex-col">
        <div className="flex-shrink-0 px-4 py-2 bg-gray-50 border-b border-gray-200">
          <h3 className="text-sm font-medium text-gray-700">投影片預覽</h3>
        </div>
        <div className="flex-1 overflow-hidden">
          {preview}
        </div>
      </div>
    ),
    defaultSplit,
    minLeftWidth: 300,
    minRightWidth: 300,
    ...(className && { className }),
    ...(onSplitChange && { onSplitChange }),
  };
  
  return <SplitView {...splitViewProps} />;
}

/**
 * 響應式分割視圖 - 在小螢幕上切換為標籤頁模式
 */
export interface ResponsiveSplitViewProps extends EditorSplitViewProps {
  breakpoint?: number; // 像素寬度
}

export function ResponsiveSplitView({
  editor,
  preview,
  defaultSplit = 50,
  className,
  onSplitChange,
  breakpoint = 768,
}: ResponsiveSplitViewProps) {
  const [isMobile, setIsMobile] = useState(false);
  const [activeTab, setActiveTab] = useState<'editor' | 'preview'>('editor');

  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < breakpoint);
    };
    
    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);
    
    return () => window.removeEventListener('resize', checkIsMobile);
  }, [breakpoint]);

  if (isMobile) {
    return (
      <div className={cn('h-full flex flex-col', className)}>
        {/* 標籤頁頭部 */}
        <div className="flex-shrink-0 flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab('editor')}
            className={cn(
              'flex-1 px-4 py-2 text-sm font-medium border-b-2 transition-colors',
              activeTab === 'editor'
                ? 'text-blue-600 border-blue-600'
                : 'text-gray-500 border-transparent hover:text-gray-700'
            )}
          >
            編輯器
          </button>
          <button
            onClick={() => setActiveTab('preview')}
            className={cn(
              'flex-1 px-4 py-2 text-sm font-medium border-b-2 transition-colors',
              activeTab === 'preview'
                ? 'text-blue-600 border-blue-600'
                : 'text-gray-500 border-transparent hover:text-gray-700'
            )}
          >
            預覽
          </button>
        </div>
        
        {/* 內容區域 */}
        <div className="flex-1 overflow-hidden">
          {activeTab === 'editor' ? editor : preview}
        </div>
      </div>
    );
  }

  const editorSplitProps = {
    editor,
    preview,
    defaultSplit,
    ...(className && { className }),
    ...(onSplitChange && { onSplitChange }),
  };
  
  return <EditorSplitView {...editorSplitProps} />;
}