/**
 * Markdown 編輯器工具函數
 * 提供文本處理、格式化和統計功能
 */

// 投影片分隔符
export const SLIDE_SEPARATOR = '---';

// 常用 Markdown 格式
export const MARKDOWN_FORMATS = {
  BOLD: '**',
  ITALIC: '*',
  CODE: '`',
  CODE_BLOCK: '```',
  LINK: '[]()',
  IMAGE: '![]()',
  QUOTE: '> ',
  UNORDERED_LIST: '- ',
  ORDERED_LIST: '1. ',
  HEADER_1: '# ',
  HEADER_2: '## ',
  HEADER_3: '### ',
  HEADER_4: '#### ',
  HEADER_5: '##### ',
  HEADER_6: '###### ',
} as const;

/**
 * 獲取文本統計信息
 */
export interface TextStats {
  characters: number;
  charactersNoSpaces: number;
  words: number;
  lines: number;
  slides: number;
  paragraphs: number;
}

export function getTextStats(text: string): TextStats {
  if (!text) {
    return {
      characters: 0,
      charactersNoSpaces: 0,
      words: 0,
      lines: 0,
      slides: 0,
      paragraphs: 0,
    };
  }

  const lines = text.split('\n');
  const slides = text.split(SLIDE_SEPARATOR).length;
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim()).length;

  return {
    characters: text.length,
    charactersNoSpaces: text.replace(/\s/g, '').length,
    words,
    lines: lines.length,
    slides,
    paragraphs,
  };
}

/**
 * 獲取當前游標位置信息
 */
export interface CursorPosition {
  line: number;
  column: number;
  offset: number;
}

export function getCursorPosition(text: string, selectionStart: number): CursorPosition {
  const textBeforeCursor = text.substring(0, selectionStart);
  const lines = textBeforeCursor.split('\n');
  
  return {
    line: lines.length,
    column: lines[lines.length - 1].length + 1,
    offset: selectionStart,
  };
}

/**
 * 獲取選擇的文本信息
 */
export interface SelectionInfo {
  start: CursorPosition;
  end: CursorPosition;
  selectedText: string;
  hasSelection: boolean;
}

export function getSelectionInfo(
  text: string, 
  selectionStart: number, 
  selectionEnd: number
): SelectionInfo {
  const hasSelection = selectionStart !== selectionEnd;
  
  return {
    start: getCursorPosition(text, selectionStart),
    end: getCursorPosition(text, selectionEnd),
    selectedText: hasSelection ? text.substring(selectionStart, selectionEnd) : '',
    hasSelection,
  };
}

/**
 * 插入文本到指定位置
 */
export function insertTextAtPosition(
  originalText: string,
  insertText: string,
  position: number
): { newText: string; newCursorPosition: number } {
  const newText = originalText.slice(0, position) + insertText + originalText.slice(position);
  const newCursorPosition = position + insertText.length;
  
  return { newText, newCursorPosition };
}

/**
 * 替換選擇的文本
 */
export function replaceSelectedText(
  originalText: string,
  replacementText: string,
  selectionStart: number,
  selectionEnd: number
): { newText: string; newCursorPosition: number } {
  const newText = originalText.slice(0, selectionStart) + replacementText + originalText.slice(selectionEnd);
  const newCursorPosition = selectionStart + replacementText.length;
  
  return { newText, newCursorPosition };
}

/**
 * 包圍選擇的文本
 */
export function wrapSelectedText(
  originalText: string,
  wrapper: string,
  selectionStart: number,
  selectionEnd: number,
  endWrapper?: string
): { newText: string; newSelectionStart: number; newSelectionEnd: number } {
  const selectedText = originalText.substring(selectionStart, selectionEnd);
  const actualEndWrapper = endWrapper || wrapper;
  const wrappedText = wrapper + selectedText + actualEndWrapper;
  
  const newText = originalText.slice(0, selectionStart) + wrappedText + originalText.slice(selectionEnd);
  const newSelectionStart = selectionStart + wrapper.length;
  const newSelectionEnd = newSelectionStart + selectedText.length;
  
  return { newText, newSelectionStart, newSelectionEnd };
}

