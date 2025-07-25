'use client';

import React, { useRef, useCallback, useImperativeHandle } from 'react';

export interface MarkdownEditorProps {
  /** 當前值 */
  value?: string;
  /** 變更回調 */
  onChange?: (value: string) => void;
  /** 佔位符文字 */
  placeholder?: string;
  /** 自定義樣式類名 */
  className?: string;
  /** 是否自動對焦 */
  autoFocus?: boolean;
  /** 是否唯讀 */
  readOnly?: boolean;
  /** 是否顯示行號 */
  showLineNumbers?: boolean;
}

export interface MarkdownEditorApi {
  focus: () => void;
  blur: () => void;
  insertText: (text: string) => void;
}

const MarkdownEditor = React.forwardRef<MarkdownEditorApi, MarkdownEditorProps>(
  (
    {
      value = '',
      onChange,
      placeholder = '在此輸入 Markdown 內容 (--- 分頁)',
      className = '',
      autoFocus = false,
      readOnly = false,
      showLineNumbers = false,
    },
    ref
  ) => {
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // 處理文本變更
    const handleChange = useCallback(
      (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        onChange?.(e.target.value);
      },
      [onChange]
    );

    // 處理 Tab 鍵
    const handleKeyDown = useCallback(
      (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Tab') {
          e.preventDefault();
          const textarea = e.currentTarget;
          const { selectionStart, selectionEnd, value } = textarea;
          const tabString = '  '; // 2 個空格

          const newValue =
            value.substring(0, selectionStart) +
            tabString +
            value.substring(selectionEnd);

          onChange?.(newValue);

          // 設定游標位置
          setTimeout(() => {
            textarea.setSelectionRange(
              selectionStart + tabString.length,
              selectionStart + tabString.length
            );
          }, 0);
        }
      },
      [onChange, value]
    );

    // 暴露 API 到父組件
    useImperativeHandle(
      ref,
      () => ({
        focus: () => textareaRef.current?.focus(),
        blur: () => textareaRef.current?.blur(),
        insertText: (text: string) => {
          const textarea = textareaRef.current;
          if (!textarea) return;

          const { selectionStart, selectionEnd } = textarea;
          const currentValue = textarea.value;
          const newValue =
            currentValue.substring(0, selectionStart) +
            text +
            currentValue.substring(selectionEnd);

          onChange?.(newValue);

          // 設定游標位置
          setTimeout(() => {
            textarea.setSelectionRange(
              selectionStart + text.length,
              selectionStart + text.length
            );
          }, 0);
        },
      }),
      [onChange]
    );

    return (
      <div className={`relative h-full bg-white dark:bg-gray-900 ${className}`}>
        <div className="flex h-full">
          {/* 行號 (可選) */}
          {showLineNumbers && (
            <div className="flex-shrink-0 w-12 bg-gray-50 dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 overflow-hidden select-none">
              <div className="py-4 pr-2 font-mono text-xs text-gray-500 dark:text-gray-400">
                {value.split('\n').map((_, index) => (
                  <div key={index} className="leading-6 text-right">
                    {index + 1}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 編輯器 */}
          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              value={value}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              readOnly={readOnly}
              autoFocus={autoFocus}
              spellCheck={false}
              className={`
                w-full h-full p-4 font-mono text-sm resize-none outline-none
                bg-transparent text-gray-900 dark:text-gray-100
                placeholder-gray-400 dark:placeholder-gray-500
                leading-6
                ${readOnly ? 'cursor-default' : 'cursor-text'}
              `}
              style={{
                scrollbarWidth: 'thin',
                scrollbarColor: '#cbd5e0 transparent',
              }}
            />
          </div>
        </div>
      </div>
    );
  }
);

MarkdownEditor.displayName = 'MarkdownEditor';

export default MarkdownEditor;
