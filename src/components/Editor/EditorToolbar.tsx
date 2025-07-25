'use client';

import React, { useMemo } from 'react';
import { useEditorStore } from '@/stores/editorStore';
import { Button } from '@/components/UI/Button';
import { getTextStats } from '@/lib/editor/markdown-utils';

export interface EditorToolbarProps {
  /** 編輯器 API 引用 */
  editorRef?: React.RefObject<any>;
  /** 自定義樣式類名 */
  className?: string;
  /** 是否顯示統計信息 */
  showStats?: boolean;
  /** 是否顯示格式化按鈕 */
  showFormatButtons?: boolean;
  /** 是否顯示歷史按鈕 */
  showHistoryButtons?: boolean;
  /** 是否顯示插入按鈕 */
  showInsertButtons?: boolean;
  /** 自定義按鈕組 */
  customButtons?: React.ReactNode;
}

// 格式化按鈕配置
const FORMAT_BUTTONS = [
  {
    id: 'bold',
    label: '粗體',
    icon: (
      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M3 4a1 1 0 011-1h6a4.5 4.5 0 013.999 6.732A4.5 4.5 0 0110 18H4a1 1 0 01-1-1V4zm2 1v4h5a2.5 2.5 0 000-5H5zm0 6v4h5a2.5 2.5 0 000-5H5z" clipRule="evenodd" />
      </svg>
    ),
    shortcut: 'Ctrl+B',
    format: 'bold',
  },
  {
    id: 'italic',
    label: '斜體',
    icon: (
      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
        <path d="M8.854 3H5.146a.5.5 0 000 1h1.02l-1.86 8H3.146a.5.5 0 000 1h3.708a.5.5 0 000-1H5.832l1.86-8H8.854a.5.5 0 000-1z" />
      </svg>
    ),
    shortcut: 'Ctrl+I',
    format: 'italic',
  },
  {
    id: 'code',
    label: '程式碼',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
      </svg>
    ),
    shortcut: 'Ctrl+/',
    format: 'code',
  },
  {
    id: 'link',
    label: '連結',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
      </svg>
    ),
    shortcut: 'Ctrl+K',
    format: 'link',
  },
] as const;

// 標題按鈕配置
const HEADING_BUTTONS = [
  {
    id: 'h1',
    label: 'H1',
    format: 'h1',
  },
  {
    id: 'h2',
    label: 'H2',
    format: 'h2',
  },
  {
    id: 'h3',
    label: 'H3',
    format: 'h3',
  },
] as const;

// 列表按鈕配置
const LIST_BUTTONS = [
  {
    id: 'ul',
    label: '無序列表',
    icon: (
      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
      </svg>
    ),
    format: 'ul',
  },
  {
    id: 'ol',
    label: '有序列表',
    icon: (
      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11.707 4.707a1 1 0 00-1.414-1.414L10 9.586 8.707 8.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
      </svg>
    ),
    format: 'ol',
  },
  {
    id: 'quote',
    label: '引用',
    icon: (
      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0-7a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
      </svg>
    ),
    format: 'quote',
  },
] as const;

