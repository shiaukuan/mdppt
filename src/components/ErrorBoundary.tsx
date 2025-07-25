/**
 * React 錯誤邊界組件
 * 提供友善的錯誤訊息和重試選項
 */

'use client';

import React, { Component, ReactNode, ErrorInfo } from 'react';

// 錯誤邊界狀態介面
interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string;
  retryCount: number;
}

// 錯誤邊界 Props
export interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo, errorId: string) => void;
  onRetry?: (errorId: string, retryCount: number) => void;
  showDetails?: boolean;
  maxRetries?: number;
  resetOnPropsChange?: boolean;
  resetKeys?: Array<string | number>;
}

// 錯誤類別定義
export enum ErrorType {
  NETWORK = 'network',
  PERMISSION = 'permission',
  VALIDATION = 'validation',
  RUNTIME = 'runtime',
  CHUNK_LOAD = 'chunk_load',
  UNKNOWN = 'unknown',
}

// 錯誤分類工具
function classifyError(error: Error): ErrorType {
  const message = error.message.toLowerCase();
  const stack = error.stack?.toLowerCase() || '';

  if (message.includes('network') || message.includes('fetch') || message.includes('connection')) {
    return ErrorType.NETWORK;
  }
  
  if (message.includes('permission') || message.includes('unauthorized') || message.includes('forbidden')) {
    return ErrorType.PERMISSION;
  }
  
  if (message.includes('validation') || message.includes('invalid') || message.includes('required')) {
    return ErrorType.VALIDATION;
  }
  
  if (message.includes('loading chunk') || stack.includes('chunk')) {
    return ErrorType.CHUNK_LOAD;
  }
  
  if (message.includes('runtime') || stack.includes('runtime')) {
    return ErrorType.RUNTIME;
  }
  
  return ErrorType.UNKNOWN;
}

// 錯誤訊息映射
const errorMessages = {
  [ErrorType.NETWORK]: {
    title: '網路連線問題',
    message: '無法連接到伺服器，請檢查您的網路連線。',
    suggestion: '請檢查網路連線後重試，或聯絡系統管理員。',
    icon: '🌐',
    retryable: true,
  },
  [ErrorType.PERMISSION]: {
    title: '權限不足',
    message: '您沒有執行此操作的權限。',
    suggestion: '請聯絡管理員獲取所需權限，或使用其他帳號登入。',
    icon: '🔒',
    retryable: false,
  },
  [ErrorType.VALIDATION]: {
    title: '資料驗證錯誤',
    message: '輸入的資料格式不正確。',
    suggestion: '請檢查輸入內容是否符合要求，並重新提交。',
    icon: '⚠️',
    retryable: true,
  },
  [ErrorType.CHUNK_LOAD]: {
    title: '載入失敗',
    message: '無法載入應用程式資源。',
    suggestion: '請重新整理頁面，或清除瀏覽器快取後再試。',
    icon: '📦',
    retryable: true,
  },
  [ErrorType.RUNTIME]: {
    title: '執行時錯誤',
    message: '應用程式執行時發生錯誤。',
    suggestion: '請重試，如果問題持續存在，請聯絡技術支援。',
    icon: '⚙️',
    retryable: true,
  },
  [ErrorType.UNKNOWN]: {
    title: '未預期的錯誤',
    message: '發生了未知的錯誤。',
    suggestion: '請重試，如果問題持續存在，請聯絡技術支援。',
    icon: '❌',
    retryable: true,
  },
};

/**
 * 錯誤顯示組件
 */
interface ErrorDisplayProps {
  error: Error;
  errorInfo: ErrorInfo | null;
  errorId: string;
  retryCount: number;
  maxRetries: number;
  showDetails: boolean;
  onRetry: () => void;
  onReportError: () => void;
}

