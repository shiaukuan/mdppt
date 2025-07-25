/**
 * API 回應工具函數 - 使用統一的型別系統
 */

import { NextResponse } from 'next/server';
import type {
  ApiResponse,
  ApiErrorCode,
  ErrorResponse,
  ValidationError,
} from '@/types/api';
import { API_ERROR_CODES, ERROR_MESSAGES, HTTP_STATUS } from '@/lib/constants';

// ============================================================================
// 成功回應建立函數
// ============================================================================

/**
 * 建立標準成功回應
 */
export function createSuccessResponse<T>(
  data: T,
  status: number = HTTP_STATUS.OK,
  requestId?: string
): NextResponse<ApiResponse<T>> {
  const response: ApiResponse<T> = {
    success: true,
    data,
    timestamp: new Date().toISOString(),
    ...(requestId && { requestId }),
  };

  return NextResponse.json(response, { status });
}

/**
 * 建立創建成功回應（201）
 */
export function createCreatedResponse<T>(
  data: T,
  requestId?: string
): NextResponse<ApiResponse<T>> {
  return createSuccessResponse(data, HTTP_STATUS.CREATED, requestId);
}

/**
 * 建立無內容回應（204）
 */
export function createNoContentResponse(): NextResponse {
  return new NextResponse(null, { status: HTTP_STATUS.NO_CONTENT });
}

// ============================================================================
// 錯誤回應建立函數
// ============================================================================

/**
 * 建立標準錯誤回應
 */
export function createErrorResponse(
  message: string,
  code: ApiErrorCode,
  status: number = HTTP_STATUS.BAD_REQUEST,
  details?: any,
  field?: string,
  requestId?: string
): NextResponse<ApiResponse> {
  const error: ErrorResponse = {
    message,
    code,
    details,
    field,
    ...(process.env.NODE_ENV === 'development' &&
      details?.stack && {
        stack: details.stack,
      }),
  };

  const response: ApiResponse = {
    success: false,
    error,
    timestamp: new Date().toISOString(),
    ...(requestId && { requestId }),
  };

  return NextResponse.json(response, { status });
}

/**
 * 從驗證錯誤建立錯誤回應
 */
export function createValidationErrorResponse(
  errors: ValidationError[],
  requestId?: string
): NextResponse<ApiResponse> {
  const primaryError = errors[0];

  return createErrorResponse(
    primaryError?.message || '資料驗證失敗',
    API_ERROR_CODES.INVALID_INPUT!,
    HTTP_STATUS.BAD_REQUEST,
    { validationErrors: errors },
    primaryError?.field,
    requestId
  );
}

// ============================================================================
// 預定義的常見錯誤回應
// ============================================================================

