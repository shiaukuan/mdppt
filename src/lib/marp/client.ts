/**
 * Marp Core 客戶端
 * 處理 Marp 實例初始化、渲染和 SSR 安全包裝
 */

import type { MarpConfig, SupportedTheme } from './config';
import { DEFAULT_MARP_CONFIG, MARP_ERROR_MESSAGES } from './config';
import { themeManager } from './themes';

// Marp Core 相關型別
interface MarpCore {
  new (options?: any): MarpInstance;
}

interface MarpInstance {
  render(markdown: string, options?: any): MarpRenderResult;
  themeSet: {
    default: (css: string) => void;
    add: (css: string) => string;
  };
}

interface MarpRenderResult {
  html: string;
  css: string;
  comments: string[];
  slides: Array<{
    html: string;
    background?: string;
    backgroundImage?: string;
  }>;
}

// 渲染結果介面
export interface SlideRenderResult {
  html: string;
  css: string;
  slides: SlideData[];
  totalSlides: number;
  error?: string;
  warnings?: string[];
}

export interface SlideData {
  html: string;
  index: number;
  background?: string;
  backgroundImage?: string;
  title?: string;
}

// Marp 客戶端類別
export class MarpClient {
  private marpCore: MarpCore | null = null;
  private marpInstance: MarpInstance | null = null;
  private isInitialized = false;
  private initializationPromise: Promise<void> | null = null;
  private cache = new Map<string, SlideRenderResult>();
  private lastConfig: MarpConfig = { ...DEFAULT_MARP_CONFIG };

  /**
   * 初始化 Marp Core (動態匯入)
   */
  private async initializeMarp(): Promise<void> {
    if (this.isInitialized) return;
    
    if (this.initializationPromise) {
      return this.initializationPromise;
    }

    this.initializationPromise = this.doInitialize();
    return this.initializationPromise;
  }

  private async doInitialize(): Promise<void> {
    try {
      // 檢查是否在瀏覽器環境
      if (typeof window === 'undefined') {
        throw new Error('Marp can only be initialized in browser environment');
      }

      // 動態匯入 Marp Core
      const { Marp } = await import('@marp-team/marp-core');
      this.marpCore = Marp as any;

      // 建立 Marp 實例
      this.marpInstance = new this.marpCore({
        html: true,
        pagination: true,
        math: 'mathjax',
        inlineSVG: false,
        slide: true,
      });

      this.isInitialized = true;
      console.log('Marp Core initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Marp Core:', error);
      this.isInitialized = false;
      this.initializationPromise = null;
      throw new Error(MARP_ERROR_MESSAGES.INITIALIZATION_FAILED);
    }
  }

  /**
   * 檢查是否已初始化
   */
  public isReady(): boolean {
    return this.isInitialized && this.marpInstance !== null;
  }

  /**
   * 等待初始化完成
   */
  public async waitForInitialization(): Promise<void> {
    if (!this.isInitialized) {
      await this.initializeMarp();
    }
  }

  /**
   * 渲染 Markdown 為投影片
   */
  public async render(
    markdown: string, 
    config: Partial<MarpConfig> = {}
  ): Promise<SlideRenderResult> {
    try {
      // 確保已初始化
      await this.waitForInitialization();
      
      if (!this.marpInstance) {
        throw new Error(MARP_ERROR_MESSAGES.INITIALIZATION_FAILED);
      }

      // 合併配置
      const fullConfig: MarpConfig = { ...DEFAULT_MARP_CONFIG, ...config };
      
      // 檢查快取
      const cacheKey = this.generateCacheKey(markdown, fullConfig);
      const cached = this.cache.get(cacheKey);
      if (cached) {
        return cached;
      }

      // 套用主題
      await this.applyTheme(fullConfig.theme, fullConfig.customCSS);

      // 準備 Markdown 內容
      const processedMarkdown = this.preprocessMarkdown(markdown, fullConfig);

      // 渲染
      const result = this.marpInstance.render(processedMarkdown);
      
      // 處理結果
      const slideResult = this.processRenderResult(result, fullConfig);
      
      // 快取結果
      this.cache.set(cacheKey, slideResult);
      
      // 清理舊快取
      this.cleanupCache();

      return slideResult;
    } catch (error) {
      console.error('Marp render error:', error);
      return {
        html: '',
        css: '',
        slides: [],
        totalSlides: 0,
        error: error instanceof Error ? error.message : MARP_ERROR_MESSAGES.RENDER_FAILED,
      };
    }
  }

  /**
   * 套用主題
   */
  private async applyTheme(themeId: SupportedTheme, customCSS?: string): Promise<void> {
    if (!this.marpInstance) return;

    try {
      // 生成主題 CSS
      const themeCSS = themeManager.generateMarpTheme(themeId, customCSS);
      
      // 設定主題
      this.marpInstance.themeSet.default(themeCSS);
      
      console.log(`Applied theme: ${themeId}`);
    } catch (error) {
      console.error('Failed to apply theme:', error);
      throw new Error(MARP_ERROR_MESSAGES.THEME_LOAD_FAILED);
    }
  }

