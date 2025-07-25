/**
 * Toast 管理 Context
 * 提供 Toast 顯示/隱藏、佇列管理功能
 */

'use client';

import React, { createContext, useContext, useReducer, useCallback, ReactNode } from 'react';
import { ToastData, ToastContainer, toastUtils, ToastVariant } from '@/components/UI/Toast';

// Toast 狀態介面
interface ToastState {
  toasts: ToastData[];
}

// Toast 動作類型
type ToastAction =
  | { type: 'ADD_TOAST'; payload: ToastData }
  | { type: 'REMOVE_TOAST'; payload: string }
  | { type: 'CLEAR_ALL_TOASTS' }
  | { type: 'UPDATE_TOAST'; payload: { id: string; updates: Partial<ToastData> } };

// Toast Context 介面
interface ToastContextType {
  toasts: ToastData[];
  // 基本操作
  addToast: (toast: ToastData) => void;
  removeToast: (id: string) => void;
  clearAll: () => void;
  updateToast: (id: string, updates: Partial<ToastData>) => void;
  
  // 快捷方法
  showSuccess: (message: string, options?: Partial<ToastData>) => string;
  showError: (message: string, options?: Partial<ToastData>) => string;
  showWarning: (message: string, options?: Partial<ToastData>) => string;
  showInfo: (message: string, options?: Partial<ToastData>) => string;
  
  // 特殊用途
  showPersistent: (message: string, variant?: ToastVariant, options?: Partial<ToastData>) => string;
  showWithAction: (
    message: string,
    actionLabel: string,
    actionCallback: () => void,
    variant?: ToastVariant,
    options?: Partial<ToastData>
  ) => string;
  
  // 重試相關
  showRetry: (
    message: string,
    retryCallback: () => void,
    variant?: ToastVariant,
    options?: Partial<ToastData>
  ) => string;
}

// Toast Context Provider Props
interface ToastProviderProps {
  children: ReactNode;
  maxToasts?: number;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center';
}

// Toast Reducer
function toastReducer(state: ToastState, action: ToastAction): ToastState {
  switch (action.type) {
    case 'ADD_TOAST':
      return {
        ...state,
        toasts: [action.payload, ...state.toasts],
      };

    case 'REMOVE_TOAST':
      return {
        ...state,
        toasts: state.toasts.filter(toast => toast.id !== action.payload),
      };

    case 'CLEAR_ALL_TOASTS':
      return {
        ...state,
        toasts: [],
      };

    case 'UPDATE_TOAST':
      return {
        ...state,
        toasts: state.toasts.map(toast =>
          toast.id === action.payload.id
            ? { ...toast, ...action.payload.updates }
            : toast
        ),
      };

    default:
      return state;
  }
}

// 創建 Context
const ToastContext = createContext<ToastContextType | undefined>(undefined);

/**
 * Toast Provider 組件
 */
export function ToastProvider({
  children,
  maxToasts = 5,
  position = 'top-right',
}: ToastProviderProps) {
  const [state, dispatch] = useReducer(toastReducer, { toasts: [] });

  // 基本操作
  const addToast = useCallback((toast: ToastData) => {
    dispatch({ type: 'ADD_TOAST', payload: toast });
  }, []);

  const removeToast = useCallback((id: string) => {
    dispatch({ type: 'REMOVE_TOAST', payload: id });
  }, []);

  const clearAll = useCallback(() => {
    dispatch({ type: 'CLEAR_ALL_TOASTS' });
  }, []);

  const updateToast = useCallback((id: string, updates: Partial<ToastData>) => {
    dispatch({ type: 'UPDATE_TOAST', payload: { id, updates } });
  }, []);

  // 快捷方法
  const showSuccess = useCallback((message: string, options?: Partial<ToastData>) => {
    const toast = toastUtils.success(message, options);
    addToast(toast);
    return toast.id;
  }, [addToast]);

  const showError = useCallback((message: string, options?: Partial<ToastData>) => {
    const toast = toastUtils.error(message, options);
    addToast(toast);
    return toast.id;
  }, [addToast]);

  const showWarning = useCallback((message: string, options?: Partial<ToastData>) => {
    const toast = toastUtils.warning(message, options);
    addToast(toast);
    return toast.id;
  }, [addToast]);

  const showInfo = useCallback((message: string, options?: Partial<ToastData>) => {
    const toast = toastUtils.info(message, options);
    addToast(toast);
    return toast.id;
  }, [addToast]);

  // 持久化 Toast
  const showPersistent = useCallback((
    message: string,
    variant: ToastVariant = 'info',
    options?: Partial<ToastData>
  ) => {
    const toast = toastUtils.persistent(message, variant, options);
    addToast(toast);
    return toast.id;
  }, [addToast]);

  // 帶動作的 Toast
  const showWithAction = useCallback((
    message: string,
    actionLabel: string,
    actionCallback: () => void,
    variant: ToastVariant = 'info',
    options?: Partial<ToastData>
  ) => {
    const toast = toastUtils.create(message, variant, {
      action: {
        label: actionLabel,
        onClick: actionCallback,
      },
      ...options,
    });
    addToast(toast);
    return toast.id;
  }, [addToast]);

  // 重試 Toast
  const showRetry = useCallback((
    message: string,
    retryCallback: () => void,
    variant: ToastVariant = 'error',
    options?: Partial<ToastData>
  ) => {
    const toast = toastUtils.create(message, variant, {
      action: {
        label: '重試',
        onClick: retryCallback,
      },
      duration: 8000, // 重試 Toast 顯示更久
      ...options,
    });
    addToast(toast);
    return toast.id;
  }, [addToast]);

  // Context 值
  const contextValue: ToastContextType = {
    toasts: state.toasts,
    addToast,
    removeToast,
    clearAll,
    updateToast,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    showPersistent,
    showWithAction,
    showRetry,
  };

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      <ToastContainer
        toasts={state.toasts}
        onClose={removeToast}
        position={position}
        maxToasts={maxToasts}
      />
    </ToastContext.Provider>
  );
}

