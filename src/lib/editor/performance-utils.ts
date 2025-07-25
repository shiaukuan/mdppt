/**
 * 編輯器效能優化工具
 * 用於處理大型文件和提升編輯器響應性
 */

// 效能閾值配置
export const PERFORMANCE_THRESHOLDS = {
  // 檔案大小閾值（字元數）
  LARGE_FILE: 50000,
  HUGE_FILE: 200000,
  
  // 行數閾值
  MANY_LINES: 1000,
  TOO_MANY_LINES: 5000,
  
  // 語法高亮閾值
  SYNTAX_HIGHLIGHT_LIMIT: 100000,
  
  // 行號渲染閾值
  LINE_NUMBERS_LIMIT: 10000,
  
  // 即時預覽更新閾值
  PREVIEW_UPDATE_DELAY_THRESHOLD: 30000,
  
  // 自動儲存頻率調整閾值
  AUTO_SAVE_DELAY_THRESHOLD: 100000,
} as const;

// 效能級別枚舉
export enum PerformanceLevel {
  OPTIMAL = 'optimal',
  GOOD = 'good',
  DEGRADED = 'degraded',
  POOR = 'poor',
}

/**
 * 效能分析結果
 */
export interface PerformanceAnalysis {
  level: PerformanceLevel;
  fileSize: number;
  lineCount: number;
  recommendations: string[];
  optimizations: {
    disableSyntaxHighlight: boolean;
    disableLineNumbers: boolean;
    increasePreviewDelay: boolean;
    increaseAutoSaveDelay: boolean;
    useVirtualScrolling: boolean;
    chunkRendering: boolean;
  };
}

/**
 * 分析文本效能
 */
export function analyzePerformance(text: string): PerformanceAnalysis {
  const fileSize = text.length;
  const lineCount = text.split('\n').length;
  const recommendations: string[] = [];
  
  // 確定效能級別
  let level: PerformanceLevel;
  if (fileSize > PERFORMANCE_THRESHOLDS.HUGE_FILE || lineCount > PERFORMANCE_THRESHOLDS.TOO_MANY_LINES) {
    level = PerformanceLevel.POOR;
  } else if (fileSize > PERFORMANCE_THRESHOLDS.LARGE_FILE || lineCount > PERFORMANCE_THRESHOLDS.MANY_LINES) {
    level = PerformanceLevel.DEGRADED;
  } else if (fileSize > PERFORMANCE_THRESHOLDS.LARGE_FILE / 2) {
    level = PerformanceLevel.GOOD;
  } else {
    level = PerformanceLevel.OPTIMAL;
  }
  
  // 生成建議和優化選項
  const optimizations = {
    disableSyntaxHighlight: fileSize > PERFORMANCE_THRESHOLDS.SYNTAX_HIGHLIGHT_LIMIT,
    disableLineNumbers: lineCount > PERFORMANCE_THRESHOLDS.LINE_NUMBERS_LIMIT,
    increasePreviewDelay: fileSize > PERFORMANCE_THRESHOLDS.PREVIEW_UPDATE_DELAY_THRESHOLD,
    increaseAutoSaveDelay: fileSize > PERFORMANCE_THRESHOLDS.AUTO_SAVE_DELAY_THRESHOLD,
    useVirtualScrolling: lineCount > PERFORMANCE_THRESHOLDS.MANY_LINES,
    chunkRendering: fileSize > PERFORMANCE_THRESHOLDS.LARGE_FILE,
  };
  
  // 生成建議
  if (optimizations.disableSyntaxHighlight) {
    recommendations.push('建議停用語法高亮以提升效能');
  }
  if (optimizations.disableLineNumbers) {
    recommendations.push('建議停用行號顯示以減少渲染負擔');
  }
  if (optimizations.increasePreviewDelay) {
    recommendations.push('建議增加預覽更新延遲時間');
  }
  if (optimizations.increaseAutoSaveDelay) {
    recommendations.push('建議降低自動儲存頻率');
  }
  if (optimizations.useVirtualScrolling) {
    recommendations.push('建議使用虛擬滾動來處理大量行數');
  }
  if (optimizations.chunkRendering) {
    recommendations.push('建議使用分塊渲染來處理大型檔案');
  }
  
  if (recommendations.length === 0) {
    recommendations.push('檔案大小適中，無需特殊優化');
  }
  
  return {
    level,
    fileSize,
    lineCount,
    recommendations,
    optimizations,
  };
}