  /**
   * 預處理 Markdown
   */
  private preprocessMarkdown(markdown: string, config: MarpConfig): string {
    let processed = markdown;

    // 添加主題指令
    if (!processed.includes('theme:')) {
      processed = `---\ntheme: ${config.theme}\n---\n\n${processed}`;
    }

    // 添加分頁指令
    if (config.pagination && !processed.includes('paginate:')) {
      processed = processed.replace('---\n', '---\npaginate: true\n');
    }

    // 添加尺寸指令
    const size = config.customSize || (config.size === 'custom' ? [1280, 720] : undefined);
    if (size && !processed.includes('size:')) {
      processed = processed.replace('---\n', `---\nsize: ${size[0]}x${size[1]}\n`);
    }

    // 處理數學公式
    if (config.math && !processed.includes('math:')) {
      processed = processed.replace('---\n', `---\nmath: ${config.math}\n`);
    }

    return processed;
  }

  /**
   * 處理渲染結果
   */
  private processRenderResult(
    result: MarpRenderResult, 
    config: MarpConfig
  ): SlideRenderResult {
    const slides: SlideData[] = result.slides.map((slide, index) => ({
      html: slide.html,
      index: index + 1,
      background: slide.background,
      backgroundImage: slide.backgroundImage,
      title: this.extractSlideTitle(slide.html),
    }));

    return {
      html: result.html,
      css: result.css,
      slides,
      totalSlides: slides.length,
      warnings: result.comments,
    };
  }

  /**
   * 提取投影片標題
   */
  private extractSlideTitle(html: string): string {
    const match = html.match(/<h[1-6][^>]*>(.*?)<\/h[1-6]>/);
    if (match) {
      return match[1].replace(/<[^>]*>/g, '').trim();
    }
    return `投影片`;
  }

  /**
   * 生成快取鍵
   */
  private generateCacheKey(markdown: string, config: MarpConfig): string {
    const configStr = JSON.stringify(config);
    return `${markdown.length}-${this.hashString(markdown + configStr)}`;
  }

  /**
   * 簡單的字串雜湊
   */
  private hashString(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // 轉換為 32 位整數
    }
    return hash.toString(36);
  }

  /**
   * 清理快取
   */
  private cleanupCache(): void {
    if (this.cache.size > 50) {
      // 保留最近的 30 個項目
      const keys = Array.from(this.cache.keys());
      const toDelete = keys.slice(0, keys.length - 30);
      toDelete.forEach(key => this.cache.delete(key));
    }
  }

  /**
   * 清空快取
   */
  public clearCache(): void {
    this.cache.clear();
  }

  /**
   * 獲取快取統計
   */
  public getCacheStats(): { size: number; hitRate: number } {
    return {
      size: this.cache.size,
      hitRate: 0, // 簡化版本，不追蹤命中率
    };
  }

  /**
   * 銷毀實例
   */
  public destroy(): void {
    this.marpInstance = null;
    this.marpCore = null;
    this.isInitialized = false;
    this.initializationPromise = null;
    this.clearCache();
  }
}

// 全域 Marp 客戶端實例
let globalMarpClient: MarpClient | null = null;

/**
 * 獲取全域 Marp 客戶端實例
 */
export function getMarpClient(): MarpClient {
  if (!globalMarpClient) {
    globalMarpClient = new MarpClient();
  }
  return globalMarpClient;
}

/**
 * SSR 安全包裝：檢查是否在客戶端環境
 */
export function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof document !== 'undefined';
}

/**
 * SSR 安全的 Marp 渲染函數
 */
export async function renderSlidesSafely(
  markdown: string,
  config?: Partial<MarpConfig>
): Promise<SlideRenderResult> {
  if (!isBrowser()) {
    // SSR 環境下返回空結果
    return {
      html: '',
      css: '',
      slides: [],
      totalSlides: 0,
      error: 'Marp rendering is only available in browser environment',
    };
  }

  const client = getMarpClient();
  return client.render(markdown, config);
}

/**
 * 預載入 Marp Core（可選的效能優化）
 */
export async function preloadMarpCore(): Promise<boolean> {
  if (!isBrowser()) return false;
  
  try {
    const client = getMarpClient();
    await client.waitForInitialization();
    return true;
  } catch (error) {
    console.error('Failed to preload Marp Core:', error);
    return false;
  }
}

// 清理函數，用於頁面卸載時
export function cleanupMarpClient(): void {
  if (globalMarpClient) {
    globalMarpClient.destroy();
    globalMarpClient = null;
  }
}