function ErrorDisplay({
  error,
  errorInfo,
  errorId,
  retryCount,
  maxRetries,
  showDetails,
  onRetry,
  onReportError,
}: ErrorDisplayProps) {
  const [showFullError, setShowFullError] = React.useState(false);
  const [isReporting, setIsReporting] = React.useState(false);
  
  const errorType = classifyError(error);
  const errorConfig = errorMessages[errorType];
  
  const canRetry = errorConfig.retryable && retryCount < maxRetries;

  const handleReportError = async () => {
    setIsReporting(true);
    try {
      await onReportError();
    } finally {
      setIsReporting(false);
    }
  };

  return (
    <div className="min-h-[400px] flex items-center justify-center p-8 bg-gray-50">
      <div className="max-w-lg w-full bg-white rounded-lg shadow-lg p-8 text-center">
        {/* 錯誤圖示 */}
        <div className="text-6xl mb-6">
          {errorConfig.icon}
        </div>

        {/* 錯誤標題 */}
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          {errorConfig.title}
        </h2>

        {/* 錯誤訊息 */}
        <p className="text-gray-600 mb-4 leading-relaxed">
          {errorConfig.message}
        </p>

        {/* 建議 */}
        <p className="text-sm text-gray-500 mb-6">
          {errorConfig.suggestion}
        </p>

        {/* 動作按鈕 */}
        <div className="flex flex-col gap-3 mb-6">
          {canRetry && (
            <button
              onClick={onRetry}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              重試 {retryCount > 0 && `(${retryCount}/${maxRetries})`}
            </button>
          )}
          
          <button
            onClick={() => window.location.reload()}
            className="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors font-medium"
          >
            重新載入頁面
          </button>
          
          <button
            onClick={handleReportError}
            disabled={isReporting}
            className="text-blue-600 hover:text-blue-800 transition-colors text-sm disabled:opacity-50"
          >
            {isReporting ? '回報中...' : '回報問題'}
          </button>
        </div>

        {/* 錯誤詳細資訊 */}
        {showDetails && (
          <div className="border-t pt-6">
            <button
              onClick={() => setShowFullError(!showFullError)}
              className="text-sm text-gray-500 hover:text-gray-700 transition-colors mb-4"
            >
              {showFullError ? '隱藏' : '顯示'}技術詳細資訊
            </button>
            
            {showFullError && (
              <div className="bg-gray-100 rounded-lg p-4 text-left text-sm">
                <div className="font-semibold text-gray-700 mb-2">
                  錯誤 ID: {errorId}
                </div>
                <div className="font-semibold text-gray-700 mb-2">
                  錯誤類型: {errorType}
                </div>
                <div className="font-semibold text-gray-700 mb-2">
                  錯誤訊息:
                </div>
                <div className="bg-red-50 border border-red-200 rounded p-3 mb-4 text-red-800 font-mono text-xs overflow-auto">
                  {error.message}
                </div>
                
                {error.stack && (
                  <>
                    <div className="font-semibold text-gray-700 mb-2">
                      堆疊追蹤:
                    </div>
                    <div className="bg-gray-200 rounded p-3 mb-4 font-mono text-xs overflow-auto max-h-32">
                      {error.stack}
                    </div>
                  </>
                )}
                
                {errorInfo && (
                  <>
                    <div className="font-semibold text-gray-700 mb-2">
                      組件堆疊:
                    </div>
                    <div className="bg-gray-200 rounded p-3 font-mono text-xs overflow-auto max-h-32">
                      {errorInfo.componentStack}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * 錯誤邊界類別組件
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private retryTimeoutId: NodeJS.Timeout | null = null;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: '',
      retryCount: 0,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    const errorId = Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
    
    return {
      hasError: true,
      error,
      errorId,
    };
  }

  override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      error,
      errorInfo,
    });

    // 呼叫錯誤回調
    if (this.props.onError) {
      this.props.onError(error, errorInfo, this.state.errorId);
    }

    // 記錄錯誤到控制台
    console.group('🚨 Error Boundary Caught Error');
    console.error('Error:', error);
    console.error('Error Info:', errorInfo);
    console.error('Error ID:', this.state.errorId);
    console.groupEnd();

    // 自動重試邏輯（對於特定類型的錯誤）
    const errorType = classifyError(error);
    if (errorType === ErrorType.CHUNK_LOAD && this.state.retryCount === 0) {
      this.scheduleAutoRetry();
    }
  }

  override componentDidUpdate(prevProps: ErrorBoundaryProps) {
    const { resetOnPropsChange, resetKeys } = this.props;
    
    if (this.state.hasError && resetOnPropsChange) {
      if (resetKeys) {
        const hasResetKeyChanged = resetKeys.some(
          (key, index) => key !== (prevProps.resetKeys?.[index])
        );
        
        if (hasResetKeyChanged) {
          this.resetError();
        }
      }
    }
  }

  override componentWillUnmount() {
    if (this.retryTimeoutId) {
      clearTimeout(this.retryTimeoutId);
    }
  }

  scheduleAutoRetry = () => {
    this.retryTimeoutId = setTimeout(() => {
      this.handleRetry();
    }, 1000);
  };

  resetError = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: '',
      retryCount: 0,
    });
  };

  handleRetry = () => {
    const { maxRetries = 3, onRetry } = this.props;
    
    if (this.state.retryCount >= maxRetries) {
      return;
    }

    this.setState(prevState => ({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: prevState.retryCount + 1,
    }));

    if (onRetry) {
      onRetry(this.state.errorId, this.state.retryCount + 1);
    }
  };

  handleReportError = async () => {
    const { error, errorInfo, errorId } = this.state;
    
    try {
      // 這裡可以整合錯誤回報服務
      const errorReport = {
        errorId,
        message: error?.message,
        stack: error?.stack,
        componentStack: errorInfo?.componentStack,
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString(),
        url: window.location.href,
      };

      // 發送到錯誤追蹤服務
      console.log('Error report:', errorReport);
      
      // 這裡可以呼叫實際的錯誤回報 API
      // await fetch('/api/error-report', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(errorReport),
      // });
      
      alert('感謝您回報問題，我們會盡快處理。');
    } catch (reportError) {
      console.error('Failed to report error:', reportError);
      alert('回報問題時發生錯誤，請稍後再試。');
    }
  };

  override render() {
    if (this.state.hasError) {
      // 如果提供了自訂的 fallback，使用它
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // 使用預設的錯誤顯示組件
      return (
        <ErrorDisplay
          error={this.state.error!}
          errorInfo={this.state.errorInfo}
          errorId={this.state.errorId}
          retryCount={this.state.retryCount}
          maxRetries={this.props.maxRetries || 3}
          showDetails={this.props.showDetails !== false}
          onRetry={this.handleRetry}
          onReportError={this.handleReportError}
        />
      );
    }

    return this.props.children;
  }
}

