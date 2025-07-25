/**
 * 全面的錯誤處理工具
 * 提供統一的錯誤處理、重試邏輯和網路錯誤管理
 */

// 錯誤類型定義
export enum ErrorCode {
  // 網路相關錯誤
  NETWORK_ERROR = 'NETWORK_ERROR',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',
  CONNECTION_ERROR = 'CONNECTION_ERROR',
  
  // API 相關錯誤
  API_ERROR = 'API_ERROR',
  AUTHENTICATION_ERROR = 'AUTHENTICATION_ERROR',
  AUTHORIZATION_ERROR = 'AUTHORIZATION_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  NOT_FOUND_ERROR = 'NOT_FOUND_ERROR',
  RATE_LIMIT_ERROR = 'RATE_LIMIT_ERROR',
  
  // 應用程式錯誤
  PARSING_ERROR = 'PARSING_ERROR',
  CONFIGURATION_ERROR = 'CONFIGURATION_ERROR',
  FEATURE_NOT_AVAILABLE = 'FEATURE_NOT_AVAILABLE',
  
  // 外部服務錯誤
  OPENAI_ERROR = 'OPENAI_ERROR',
  MARP_ERROR = 'MARP_ERROR',
  
  // 通用錯誤
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

// 自訂錯誤類別
export class AppError extends Error {
  public readonly code: ErrorCode;
  public readonly statusCode?: number;
  public readonly retryable: boolean;
  public readonly userMessage: string;
  public readonly originalError?: unknown;

  constructor(
    code: ErrorCode,
    message: string,
    userMessage?: string,
    options: {
      statusCode?: number;
      retryable?: boolean;
      originalError?: unknown;
    } = {}
  ) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.statusCode = options.statusCode;
    this.retryable = options.retryable ?? false;
    this.userMessage = userMessage || this.getDefaultUserMessage(code);
    this.originalError = options.originalError;

    // 確保堆疊追蹤正確
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AppError);
    }
  }

  private getDefaultUserMessage(code: ErrorCode): string {
    const messages = {
      [ErrorCode.NETWORK_ERROR]: '網路連線發生問題，請檢查您的網路連線。',
      [ErrorCode.TIMEOUT_ERROR]: '請求超時，請稍後再試。',
      [ErrorCode.CONNECTION_ERROR]: '無法連接到伺服器。',
      [ErrorCode.API_ERROR]: 'API 請求失敗。',
      [ErrorCode.AUTHENTICATION_ERROR]: '身份驗證失敗，請重新登入。',
      [ErrorCode.AUTHORIZATION_ERROR]: '您沒有執行此操作的權限。',
      [ErrorCode.VALIDATION_ERROR]: '輸入資料不正確，請檢查後重試。',
      [ErrorCode.NOT_FOUND_ERROR]: '找不到請求的資源。',
      [ErrorCode.RATE_LIMIT_ERROR]: '請求頻率過高，請稍後再試。',
      [ErrorCode.PARSING_ERROR]: '資料解析失敗。',
      [ErrorCode.CONFIGURATION_ERROR]: '系統配置錯誤。',
      [ErrorCode.FEATURE_NOT_AVAILABLE]: '此功能暫時無法使用。',
      [ErrorCode.OPENAI_ERROR]: 'OpenAI 服務發生錯誤。',
      [ErrorCode.MARP_ERROR]: '投影片渲染發生錯誤。',
      [ErrorCode.UNKNOWN_ERROR]: '發生未知錯誤，請稍後再試。',
    };

    return messages[code] || messages[ErrorCode.UNKNOWN_ERROR];
  }
}

