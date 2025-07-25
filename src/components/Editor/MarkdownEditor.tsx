'use client';

import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { useEditorStore } from '@/stores/editorStore';
import { useDebouncedCallback } from '@/hooks/useDebounce';
import {
  getTextStats,
  getCursorPosition,
  getSelectionInfo,
  getAutoIndent,
  insertTextAtPosition,
  replaceSelectedText,
  wrapSelectedText,
  toggleLineFormat,
  insertSlideSeparator,
  MARKDOWN_FORMATS,
  type TextStats,
  type CursorPosition,
  type SelectionInfo,
} from '@/lib/editor/markdown-utils';
import {
  analyzePerformance,
  PerformanceAdvisor,
  throttle,
  type PerformanceAnalysis,
} from '@/lib/editor/performance-utils';

export interface MarkdownEditorProps {
  /** 自定義樣式類名 */
  className?: string;
  /** 是否顯示行號 */
  showLineNumbers?: boolean;
  /** 是否啟用語法高亮 */
  enableSyntaxHighlight?: boolean;
  /** 是否自動對焦 */
  autoFocus?: boolean;
  /** 是否唯讀 */
  readOnly?: boolean;
  /** 佔位符文字 */
  placeholder?: string;
  /** 字體大小 */
  fontSize?: number;
  /** Tab 大小 */
  tabSize?: number;
  /** 是否啟用自動儲存 */
  enableAutoSave?: boolean;
  /** 自動儲存間隔（毫秒） */
  autoSaveInterval?: number;
  /** 變更回調 */
  onChange?: (value: string) => void;
  /** 選擇變更回調 */
  onSelectionChange?: (selection: SelectionInfo) => void;
  /** 游標位置變更回調 */
  onCursorChange?: (position: CursorPosition) => void;
  /** 統計變更回調 */
  onStatsChange?: (stats: TextStats) => void;
}

