'use client';

import React from 'react';
import { clsx } from 'clsx';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** 按鈕變體 */
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive';
  /** 按鈕大小 */
  size?: 'sm' | 'md' | 'lg';
  /** 載入狀態 */
  loading?: boolean;
  /** 載入文字 */
  loadingText?: string;
  /** 圖示（放在文字前面） */
  icon?: React.ReactNode;
  /** 圖示位置 */
  iconPosition?: 'left' | 'right';
  /** 全寬度 */
  fullWidth?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({
    className,
    variant = 'primary',
    size = 'md',
    loading = false,
    loadingText,
    icon,
    iconPosition = 'left',
    fullWidth = false,
    disabled,
    children,
    ...props
  }, ref) => {
    const isDisabled = disabled || loading;

    return (
      <button
        className={clsx(
          // 基礎樣式
          'inline-flex items-center justify-center font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
          
          // 變體樣式
          {
            // Primary
            'bg-blue-600 text-white hover:bg-blue-700 focus-visible:ring-blue-500': 
              variant === 'primary',
            
            // Secondary
            'bg-gray-100 text-gray-900 hover:bg-gray-200 focus-visible:ring-gray-500 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700': 
              variant === 'secondary',
            
            // Outline
            'border border-gray-300 bg-transparent text-gray-700 hover:bg-gray-50 focus-visible:ring-gray-500 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800': 
              variant === 'outline',
            
            // Ghost
            'bg-transparent text-gray-700 hover:bg-gray-100 focus-visible:ring-gray-500 dark:text-gray-300 dark:hover:bg-gray-800': 
              variant === 'ghost',
            
            // Destructive
            'bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-500': 
              variant === 'destructive',
          },
          
          // 大小樣式
          {
            'h-8 px-3 text-sm rounded-md': size === 'sm',
            'h-10 px-4 text-sm rounded-md': size === 'md',
            'h-12 px-6 text-base rounded-lg': size === 'lg',
          },
          
          // 全寬度
          {
            'w-full': fullWidth,
          },
          
          className
        )}
        disabled={isDisabled}
        ref={ref}
        {...props}
      >
        {loading && (
          <svg
            className={clsx(
              'animate-spin',
              {
                'w-3 h-3': size === 'sm',
                'w-4 h-4': size === 'md',
                'w-5 h-5': size === 'lg',
              },
              children || loadingText ? 'mr-2' : ''
            )}
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
        )}
        
        {!loading && icon && iconPosition === 'left' && (
          <span className={clsx(
            {
              'w-3 h-3': size === 'sm',
              'w-4 h-4': size === 'md',
              'w-5 h-5': size === 'lg',
            },
            children ? 'mr-2' : ''
          )}>
            {icon}
          </span>
        )}
        
        {loading ? (loadingText || children) : children}
        
        {!loading && icon && iconPosition === 'right' && (
          <span className={clsx(
            {
              'w-3 h-3': size === 'sm',
              'w-4 h-4': size === 'md',
              'w-5 h-5': size === 'lg',
            },
            children ? 'ml-2' : ''
          )}>
            {icon}
          </span>
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';

export { Button };

// 預設匯出
export default Button;