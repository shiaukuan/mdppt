/**
 * API 相關的 TypeScript 型別定義
 */

// ============================================================================
// 基礎型別
// ============================================================================

export type ApiErrorCode =
  | 'INVALID_INPUT'
  | 'INVALID_MODEL'
  | 'OPENAI_ERROR'
  | 'RATE_LIMIT'
  | 'INTERNAL_ERROR'
  | 'MISSING_API_KEY'
  | 'UNAUTHORIZED'
  | 'NOT_FOUND'
  | 'METHOD_NOT_ALLOWED'
  | 'REQUEST_TOO_LARGE'
  | 'INVALID_FILE_FORMAT'
  | 'TOKEN_LIMIT_EXCEEDED';

export type HttpMethod =
  | 'GET'
  | 'POST'
  | 'PUT'
  | 'DELETE'
  | 'PATCH'
  | 'OPTIONS';

export type OpenAIModel = 'gpt-4o' | 'gpt-4o-mini' | 'gpt-3.5-turbo';

export type SlideTheme = 'default' | 'dark' | 'academic' | 'modern' | 'minimal';

export type ExportFormat = 'pptx' | 'pdf' | 'html' | 'markdown';

export type SlideSize = 'standard' | 'widescreen' | 'square';

export type FontSize = 'small' | 'medium' | 'large';

export type Language = 'zh-TW' | 'zh-CN' | 'en' | 'ja' | 'ko' | 'auto';

// ============================================================================
// 標準 API 回應結構
// ============================================================================

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: ErrorResponse;
  timestamp: string;
  requestId?: string;
}

export interface ErrorResponse {
  message: string;
  code: ApiErrorCode;
  details?: Record<string, any>;
  field?: string; // 錯誤相關的欄位名稱
  stack?: string; // 開發環境的錯誤堆疊
}

export interface ValidationError {
  field: string;
  message: string;
  value?: any;
}

// ============================================================================
// Token 使用統計
// ============================================================================

export interface TokenUsage {
  prompt: number;
  completion: number;
  total: number;
  estimatedCost?: {
    usd: number;
    currency: string;
  };
}

export interface TokenLimits {
  maxPromptTokens: number;
  maxCompletionTokens: number;
  maxTotalTokens: number;
}

// ============================================================================
// 投影片生成 API
// ============================================================================

export interface SlideGenerationRequest {
  topic: string;
  model?: OpenAIModel;
  maxPages?: number;
  style?: SlideTheme;
  includeCode?: boolean;
  includeImages?: boolean;
  language?: Language;
  customPrompt?: string;
  targetAudience?: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  slideFormat?: 'presentation' | 'tutorial' | 'workshop' | 'lecture' | 'academic' | 'business';
  tone?: 'formal' | 'casual' | 'academic' | 'friendly' | 'professional';
}

export interface SlideGenerationResponse {
  id: string;
  markdown: string;
  tokenUsage: TokenUsage;
  createdAt: string;
  config: SlideGenerationConfig;
  metadata: SlideMetadata;
}

export interface SlideGenerationConfig {
  model: OpenAIModel;
  maxPages: number;
  style: SlideTheme;
  includeCode: boolean;
  includeImages: boolean;
  language: Language;
  targetAudience: string;
  slideFormat: string;
  tone: string;
}

export interface SlideMetadata {
  slideCount: number;
  wordCount: number;
  codeBlockCount: number;
  imageCount: number;
  estimatedReadingTime: number; // 分鐘
  tags: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  openaiMetadata?: {
    model: string;
    generatedAt: string;
  };
}

// ============================================================================
// 匯出 API
// ============================================================================

export interface ExportRequest {
  markdown: string;
  format: ExportFormat;
  filename?: string;
  theme?: SlideTheme;
  options?: ExportOptions;
}

export interface ExportOptions {
  includeNotes?: boolean;
  slideSize?: SlideSize;
  fontSize?: FontSize;
  quality?: 'low' | 'medium' | 'high';
  watermark?: boolean;
  headerFooter?: {
    header?: string;
    footer?: string;
    showPageNumbers?: boolean;
  };
  styling?: {
    backgroundColor?: string;
    textColor?: string;
    accentColor?: string;
    fontFamily?: string;
  };
}

