/**
 * Marp 主題系統
 * 處理主題載入、切換和自訂 CSS
 */

import type { SupportedTheme, ThemeInfo } from './config';
import { THEME_INFO } from './config';

// 內建主題 CSS 定義
const THEME_CSS = {
  default: `
/* Default theme styles */
section {
  background: #fff;
  color: #333;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

h1, h2, h3, h4, h5, h6 {
  color: #1e3a8a;
  margin: 0.5em 0;
}

h1 {
  font-size: 2.5em;
  text-align: center;
  border-bottom: 3px solid #3b82f6;
  padding-bottom: 0.3em;
}

h2 {
  font-size: 2em;
  color: #3b82f6;
}

pre, code {
  background: #f8f9fa;
  border-radius: 4px;
}

blockquote {
  border-left: 4px solid #3b82f6;
  margin: 1em 0;
  padding: 0.5em 1em;
  background: #f8fafc;
}
`,

  uncover: `
/* Uncover theme - Modern minimalist */
section {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  justify-content: center;
  text-align: center;
}

h1 {
  font-size: 3em;
  font-weight: 700;
  margin: 0;
  text-shadow: 0 2px 4px rgba(0,0,0,0.3);
}

h2 {
  font-size: 2.2em;
  font-weight: 600;
  margin: 0.5em 0;
  opacity: 0.9;
}

p, li {
  font-size: 1.2em;
  line-height: 1.6;
  margin: 0.8em 0;
}

pre, code {
  background: rgba(0,0,0,0.2);
  border-radius: 8px;
  color: #f8f9fa;
}

blockquote {
  border-left: 4px solid rgba(255,255,255,0.6);
  background: rgba(255,255,255,0.1);
  padding: 1em;
  margin: 1em 0;
}
`,

  gaia: `
/* Gaia theme - Elegant professional */
section {
  background: #fdfcff;
  color: #1e1b4b;
  font-family: 'Georgia', serif;
  padding: 60px;
}

h1 {
  font-size: 2.8em;
  color: #7c3aed;
  text-align: center;
  margin-bottom: 0.8em;
  font-weight: 300;
  letter-spacing: -0.02em;
}

h2 {
  font-size: 2.2em;
  color: #7c3aed;
  border-bottom: 2px solid #a78bfa;
  padding-bottom: 0.2em;
  margin: 1em 0 0.5em 0;
}

h3 {
  font-size: 1.6em;
  color: #8b5cf6;
  margin: 0.8em 0 0.4em 0;
}

p, li {
  font-size: 1.1em;
  line-height: 1.8;
  margin: 0.6em 0;
}

ul, ol {
  margin: 1em 0;
}

li {
  margin: 0.4em 0;
}

pre, code {
  background: #f3f4f6;
  border: 1px solid #e5e7eb;
  border-radius: 4px;
  font-family: 'Monaco', 'Menlo', monospace;
}

blockquote {
  border-left: 4px solid #a78bfa;
  background: #f8fafc;
  padding: 1em;
  margin: 1.5em 0;
  font-style: italic;
}
`,

  academic: `
/* Academic theme - Clean and readable */
section {
  background: #f0fdf4;
  color: #064e3b;
  font-family: 'Times New Roman', serif;
  padding: 50px;
  line-height: 1.6;
}

h1 {
  font-size: 2.4em;
  color: #059669;
  text-align: center;
  margin-bottom: 1em;
  border-bottom: 3px double #059669;
  padding-bottom: 0.5em;
}

h2 {
  font-size: 1.8em;
  color: #047857;
  margin: 1.2em 0 0.6em 0;
  border-left: 5px solid #34d399;
  padding-left: 0.5em;
}

h3 {
  font-size: 1.4em;
  color: #065f46;
  margin: 1em 0 0.5em 0;
}

p, li {
  font-size: 1em;
  line-height: 1.8;
  margin: 0.8em 0;
  text-align: justify;
}

ul, ol {
  margin: 1em 0;
  padding-left: 2em;
}

pre, code {
  background: #ecfdf5;
  border: 1px solid #a7f3d0;
  border-radius: 3px;
  font-family: 'Courier New', monospace;
}

blockquote {
  border-left: 4px solid #10b981;
  background: #ecfdf5;
  padding: 1em;
  margin: 1.5em 0;
  font-style: italic;
}

table {
  border-collapse: collapse;
  margin: 1em 0;
  width: 100%;
}

th, td {
  border: 1px solid #a7f3d0;
  padding: 0.5em;
  text-align: left;
}

th {
  background: #d1fae5;
  font-weight: bold;
}
`,

  business: `
/* Business theme - Professional and corporate */
section {
  background: #fefefe;
  color: #7f1d1d;
  font-family: 'Arial', sans-serif;
  padding: 50px;
}

h1 {
  font-size: 2.6em;
  color: #dc2626;
  text-align: center;
  margin-bottom: 0.8em;
  font-weight: bold;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

h2 {
  font-size: 2em;
  color: #dc2626;
  margin: 1em 0 0.6em 0;
  padding: 0.3em 0;
  border-bottom: 2px solid #f87171;
}

h3 {
  font-size: 1.5em;
  color: #b91c1c;
  margin: 0.8em 0 0.4em 0;
}

p, li {
  font-size: 1.1em;
  line-height: 1.6;
  margin: 0.6em 0;
}

ul, ol {
  margin: 1em 0;
}

li::marker {
  color: #dc2626;
  font-weight: bold;
}

pre, code {
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 4px;
  font-family: 'Consolas', monospace;
}

blockquote {
  border-left: 4px solid #f87171;
  background: #fef2f2;
  padding: 1em;
  margin: 1.5em 0;
  font-weight: 500;
}

strong {
  color: #dc2626;
  font-weight: bold;
}

em {
  color: #b91c1c;
  font-style: italic;
}
`,
};

