/**
 * Header 元件 - 應用程式標題和主要操作按鈕區域
 */

'use client';

import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export interface HeaderProps {
  title?: string;
  subtitle?: string;
  actions?: ReactNode;
  className?: string;
  variant?: 'default' | 'compact' | 'minimal';
  showDivider?: boolean;
}

const variantClasses = {
  default: 'h-16 px-6 py-4',
  compact: 'h-12 px-4 py-2',
  minimal: 'h-10 px-4 py-2',
};

export function Header({
  title = 'Markdown 投影片產生器',
  subtitle,
  actions,
  className,
  variant = 'default',
  showDivider = true,
}: HeaderProps) {
  return (
    <header
      className={cn(
        // 基礎樣式
        'flex items-center justify-between bg-white border-b border-gray-200',
        'sticky top-0 z-50 backdrop-blur-sm bg-white/95',
        // 變體樣式
        variantClasses[variant],
        // 分隔線
        !showDivider && 'border-b-0',
        // 自訂樣式
        className
      )}
    >
      {/* 標題區域 */}
      <div className="flex flex-col justify-center min-w-0">
        <h1
          className={cn(
            'font-semibold text-gray-900 truncate',
            variant === 'minimal' ? 'text-sm' : 'text-lg'
          )}
        >
          {title}
        </h1>
        {subtitle && (
          <p
            className={cn(
              'text-gray-600 truncate',
              variant === 'minimal' ? 'text-xs' : 'text-sm'
            )}
          >
            {subtitle}
          </p>
        )}
      </div>

      {/* 操作按鈕區域 */}
      {actions && (
        <div className="flex items-center gap-2 flex-shrink-0">
          {actions}
        </div>
      )}
    </header>
  );
}

/**
 * 主要操作按鈕元件
 */
export interface ActionButtonProps {
  children: ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  icon?: ReactNode;
  className?: string;
}

const buttonVariants = {
  primary: 'bg-blue-600 text-white hover:bg-blue-700',
  secondary: 'bg-gray-100 text-gray-900 hover:bg-gray-200',
  ghost: 'text-gray-600 hover:text-gray-900 hover:bg-gray-100',
};

const buttonSizes = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-sm',
  lg: 'px-6 py-2.5 text-base',
};

export function ActionButton({
  children,
  onClick,
  variant = 'secondary',
  size = 'md',
  disabled = false,
  loading = false,
  icon,
  className,
}: ActionButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className={cn(
        // 基礎樣式
        'inline-flex items-center justify-center rounded-md font-medium',
        'transition-colors focus-visible:outline-none focus-visible:ring-2',
        'focus-visible:ring-blue-500 focus-visible:ring-offset-2',
        'disabled:pointer-events-none disabled:opacity-50',
        // 變體樣式
        buttonVariants[variant],
        // 大小樣式
        buttonSizes[size],
        // 自訂樣式
        className
      )}
    >
      {loading && (
        <svg
          className="animate-spin -ml-1 mr-2 h-4 w-4"
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
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      )}
      {icon && !loading && <span className="mr-2">{icon}</span>}
      {children}
    </button>
  );
}

/**
 * 預定義的 Header 變體
 */
export function AppHeader({
  actions,
  className,
}: {
  actions?: ReactNode;
  className?: string;
}) {
  const headerProps = {
    title: "Markdown 投影片產生器",
    subtitle: "使用 AI 快速生成專業投影片",
    actions,
    ...(className && { className }),
  };
  
  return <Header {...headerProps} />;
}

export function CompactHeader({
  title,
  actions,
  className,
}: {
  title?: string;
  actions?: ReactNode;
  className?: string;
}) {
  const headerProps = {
    ...(title && { title }),
    variant: "compact" as const,
    actions,
    ...(className && { className }),
  };
  
  return <Header {...headerProps} />;
}

export function MinimalHeader({
  title,
  actions,
  className,
}: {
  title?: string;
  actions?: ReactNode;
  className?: string;
}) {
  const headerProps = {
    ...(title && { title }),
    variant: "minimal" as const,
    showDivider: false,
    actions,
    ...(className && { className }),
  };
  
  return <Header {...headerProps} />;
}