export interface ExportResponse {
  success: boolean;
  downloadUrl?: string;
  filename: string;
  fileSize: number;
  contentType: string;
  expiresAt: string;
  metadata: ExportMetadata;
}

export interface ExportMetadata {
  format: ExportFormat;
  slideCount: number;
  processingTime: number; // 毫秒
  quality: string;
  theme: SlideTheme;
}

// ============================================================================
// 快取相關
// ============================================================================

export interface CacheKey {
  hash: string;
  topic: string;
  config: Partial<SlideGenerationRequest>;
  createdAt: string;
}

export interface CacheEntry<T = any> {
  data: T;
  createdAt: string;
  expiresAt: string;
  hitCount: number;
  lastAccessed: string;
}

// ============================================================================
// 速率限制
// ============================================================================

export interface RateLimitInfo {
  limit: number;
  remaining: number;
  resetTime: number;
  retryAfter?: number;
}

export interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  identifier: 'ip' | 'apiKey' | 'userId';
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
}

// ============================================================================
// WebSocket 相關（即時功能）
// ============================================================================

export interface WebSocketMessage<T = any> {
  type: 'progress' | 'result' | 'error' | 'ping' | 'pong';
  data?: T;
  timestamp: string;
  requestId: string;
}

export interface ProgressUpdate {
  stage: 'validating' | 'generating' | 'processing' | 'finalizing';
  progress: number; // 0-100
  message: string;
  estimatedTimeRemaining?: number; // 秒
}

// ============================================================================
// 分析和統計
// ============================================================================

export interface UsageAnalytics {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  popularTopics: Array<{
    topic: string;
    count: number;
  }>;
  modelUsage: Record<OpenAIModel, number>;
  themeUsage: Record<SlideTheme, number>;
  errorDistribution: Record<ApiErrorCode, number>;
}

export interface UserSession {
  sessionId: string;
  startTime: string;
  lastActivity: string;
  requestCount: number;
  totalTokensUsed: number;
  preferences?: {
    defaultModel?: OpenAIModel;
    defaultTheme?: SlideTheme;
    defaultLanguage?: Language;
  };
}

// ============================================================================
// 設定和偏好
// ============================================================================

export interface ApiConfig {
  baseUrl: string;
  timeout: number;
  retryAttempts: number;
  retryDelay: number;
  rateLimitConfig: RateLimitConfig;
  cacheConfig: {
    ttl: number; // 秒
    maxSize: number;
    enableCompression: boolean;
  };
}

export interface UserPreferences {
  defaultModel: OpenAIModel;
  defaultTheme: SlideTheme;
  defaultLanguage: Language;
  autoSave: boolean;
  notifications: {
    email: boolean;
    push: boolean;
  };
  privacy: {
    allowAnalytics: boolean;
    shareUsageData: boolean;
  };
}

// ============================================================================
// 型別守衛和工具型別
// ============================================================================

export type ApiEndpoint =
  | '/api/v1/slides'
  | '/api/v1/export'
  | '/api/v1/health'
  | '/api/v1/analytics';

export type RequestWithAuth<T = any> = T & {
  apiKey: string;
  userId?: string;
};

export type PaginatedResponse<T> = ApiResponse<{
  items: T[];
  pagination: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
}>;

// 輔助型別：提取 API 回應的資料型別
export type ExtractApiData<T> = T extends ApiResponse<infer U> ? U : never;

// 輔助型別：建立可選欄位的請求型別
export type PartialRequest<T> = Partial<T> & Pick<T, 'topic'>;

// 輔助型別：錯誤回應的聯合型別
export type ApiError = ApiResponse<never> & {
  success: false;
  error: ErrorResponse;
};

// 輔助型別：成功回應的聯合型別
export type ApiSuccess<T> = ApiResponse<T> & {
  success: true;
  data: T;
};
