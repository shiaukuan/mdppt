import { createHash } from 'crypto';

export interface CacheEntry<T> {
  value: T;
  expiresAt: number;
  createdAt: number;
  accessCount: number;
  lastAccessed: number;
}

export interface CacheStats {
  totalEntries: number;
  hits: number;
  misses: number;
  hitRate: number;
  size: number;
  oldestEntry?: number;
  newestEntry?: number;
}

export interface CacheOptions {
  ttl?: number; // Time to live in milliseconds
  maxSize?: number; // Maximum number of entries
  cleanupInterval?: number; // Auto cleanup interval in milliseconds
}

/**
 * 簡單的記憶體快取實作，支援 TTL 和 LRU 清理策略
 */
export class MemoryCache<T = any> {
  private cache = new Map<string, CacheEntry<T>>();
  private stats = {
    hits: 0,
    misses: 0,
  };
  private cleanupTimer?: NodeJS.Timeout;
  
  constructor(private options: CacheOptions = {}) {
    const {
      ttl = 60 * 60 * 1000, // 1 hour default TTL
      maxSize = 1000,
      cleanupInterval = 5 * 60 * 1000, // 5 minutes cleanup interval
    } = options;
    
    this.options = { ttl, maxSize, cleanupInterval };
    
    // Start automatic cleanup
    if (cleanupInterval > 0) {
      this.startAutoCleanup();
    }
  }

  /**
   * 生成快取鍵的 SHA-256 雜湊
   */
  private generateCacheKey(key: string): string {
    return createHash('sha256').update(key).digest('hex');
  }

  /**
   * 檢查條目是否已過期
   */
  private isExpired(entry: CacheEntry<T>): boolean {
    return Date.now() > entry.expiresAt;
  }

  /**
   * 更新條目的存取資訊
   */
  private updateAccessInfo(entry: CacheEntry<T>): void {
    entry.accessCount++;
    entry.lastAccessed = Date.now();
  }

  /**
   * 設定快取值
   */
  set(key: string, value: T, customTtl?: number): void {
    const hashedKey = this.generateCacheKey(key);
    const ttl = customTtl ?? this.options.ttl!;
    const now = Date.now();
    
    const entry: CacheEntry<T> = {
      value,
      expiresAt: now + ttl,
      createdAt: now,
      accessCount: 0,
      lastAccessed: now,
    };

    // 如果快取已滿，清理最舊的條目
    if (this.cache.size >= this.options.maxSize!) {
      this.evictOldest();
    }

    this.cache.set(hashedKey, entry);
  }

  /**
   * 獲取快取值
   */
  get(key: string): T | undefined {
    const hashedKey = this.generateCacheKey(key);
    const entry = this.cache.get(hashedKey);

    if (!entry) {
      this.stats.misses++;
      return undefined;
    }

    if (this.isExpired(entry)) {
      this.cache.delete(hashedKey);
      this.stats.misses++;
      return undefined;
    }

    this.updateAccessInfo(entry);
    this.stats.hits++;
    return entry.value;
  }

  /**
   * 檢查快取中是否存在指定鍵
   */
  has(key: string): boolean {
    const hashedKey = this.generateCacheKey(key);
    const entry = this.cache.get(hashedKey);
    
    if (!entry) {
      return false;
    }

    if (this.isExpired(entry)) {
      this.cache.delete(hashedKey);
      return false;
    }

    return true;
  }

  /**
   * 刪除快取條目
   */
  delete(key: string): boolean {
    const hashedKey = this.generateCacheKey(key);
    return this.cache.delete(hashedKey);
  }

  /**
   * 清空所有快取
   */
  clear(): void {
    this.cache.clear();
    this.stats.hits = 0;
    this.stats.misses = 0;
  }

