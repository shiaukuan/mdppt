/**
 * 使用 Zod 進行資料驗證的工具函數
 */

import { z } from 'zod';
import type {
  SlideGenerationRequest,
  ExportRequest,
  OpenAIModel,
  SlideTheme,
  ExportFormat,
  Language,
  ValidationError,
} from '@/types/api';
import {
  SUPPORTED_MODELS,
  SUPPORTED_THEMES,
  SUPPORTED_EXPORT_FORMATS,
  SUPPORTED_LANGUAGES,
  LIMITS,
  REGEX_PATTERNS,
} from './constants';

// ============================================================================
// 基礎驗證 Schema
// ============================================================================

// 字串驗證
const topicSchema = z
  .string()
  .min(
    LIMITS.TOPIC.MIN_LENGTH,
    `主題長度至少 ${LIMITS.TOPIC.MIN_LENGTH} 個字元`
  )
  .max(
    LIMITS.TOPIC.MAX_LENGTH,
    `主題長度不可超過 ${LIMITS.TOPIC.MAX_LENGTH} 個字元`
  )
  .trim();

const filenameSchema = z
  .string()
  .min(1, '檔案名稱不可為空')
  .max(LIMITS.FILE.MAX_FILENAME_LENGTH, '檔案名稱過長')
  .regex(REGEX_PATTERNS.FILENAME, '檔案名稱包含無效字元');

const markdownSchema = z
  .string()
  .min(LIMITS.MARKDOWN.MIN_SIZE, 'Markdown 內容過短')
  .max(LIMITS.MARKDOWN.MAX_SIZE, 'Markdown 內容過大（最大 1MB）');

// 列舉驗證
const modelSchema = z.enum(
  SUPPORTED_MODELS as [OpenAIModel, ...OpenAIModel[]],
  {
    message: `不支援的模型，支援的模型: ${SUPPORTED_MODELS.join(', ')}`,
  }
);

const themeSchema = z.enum(SUPPORTED_THEMES as [SlideTheme, ...SlideTheme[]], {
  message: `不支援的主題，支援的主題: ${SUPPORTED_THEMES.join(', ')}`,
});

const exportFormatSchema = z.enum(
  SUPPORTED_EXPORT_FORMATS as [ExportFormat, ...ExportFormat[]],
  {
    message: `不支援的匯出格式，支援的格式: ${SUPPORTED_EXPORT_FORMATS.join(', ')}`,
  }
);

const languageSchema = z.enum(
  SUPPORTED_LANGUAGES as [Language, ...Language[]],
  {
    message: `不支援的語言，支援的語言: ${SUPPORTED_LANGUAGES.join(', ')}`,
  }
);

// 數值驗證
const maxPagesSchema = z
  .number()
  .int('頁數必須為整數')
  .min(LIMITS.SLIDES.MIN_COUNT, `最少 ${LIMITS.SLIDES.MIN_COUNT} 頁`)
  .max(LIMITS.SLIDES.MAX_COUNT, `最多 ${LIMITS.SLIDES.MAX_COUNT} 頁`);

// API Key 驗證
const apiKeySchema = z
  .string()
  .min(1, 'API Key 不可為空')
  .regex(REGEX_PATTERNS.OPENAI_API_KEY, '無效的 OpenAI API Key 格式');

// ============================================================================
// 投影片生成請求驗證 Schema
// ============================================================================

export const slideGenerationRequestSchema = z.object({
  topic: topicSchema,
  model: modelSchema.optional(),
  maxPages: maxPagesSchema.optional(),
  style: themeSchema.optional(),
  includeCode: z.boolean().optional(),
  includeImages: z.boolean().optional(),
  language: languageSchema.optional(),
  customPrompt: z.string().max(2000, '自訂提示詞過長').optional(),
  targetAudience: z
    .enum(['beginner', 'intermediate', 'advanced', 'expert'])
    .optional(),
  slideFormat: z
    .enum(['presentation', 'tutorial', 'workshop', 'lecture'])
    .optional(),
  tone: z.enum(['formal', 'casual', 'academic', 'friendly']).optional(),
});

// ============================================================================
// 匯出請求驗證 Schema
// ============================================================================