/**
 * 函數式錯誤邊界 Hook（React 18+ 實驗性功能的替代方案）
 */
export function useErrorHandler() {
  return (error: Error, errorInfo?: ErrorInfo) => {
    console.error('Unhandled error:', error, errorInfo);
    
    // 可以在這裡觸發全域錯誤處理
    throw error;
  };
}

/**
 * 高階組件：為組件添加錯誤邊界
 */
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<ErrorBoundaryProps, 'children'>
) {
  return function WithErrorBoundaryComponent(props: P) {
    return (
      <ErrorBoundary {...errorBoundaryProps}>
        <Component {...props} />
      </ErrorBoundary>
    );
  };
}

/**
 * 錯誤邊界工具函數
 */
export const errorBoundaryUtils = {
  // 檢查是否為開發環境
  isDevelopment: () => process.env.NODE_ENV === 'development',
  
  // 格式化錯誤資訊用於顯示
  formatErrorForDisplay: (error: Error) => {
    if (errorBoundaryUtils.isDevelopment()) {
      return `${error.name}: ${error.message}`;
    }
    return '發生了一個錯誤，請稍後再試。';
  },
  
  // 檢查錯誤是否可重試
  isRetryableError: (error: Error) => {
    const errorType = classifyError(error);
    return errorMessages[errorType].retryable;
  },
};

export default ErrorBoundary;