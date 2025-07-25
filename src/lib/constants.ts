/**
 * 應用程式常數定義
 */

import type {
  ApiErrorCode,
  OpenAIModel,
  SlideTheme,
  ExportFormat,
  Language,
  RateLimitConfig,
} from '@/types/api';

// ============================================================================
// API 錯誤碼常數
// ============================================================================

export const API_ERROR_CODES: Record<string, ApiErrorCode> = {
  INVALID_INPUT: 'INVALID_INPUT',
  INVALID_MODEL: 'INVALID_MODEL',
  OPENAI_ERROR: 'OPENAI_ERROR',
  RATE_LIMIT: 'RATE_LIMIT',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  MISSING_API_KEY: 'MISSING_API_KEY',
  UNAUTHORIZED: 'UNAUTHORIZED',
  NOT_FOUND: 'NOT_FOUND',
  METHOD_NOT_ALLOWED: 'METHOD_NOT_ALLOWED',
  REQUEST_TOO_LARGE: 'REQUEST_TOO_LARGE',
  INVALID_FILE_FORMAT: 'INVALID_FILE_FORMAT',
  TOKEN_LIMIT_EXCEEDED: 'TOKEN_LIMIT_EXCEEDED',
} as const;

// ============================================================================
// 支援的模型和格式
// ============================================================================

export const SUPPORTED_MODELS: ReadonlyArray<OpenAIModel> = [
  'gpt-4o',
  'gpt-4o-mini',
  'gpt-3.5-turbo',
] as const;

export const SUPPORTED_THEMES: ReadonlyArray<SlideTheme> = [
  'default',
  'dark',
  'academic',
  'modern',
  'minimal',
] as const;

export const SUPPORTED_EXPORT_FORMATS: ReadonlyArray<ExportFormat> = [
  'pptx',
  'pdf',
  'html',
  'markdown',
] as const;

export const SUPPORTED_LANGUAGES: ReadonlyArray<Language> = [
  'zh-TW',
  'zh-CN',
  'en',
  'ja',
  'ko',
  'auto',
] as const;

// ============================================================================
// 預設值配置
// ============================================================================

export const DEFAULT_CONFIG = {
  // 投影片生成預設值
  SLIDE_GENERATION: {
    MODEL: 'gpt-4o-mini' as OpenAIModel,
    MAX_PAGES: 15,
    MIN_PAGES: 3,
    THEME: 'default' as SlideTheme,
    INCLUDE_CODE: true,
    INCLUDE_IMAGES: false,
    LANGUAGE: 'auto' as Language,
    TARGET_AUDIENCE: 'intermediate',
    SLIDE_FORMAT: 'presentation',
    TONE: 'friendly',
  },

  // 匯出預設值
  EXPORT: {
    FORMAT: 'pptx' as ExportFormat,
    THEME: 'default' as SlideTheme,
    INCLUDE_NOTES: false,
    SLIDE_SIZE: 'standard',
    FONT_SIZE: 'medium',
    QUALITY: 'high',
    WATERMARK: false,
  },

  // API 配置
  API: {
    TIMEOUT: 30000, // 30 秒
    RETRY_ATTEMPTS: 3,
    RETRY_DELAY: 1000, // 1 秒
  },
} as const;

// ============================================================================
// 限制和約束
// ============================================================================

export const LIMITS = {
  // 內容限制
  TOPIC: {
    MIN_LENGTH: 2,
    MAX_LENGTH: 200,
  },

  MARKDOWN: {
    MAX_SIZE: 1024 * 1024, // 1MB
    MIN_SIZE: 10,
  },

  SLIDES: {
    MIN_COUNT: 1,
    MAX_COUNT: 50,
  },

  // API 請求限制
  REQUEST: {
    MAX_SIZE: 10 * 1024, // 10KB for text requests
    MAX_EXPORT_SIZE: 100 * 1024, // 100KB for export requests
  },

  // Token 限制
  TOKENS: {
    MAX_PROMPT: 4000,
    MAX_COMPLETION: 2000,
    MAX_TOTAL: 8000,
  },

  // 檔案限制
  FILE: {
    MAX_FILENAME_LENGTH: 255,
    ALLOWED_EXTENSIONS: ['.pptx', '.pdf', '.html', '.md'],
  },
} as const;

// ============================================================================
// 速率限制配置
// ============================================================================

export const RATE_LIMITS: Record<string, RateLimitConfig> = {
  SLIDE_GENERATION: {
    windowMs: 60 * 1000, // 1 分鐘
    maxRequests: 5,
    identifier: 'ip',
  },

  EXPORT: {
    windowMs: 60 * 1000, // 1 分鐘
    maxRequests: 10,
    identifier: 'ip',
  },

  STRICT: {
    windowMs: 60 * 1000, // 1 分鐘
    maxRequests: 3,
    identifier: 'ip',
  },
} as const;

