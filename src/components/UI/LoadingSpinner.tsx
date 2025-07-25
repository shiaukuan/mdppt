'use client';

import React from 'react';
import { clsx } from 'clsx';

export interface LoadingSpinnerProps {
  /** 大小 */
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  /** 載入文字 */
  text?: string;
  /** 文字位置 */
  textPosition?: 'bottom' | 'right';
  /** 自定義樣式類名 */
  className?: string;
  /** 顏色變體 */
  variant?: 'primary' | 'secondary' | 'white' | 'gray';
  /** 是否顯示背景 */
  showBackground?: boolean;
  /** 進度百分比（0-100） */
  progress?: number | undefined;
  /** 是否顯示進度條 */
  showProgress?: boolean | undefined;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  text,
  textPosition = 'bottom',
  className,
  variant = 'primary',
  showBackground = false,
  progress,
  showProgress = false,
}) => {
  // 尺寸映射
  const sizeClasses = {
    xs: 'w-3 h-3',
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12',
  };

  // 顏色映射
  const variantClasses = {
    primary: 'text-blue-600',
    secondary: 'text-gray-600',
    white: 'text-white',
    gray: 'text-gray-400',
  };

  // 文字大小映射
  const textSizeClasses = {
    xs: 'text-xs',
    sm: 'text-sm',
    md: 'text-sm',
    lg: 'text-base',
    xl: 'text-lg',
  };

  const spinnerElement = (
    <div className="relative">
      {/* 主要旋轉器 */}
      <svg
        className={clsx(
          'animate-spin',
          sizeClasses[size],
          variantClasses[variant]
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

      {/* 進度環（如果啟用） */}
      {showProgress && typeof progress === 'number' && (
        <svg
          className={clsx(
            'absolute inset-0',
            sizeClasses[size],
            variantClasses[variant]
          )}
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
        >
          <circle
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="2"
            fill="transparent"
            className="opacity-20"
          />
          <circle
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="2"
            fill="transparent"
            strokeDasharray={`${2 * Math.PI * 10}`}
            strokeDashoffset={`${2 * Math.PI * 10 * (1 - progress / 100)}`}
            strokeLinecap="round"
            className="transition-all duration-300 ease-out"
            transform="rotate(-90 12 12)"
          />
        </svg>
      )}
    </div>
  );

  const textElement = text && (
    <span
      className={clsx(
        textSizeClasses[size],
        variantClasses[variant],
        'font-medium animate-pulse'
      )}
    >
      {text}
      {showProgress && typeof progress === 'number' && ` (${progress}%)`}
    </span>
  );

  const content = (
    <div
      className={clsx(
        'flex items-center',
        {
          'flex-col space-y-2': textPosition === 'bottom',
          'flex-row space-x-3': textPosition === 'right',
        }
      )}
    >
      {spinnerElement}
      {textElement}
    </div>
  );

  if (showBackground) {
    return (
      <div
        className={clsx(
          'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50',
          className
        )}
      >
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-xl">
          {content}
        </div>
      </div>
    );
  }

  return (
    <div className={clsx('flex items-center justify-center', className)}>
      {content}
    </div>
  );
};

export default LoadingSpinner;

// 特化的載入組件變體

export const InlineSpinner: React.FC<{
  size?: LoadingSpinnerProps['size'];
  variant?: LoadingSpinnerProps['variant'];
  className?: string;
}> = ({ size = 'sm', variant = 'primary', className }) => (
  <LoadingSpinner
    size={size}
    variant={variant}
    className={clsx('inline-flex', className)}
  />
);

export const ButtonSpinner: React.FC<{
  size?: LoadingSpinnerProps['size'];
  className?: string;
}> = ({ size = 'sm', className }) => (
  <LoadingSpinner
    size={size}
    variant="white"
    className={clsx('mr-2', className)}
  />
);

export const PageSpinner: React.FC<{
  text?: string;
  progress?: number;
  showProgress?: boolean;
}> = ({ text = '載入中...', progress, showProgress }) => (
  <LoadingSpinner
    size="lg"
    text={text}
    variant="primary"
    progress={progress}
    showProgress={showProgress}
    className="min-h-[200px]"
  />
);

export const OverlaySpinner: React.FC<{
  text?: string;
  progress?: number;
  showProgress?: boolean;
}> = ({ text = '處理中...', progress, showProgress }) => (
  <LoadingSpinner
    size="xl"
    text={text}
    variant="white"
    showBackground={true}
    progress={progress}
    showProgress={showProgress}
  />
);

// 骨架載入組件
export const SkeletonLoader: React.FC<{
  lines?: number;
  className?: string;
}> = ({ lines = 3, className }) => (
  <div className={clsx('animate-pulse space-y-3', className)}>
    {Array.from({ length: lines }).map((_, index) => (
      <div
        key={index}
        className={clsx(
          'h-4 bg-gray-200 dark:bg-gray-700 rounded',
          {
            'w-full': index < lines - 1,
            'w-3/4': index === lines - 1,
          }
        )}
      />
    ))}
  </div>
);

// 脈衝載入點
export const PulsingDots: React.FC<{
  size?: 'sm' | 'md' | 'lg';
  variant?: LoadingSpinnerProps['variant'];
  className?: string;
}> = ({ size = 'md', variant = 'primary', className }) => {
  const dotSizeClasses = {
    sm: 'w-1 h-1',
    md: 'w-2 h-2',
    lg: 'w-3 h-3',
  };

  const colorClasses = {
    primary: 'bg-blue-600',
    secondary: 'bg-gray-600',
    white: 'bg-white',
    gray: 'bg-gray-400',
  };

  return (
    <div className={clsx('flex space-x-1', className)}>
      {[0, 1, 2].map((index) => (
        <div
          key={index}
          className={clsx(
            'rounded-full animate-pulse',
            dotSizeClasses[size],
            colorClasses[variant]
          )}
          style={{
            animationDelay: `${index * 0.15}s`,
            animationDuration: '1s',
          }}
        />
      ))}
    </div>
  );
};