/**
 * 主題管理器類別
 */
export class ThemeManager {
  private themes: Map<SupportedTheme, string> = new Map();
  private customThemes: Map<string, string> = new Map();
  private loadedThemes: Set<SupportedTheme> = new Set();

  constructor() {
    // 預載入所有內建主題
    this.preloadBuiltinThemes();
  }

  /**
   * 預載入內建主題
   */
  private preloadBuiltinThemes(): void {
    Object.entries(THEME_CSS).forEach(([themeId, css]) => {
      this.themes.set(themeId as SupportedTheme, css);
      this.loadedThemes.add(themeId as SupportedTheme);
    });
  }

  /**
   * 獲取主題 CSS
   */
  getThemeCSS(themeId: SupportedTheme): string {
    const css = this.themes.get(themeId);
    if (!css) {
      console.warn(`Theme ${themeId} not found, using default theme`);
      return this.themes.get('default') || '';
    }
    return css;
  }

  /**
   * 獲取所有可用主題
   */
  getAvailableThemes(): ThemeInfo[] {
    return Object.values(THEME_INFO);
  }

  /**
   * 獲取主題資訊
   */
  getThemeInfo(themeId: SupportedTheme): ThemeInfo | null {
    return THEME_INFO[themeId] || null;
  }

  /**
   * 檢查主題是否已載入
   */
  isThemeLoaded(themeId: SupportedTheme): boolean {
    return this.loadedThemes.has(themeId);
  }

  /**
   * 載入自訂主題
   */
  loadCustomTheme(themeId: string, css: string): void {
    this.customThemes.set(themeId, css);
  }

  /**
   * 獲取自訂主題
   */
  getCustomTheme(themeId: string): string | undefined {
    return this.customThemes.get(themeId);
  }

  /**
   * 移除自訂主題
   */
  removeCustomTheme(themeId: string): boolean {
    return this.customThemes.delete(themeId);
  }

  /**
   * 獲取所有自訂主題 ID
   */
  getCustomThemeIds(): string[] {
    return Array.from(this.customThemes.keys());
  }

