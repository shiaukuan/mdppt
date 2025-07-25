'use client';

import React from 'react';
import { clsx } from 'clsx';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  /** 標籤 */
  label?: string;
  /** 說明文字 */
  description?: string;
  /** 錯誤訊息 */
  error?: string | undefined;
  /** 成功狀態 */
  success?: boolean;
  /** 輸入框大小 */
  inputSize?: 'sm' | 'md' | 'lg';
  /** 左側圖示 */
  leftIcon?: React.ReactNode;
  /** 右側圖示 */
  rightIcon?: React.ReactNode;
  /** 右側動作按鈕 */
  rightAction?: React.ReactNode;
  /** 全寬度 */
  fullWidth?: boolean;
  /** 是否必填 */
  required?: boolean;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({
    className,
    label,
    description,
    error,
    success,
    inputSize = 'md',
    leftIcon,
    rightIcon,
    rightAction,
    fullWidth = false,
    required = false,
    id,
    disabled,
    ...props
  }, ref) => {
    const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;
    const hasError = !!error;
    const hasSuccess = success && !hasError;

    return (
      <div className={clsx('space-y-1', fullWidth && 'w-full')}>
        {/* 標籤 */}
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}

        {/* 輸入框容器 */}
        <div className="relative">
          {/* 左側圖示 */}
          {leftIcon && (
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <span className={clsx(
                'text-gray-400',
                {
                  'w-3 h-3': inputSize === 'sm',
                  'w-4 h-4': inputSize === 'md',
                  'w-5 h-5': inputSize === 'lg',
                }
              )}>
                {leftIcon}
              </span>
            </div>
          )}

          {/* 輸入框 */}
          <input
            ref={ref}
            id={inputId}
            className={clsx(
              // 基礎樣式
              'block w-full border rounded-md shadow-sm transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-0 disabled:opacity-50 disabled:cursor-not-allowed',
              
              // 大小樣式
              {
                'h-8 px-2 text-sm': inputSize === 'sm',
                'h-10 px-3 text-sm': inputSize === 'md',
                'h-12 px-4 text-base': inputSize === 'lg',
              },
              
              // 左側圖示padding
              {
                'pl-8': leftIcon && inputSize === 'sm',
                'pl-10': leftIcon && inputSize === 'md',
                'pl-12': leftIcon && inputSize === 'lg',
              },
              
              // 右側圖示/動作padding
              {
                'pr-8': (rightIcon || rightAction) && inputSize === 'sm',
                'pr-10': (rightIcon || rightAction) && inputSize === 'md',
                'pr-12': (rightIcon || rightAction) && inputSize === 'lg',
              },
              
              // 狀態樣式
              {
                // 正常狀態
                'border-gray-300 bg-white text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-500 dark:focus:border-blue-400 dark:focus:ring-blue-400': 
                  !hasError && !hasSuccess,
                
                // 錯誤狀態
                'border-red-300 bg-red-50 text-red-900 placeholder-red-400 focus:border-red-500 focus:ring-red-500 dark:border-red-600 dark:bg-red-900/20 dark:text-red-100 dark:placeholder-red-500': 
                  hasError,
                
                // 成功狀態
                'border-green-300 bg-green-50 text-green-900 placeholder-green-400 focus:border-green-500 focus:ring-green-500 dark:border-green-600 dark:bg-green-900/20 dark:text-green-100 dark:placeholder-green-500': 
                  hasSuccess,
              },
              
              className
            )}
            disabled={disabled}
            {...props}
          />

          {/* 右側圖示 */}
          {rightIcon && !rightAction && (
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
              <span className={clsx(
                {
                  'text-gray-400': !hasError && !hasSuccess,
                  'text-red-400': hasError,
                  'text-green-400': hasSuccess,
                },
                {
                  'w-3 h-3': inputSize === 'sm',
                  'w-4 h-4': inputSize === 'md',
                  'w-5 h-5': inputSize === 'lg',
                }
              )}>
                {rightIcon}
              </span>
            </div>
          )}

          {/* 右側動作 */}
          {rightAction && (
            <div className="absolute inset-y-0 right-0 flex items-center pr-2">
              {rightAction}
            </div>
          )}
        </div>

        {/* 說明文字 */}
        {description && !error && (
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {description}
          </p>
        )}

        {/* 錯誤訊息 */}
        {error && (
          <p className="text-xs text-red-600 dark:text-red-400 flex items-center">
            <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            {error}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export { Input };

// 預設匯出
export default Input;