  /**
   * 手動清理過期條目
   */
  cleanup(): number {
    const now = Date.now();
    let cleanedCount = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
        cleanedCount++;
      }
    }

    return cleanedCount;
  }

  /**
   * 清理最舊的條目（LRU 策略）
   */
  private evictOldest(): void {
    let oldestKey: string | undefined;
    let oldestTime = Infinity;

    for (const [key, entry] of this.cache.entries()) {
      if (entry.lastAccessed < oldestTime) {
        oldestTime = entry.lastAccessed;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
    }
  }

  /**
   * 開始自動清理計時器
   */
  private startAutoCleanup(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }

    this.cleanupTimer = setInterval(() => {
      const cleaned = this.cleanup();
      if (cleaned > 0) {
        console.log(`[MemoryCache] 清理了 ${cleaned} 個過期條目`);
      }
    }, this.options.cleanupInterval!);
  }

  /**
   * 停止自動清理
   */
  stopAutoCleanup(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = undefined;
    }
  }

  /**
   * 獲取快取統計資訊
   */
  getStats(): CacheStats {
    const entries = Array.from(this.cache.values());
    const times = entries.map(e => e.createdAt);
    
    return {
      totalEntries: this.cache.size,
      hits: this.stats.hits,
      misses: this.stats.misses,
      hitRate: this.stats.hits + this.stats.misses > 0 
        ? this.stats.hits / (this.stats.hits + this.stats.misses) 
        : 0,
      size: this.calculateSize(),
      oldestEntry: times.length > 0 ? Math.min(...times) : undefined,
      newestEntry: times.length > 0 ? Math.max(...times) : undefined,
    };
  }

  /**
   * 計算快取大小（估計的記憶體使用量）
   */
  private calculateSize(): number {
    let size = 0;
    
    for (const [key, entry] of this.cache.entries()) {
      // 估算每個條目的記憶體使用量
      size += key.length * 2; // 字串大小（假設 UTF-16）
      size += JSON.stringify(entry.value).length * 2; // 值的大小
      size += 64; // 其他屬性的估計大小
    }
    
    return size;
  }

  /**
   * 獲取快取中的所有鍵（已雜湊）
   */
  keys(): string[] {
    return Array.from(this.cache.keys());
  }

  /**
   * 獲取快取大小
   */
  get size(): number {
    return this.cache.size;
  }

  /**
   * 獲取或設定快取值（如果不存在則執行工廠函數）
   */
  async getOrSet<U extends T>(
    key: string, 
    factory: () => Promise<U> | U, 
    customTtl?: number
  ): Promise<U> {
    const cached = this.get(key);
    
    if (cached !== undefined) {
      return cached as U;
    }

    const value = await factory();
    this.set(key, value, customTtl);
    return value;
  }

  /**
   * 銷毀快取實例
   */
  destroy(): void {
    this.stopAutoCleanup();
    this.clear();
  }
}

// 預設的全域快取實例
export const defaultCache = new MemoryCache({
  ttl: 60 * 60 * 1000, // 1 hour
  maxSize: 500,
  cleanupInterval: 10 * 60 * 1000, // 10 minutes
});

/**
 * 生成投影片快取的專用鍵
 */
export function generateSlideCacheKey(
  topic: string, 
  options: Record<string, any> = {}
): string {
  const normalizedOptions = {
    ...options,
    // 確保鍵的一致性
    topic: topic.trim().toLowerCase(),
  };
  
  return `slides:${JSON.stringify(normalizedOptions)}`;
}

/**
 * 專門用於投影片生成的快取實例
 */
export const slideCache = new MemoryCache({
  ttl: 60 * 60 * 1000, // 1 hour TTL for slides
  maxSize: 200, // Limit slide cache size
  cleanupInterval: 15 * 60 * 1000, // 15 minutes cleanup
});

/**
 * 快取裝飾器，用於自動快取函數結果
 */
export function cached<T extends (...args: any[]) => any>(
  cache: MemoryCache = defaultCache,
  keyGenerator: (...args: Parameters<T>) => string,
  ttl?: number
) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: Parameters<T>) {
      const cacheKey = keyGenerator(...args);
      
      return cache.getOrSet(
        cacheKey,
        () => originalMethod.apply(this, args),
        ttl
      );
    };

    return descriptor;
  };
}