/**
 * 切換行首的 Markdown 格式（如列表、標題）
 */
export function toggleLineFormat(
  originalText: string,
  format: string,
  selectionStart: number,
  selectionEnd: number
): { newText: string; newSelectionStart: number; newSelectionEnd: number } {
  const lines = originalText.split('\n');
  const startPos = getCursorPosition(originalText, selectionStart);
  const endPos = getCursorPosition(originalText, selectionEnd);
  
  let offset = 0;
  let newSelectionStart = selectionStart;
  let newSelectionEnd = selectionEnd;
  
  for (let i = startPos.line - 1; i < endPos.line; i++) {
    const line = lines[i];
    const trimmedLine = line.trim();
    
    if (trimmedLine.startsWith(format)) {
      // 移除格式
      const newLine = line.replace(new RegExp(`^(\\s*)${format.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`), '$1');
      const lengthDiff = line.length - newLine.length;
      lines[i] = newLine;
      
      if (i === startPos.line - 1) {
        newSelectionStart = Math.max(0, newSelectionStart - lengthDiff);
      }
      if (i < endPos.line - 1 || (i === endPos.line - 1 && selectionEnd > selectionStart)) {
        newSelectionEnd = Math.max(newSelectionStart, newSelectionEnd - lengthDiff);
      }
      
      offset -= lengthDiff;
    } else {
      // 添加格式
      const indentMatch = line.match(/^(\s*)/);
      const indent = indentMatch ? indentMatch[1] : '';
      const newLine = indent + format + line.substring(indent.length);
      lines[i] = newLine;
      
      if (i === startPos.line - 1) {
        newSelectionStart += format.length;
      }
      if (i < endPos.line - 1 || (i === endPos.line - 1 && selectionEnd > selectionStart)) {
        newSelectionEnd += format.length;
      }
      
      offset += format.length;
    }
  }
  
  return {
    newText: lines.join('\n'),
    newSelectionStart,
    newSelectionEnd,
  };
}

/**
 * 插入投影片分隔符
 */
export function insertSlideSeparator(
  originalText: string,
  position: number
): { newText: string; newCursorPosition: number } {
  const textBeforePosition = originalText.substring(0, position);
  const textAfterPosition = originalText.substring(position);
  
  // 確保分隔符前後都有換行
  let separator = '\n\n' + SLIDE_SEPARATOR + '\n\n';
  
  // 如果前面已經有換行，不需要重複添加
  if (textBeforePosition.endsWith('\n\n') || textBeforePosition.endsWith('\n')) {
    separator = SLIDE_SEPARATOR + '\n\n';
  }
  
  // 如果後面已經有換行，不需要重複添加
  if (textAfterPosition.startsWith('\n\n') || textAfterPosition.startsWith('\n')) {
    separator = separator.replace(/\n\n$/, '\n');
  }
  
  return insertTextAtPosition(originalText, separator, position);
}

/**
 * 自動縮排邏輯
 */
export function getAutoIndent(text: string, cursorPosition: number): string {
  const lines = text.substring(0, cursorPosition).split('\n');
  const currentLine = lines[lines.length - 1];
  
  // 獲取當前行的縮排
  const indentMatch = currentLine.match(/^(\s*)/);
  let indent = indentMatch ? indentMatch[1] : '';
  
  // 列表項目自動縮排
  const listMatch = currentLine.match(/^(\s*)([-*+]|\d+\.)\s/);
  if (listMatch) {
    // 如果是空列表項目，返回基礎縮排
    if (currentLine.trim() === listMatch[0].trim()) {
      return '';
    }
    // 否則保持相同的列表縮排
    return listMatch[1] + listMatch[2] + ' ';
  }
  
  // 引用自動縮排
  const quoteMatch = currentLine.match(/^(\s*)(>+)\s/);
  if (quoteMatch) {
    return quoteMatch[1] + quoteMatch[2] + ' ';
  }
  
  // 程式碼區塊內的縮排
  const codeBlockLines = lines.filter(line => line.trim() === '```');
  if (codeBlockLines.length % 2 === 1) {
    // 在程式碼區塊內，保持額外縮排
    return indent + '  ';
  }
  
  // 普通縮排
  return indent;
}