// 錯誤分類器
export function classifyError(error: unknown): AppError {
  // 如果已經是 AppError，直接返回
  if (error instanceof AppError) {
    return error;
  }

  // 如果是標準 Error
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    
    // 網路錯誤
    if (message.includes('network') || message.includes('fetch failed')) {
      return new AppError(
        ErrorCode.NETWORK_ERROR,
        error.message,
        undefined,
        { retryable: true, originalError: error }
      );
    }
    
    // 超時錯誤
    if (message.includes('timeout') || message.includes('aborted')) {
      return new AppError(
        ErrorCode.TIMEOUT_ERROR,
        error.message,
        undefined,
        { retryable: true, originalError: error }
      );
    }
    
    // OpenAI 相關錯誤
    if (message.includes('openai') || message.includes('api key')) {
      return new AppError(
        ErrorCode.OPENAI_ERROR,
        error.message,
        'OpenAI API 發生錯誤，請檢查 API Key 設定。',
        { retryable: false, originalError: error }
      );
    }
    
    // Marp 相關錯誤
    if (message.includes('marp') || message.includes('marpit')) {
      return new AppError(
        ErrorCode.MARP_ERROR,
        error.message,
        undefined,
        { retryable: true, originalError: error }
      );
    }

    // 通用錯誤
    return new AppError(
      ErrorCode.UNKNOWN_ERROR,
      error.message,
      undefined,
      { originalError: error }
    );
  }

  // HTTP Response 錯誤
  if (typeof error === 'object' && error !== null && 'status' in error) {
    const response = error as { status: number; statusText?: string; message?: string };
    
    let errorCode: ErrorCode;
    let retryable = false;
    
    switch (response.status) {
      case 400:
        errorCode = ErrorCode.VALIDATION_ERROR;
        break;
      case 401:
        errorCode = ErrorCode.AUTHENTICATION_ERROR;
        break;
      case 403:
        errorCode = ErrorCode.AUTHORIZATION_ERROR;
        break;
      case 404:
        errorCode = ErrorCode.NOT_FOUND_ERROR;
        break;
      case 429:
        errorCode = ErrorCode.RATE_LIMIT_ERROR;
        retryable = true;
        break;
      case 500:
      case 502:
      case 503:
      case 504:
        errorCode = ErrorCode.API_ERROR;
        retryable = true;
        break;
      default:
        errorCode = ErrorCode.API_ERROR;
    }

    return new AppError(
      errorCode,
      response.message || response.statusText || `HTTP ${response.status}`,
      undefined,
      { statusCode: response.status, retryable, originalError: error }
    );
  }

  // 字串錯誤
  if (typeof error === 'string') {
    return new AppError(ErrorCode.UNKNOWN_ERROR, error);
  }

  // 未知錯誤
  return new AppError(
    ErrorCode.UNKNOWN_ERROR,
    '發生未知錯誤',
    undefined,
    { originalError: error }
  );
}

// 重試配置
export interface RetryConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  backoffFactor: number;
  retryCondition?: (error: AppError) => boolean;
}

// 預設重試配置
export const defaultRetryConfig: RetryConfig = {
  maxRetries: 3,
  baseDelay: 1000,
  maxDelay: 10000,
  backoffFactor: 2,
  retryCondition: (error) => error.retryable,
};

// 重試執行器
export async function retryWithBackoff<T>(
  operation: () => Promise<T>,
  config: Partial<RetryConfig> = {}
): Promise<T> {
  const finalConfig = { ...defaultRetryConfig, ...config };
  let lastError: AppError;
  
  for (let attempt = 0; attempt <= finalConfig.maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      const appError = classifyError(error);
      lastError = appError;
      
      // 如果是最後一次嘗試，或錯誤不可重試，拋出錯誤
      if (
        attempt === finalConfig.maxRetries ||
        !finalConfig.retryCondition!(appError)
      ) {
        throw appError;
      }
      
      // 計算延遲時間（指數退避）
      const delay = Math.min(
        finalConfig.baseDelay * Math.pow(finalConfig.backoffFactor, attempt),
        finalConfig.maxDelay
      );
      
      // 加入隨機抖動（避免雷擊效應）
      const jitteredDelay = delay * (0.5 + Math.random() * 0.5);
      
      console.warn(`Operation failed (attempt ${attempt + 1}/${finalConfig.maxRetries + 1}). Retrying in ${Math.round(jitteredDelay)}ms...`, appError);
      
      await new Promise(resolve => setTimeout(resolve, jitteredDelay));
    }
  }
  
  throw lastError!;
}