export const exportOptionsSchema = z.object({
  includeNotes: z.boolean().optional(),
  slideSize: z.enum(['standard', 'widescreen', 'square']).optional(),
  fontSize: z.enum(['small', 'medium', 'large']).optional(),
  quality: z.enum(['low', 'medium', 'high']).optional(),
  watermark: z.boolean().optional(),
  headerFooter: z
    .object({
      header: z.string().max(100).optional(),
      footer: z.string().max(100).optional(),
      showPageNumbers: z.boolean().optional(),
    })
    .optional(),
  styling: z
    .object({
      backgroundColor: z
        .string()
        .regex(/^#[0-9A-Fa-f]{6}$/)
        .optional(),
      textColor: z
        .string()
        .regex(/^#[0-9A-Fa-f]{6}$/)
        .optional(),
      accentColor: z
        .string()
        .regex(/^#[0-9A-Fa-f]{6}$/)
        .optional(),
      fontFamily: z.string().max(50).optional(),
    })
    .optional(),
});

export const exportRequestSchema = z.object({
  markdown: markdownSchema,
  format: exportFormatSchema,
  filename: filenameSchema.optional(),
  theme: themeSchema.optional(),
  options: exportOptionsSchema.optional(),
});

// ============================================================================
// API Key 驗證 Schema
// ============================================================================

export const apiKeyValidationSchema = z.object({
  apiKey: apiKeySchema,
});

// ============================================================================
// 通用驗證函數
// ============================================================================

export type ValidationResult<T> =
  | {
      success: true;
      data: T;
    }
  | {
      success: false;
      errors: ValidationError[];
    };

/**
 * 將 Zod 錯誤轉換為自訂的驗證錯誤格式
 */
function formatZodErrors(error: z.ZodError): ValidationError[] {
  // 檢查 error.issues 是否存在且為陣列 (Zod 使用 issues 而非 errors)
  if (!error.issues || !Array.isArray(error.issues)) {
    console.warn('Invalid Zod error structure:', error);
    return [
      {
        field: 'unknown',
        message: error.message || '驗證失敗',
        value: undefined,
      },
    ];
  }

  return error.issues.map(err => ({
    field: err.path ? err.path.join('.') : 'unknown',
    message: err.message || '驗證錯誤',
    value: err.code === 'invalid_type' ? undefined : (err as any).received,
  }));
}

/**
 * 安全的驗證函數，返回型別安全的結果
 */
function safeValidate<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): ValidationResult<T> {
  try {
    const result = schema.parse(data);
    return {
      success: true,
      data: result,
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        errors: formatZodErrors(error),
      };
    }

    return {
      success: false,
      errors: [
        {
          field: 'unknown',
          message: '未知的驗證錯誤',
          value: data,
        },
      ],
    };
  }
}

// ============================================================================
// 具體驗證函數
// ============================================================================

/**
 * 驗證投影片生成請求
 */
export function validateSlideGenerationRequest(
  data: unknown
): ValidationResult<SlideGenerationRequest> {
  return safeValidate(slideGenerationRequestSchema, data);
}

/**
 * 驗證匯出請求
 */
export function validateExportRequest(
  data: unknown
): ValidationResult<ExportRequest> {
  return safeValidate(exportRequestSchema, data);
}

/**
 * 驗證 API Key
 */
export function validateApiKey(apiKey: unknown): ValidationResult<string> {
  const result = safeValidate(apiKeyValidationSchema, { apiKey });

  if (result.success) {
    return {
      success: true,
      data: result.data.apiKey,
    };
  }

  return result;
}

/**
 * 驗證檔案名稱
 */
export function validateFilename(filename: unknown): ValidationResult<string> {
  return safeValidate(filenameSchema, filename);
}

/**
 * 驗證 Markdown 內容
 */
export function validateMarkdown(markdown: unknown): ValidationResult<string> {
  return safeValidate(markdownSchema, markdown);
}

// ============================================================================
// 條件驗證函數
// ============================================================================

/**
 * 根據條件驗證可選欄位
 */
export function validateConditional<T>(
  condition: boolean,
  schema: z.ZodSchema<T>,
  data: unknown
): ValidationResult<T | undefined> {
  if (!condition) {
    return {
      success: true,
      data: undefined,
    };
  }

  return safeValidate(schema, data);
}

/**
 * 驗證必填欄位是否存在
 */
export function validateRequiredFields(
  data: Record<string, any>,
  requiredFields: string[]
): ValidationResult<Record<string, any>> {
  const missingFields = requiredFields.filter(
    field =>
      !(field in data) ||
      data[field] === undefined ||
      data[field] === null ||
      data[field] === ''
  );

  if (missingFields.length > 0) {
    return {
      success: false,
      errors: missingFields.map(field => ({
        field,
        message: `缺少必要欄位: ${field}`,
        value: undefined,
      })),
    };
  }

  return {
    success: true,
    data,
  };
}

// ============================================================================
// 自訂驗證器
// ============================================================================

/**
 * 驗證物件是否包含特定鍵
 */
export function hasRequiredKeys<T extends Record<string, any>>(
  obj: T,
  keys: (keyof T)[]
): boolean {
  return keys.every(key => key in obj && obj[key] !== undefined);
}

/**
 * 驗證字串是否為有效的 URL
 */
export function isValidUrl(url: string): boolean {
  return REGEX_PATTERNS.URL.test(url);
}

/**
 * 驗證字串是否為有效的 Email
 */
export function isValidEmail(email: string): boolean {
  return REGEX_PATTERNS.EMAIL.test(email);
}

/**
 * 驗證檔案大小
 */
export function validateFileSize(
  size: number,
  maxSize: number = LIMITS.REQUEST.MAX_SIZE
): ValidationResult<number> {
  if (size > maxSize) {
    return {
      success: false,
      errors: [
        {
          field: 'fileSize',
          message: `檔案大小超過限制（最大 ${Math.round(maxSize / 1024)} KB）`,
          value: size,
        },
      ],
    };
  }

  return {
    success: true,
    data: size,
  };
}

/**
 * 驗證內容類型
 */
export function validateContentType(
  contentType: string,
  allowedTypes: string[]
): ValidationResult<string> {
  if (!allowedTypes.includes(contentType)) {
    return {
      success: false,
      errors: [
        {
          field: 'contentType',
          message: `不支援的內容類型，允許的類型: ${allowedTypes.join(', ')}`,
          value: contentType,
        },
      ],
    };
  }

  return {
    success: true,
    data: contentType,
  };
}

// ============================================================================
// 組合驗證器
// ============================================================================

/**
 * 執行多個驗證器並收集所有錯誤
 */
export function validateMultiple<T>(
  validators: Array<() => ValidationResult<any>>
): ValidationResult<T[]> {
  const results = validators.map(validator => validator());
  const errors: ValidationError[] = [];
  const data: any[] = [];

  for (const result of results) {
    if (result.success) {
      data.push(result.data);
    } else {
      errors.push(...result.errors);
    }
  }

  if (errors.length > 0) {
    return {
      success: false,
      errors,
    };
  }

  return {
    success: true,
    data: data as T[],
  };
}

/**
 * 驗證並清理輸入資料
 */
export function sanitizeAndValidate<T>(
  schema: z.ZodSchema<T>,
  data: unknown,
  sanitizers?: Array<(data: any) => any>
): ValidationResult<T> {
  let processedData = data;

  // 應用清理函數
  if (sanitizers) {
    for (const sanitizer of sanitizers) {
      processedData = sanitizer(processedData);
    }
  }

  return safeValidate(schema, processedData);
}

// ============================================================================
// 常用清理函數
// ============================================================================

/**
 * 清理字串：去除前後空白並限制長度
 */
export function sanitizeString(str: unknown, maxLength?: number): string {
  if (typeof str !== 'string') {
    return '';
  }

  let cleaned = str.trim();

  if (maxLength && cleaned.length > maxLength) {
    cleaned = cleaned.substring(0, maxLength);
  }

  return cleaned;
}

/**
 * 清理物件：移除空值和未定義的屬性
 */
export function sanitizeObject<T extends Record<string, any>>(
  obj: T
): Partial<T> {
  const cleaned: Partial<T> = {};

  for (const [key, value] of Object.entries(obj)) {
    if (value !== null && value !== undefined && value !== '') {
      cleaned[key as keyof T] = value;
    }
  }

  return cleaned;
}

/**
 * 清理陣列：移除空值和重複項
 */
export function sanitizeArray<T>(arr: unknown): T[] {
  if (!Array.isArray(arr)) {
    return [];
  }

  return arr.filter(
    (item, index, self) =>
      item !== null &&
      item !== undefined &&
      item !== '' &&
      self.indexOf(item) === index
  );
}