/**
 * 格式化 Markdown 文本
 */
export function formatMarkdown(text: string): string {
  return text
    // 統一行尾
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    // 移除行尾空白
    .split('\n')
    .map(line => line.trimEnd())
    .join('\n')
    // 確保文件結尾有換行
    .replace(/\n*$/, '\n');
}

/**
 * 獲取投影片內容陣列
 */
export function getSlides(text: string): string[] {
  return text
    .split(SLIDE_SEPARATOR)
    .map(slide => slide.trim())
    .filter(slide => slide.length > 0);
}

/**
 * 獲取當前游標所在的投影片索引
 */
export function getCurrentSlideIndex(text: string, cursorPosition: number): number {
  const textBeforeCursor = text.substring(0, cursorPosition);
  const separators = textBeforeCursor.split(SLIDE_SEPARATOR);
  return Math.max(0, separators.length - 1);
}

/**
 * 搜尋文本
 */
export interface SearchResult {
  index: number;
  line: number;
  column: number;
  length: number;
  context: string;
}

export function searchText(
  text: string, 
  searchTerm: string, 
  options: {
    caseSensitive?: boolean;
    wholeWord?: boolean;
    regex?: boolean;
  } = {}
): SearchResult[] {
  if (!searchTerm) return [];
  
  const results: SearchResult[] = [];
  const lines = text.split('\n');
  
  let searchPattern: RegExp;
  
  try {
    if (options.regex) {
      const flags = options.caseSensitive ? 'g' : 'gi';
      searchPattern = new RegExp(searchTerm, flags);
    } else {
      const escapedTerm = searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const pattern = options.wholeWord ? `\\b${escapedTerm}\\b` : escapedTerm;
      const flags = options.caseSensitive ? 'g' : 'gi';
      searchPattern = new RegExp(pattern, flags);
    }
  } catch {
    // 如果正則表達式無效，回退到字面搜尋
    const flags = options.caseSensitive ? 'g' : 'gi';
    searchPattern = new RegExp(searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), flags);
  }
  
  let globalIndex = 0;
  
  lines.forEach((line, lineIndex) => {
    let match;
    while ((match = searchPattern.exec(line)) !== null) {
      results.push({
        index: globalIndex + match.index,
        line: lineIndex + 1,
        column: match.index + 1,
        length: match[0].length,
        context: line,
      });
      
      // 防止無窮迴圈
      if (match.index === searchPattern.lastIndex) {
        searchPattern.lastIndex++;
      }
    }
    
    globalIndex += line.length + 1; // +1 for newline
  });
  
  return results;
}

/**
 * 替換文本
 */
export function replaceText(
  text: string,
  searchTerm: string,
  replacement: string,
  options: {
    caseSensitive?: boolean;
    wholeWord?: boolean;
    regex?: boolean;
    replaceAll?: boolean;
  } = {}
): { newText: string; replacementCount: number } {
  if (!searchTerm) return { newText: text, replacementCount: 0 };
  
  let searchPattern: RegExp;
  
  try {
    if (options.regex) {
      const flags = options.caseSensitive ? (options.replaceAll ? 'g' : '') : (options.replaceAll ? 'gi' : 'i');
      searchPattern = new RegExp(searchTerm, flags);
    } else {
      const escapedTerm = searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const pattern = options.wholeWord ? `\\b${escapedTerm}\\b` : escapedTerm;
      const flags = options.caseSensitive ? (options.replaceAll ? 'g' : '') : (options.replaceAll ? 'gi' : 'i');
      searchPattern = new RegExp(pattern, flags);
    }
  } catch {
    // 如果正則表達式無效，回退到字面搜尋
    const flags = options.caseSensitive ? (options.replaceAll ? 'g' : '') : (options.replaceAll ? 'gi' : 'i');
    searchPattern = new RegExp(searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), flags);
  }
  
  const newText = text.replace(searchPattern, replacement);
  const originalMatches = text.match(searchPattern) || [];
  const replacementCount = originalMatches.length;
  
  return { newText, replacementCount };
}