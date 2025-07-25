import { useState, useCallback, useRef } from 'react';
import { useApiKey } from '@/contexts/SettingsContext';
import { useEditorStore } from '@/stores/editorStore';
import { fetchWithErrorHandling, classifyError, AppError, ErrorCode } from '@/lib/error-handling';
import type { SlideGeneratorFormData } from '@/components/SlideGenerator/GeneratorForm';

// API 回應介面
export interface SlideGenerationResponse {
  success: boolean;
  data?: {
    content: string;
    usage?: {
      promptTokens: number;
      completionTokens: number;
      totalTokens: number;
      estimatedCost?: number;
    };
    model: string;
    processingTime: number;
  };
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

// Token 使用追蹤
export interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  estimatedCost: number;
  requestCount: number;
  sessionTotal: number;
}

// 錯誤類型
export interface SlideGenerationError {
  type: 'network' | 'api' | 'validation' | 'auth' | 'quota' | 'unknown';
  message: string;
  code?: string;
  details?: any;
  retry?: boolean;
}

// Hook 狀態
export interface UseSlideGenerationState {
  isGenerating: boolean;
  isValidating: boolean;
  progress: number;
  error: SlideGenerationError | null;
  lastGeneration: {
    timestamp: Date;
    formData: SlideGeneratorFormData;
    content: string;
    usage?: TokenUsage;
  } | null;
  tokenUsage: TokenUsage;
}

// Hook 回傳介面
export interface UseSlideGenerationReturn extends UseSlideGenerationState {
  generateSlides: (formData: SlideGeneratorFormData) => Promise<void>;
  clearError: () => void;
  cancelGeneration: () => void;
  retryLastGeneration: () => Promise<void>;
  resetTokenUsage: () => void;
}

// 初始 token 使用狀態
const initialTokenUsage: TokenUsage = {
  promptTokens: 0,
  completionTokens: 0,
  totalTokens: 0,
  estimatedCost: 0,
  requestCount: 0,
  sessionTotal: 0,
};

// 初始狀態
const initialState: UseSlideGenerationState = {
  isGenerating: false,
  isValidating: false,
  progress: 0,
  error: null,
  lastGeneration: null,
  tokenUsage: { ...initialTokenUsage },
};

// Token 價格（每 1K tokens 的 USD）
const TOKEN_PRICES = {
  'gpt-4o': { prompt: 0.005, completion: 0.015 },
  'gpt-4o-mini': { prompt: 0.00015, completion: 0.0006 },
  'gpt-4': { prompt: 0.03, completion: 0.06 },
  'gpt-3.5-turbo': { prompt: 0.001, completion: 0.002 },
} as const;