  /**
   * 生成完整的 Marp 主題 CSS
   */
  generateMarpTheme(themeId: SupportedTheme, customCSS?: string): string {
    const baseCSS = this.getThemeCSS(themeId);
    const themeInfo = this.getThemeInfo(themeId);
    
    let fullCSS = `/* Marp theme: ${themeInfo?.name || themeId} */\n`;
    fullCSS += `/* ${themeInfo?.description || ''} */\n\n`;
    
    // 添加基礎 Marp 樣式
    fullCSS += `
/* Marp base styles */
section {
  width: 1280px;
  height: 720px;
  padding: 40px;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: stretch;
}

section.invert {
  filter: invert(1);
}

section.center {
  justify-content: center;
  text-align: center;
}

section.lead {
  justify-content: center;
  text-align: center;
}

section.lead h1 {
  font-size: 3.2em;
}

section.lead h2 {
  font-size: 2.4em;
}

/* 分頁樣式 */
section::after {
  content: attr(data-marpit-pagination) '/' attr(data-marpit-pagination-total);
  position: absolute;
  bottom: 20px;
  right: 30px;
  font-size: 0.8em;
  color: currentColor;
  opacity: 0.6;
}

/* 進度條 */
section[data-marpit-pagination]::before {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  height: 4px;
  background: currentColor;
  opacity: 0.3;
  width: calc(100% * attr(data-marpit-pagination, number) / attr(data-marpit-pagination-total, number));
}
`;

    // 添加主題特定樣式
    fullCSS += baseCSS;

    // 添加自訂 CSS
    if (customCSS) {
      fullCSS += '\n\n/* Custom styles */\n';
      fullCSS += customCSS;
    }

    return fullCSS;
  }

  /**
   * 驗證 CSS 語法
   */
  validateCSS(css: string): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    try {
      // 基本的 CSS 語法檢查
      if (!css.trim()) {
        errors.push('CSS 內容不能為空');
      }

      // 檢查括號匹配
      const openBraces = (css.match(/\{/g) || []).length;
      const closeBraces = (css.match(/\}/g) || []).length;
      
      if (openBraces !== closeBraces) {
        errors.push('CSS 括號不匹配');
      }

      // 檢查基本語法錯誤
      if (css.includes('{{') || css.includes('}}')) {
        errors.push('CSS 含有無效的雙括號');
      }

      return {
        valid: errors.length === 0,
        errors,
      };
    } catch (error) {
      return {
        valid: false,
        errors: ['CSS 語法驗證失敗'],
      };
    }
  }

  /**
   * 清理所有快取
   */
  clearCache(): void {
    this.customThemes.clear();
    this.preloadBuiltinThemes(); // 重新載入內建主題
  }
}

// 全域主題管理器實例
export const themeManager = new ThemeManager();

/**
 * 工具函數：取得主題顏色
 */
export function getThemeColors(themeId: SupportedTheme) {
  const themeInfo = themeManager.getThemeInfo(themeId);
  return themeInfo?.colors || THEME_INFO.default.colors;
}

/**
 * 工具函數：生成主題預覽
 */
export function generateThemePreview(themeId: SupportedTheme): string {
  const colors = getThemeColors(themeId);
  return `
    <div style="
      width: 120px; 
      height: 80px; 
      background: ${colors.background}; 
      border: 1px solid #e5e7eb;
      border-radius: 4px;
      padding: 8px;
      font-family: sans-serif;
      font-size: 10px;
      color: ${colors.text};
      position: relative;
    ">
      <div style="color: ${colors.primary}; font-weight: bold; margin-bottom: 4px;">標題</div>
      <div style="font-size: 8px; line-height: 1.2;">內容文字範例</div>
      <div style="
        position: absolute; 
        bottom: 4px; 
        right: 4px; 
        width: 20px; 
        height: 2px; 
        background: ${colors.secondary};
      "></div>
    </div>
  `;
}