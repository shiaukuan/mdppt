'use client';

import React from 'react';
import { Button } from '@/components/UI/Button';

export interface EditorToolbarProps {
  /** 編輯器 API 引用 */
  editorRef?: React.RefObject<any>;
  /** 自定義樣式類名 */
  className?: string;
  /** 是否顯示統計信息 */
  showStats?: boolean;
  /** 是否顯示格式化按鈕 */
  showFormatButtons?: boolean;
  /** 是否顯示插入按鈕 */
  showInsertButtons?: boolean;
  /** 自定義按鈕組 */
  customButtons?: React.ReactNode;
  /** Markdown 內容（用於統計） */
  markdown?: string;
}

export default function EditorToolbar({
  editorRef,
  className = '',
  showStats = true,
  showFormatButtons = true,
  showInsertButtons = true,
  customButtons,
  markdown = '',
}: EditorToolbarProps) {
  // 簡單的統計計算
  const stats = React.useMemo(() => {
    const lines = markdown.split('\n').length;
    const words = markdown.trim() ? markdown.trim().split(/\s+/).length : 0;
    const characters = markdown.length;
    const charactersNoSpaces = markdown.replace(/\s/g, '').length;

    return {
      lines,
      words,
      characters,
      charactersNoSpaces,
    };
  }, [markdown]);

  // 插入文本到編輯器
  const insertText = (text: string) => {
    if (editorRef?.current?.insertText) {
      editorRef.current.insertText(text);
    }
  };

  // 插入投影片分隔符
  const insertSlide = () => {
    insertText('\n\n---\n\n');
  };

  // 插入標題
  const insertHeader = (level: number) => {
    const headerText = '#'.repeat(level) + ' 標題';
    insertText(headerText);
  };

  return (
    <div
      className={`border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 ${className}`}
    >
      <div className="flex items-center justify-between px-4 py-2">
        {/* 左側按鈕組 */}
        <div className="flex items-center space-x-2">
          {/* 格式化按鈕 */}
          {showFormatButtons && (
            <div className="flex items-center space-x-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => insertHeader(1)}
                title="插入 H1 標題"
              >
                H1
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => insertHeader(2)}
                title="插入 H2 標題"
              >
                H2
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => insertHeader(3)}
                title="插入 H3 標題"
              >
                H3
              </Button>
            </div>
          )}

          {/* 插入按鈕 */}
          {showInsertButtons && (
            <div className="flex items-center space-x-1 border-l border-gray-200 dark:border-gray-700 pl-2 ml-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={insertSlide}
                title="插入投影片分隔符"
              >
                投影片
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => insertText('- ')}
                title="插入列表項目"
              >
                列表
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => insertText('[連結文字](網址)')}
                title="插入連結"
              >
                連結
              </Button>
            </div>
          )}

          {/* 自定義按鈕 */}
          {customButtons && (
            <div className="border-l border-gray-200 dark:border-gray-700 pl-2 ml-2">
              {customButtons}
            </div>
          )}
        </div>

        {/* 右側統計信息 */}
        {showStats && (
          <div className="text-xs text-gray-500 dark:text-gray-400 space-x-4">
            <span>行數: {stats.lines}</span>
            <span>字數: {stats.words}</span>
            <span>字元: {stats.characters}</span>
          </div>
        )}
      </div>
    </div>
  );
}