/**
 * 節流函數
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): T {
  let timeoutId: NodeJS.Timeout | null = null;
  let lastExecTime = 0;
  
  return ((...args: Parameters<T>) => {
    const currentTime = Date.now();
    
    if (currentTime - lastExecTime > delay) {
      func(...args);
      lastExecTime = currentTime;
    } else {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      timeoutId = setTimeout(() => {
        func(...args);
        lastExecTime = Date.now();
      }, delay - (currentTime - lastExecTime));
    }
  }) as T;
}

/**
 * 可見範圍計算（用於虛擬滾動）
 */
export interface VisibleRange {
  startLine: number;
  endLine: number;
  startIndex: number;
  endIndex: number;
}

export function calculateVisibleRange(
  scrollTop: number,
  containerHeight: number,
  lineHeight: number,
  totalLines: number,
  buffer: number = 10
): VisibleRange {
  const startLine = Math.max(0, Math.floor(scrollTop / lineHeight) - buffer);
  const visibleLines = Math.ceil(containerHeight / lineHeight);
  const endLine = Math.min(totalLines - 1, startLine + visibleLines + buffer * 2);
  
  return {
    startLine,
    endLine,
    startIndex: startLine,
    endIndex: endLine,
  };
}

/**
 * 文本分塊處理
 */
export interface TextChunk {
  content: string;
  startLine: number;
  endLine: number;
  lines: string[];
}

export function chunkText(text: string, chunkSize: number = 1000): TextChunk[] {
  const lines = text.split('\n');
  const chunks: TextChunk[] = [];
  
  for (let i = 0; i < lines.length; i += chunkSize) {
    const chunkLines = lines.slice(i, i + chunkSize);
    chunks.push({
      content: chunkLines.join('\n'),
      startLine: i,
      endLine: Math.min(i + chunkSize - 1, lines.length - 1),
      lines: chunkLines,
    });
  }
  
  return chunks;
}

/**
 * 記憶體使用監控
 */
export interface MemoryInfo {
  used: number;
  total: number;
  available: number;
  usage: number; // 百分比
}