// 網路請求包裝器
export async function fetchWithErrorHandling(
  url: string,
  options: RequestInit = {},
  retryConfig?: Partial<RetryConfig>
): Promise<Response> {
  return retryWithBackoff(async () => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30秒超時
      
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw {
          status: response.status,
          statusText: response.statusText,
          message: await response.text().catch(() => response.statusText),
        };
      }
      
      return response;
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        throw new AppError(
          ErrorCode.TIMEOUT_ERROR,
          'Request timeout',
          '請求超時，請稍後再試。',
          { retryable: true, originalError: error }
        );
      }
      throw error;
    }
  }, retryConfig);
}

// API 錯誤處理工具
export const apiErrorHandler = {
  // 處理 API 回應
  async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      let errorMessage: string;
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorData.error || response.statusText;
      } catch {
        errorMessage = response.statusText;
      }
      
      throw {
        status: response.status,
        statusText: response.statusText,
        message: errorMessage,
      };
    }
    
    try {
      return await response.json();
    } catch (error) {
      throw new AppError(
        ErrorCode.PARSING_ERROR,
        'Failed to parse response JSON',
        '回應資料格式錯誤。',
        { originalError: error }
      );
    }
  },

  // 處理 OpenAI API 錯誤
  handleOpenAIError(error: unknown): AppError {
    const appError = classifyError(error);
    
    if (appError.code === ErrorCode.UNKNOWN_ERROR) {
      return new AppError(
        ErrorCode.OPENAI_ERROR,
        appError.message,
        'OpenAI API 發生錯誤，請檢查 API Key 或稍後再試。',
        { retryable: true, originalError: error }
      );
    }
    
    return appError;
  },

  // 處理驗證錯誤
  handleValidationError(errors: Record<string, string[]>): AppError {
    const errorMessages = Object.entries(errors)
      .map(([field, messages]) => `${field}: ${messages.join(', ')}`)
      .join('; ');
    
    return new AppError(
      ErrorCode.VALIDATION_ERROR,
      `Validation failed: ${errorMessages}`,
      '輸入資料驗證失敗，請檢查輸入內容。',
      { retryable: false }
    );
  },
};

// 全域錯誤處理器
export function setupGlobalErrorHandler() {
  // 處理未捕獲的 Promise 拒絕
  window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
    const appError = classifyError(event.reason);
    
    // 可以在這裡整合全域通知系統
    console.error('Global error handler:', appError);
    
    // 防止瀏覽器顯示默認錯誤
    event.preventDefault();
  });

  // 處理 JavaScript 錯誤
  window.addEventListener('error', (event) => {
    console.error('Global JavaScript error:', event.error);
    const appError = classifyError(event.error);
    
    // 可以在這裡整合全域通知系統
    console.error('Global error handler:', appError);
  });
}

// 錯誤報告工具
export const errorReporter = {
  // 發送錯誤報告
  async reportError(error: AppError, context?: Record<string, unknown>) {
    try {
      const errorReport = {
        code: error.code,
        message: error.message,
        userMessage: error.userMessage,
        statusCode: error.statusCode,
        retryable: error.retryable,
        stack: error.stack,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href,
        context,
      };

      console.log('Error report:', errorReport);
      
      // 這裡可以發送到錯誤追蹤服務
      // await fetch('/api/error-report', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(errorReport),
      // });
      
    } catch (reportError) {
      console.error('Failed to report error:', reportError);
    }
  },

  // 批量錯誤報告
  async reportErrors(errors: Array<{ error: AppError; context?: Record<string, unknown> }>) {
    for (const { error, context } of errors) {
      await this.reportError(error, context);
    }
  },
};

export default {
  AppError,
  classifyError,
  retryWithBackoff,
  fetchWithErrorHandling,
  apiErrorHandler,
  errorReporter,
  setupGlobalErrorHandler,
};