// ============================================================================
// Prompt 模板
// ============================================================================

export const PROMPT_TEMPLATES = {
  // 基本投影片生成模板
  BASIC: `You are SlideBuilderGPT, an expert presentation generator. Create a comprehensive slide deck for the topic: **{{topic}}**.

**Instructions:**
- Use \`---\` to separate slides
- First slide: title only with engaging subtitle
- Each content slide should have ≤ 5 bullet points
- Use clear, concise language appropriate for {{targetAudience}} audience
- Maintain {{tone}} tone throughout
- Format: {{slideFormat}}
- Language: {{language}}
- Maximum {{maxPages}} slides

**Structure Requirements:**
1. Title slide
2. Agenda/Overview slide
3. 3-4 main content slides
4. {{includeCode ? 'Include practical code examples where relevant' : 'Focus on conceptual explanations'}}
5. {{includeImages ? 'Add image placeholders with \`![description](placeholder)\`' : 'Use text-based content only'}}
6. Summary/conclusion slide

**Content Guidelines:**
- Start each slide with a clear heading (# or ##)
- Use bullet points, numbered lists, or short paragraphs
- Include practical examples and real-world applications
- End with key takeaways and next steps`,

  // 學術風格模板
  ACADEMIC: `You are an academic presentation specialist. Create a scholarly slide deck on: **{{topic}}**.

**Academic Standards:**
- Formal tone and precise terminology
- Evidence-based content with theoretical frameworks
- Logical flow from introduction to conclusion
- Critical analysis and evaluation
- {{includeCode ? 'Technical implementations with detailed explanations' : 'Theoretical concepts with examples'}}

**Required Structure:**
1. Title slide with full topic statement
2. Research objectives and methodology
3. Literature review/background
4. Main findings/concepts (3-4 slides)
5. Analysis and discussion
6. Conclusions and future research directions

Maximum {{maxPages}} slides. Language: {{language}}.`,

  // 教學風格模板
  TUTORIAL: `You are an educational content creator. Design a step-by-step tutorial on: **{{topic}}**.

**Learning Objectives:**
- Break down complex concepts into digestible steps
- Provide hands-on examples and exercises
- Include progress checkpoints
- Cater to {{targetAudience}} level learners

**Tutorial Structure:**
1. Learning objectives and prerequisites
2. Overview of what will be covered
3. Step-by-step instructions (3-5 main steps)
4. {{includeCode ? 'Practical coding exercises with explanations' : 'Interactive examples and activities'}}
5. Common pitfalls and troubleshooting
6. Review and next steps

Use clear headings, numbered steps, and actionable content. Maximum {{maxPages}} slides. Language: {{language}}.`,

  // 商業簡報模板
  BUSINESS: `You are a business presentation consultant. Create a professional presentation on: **{{topic}}**.

**Business Focus:**
- Clear value proposition and benefits
- Data-driven insights and metrics
- Strategic recommendations
- Executive-level summary
- ROI and business impact

**Business Structure:**
1. Executive summary
2. Problem/opportunity statement
3. Solution overview
4. Benefits and value proposition
5. Implementation roadmap
6. Financial projections/ROI
7. Recommendations and next steps

Professional tone, concise content, focus on business outcomes. Maximum {{maxPages}} slides. Language: {{language}}.`,
} as const;

// ============================================================================
// 錯誤訊息
// ============================================================================

export const ERROR_MESSAGES = {
  [API_ERROR_CODES.INVALID_INPUT]: '無效的輸入參數',
  [API_ERROR_CODES.INVALID_MODEL]: '不支援的 AI 模型',
  [API_ERROR_CODES.OPENAI_ERROR]: 'OpenAI API 服務錯誤',
  [API_ERROR_CODES.RATE_LIMIT]: '請求過於頻繁，請稍後再試',
  [API_ERROR_CODES.INTERNAL_ERROR]: '內部伺服器錯誤',
  [API_ERROR_CODES.MISSING_API_KEY]: '缺少 API 金鑰',
  [API_ERROR_CODES.UNAUTHORIZED]: '未授權的請求',
  [API_ERROR_CODES.NOT_FOUND]: '找不到請求的資源',
  [API_ERROR_CODES.METHOD_NOT_ALLOWED]: '不支援的 HTTP 方法',
  [API_ERROR_CODES.REQUEST_TOO_LARGE]: '請求內容過大',
  [API_ERROR_CODES.INVALID_FILE_FORMAT]: '無效的檔案格式',
  [API_ERROR_CODES.TOKEN_LIMIT_EXCEEDED]: '超過 Token 使用限制',
} as const;

// ============================================================================
// 模型價格配置（用於成本估算）
// ============================================================================