export function useSlideGeneration(): UseSlideGenerationReturn {
  const [state, setState] = useState<UseSlideGenerationState>(initialState);
  const { apiKey, isValid: isApiKeyValid } = useApiKey();
  const { setMarkdown } = useEditorStore();
  const abortControllerRef = useRef<AbortController | null>(null);

  // 計算估計成本
  const calculateCost = useCallback((
    model: string,
    promptTokens: number,
    completionTokens: number
  ): number => {
    const prices = TOKEN_PRICES[model as keyof typeof TOKEN_PRICES];
    if (!prices) return 0;
    
    const promptCost = (promptTokens / 1000) * prices.prompt;
    const completionCost = (completionTokens / 1000) * prices.completion;
    return promptCost + completionCost;
  }, []);

  // 錯誤分類
  const classifyError = useCallback((error: any): SlideGenerationError => {
    // 網路錯誤
    if (error.name === 'AbortError') {
      return {
        type: 'network',
        message: '請求已取消',
        retry: true,
      };
    }

    if (!navigator.onLine) {
      return {
        type: 'network',
        message: '網路連線中斷，請檢查網路設定',
        retry: true,
      };
    }

    // API 錯誤
    if (error.status) {
      switch (error.status) {
        case 400:
          return {
            type: 'validation',
            message: '請求參數錯誤，請檢查輸入內容',
            code: 'INVALID_REQUEST',
            retry: false,
          };
        case 401:
          return {
            type: 'auth',
            message: 'API Key 無效或已過期，請重新設定',
            code: 'INVALID_API_KEY',
            retry: false,
          };
        case 403:
          return {
            type: 'auth',
            message: '沒有權限訪問此 API，請檢查 API Key 權限',
            code: 'FORBIDDEN',
            retry: false,
          };
        case 429:
          return {
            type: 'quota',
            message: '請求過於頻繁或配額已用完，請稍後再試',
            code: 'RATE_LIMIT_EXCEEDED',
            retry: true,
          };
        case 500:
          return {
            type: 'api',
            message: '伺服器內部錯誤，請稍後再試',
            code: 'INTERNAL_ERROR',
            retry: true,
          };
        case 503:
          return {
            type: 'api',
            message: '服務暫時不可用，請稍後再試',
            code: 'SERVICE_UNAVAILABLE',
            retry: true,
          };
        default:
          return {
            type: 'api',
            message: `API 錯誤 (${error.status})，請稍後再試`,
            code: 'API_ERROR',
            retry: true,
          };
      }
    }

    // 其他錯誤
    return {
      type: 'unknown',
      message: error.message || '未知錯誤，請稍後再試',
      retry: true,
    };
  }, []);

  // 生成投影片
  const generateSlides = useCallback(async (formData: SlideGeneratorFormData) => {
    // 驗證 API Key
    if (!isApiKeyValid) {
      setState(prev => ({
        ...prev,
        error: {
          type: 'auth',
          message: '請先設定有效的 OpenAI API Key',
          retry: false,
        },
      }));
      return;
    }

    // 重設狀態
    setState(prev => ({
      ...prev,
      isGenerating: true,
      isValidating: true,
      progress: 0,
      error: null,
    }));

    try {
      // 建立 AbortController
      abortControllerRef.current = new AbortController();
      
      // 驗證階段
      setState(prev => ({ ...prev, progress: 10 }));
      
      // 準備請求資料
      const requestData = {
        ...formData,
        apiKey,
      };

      // 發送請求
      setState(prev => ({ 
        ...prev, 
        isValidating: false, 
        progress: 20 
      }));

      const response = await fetchWithErrorHandling('/api/v1/slides', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
        signal: abortControllerRef.current.signal,
      }, {
        maxRetries: 2,
        baseDelay: 1000,
        retryCondition: (error) => error.retryable && error.code !== ErrorCode.AUTHENTICATION_ERROR,
      });

      setState(prev => ({ ...prev, progress: 60 }));

      let result: SlideGenerationResponse;
      try {
        result = await response.json();
      } catch (parseError) {
        throw new AppError(
          ErrorCode.PARSING_ERROR,
          'Failed to parse API response',
          '伺服器回應格式錯誤',
          { originalError: parseError }
        );
      }

      setState(prev => ({ ...prev, progress: 80 }));

      setState(prev => ({ ...prev, progress: 90 }));

      if (!result.success || !result.data?.content) {
        throw new Error(result.error?.message || '生成失敗，請稍後再試');
      }

      // 計算 token 使用
      const usage = result.data?.usage;
      let newTokenUsage = state.tokenUsage;
      
      if (usage) {
        const estimatedCost = calculateCost(
          formData.model,
          usage.promptTokens,
          usage.completionTokens
        );

        newTokenUsage = {
          promptTokens: usage.promptTokens,
          completionTokens: usage.completionTokens,
          totalTokens: usage.totalTokens,
          estimatedCost,
          requestCount: state.tokenUsage.requestCount + 1,
          sessionTotal: state.tokenUsage.sessionTotal + usage.totalTokens,
        };
      }

      // 更新編輯器內容
      setMarkdown(result.data.content, true);

      // 更新狀態
      setState(prev => ({
        ...prev,
        isGenerating: false,
        progress: 100,
        lastGeneration: {
          timestamp: new Date(),
          formData,
          content: result.data.content,
          usage: newTokenUsage,
        },
        tokenUsage: newTokenUsage,
      }));

      // 短暫顯示完成狀態後重設進度
      setTimeout(() => {
        setState(prev => ({ ...prev, progress: 0 }));
      }, 1000);

    } catch (error: unknown) {
      // 檢查是否為用戶取消操作
      if (error instanceof DOMException && error.name === 'AbortError') {
        setState(prev => ({
          ...prev,
          isGenerating: false,
          isValidating: false,
          progress: 0,
          error: null,
        }));
        return;
      }

      // 分類並處理錯誤
      const appError = classifyError(error);
      
      // 轉換為舊的錯誤格式以保持相容性
      const legacyError: SlideGenerationError = {
        type: appError.code === ErrorCode.NETWORK_ERROR ? 'network' :
              appError.code === ErrorCode.AUTHENTICATION_ERROR ? 'auth' :
              appError.code === ErrorCode.VALIDATION_ERROR ? 'validation' :
              appError.code === ErrorCode.OPENAI_ERROR ? 'api' :
              appError.code === ErrorCode.RATE_LIMIT_ERROR ? 'quota' : 'unknown',
        message: appError.userMessage,
        code: appError.code,
        details: appError.originalError,
        retry: appError.retryable,
      };

      setState(prev => ({
        ...prev,
        isGenerating: false,
        isValidating: false,
        progress: 0,
        error: legacyError,
      }));

      // 記錄詳細錯誤資訊
      console.error('Slide generation error:', appError);
    } finally {
      abortControllerRef.current = null;
    }
  }, [apiKey, isApiKeyValid, state.tokenUsage, setMarkdown, calculateCost]);

  // 清除錯誤
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  // 取消生成
  const cancelGeneration = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setState(prev => ({
        ...prev,
        isGenerating: false,
        isValidating: false,
        progress: 0,
      }));
    }
  }, []);

  // 重試上次生成
  const retryLastGeneration = useCallback(async () => {
    if (state.lastGeneration) {
      await generateSlides(state.lastGeneration.formData);
    }
  }, [state.lastGeneration, generateSlides]);

  // 重設 token 使用統計
  const resetTokenUsage = useCallback(() => {
    setState(prev => ({
      ...prev,
      tokenUsage: { ...initialTokenUsage },
    }));
  }, []);

  return {
    ...state,
    generateSlides,
    clearError,
    cancelGeneration,
    retryLastGeneration,
    resetTokenUsage,
  };
}