export function getMemoryInfo(): MemoryInfo | null {
  if (typeof window !== 'undefined' && 'memory' in performance) {
    const memory = (performance as any).memory;
    return {
      used: memory.usedJSHeapSize,
      total: memory.totalJSHeapSize,
      available: memory.jsHeapSizeLimit,
      usage: (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100,
    };
  }
  return null;
}

/**
 * 渲染幀率監控
 */
export class FrameRateMonitor {
  private frameCount = 0;
  private lastTime = 0;
  private fps = 0;
  private isRunning = false;
  private animationId: number | null = null;
  
  start() {
    if (this.isRunning) return;
    
    this.isRunning = true;
    this.lastTime = performance.now();
    this.frameCount = 0;
    
    const tick = (currentTime: number) => {
      this.frameCount++;
      
      if (currentTime - this.lastTime >= 1000) {
        this.fps = Math.round((this.frameCount * 1000) / (currentTime - this.lastTime));
        this.frameCount = 0;
        this.lastTime = currentTime;
      }
      
      if (this.isRunning) {
        this.animationId = requestAnimationFrame(tick);
      }
    };
    
    this.animationId = requestAnimationFrame(tick);
  }
  
  stop() {
    this.isRunning = false;
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }
  
  getFPS(): number {
    return this.fps;
  }
}

/**
 * 效能建議系統
 */
export class PerformanceAdvisor {
  private analysis: PerformanceAnalysis;
  private frameRateMonitor: FrameRateMonitor;
  private memoryWarningThreshold = 80; // 80% 記憶體使用率警告
  private fpsWarningThreshold = 30; // 30 FPS 以下警告
  
  constructor(text: string) {
    this.analysis = analyzePerformance(text);
    this.frameRateMonitor = new FrameRateMonitor();
  }
  
  startMonitoring() {
    this.frameRateMonitor.start();
  }
  
  stopMonitoring() {
    this.frameRateMonitor.stop();
  }
  
  getCurrentRecommendations(): string[] {
    const recommendations = [...this.analysis.recommendations];
    
    // 檢查記憶體使用
    const memoryInfo = getMemoryInfo();
    if (memoryInfo && memoryInfo.usage > this.memoryWarningThreshold) {
      recommendations.push(`記憶體使用率過高 (${memoryInfo.usage.toFixed(1)}%)，建議關閉不必要的功能`);
    }
    
    // 檢查幀率
    const fps = this.frameRateMonitor.getFPS();
    if (fps > 0 && fps < this.fpsWarningThreshold) {
      recommendations.push(`渲染幀率過低 (${fps} FPS)，建議停用動畫和即時更新功能`);
    }
    
    return recommendations;
  }
  
  getOptimalSettings() {
    const settings = {
      syntaxHighlight: !this.analysis.optimizations.disableSyntaxHighlight,
      lineNumbers: !this.analysis.optimizations.disableLineNumbers,
      previewDelay: this.analysis.optimizations.increasePreviewDelay ? 1000 : 300,
      autoSaveDelay: this.analysis.optimizations.increaseAutoSaveDelay ? 5000 : 2000,
      virtualScrolling: this.analysis.optimizations.useVirtualScrolling,
      chunkRendering: this.analysis.optimizations.chunkRendering,
    };
    
    // 根據當前性能狀況動態調整
    const memoryInfo = getMemoryInfo();
    const fps = this.frameRateMonitor.getFPS();
    
    if (memoryInfo && memoryInfo.usage > this.memoryWarningThreshold) {
      settings.syntaxHighlight = false;
      settings.previewDelay = Math.max(settings.previewDelay, 1500);
    }
    
    if (fps > 0 && fps < this.fpsWarningThreshold) {
      settings.syntaxHighlight = false;
      settings.lineNumbers = false;
      settings.previewDelay = Math.max(settings.previewDelay, 2000);
    }
    
    return settings;
  }
  
  updateAnalysis(text: string) {
    this.analysis = analyzePerformance(text);
  }
}

/**
 * 批次處理工具
 */
export class BatchProcessor<T> {
  private queue: T[] = [];
  private isProcessing = false;
  private batchSize: number;
  private delay: number;
  
  constructor(
    private processor: (items: T[]) => Promise<void> | void,
    batchSize: number = 100,
    delay: number = 16 // ~60fps
  ) {
    this.batchSize = batchSize;
    this.delay = delay;
  }
  
  add(item: T) {
    this.queue.push(item);
    if (!this.isProcessing) {
      this.process();
    }
  }
  
  addBatch(items: T[]) {
    this.queue.push(...items);
    if (!this.isProcessing) {
      this.process();
    }
  }
  
  private async process() {
    this.isProcessing = true;
    
    while (this.queue.length > 0) {
      const batch = this.queue.splice(0, this.batchSize);
      await this.processor(batch);
      
      // 讓出控制權給瀏覽器
      if (this.queue.length > 0) {
        await new Promise(resolve => setTimeout(resolve, this.delay));
      }
    }
    
    this.isProcessing = false;
  }
  
  clear() {
    this.queue = [];
  }
  
  getQueueLength(): number {
    return this.queue.length;
  }
}