export const MODEL_PRICING = {
  'gpt-4o': {
    prompt: 0.005, // 每 1K tokens 的價格 (USD)
    completion: 0.015,
    currency: 'USD',
  },
  'gpt-4o-mini': {
    prompt: 0.0015,
    completion: 0.002,
    currency: 'USD',
  },
  'gpt-3.5-turbo': {
    prompt: 0.001,
    completion: 0.002,
    currency: 'USD',
  },
} as const;

// ============================================================================
// 主題配色方案
// ============================================================================

export const THEME_COLORS = {
  default: {
    primary: '#3b82f6',
    secondary: '#64748b',
    accent: '#f59e0b',
    background: '#ffffff',
    surface: '#f8fafc',
    text: {
      primary: '#1e293b',
      secondary: '#475569',
      muted: '#64748b',
      inverse: '#ffffff',
    },
  },
  dark: {
    primary: '#60a5fa',
    secondary: '#94a3b8',
    accent: '#fbbf24',
    background: '#0f172a',
    surface: '#1e293b',
    text: {
      primary: '#f1f5f9',
      secondary: '#cbd5e1',
      muted: '#94a3b8',
      inverse: '#0f172a',
    },
  },
  academic: {
    primary: '#1d4ed8',
    secondary: '#374151',
    accent: '#dc2626',
    background: '#ffffff',
    surface: '#f9fafb',
    text: {
      primary: '#111827',
      secondary: '#374151',
      muted: '#6b7280',
      inverse: '#ffffff',
    },
  },
  modern: {
    primary: '#8b5cf6',
    secondary: '#6b7280',
    accent: '#10b981',
    background: '#ffffff',
    surface: '#f3f4f6',
    text: {
      primary: '#111827',
      secondary: '#4b5563',
      muted: '#9ca3af',
      inverse: '#ffffff',
    },
  },
  minimal: {
    primary: '#000000',
    secondary: '#525252',
    accent: '#ef4444',
    background: '#ffffff',
    surface: '#fafafa',
    text: {
      primary: '#000000',
      secondary: '#404040',
      muted: '#737373',
      inverse: '#ffffff',
    },
  },
} as const;

// ============================================================================
// 正規表達式模式
// ============================================================================

export const REGEX_PATTERNS = {
  // 檔案名稱驗證（允許中文、英文、數字、常見符號）
  FILENAME: /^[a-zA-Z0-9\u4e00-\u9fff._-]+$/,

  // API Key 格式驗證
  OPENAI_API_KEY: /^sk-[a-zA-Z0-9]{48,}$/,

  // Email 格式驗證
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,

  // URL 格式驗證
  URL: /^https?:\/\/([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/,

  // Markdown 圖片語法
  MARKDOWN_IMAGE: /!\[([^\]]*)\]\(([^)]+)\)/g,

  // Markdown 程式碼區塊
  MARKDOWN_CODE_BLOCK: /```(\w+)?\n([\s\S]*?)\n```/g,

  // Markdown 連結
  MARKDOWN_LINK: /\[([^\]]+)\]\(([^)]+)\)/g,
} as const;

// ============================================================================
// 快取配置
// ============================================================================

export const CACHE_CONFIG = {
  TTL: {
    SLIDE_GENERATION: 60 * 60, // 1 小時
    EXPORT: 10 * 60, // 10 分鐘
    USER_SESSION: 24 * 60 * 60, // 24 小時
  },

  KEYS: {
    SLIDE_PREFIX: 'slide:',
    EXPORT_PREFIX: 'export:',
    RATE_LIMIT_PREFIX: 'rate_limit:',
    SESSION_PREFIX: 'session:',
  },

  MAX_SIZE: 1000, // 最大快取項目數量
} as const;

// ============================================================================
// 環境變數鍵名
// ============================================================================

export const ENV_VARS = {
  NODE_ENV: 'NODE_ENV',
  PORT: 'PORT',
  REDIS_URL: 'REDIS_URL',
  DATABASE_URL: 'DATABASE_URL',
  NEXTAUTH_SECRET: 'NEXTAUTH_SECRET',
  NEXTAUTH_URL: 'NEXTAUTH_URL',
} as const;

// ============================================================================
// HTTP 狀態碼
// ============================================================================

export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  METHOD_NOT_ALLOWED: 405,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503,
} as const;

// ============================================================================
// CORS 配置
// ============================================================================

export const CORS_CONFIG = {
  ALLOWED_ORIGINS: [
    'http://localhost:3000',
    'http://localhost:3001',
    'https://localhost:3000',
    'https://localhost:3001',
  ],
  ALLOWED_METHODS: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  ALLOWED_HEADERS: [
    'Content-Type',
    'Authorization',
    'X-API-Key',
    'X-Request-ID',
  ],
  MAX_AGE: 86400, // 24 小時
} as const;