const MarkdownEditor = React.forwardRef<MarkdownEditorApi, MarkdownEditorProps>(({
  className,
  showLineNumbers = true,
  enableSyntaxHighlight = true,
  autoFocus = false,
  readOnly = false,
  placeholder = '開始輸入 Markdown 內容...',
  fontSize = 14,
  tabSize = 2,
  enableAutoSave = true,
  autoSaveInterval = 2000,
  onChange,
  onSelectionChange,
  onCursorChange,
  onStatsChange,
}, ref) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const highlightRef = useRef<HTMLPreElement>(null);
  const lineNumbersRef = useRef<HTMLDivElement>(null);
  
  // Zustand store
  const {
    markdown,
    setMarkdown,
    setCursor,
    setSelection,
    clearSelection,
    isModified,
    markAsSaved,
    autoSave,
  } = useEditorStore();

  // 本地狀態
  const [isFocused, setIsFocused] = useState(false);
  const [performanceAnalysis, setPerformanceAnalysis] = useState<PerformanceAnalysis>(() => 
    analyzePerformance(markdown)
  );
  const [performanceAdvisor] = useState(() => new PerformanceAdvisor(markdown));
  
  // 記憶化的統計信息
  const stats = useMemo(() => getTextStats(markdown), [markdown]);
  
  // 防抖的變更處理
  const debouncedOnChange = useDebouncedCallback((value: string) => {
    onChange?.(value);
  }, 300);
  
  // 防抖的自動儲存
  const debouncedAutoSave = useDebouncedCallback(() => {
    if (enableAutoSave && autoSave.enabled && isModified) {
      markAsSaved();
      // 這裡可以添加實際的儲存邏輯，例如儲存到伺服器
    }
  }, autoSaveInterval);

  // 更新行號
  const updateLineNumbers = useCallback(() => {
    if (!showLineNumbers || !lineNumbersRef.current) return;
    
    const lineCount = markdown.split('\n').length;
    const lineNumbers = Array.from({ length: lineCount }, (_, i) => i + 1);
    
    lineNumbersRef.current.innerHTML = lineNumbers
      .map(num => `<span class="line-number">${num}</span>`)
      .join('\n');
  }, [markdown, showLineNumbers]);

  // 節流的語法高亮更新
  const updateSyntaxHighlight = useCallback(throttle(() => {
    if (!enableSyntaxHighlight || !highlightRef.current) return;
    
    // 效能檢查：大檔案時跳過語法高亮
    if (performanceAnalysis.optimizations.disableSyntaxHighlight) {
      highlightRef.current.innerHTML = markdown.replace(/</g, '&lt;').replace(/>/g, '&gt;');
      return;
    }
    
    let highlightedText = markdown
      // 標題
      .replace(/^(#{1,6})\s(.+)$/gm, '<span class="text-blue-600 font-bold">$1</span> <span class="text-gray-900 font-semibold">$2</span>')
      // 粗體
      .replace(/\*\*(.+?)\*\*/g, '<span class="font-bold">**$1**</span>')
      // 斜體
      .replace(/\*(.+?)\*/g, '<span class="italic">*$1*</span>')
      // 程式碼
      .replace(/`(.+?)`/g, '<span class="bg-gray-100 px-1 rounded text-red-600 font-mono">`$1`</span>')
      // 連結
      .replace(/\[(.+?)\]\((.+?)\)/g, '<span class="text-blue-500">[$1]($2)</span>')
      // 列表
      .replace(/^(\s*)([-*+]|\d+\.)\s/gm, '$1<span class="text-gray-600">$2</span> ')
      // 引用
      .replace(/^(\s*)(>+)\s/gm, '$1<span class="text-gray-500">$2</span> ')
      // 投影片分隔符
      .replace(/^---$/gm, '<span class="text-purple-600 font-bold border-b border-purple-200">---</span>')
      // 轉義 HTML
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
    
    // 添加換行
    highlightedText = highlightedText.replace(/\n/g, '\n');
    
    highlightRef.current.innerHTML = highlightedText;
  }, 100), [markdown, enableSyntaxHighlight, performanceAnalysis.optimizations.disableSyntaxHighlight]);

  // 處理鍵盤事件
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const textarea = e.currentTarget;
    const { selectionStart, selectionEnd, value } = textarea;
    
    // Tab 鍵處理
    if (e.key === 'Tab') {
      e.preventDefault();
      const tabString = ' '.repeat(tabSize);
      
      if (selectionStart === selectionEnd) {
        // 插入 tab
        const result = insertTextAtPosition(value, tabString, selectionStart);
        setMarkdown(result.newText);
        setTimeout(() => {
          textarea.setSelectionRange(result.newCursorPosition, result.newCursorPosition);
        }, 0);
      } else {
        // 縮排/取消縮排選中的行
        const isShift = e.shiftKey;
        const lines = value.split('\n');
        const startLine = value.substring(0, selectionStart).split('\n').length - 1;
        const endLine = value.substring(0, selectionEnd).split('\n').length - 1;
        
        let offset = 0;
        for (let i = startLine; i <= endLine; i++) {
          if (isShift) {
            // 取消縮排
            if (lines[i]?.startsWith(tabString)) {
              lines[i] = lines[i]!.substring(tabString.length);
              offset -= tabString.length;
            } else if (lines[i]?.startsWith(' ')) {
              const spacesToRemove = Math.min(tabSize, lines[i]!.match(/^ */)?.[0].length || 0);
              lines[i] = lines[i]!.substring(spacesToRemove);
              offset -= spacesToRemove;
            }
          } else {
            // 縮排
            lines[i] = tabString + (lines[i] || '');
            offset += tabString.length;
          }
        }
        
        const newText = lines.join('\n');
        setMarkdown(newText);
        
        setTimeout(() => {
          const newSelectionStart = selectionStart + (startLine === endLine ? 0 : offset / (endLine - startLine + 1));
          const newSelectionEnd = selectionEnd + offset;
          textarea.setSelectionRange(newSelectionStart, newSelectionEnd);
        }, 0);
      }
      return;
    }
    
    // Enter 鍵自動縮排
    if (e.key === 'Enter') {
      e.preventDefault();
      const autoIndent = getAutoIndent(value, selectionStart);
      const insertText = '\n' + autoIndent;
      
      const result = insertTextAtPosition(value, insertText, selectionStart);
      setMarkdown(result.newText);
      
      setTimeout(() => {
        textarea.setSelectionRange(result.newCursorPosition, result.newCursorPosition);
      }, 0);
      return;
    }
    
    // Ctrl/Cmd + 快捷鍵
    const isCtrlOrCmd = e.ctrlKey || e.metaKey;
    if (isCtrlOrCmd) {
      switch (e.key) {
        case 'b': // 粗體
          e.preventDefault();
          handleFormatText('bold');
          break;
        case 'i': // 斜體
          e.preventDefault();
          handleFormatText('italic');
          break;
        case 'k': // 連結
          e.preventDefault();
          handleFormatText('link');
          break;
        case '/': // 註解/程式碼
          e.preventDefault();
          handleFormatText('code');
          break;
        case 'z': // 復原/重做
          e.preventDefault();
          if (e.shiftKey) {
            // 重做 (Ctrl+Shift+Z)
            handleRedo();
          } else {
            // 復原 (Ctrl+Z)
            handleUndo();
          }
          break;
        case 'y': // 重做 (Ctrl+Y)
          e.preventDefault();
          handleRedo();
          break;
        case 's': // 儲存
          e.preventDefault();
          handleSave();
          break;
      }
    }
  }, [tabSize, setMarkdown]);

  // 格式化文本
  const handleFormatText = useCallback((format: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    
    const { selectionStart, selectionEnd, value } = textarea;
    let result;
    
    switch (format) {
      case 'bold':
        result = wrapSelectedText(value, MARKDOWN_FORMATS.BOLD, selectionStart, selectionEnd);
        break;
      case 'italic':
        result = wrapSelectedText(value, MARKDOWN_FORMATS.ITALIC, selectionStart, selectionEnd);
        break;
      case 'code':
        result = wrapSelectedText(value, MARKDOWN_FORMATS.CODE, selectionStart, selectionEnd);
        break;
      case 'link':
        const linkText = value.substring(selectionStart, selectionEnd) || '連結文字';
        result = replaceSelectedText(value, `[${linkText}](網址)`, selectionStart, selectionEnd);
        break;
      case 'h1':
        result = toggleLineFormat(value, MARKDOWN_FORMATS.HEADER_1, selectionStart, selectionEnd);
        break;
      case 'h2':
        result = toggleLineFormat(value, MARKDOWN_FORMATS.HEADER_2, selectionStart, selectionEnd);
        break;
      case 'h3':
        result = toggleLineFormat(value, MARKDOWN_FORMATS.HEADER_3, selectionStart, selectionEnd);
        break;
      case 'ul':
        result = toggleLineFormat(value, MARKDOWN_FORMATS.UNORDERED_LIST, selectionStart, selectionEnd);
        break;
      case 'ol':
        result = toggleLineFormat(value, MARKDOWN_FORMATS.ORDERED_LIST, selectionStart, selectionEnd);
        break;
      case 'quote':
        result = toggleLineFormat(value, MARKDOWN_FORMATS.QUOTE, selectionStart, selectionEnd);
        break;
      case 'slide':
        result = insertSlideSeparator(value, selectionStart);
        break;
      default:
        return;
    }
    
    setMarkdown(result.newText);
    
    setTimeout(() => {
      if ('newSelectionStart' in result) {
        textarea.setSelectionRange(result.newSelectionStart, result.newSelectionEnd);
      } else {
        textarea.setSelectionRange(result.newCursorPosition, result.newCursorPosition);
      }
      textarea.focus();
    }, 0);
  }, [setMarkdown]);

  // 復原
  const handleUndo = useCallback(() => {
    const { undo, canUndo } = useEditorStore.getState();
    if (canUndo()) {
      undo();
    }
  }, []);

  // 重做
  const handleRedo = useCallback(() => {
    const { redo, canRedo } = useEditorStore.getState();
    if (canRedo()) {
      redo();
    }
  }, []);

  // 儲存
  const handleSave = useCallback(() => {
    markAsSaved();
    // 觸發實際儲存邏輯
  }, [markAsSaved]);

  // 處理文本變更
  const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    setMarkdown(newValue, true); // 添加到歷史記錄
    debouncedOnChange(newValue);
    debouncedAutoSave();
  }, [setMarkdown, debouncedOnChange, debouncedAutoSave]);

  // 處理選擇變更
  const handleSelectionChange = useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    
    const { selectionStart, selectionEnd, value } = textarea;
    const cursorPos = getCursorPosition(value, selectionStart);
    const selectionInfo = getSelectionInfo(value, selectionStart, selectionEnd);
    
    setCursor(cursorPos.line, cursorPos.column);
    
    if (selectionInfo.hasSelection) {
      setSelection(selectionInfo.start, selectionInfo.end);
    } else {
      clearSelection();
    }
    
    onCursorChange?.(cursorPos);
    onSelectionChange?.(selectionInfo);
  }, [setCursor, setSelection, clearSelection, onCursorChange, onSelectionChange]);

  // 同步滾動
  const handleScroll = useCallback(() => {
    const textarea = textareaRef.current;
    const highlight = highlightRef.current;
    const lineNumbers = lineNumbersRef.current;
    
    if (!textarea) return;
    
    if (highlight) {
      highlight.scrollTop = textarea.scrollTop;
      highlight.scrollLeft = textarea.scrollLeft;
    }
    
    if (lineNumbers) {
      lineNumbers.scrollTop = textarea.scrollTop;
    }
  }, []);

  // 效果：更新效能分析
  useEffect(() => {
    const newAnalysis = analyzePerformance(markdown);
    setPerformanceAnalysis(newAnalysis);
    performanceAdvisor.updateAnalysis(markdown);
  }, [markdown, performanceAdvisor]);

  // 效果：更新行號和語法高亮
  useEffect(() => {
    updateLineNumbers();
    updateSyntaxHighlight();
  }, [markdown, updateLineNumbers, updateSyntaxHighlight]);

  // 效果：啟動效能監控
  useEffect(() => {
    performanceAdvisor.startMonitoring();
    return () => {
      performanceAdvisor.stopMonitoring();
    };
  }, [performanceAdvisor]);

  // 效果：統計變更通知
  useEffect(() => {
    onStatsChange?.(stats);
  }, [stats, onStatsChange]);

  // 效果：自動對焦
  useEffect(() => {
    if (autoFocus && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [autoFocus]);

  // 公開 API
  const editorApi = useMemo(() => ({
    focus: () => textareaRef.current?.focus(),
    blur: () => textareaRef.current?.blur(),
    getSelection: () => {
      const textarea = textareaRef.current;
      if (!textarea) return null;
      return getSelectionInfo(textarea.value, textarea.selectionStart, textarea.selectionEnd);
    },
    setSelection: (start: number, end: number) => {
      textareaRef.current?.setSelectionRange(start, end);
    },
    insertText: (text: string) => {
      const textarea = textareaRef.current;
      if (!textarea) return;
      const result = insertTextAtPosition(textarea.value, text, textarea.selectionStart);
      setMarkdown(result.newText);
      setTimeout(() => {
        textarea.setSelectionRange(result.newCursorPosition, result.newCursorPosition);
      }, 0);
    },
    formatText: handleFormatText,
    undo: handleUndo,
    redo: handleRedo,
    save: handleSave,
  }), [setMarkdown, handleFormatText, handleUndo, handleRedo, handleSave]);

  // 暴露 API 到父組件
  React.useImperativeHandle(ref, () => ({
    ...textareaRef.current!,
    ...editorApi,
  }));

  return (
    <div className={`relative h-full bg-white dark:bg-gray-900 ${className}`}>
      <div className="flex h-full">
        {/* 行號 */}
        {showLineNumbers && (
          <div
            ref={lineNumbersRef}
            className="flex-shrink-0 w-12 bg-gray-50 dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 overflow-hidden select-none"
            style={{ fontSize: `${fontSize}px` }}
          >
            <div className="p-2 font-mono text-xs text-gray-500 dark:text-gray-400 leading-relaxed whitespace-pre">
              {/* 行號會由 updateLineNumbers 動態插入 */}
            </div>
          </div>
        )}

        {/* 編輯器容器 */}
        <div className="flex-1 relative overflow-hidden">
          {/* 語法高亮背景 */}
          {enableSyntaxHighlight && (
            <pre
              ref={highlightRef}
              className="absolute inset-0 p-4 font-mono text-transparent pointer-events-none overflow-auto whitespace-pre-wrap break-words leading-relaxed"
              style={{ fontSize: `${fontSize}px`, tabSize }}
              aria-hidden="true"
            />
          )}

          {/* 實際的 textarea */}
          <textarea
            ref={textareaRef}
            value={markdown}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            onSelect={handleSelectionChange}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            onScroll={handleScroll}
            placeholder={placeholder}
            readOnly={readOnly}
            spellCheck={false}
            className={`
              absolute inset-0 w-full h-full p-4 font-mono resize-none outline-none
              bg-transparent text-gray-900 dark:text-gray-100 leading-relaxed
              ${enableSyntaxHighlight ? 'text-transparent caret-gray-900 dark:caret-gray-100' : ''}
              ${readOnly ? 'cursor-default' : 'cursor-text'}
            `}
            style={{
              fontSize: `${fontSize}px`,
              tabSize,
              lineHeight: 1.6,
            }}
          />
        </div>
      </div>

      {/* 焦點指示器 */}
      {isFocused && (
        <div className="absolute inset-0 pointer-events-none border-2 border-blue-500 dark:border-blue-400 rounded-sm opacity-20" />
      )}

      {/* 修改狀態指示器 */}
      {isModified && (
        <div className="absolute top-2 right-2 w-2 h-2 bg-orange-500 rounded-full animate-pulse" />
      )}

      {/* 效能警告 */}
      {performanceAnalysis.recommendations.length > 0 && (
        <div className="absolute top-2 left-2 max-w-xs">
          <div className="bg-yellow-100 dark:bg-yellow-900/20 border border-yellow-300 dark:border-yellow-700 rounded-md p-2 text-xs">
            <div className="flex items-center">
              <svg className="w-4 h-4 text-yellow-600 dark:text-yellow-400 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <span className="font-medium text-yellow-800 dark:text-yellow-200">效能提示</span>
            </div>
            <div className="mt-1 text-yellow-700 dark:text-yellow-300">
              {performanceAnalysis.recommendations[0]}
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

MarkdownEditor.displayName = 'MarkdownEditor';

export default MarkdownEditor;

// 導出 API 類型供外部使用
export type MarkdownEditorApi = {
  focus: () => void;
  blur: () => void;
  getSelection: () => SelectionInfo | null;
  setSelection: (start: number, end: number) => void;
  insertText: (text: string) => void;
  formatText: (format: string) => void;
  undo: () => void;
  redo: () => void;
  save: () => void;
};