/**
 * useToast Hook
 */
export function useToast() {
  const context = useContext(ToastContext);
  
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  
  return context;
}

/**
 * 高階組件：為組件提供 Toast 功能
 */
export function withToast<P extends object>(Component: React.ComponentType<P>) {
  return function WithToastComponent(props: P) {
    const toast = useToast();
    
    return <Component {...props} toast={toast} />;
  };
}

/**
 * Toast Hook 的擴展功能
 */
export function useToastActions() {
  const toast = useToast();

  // API 錯誤處理
  const handleApiError = useCallback((error: unknown, fallbackMessage = '操作失敗') => {
    let message = fallbackMessage;
    
    if (error instanceof Error) {
      message = error.message;
    } else if (typeof error === 'string') {
      message = error;
    } else if (error && typeof error === 'object' && 'message' in error) {
      message = (error as any).message || fallbackMessage;
    }

    return toast.showError(message, {
      title: '錯誤',
      duration: 6000,
    });
  }, [toast]);

  // 網路錯誤處理（帶重試）
  const handleNetworkError = useCallback((
    retryCallback: () => void,
    customMessage?: string
  ) => {
    const message = customMessage || '網路連線發生問題';
    
    return toast.showRetry(message, retryCallback, 'error', {
      title: '連線錯誤',
      duration: 10000,
    });
  }, [toast]);

  // 成功操作反饋
  const showSuccess = useCallback((
    message: string,
    options?: { title?: string; duration?: number }
  ) => {
    return toast.showSuccess(message, {
      duration: 3000,
      ...options,
    });
  }, [toast]);

  // 載入中提示（持久化）
  const showLoading = useCallback((message = '處理中...') => {
    return toast.showPersistent(message, 'info', {
      title: '請稍候',
    });
  }, [toast]);

  // 更新載入提示
  const updateLoading = useCallback((id: string, message: string) => {
    toast.updateToast(id, { message });
  }, [toast]);

  // 完成載入（移除載入 Toast 並顯示結果）
  const completeLoading = useCallback((
    loadingId: string,
    successMessage?: string,
    errorMessage?: string
  ) => {
    toast.removeToast(loadingId);
    
    if (successMessage) {
      showSuccess(successMessage);
    } else if (errorMessage) {
      toast.showError(errorMessage);
    }
  }, [toast, showSuccess]);

  // 確認對話框式 Toast
  const showConfirm = useCallback((
    message: string,
    onConfirm: () => void,
    onCancel?: () => void
  ) => {
    const confirmId = toast.showWithAction(
      message,
      '確認',
      () => {
        onConfirm();
        toast.removeToast(confirmId);
      },
      'warning',
      {
        title: '確認操作',
        persistent: true,
      }
    );

    // 如果提供了取消回調，添加取消按鈕的邏輯可以通過自定義 Toast 實現
    return confirmId;
  }, [toast]);

  return {
    ...toast,
    handleApiError,
    handleNetworkError,
    showSuccess,
    showLoading,
    updateLoading,
    completeLoading,
    showConfirm,
  };
}

/**
 * Toast 狀態管理工具
 */
export const toastManager = {
  // 儲存全域 Toast 實例的引用（用於非 React 環境）
  instance: null as ToastContextType | null,

  // 設定全域實例
  setInstance(instance: ToastContextType) {
    this.instance = instance;
  },

  // 全域快捷方法（需要先設定實例）
  success: (message: string, options?: Partial<ToastData>) => {
    if (toastManager.instance) {
      return toastManager.instance.showSuccess(message, options);
    }
    console.warn('Toast manager instance not set');
    return '';
  },

  error: (message: string, options?: Partial<ToastData>) => {
    if (toastManager.instance) {
      return toastManager.instance.showError(message, options);
    }
    console.warn('Toast manager instance not set');
    return '';
  },

  warning: (message: string, options?: Partial<ToastData>) => {
    if (toastManager.instance) {
      return toastManager.instance.showWarning(message, options);
    }
    console.warn('Toast manager instance not set');
    return '';
  },

  info: (message: string, options?: Partial<ToastData>) => {
    if (toastManager.instance) {
      return toastManager.instance.showInfo(message, options);
    }
    console.warn('Toast manager instance not set');
    return '';
  },
};

export default ToastProvider;