const EditorToolbar: React.FC<EditorToolbarProps> = ({
  editorRef,
  className,
  showStats = true,
  showFormatButtons = true,
  showHistoryButtons = true,
  showInsertButtons = true,
  customButtons,
}) => {
  // Zustand store
  const {
    markdown,
    canUndo,
    canRedo,
    undo,
    redo,
    isModified,
    lastSaved,
    autoSave,
  } = useEditorStore();

  // 統計信息
  const stats = useMemo(() => getTextStats(markdown), [markdown]);

  // 格式化文本
  const handleFormat = (format: string) => {
    if (editorRef?.current?.formatText) {
      editorRef.current.formatText(format);
    }
  };

  // 插入投影片分隔符
  const handleInsertSlide = () => {
    handleFormat('slide');
  };

  // 插入表格
  const handleInsertTable = () => {
    const tableTemplate = `
| 欄位1 | 欄位2 | 欄位3 |
|-------|-------|-------|
| 內容1 | 內容2 | 內容3 |
| 內容4 | 內容5 | 內容6 |
`.trim();
    
    if (editorRef?.current?.insertText) {
      editorRef.current.insertText(tableTemplate);
    }
  };

  // 插入程式碼區塊
  const handleInsertCodeBlock = () => {
    const codeTemplate = '```javascript\n// 你的程式碼\nconsole.log("Hello, World!");\n```';
    
    if (editorRef?.current?.insertText) {
      editorRef.current.insertText(codeTemplate);
    }
  };

  // 格式化 Markdown
  const handleFormatDocument = () => {
    // 可以添加整體文檔格式化邏輯
    console.log('格式化文檔');
  };

  // 復原
  const handleUndo = () => {
    if (canUndo()) {
      undo();
    }
  };

  // 重做
  const handleRedo = () => {
    if (canRedo()) {
      redo();
    }
  };

  // 儲存狀態文字
  const getSaveStatusText = () => {
    if (!isModified) {
      return lastSaved ? `已儲存於 ${lastSaved.toLocaleTimeString()}` : '已儲存';
    }
    if (autoSave.enabled) {
      return '自動儲存中...';
    }
    return '有未儲存的變更';
  };

  return (
    <div className={`bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 ${className}`}>
      <div className="flex items-center justify-between px-4 py-2">
        <div className="flex items-center space-x-1">
          {/* 歷史操作按鈕 */}
          {showHistoryButtons && (
            <div className="flex items-center space-x-1 pr-2 border-r border-gray-200 dark:border-gray-700">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleUndo}
                disabled={!canUndo()}
                title="復原 (Ctrl+Z)"
                icon={
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                  </svg>
                }
              />
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRedo}
                disabled={!canRedo()}
                title="重做 (Ctrl+Y)"
                icon={
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 10h-10a8 8 0 00-8 8v2m18-10l-6-6m6 6l-6 6" />
                  </svg>
                }
              />
            </div>
          )}

          {/* 格式化按鈕 */}
          {showFormatButtons && (
            <>
              <div className="flex items-center space-x-1 pr-2 border-r border-gray-200 dark:border-gray-700">
                {FORMAT_BUTTONS.map((button) => (
                  <Button
                    key={button.id}
                    variant="ghost"
                    size="sm"
                    onClick={() => handleFormat(button.format)}
                    title={`${button.label} (${button.shortcut})`}
                    icon={button.icon}
                  />
                ))}
              </div>

              {/* 標題按鈕 */}
              <div className="flex items-center space-x-1 pr-2 border-r border-gray-200 dark:border-gray-700">
                {HEADING_BUTTONS.map((button) => (
                  <Button
                    key={button.id}
                    variant="ghost"
                    size="sm"
                    onClick={() => handleFormat(button.format)}
                    title={button.label}
                    className="font-bold"
                  >
                    {button.label}
                  </Button>
                ))}
              </div>

              {/* 列表和引用按鈕 */}
              <div className="flex items-center space-x-1 pr-2 border-r border-gray-200 dark:border-gray-700">
                {LIST_BUTTONS.map((button) => (
                  <Button
                    key={button.id}
                    variant="ghost"
                    size="sm"
                    onClick={() => handleFormat(button.format)}
                    title={button.label}
                    icon={button.icon}
                  />
                ))}
              </div>
            </>
          )}

          {/* 插入按鈕 */}
          {showInsertButtons && (
            <div className="flex items-center space-x-1 pr-2 border-r border-gray-200 dark:border-gray-700">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleInsertSlide}
                title="插入投影片分隔符"
                icon={
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
                  </svg>
                }
              >
                投影片
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={handleInsertTable}
                title="插入表格"
                icon={
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0V4a1 1 0 011-1h14a1 1 0 011 1v16a1 1 0 01-1 1H5a1 1 0 01-1-1z" />
                  </svg>
                }
              >
                表格
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={handleInsertCodeBlock}
                title="插入程式碼區塊"
                icon={
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                  </svg>
                }
              >
                程式碼
              </Button>
            </div>
          )}

          {/* 自定義按鈕 */}
          {customButtons && (
            <div className="flex items-center space-x-1 pr-2 border-r border-gray-200 dark:border-gray-700">
              {customButtons}
            </div>
          )}

          {/* 格式化文檔按鈕 */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleFormatDocument}
            title="格式化文檔"
            icon={
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
              </svg>
            }
          >
            格式化
          </Button>
        </div>

        {/* 右側信息區 */}
        <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
          {/* 統計信息 */}
          {showStats && (
            <div className="flex items-center space-x-4">
              <span title="投影片數量">
                <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                {stats.slides} 投影片
              </span>
              
              <span title="字數">
                <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                {stats.words} 字
              </span>
              
              <span title="字元數">
                <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
                {stats.characters} 字元
              </span>
              
              <span title="行數">
                <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                </svg>
                {stats.lines} 行
              </span>
            </div>
          )}

          {/* 分隔線 */}
          {showStats && (
            <div className="h-4 w-px bg-gray-300 dark:bg-gray-600" />
          )}

          {/* 儲存狀態 */}
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${
              isModified 
                ? 'bg-orange-500 animate-pulse' 
                : 'bg-green-500'
            }`} />
            <span className="text-xs">
              {getSaveStatusText()}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditorToolbar;