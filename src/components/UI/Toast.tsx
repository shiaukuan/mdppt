/**
 * Toast 通知組件
 * 提供成功/錯誤/資訊變體，自動關閉和堆疊多個 toasts
 */

'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { cn } from '@/lib/utils';

// Toast 類型
export type ToastVariant = 'success' | 'error' | 'warning' | 'info';

// Toast 資料介面
export interface ToastData {
  id: string;
  title?: string;
  message: string;
  variant: ToastVariant;
  duration?: number;
  persistent?: boolean;
  action?: {
    label: string;
    onClick: () => void;
  };
}

// Toast 組件 Props
export interface ToastProps extends ToastData {
  onClose: (id: string) => void;
  onAction?: () => void;
}

// Toast 變體樣式
const toastVariants = {
  success: {
    container: 'bg-green-50 border-green-200 text-green-800',
    icon: '✅',
    iconBg: 'bg-green-100',
    progressBar: 'bg-green-500',
  },
  error: {
    container: 'bg-red-50 border-red-200 text-red-800',
    icon: '❌',
    iconBg: 'bg-red-100',
    progressBar: 'bg-red-500',
  },
  warning: {
    container: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    icon: '⚠️',
    iconBg: 'bg-yellow-100',
    progressBar: 'bg-yellow-500',
  },
  info: {
    container: 'bg-blue-50 border-blue-200 text-blue-800',
    icon: 'ℹ️',
    iconBg: 'bg-blue-100',
    progressBar: 'bg-blue-500',
  },
};

/**
 * 個別 Toast 組件
 */
export function Toast({
  id,
  title,
  message,
  variant,
  duration = 5000,
  persistent = false,
  action,
  onClose,
}: ToastProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const [progress, setProgress] = useState(100);
  
  const styles = toastVariants[variant];

  // 動畫進入
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 50);
    return () => clearTimeout(timer);
  }, []);

  // 自動關閉邏輯
  useEffect(() => {
    if (persistent) return;

    let progressTimer: NodeJS.Timeout;
    let closeTimer: NodeJS.Timeout;

    const startProgress = () => {
      const startTime = Date.now();
      const updateProgress = () => {
        const elapsed = Date.now() - startTime;
        const remaining = Math.max(0, duration - elapsed);
        const percentage = (remaining / duration) * 100;
        
        setProgress(percentage);
        
        if (remaining > 0) {
          progressTimer = setTimeout(updateProgress, 50);
        }
      };
      
      updateProgress();
    };

    const scheduleClose = () => {
      closeTimer = setTimeout(() => {
        handleClose();
      }, duration);
    };

    startProgress();
    scheduleClose();

    return () => {
      clearTimeout(progressTimer);
      clearTimeout(closeTimer);
    };
  }, [duration, persistent]);

  // 關閉處理
  const handleClose = useCallback(() => {
    setIsLeaving(true);
    setTimeout(() => {
      onClose(id);
    }, 300); // 等待退出動畫完成
  }, [id, onClose]);

  // 動作處理
  const handleAction = useCallback(() => {
    if (action) {
      action.onClick();
      handleClose();
    }
  }, [action, handleClose]);

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-lg border shadow-lg transition-all duration-300 ease-out transform',
        'max-w-sm w-full pointer-events-auto',
        styles.container,
        isVisible && !isLeaving
          ? 'translate-x-0 opacity-100 scale-100'
          : 'translate-x-full opacity-0 scale-95'
      )}
      role="alert"
      aria-live="polite"
    >
      {/* 主要內容 */}
      <div className="p-4">
        <div className="flex items-start gap-3">
          {/* 圖示 */}
          <div className={cn('flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm', styles.iconBg)}>
            {styles.icon}
          </div>

          {/* 文字內容 */}
          <div className="flex-1 min-w-0">
            {title && (
              <div className="text-sm font-semibold mb-1">
                {title}
              </div>
            )}
            <div className="text-sm leading-relaxed">
              {message}
            </div>
            
            {/* 動作按鈕 */}
            {action && (
              <div className="mt-2">
                <button
                  onClick={handleAction}
                  className="text-sm font-medium underline hover:no-underline transition-all"
                >
                  {action.label}
                </button>
              </div>
            )}
          </div>

          {/* 關閉按鈕 */}
          <button
            onClick={handleClose}
            className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="關閉通知"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* 進度條 */}
      {!persistent && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/10">
          <div
            className={cn('h-full transition-all duration-75 ease-linear', styles.progressBar)}
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </div>
  );
}

/**
 * Toast 容器組件 - 管理多個 Toast 的堆疊顯示
 */
export interface ToastContainerProps {
  toasts: ToastData[];
  onClose: (id: string) => void;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center';
  maxToasts?: number;
}

const positionClasses = {
  'top-right': 'top-4 right-4',
  'top-left': 'top-4 left-4',
  'bottom-right': 'bottom-4 right-4',
  'bottom-left': 'bottom-4 left-4',
  'top-center': 'top-4 left-1/2 transform -translate-x-1/2',
  'bottom-center': 'bottom-4 left-1/2 transform -translate-x-1/2',
};

export function ToastContainer({
  toasts,
  onClose,
  position = 'top-right',
  maxToasts = 5,
}: ToastContainerProps) {
  // 限制顯示的 Toast 數量
  const visibleToasts = toasts.slice(0, maxToasts);
  
  if (visibleToasts.length === 0) {
    return null;
  }

  return (
    <div
      className={cn(
        'fixed z-50 flex flex-col gap-2 pointer-events-none',
        positionClasses[position]
      )}
      aria-live="polite"
      aria-label="通知區域"
    >
      {visibleToasts.map((toast) => (
        <Toast
          key={toast.id}
          {...toast}
          onClose={onClose}
        />
      ))}
    </div>
  );
}

/**
 * Toast 工具函數
 */
export const toastUtils = {
  // 生成唯一 ID
  generateId: () => Date.now().toString(36) + Math.random().toString(36).substr(2),

  // 創建 Toast 資料
  create: (
    message: string,
    variant: ToastVariant = 'info',
    options: Partial<Omit<ToastData, 'id' | 'message' | 'variant'>> = {}
  ): ToastData => ({
    id: toastUtils.generateId(),
    message,
    variant,
    duration: 5000,
    persistent: false,
    ...options,
  }),

  // 快捷方法
  success: (message: string, options?: Partial<ToastData>) =>
    toastUtils.create(message, 'success', options),

  error: (message: string, options?: Partial<ToastData>) =>
    toastUtils.create(message, 'error', { duration: 7000, ...options }),

  warning: (message: string, options?: Partial<ToastData>) =>
    toastUtils.create(message, 'warning', { duration: 6000, ...options }),

  info: (message: string, options?: Partial<ToastData>) =>
    toastUtils.create(message, 'info', options),

  // 持久化 Toast（需要手動關閉）
  persistent: (message: string, variant: ToastVariant = 'info', options?: Partial<ToastData>) =>
    toastUtils.create(message, variant, { persistent: true, ...options }),
};

/**
 * 簡化版 Toast 組件（用於快速使用）
 */
export interface SimpleToastProps {
  message: string;
  variant?: ToastVariant;
  visible: boolean;
  onClose: () => void;
  duration?: number;
}

export function SimpleToast({
  message,
  variant = 'info',
  visible,
  onClose,
  duration = 5000,
}: SimpleToastProps) {
  if (!visible) return null;

  const toast = toastUtils.create(message, variant, { duration });

  return (
    <div className="fixed top-4 right-4 z-50">
      <Toast
        {...toast}
        onClose={onClose}
      />
    </div>
  );
}

export default Toast;