export const CommonErrorResponses = {
  /**
   * 無效輸入錯誤
   */
  invalidInput: (
    message: string = '無效的輸入資料',
    details?: any,
    field?: string,
    requestId?: string
  ) =>
    createErrorResponse(
      message,
      API_ERROR_CODES.INVALID_INPUT!,
      HTTP_STATUS.BAD_REQUEST,
      details,
      field,
      requestId
    ),

  /**
   * 缺少 API Key 錯誤
   */
  missingApiKey: (
    message: string = ERROR_MESSAGES[API_ERROR_CODES.MISSING_API_KEY],
    requestId?: string
  ) =>
    createErrorResponse(
      message,
      API_ERROR_CODES.MISSING_API_KEY,
      HTTP_STATUS.UNAUTHORIZED,
      undefined,
      'apiKey',
      requestId
    ),

  /**
   * 未授權錯誤
   */
  unauthorized: (
    message: string = ERROR_MESSAGES[API_ERROR_CODES.UNAUTHORIZED],
    requestId?: string
  ) =>
    createErrorResponse(
      message,
      API_ERROR_CODES.UNAUTHORIZED,
      HTTP_STATUS.UNAUTHORIZED,
      undefined,
      undefined,
      requestId
    ),

  /**
   * 資源未找到錯誤
   */
  notFound: (
    message: string = ERROR_MESSAGES[API_ERROR_CODES.NOT_FOUND],
    requestId?: string
  ) =>
    createErrorResponse(
      message,
      API_ERROR_CODES.NOT_FOUND,
      HTTP_STATUS.NOT_FOUND,
      undefined,
      undefined,
      requestId
    ),

  /**
   * 不支援的 HTTP 方法錯誤
   */
  methodNotAllowed: (method: string, requestId?: string) =>
    createErrorResponse(
      `不支援的 HTTP 方法: ${method}`,
      API_ERROR_CODES.METHOD_NOT_ALLOWED,
      HTTP_STATUS.METHOD_NOT_ALLOWED,
      { method },
      undefined,
      requestId
    ),

  /**
   * 速率限制錯誤
   */
  rateLimit: (
    message: string = ERROR_MESSAGES[API_ERROR_CODES.RATE_LIMIT],
    retryAfter?: number,
    requestId?: string
  ) =>
    createErrorResponse(
      message,
      API_ERROR_CODES.RATE_LIMIT,
      HTTP_STATUS.TOO_MANY_REQUESTS,
      { retryAfter },
      undefined,
      requestId
    ),

  /**
   * 請求過大錯誤
   */
  requestTooLarge: (
    message: string = ERROR_MESSAGES[API_ERROR_CODES.REQUEST_TOO_LARGE],
    maxSize?: number,
    requestId?: string
  ) =>
    createErrorResponse(
      message,
      API_ERROR_CODES.REQUEST_TOO_LARGE,
      HTTP_STATUS.UNPROCESSABLE_ENTITY,
      { maxSize },
      undefined,
      requestId
    ),

  /**
   * 內部伺服器錯誤
   */
  internalError: (
    message: string = ERROR_MESSAGES[API_ERROR_CODES.INTERNAL_ERROR],
    details?: any,
    requestId?: string
  ) =>
    createErrorResponse(
      message,
      API_ERROR_CODES.INTERNAL_ERROR,
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      details,
      undefined,
      requestId
    ),

  /**
   * OpenAI API 錯誤
   */
  openaiError: (
    message: string = ERROR_MESSAGES[API_ERROR_CODES.OPENAI_ERROR],
    details?: any,
    requestId?: string
  ) =>
    createErrorResponse(
      message,
      API_ERROR_CODES.OPENAI_ERROR,
      HTTP_STATUS.BAD_GATEWAY,
      details,
      undefined,
      requestId
    ),

  /**
   * 無效模型錯誤
   */
  invalidModel: (
    model: string,
    supportedModels: string[],
    requestId?: string
  ) =>
    createErrorResponse(
      `不支援的模型: ${model}`,
      API_ERROR_CODES.INVALID_MODEL,
      HTTP_STATUS.BAD_REQUEST,
      { model, supportedModels },
      'model',
      requestId
    ),

  /**
   * Token 限制超出錯誤
   */
  tokenLimitExceeded: (
    message: string = ERROR_MESSAGES[API_ERROR_CODES.TOKEN_LIMIT_EXCEEDED],
    tokenUsage?: any,
    requestId?: string
  ) =>
    createErrorResponse(
      message,
      API_ERROR_CODES.TOKEN_LIMIT_EXCEEDED,
      HTTP_STATUS.UNPROCESSABLE_ENTITY,
      { tokenUsage },
      undefined,
      requestId
    ),

  /**
   * 無效檔案格式錯誤
   */
  invalidFileFormat: (
    format: string,
    supportedFormats: string[],
    requestId?: string
  ) =>
    createErrorResponse(
      `不支援的檔案格式: ${format}`,
      API_ERROR_CODES.INVALID_FILE_FORMAT,
      HTTP_STATUS.BAD_REQUEST,
      { format, supportedFormats },
      'format',
      requestId
    ),
};

// ============================================================================
// 工具函數
// ============================================================================

/**
 * 驗證必要欄位
 * @deprecated 使用 validation.ts 中的 validateRequiredFields 代替
 */
export function validateRequiredFields(
  data: any,
  requiredFields: string[]
): { isValid: boolean; missingFields: string[] } {
  const missingFields = requiredFields.filter(
    field =>
      !data ||
      data[field] === undefined ||
      data[field] === null ||
      data[field] === ''
  );

  return {
    isValid: missingFields.length === 0,
    missingFields,
  };
}

/**
 * 處理異步操作的包裝器
 */
export async function handleApiRequest<T>(
  operation: () => Promise<T>,
  requestId?: string
): Promise<NextResponse<ApiResponse<T>>> {
  try {
    const result = await operation();
    return createSuccessResponse(result, HTTP_STATUS.OK, requestId);
  } catch (error) {
    console.error('API 請求處理錯誤:', error);

    if (error instanceof Error) {
      return CommonErrorResponses.internalError(
        error.message,
        {
          stack:
            process.env.NODE_ENV === 'development' ? error.stack : undefined,
        },
        requestId
      );
    }

    return CommonErrorResponses.internalError('未知錯誤', undefined, requestId);
  }
}

/**
 * 生成請求 ID
 */
export function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
}

/**
 * 從 NextRequest 中提取請求 ID
 */
export function extractRequestId(headers: Headers): string | undefined {
  return headers.get('x-request-id') || undefined;
}
