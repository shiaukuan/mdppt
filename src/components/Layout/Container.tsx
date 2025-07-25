/**
 * Container 元件 - 提供標準的內容容器
 */

import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export interface ContainerProps {
  children: ReactNode;
  className?: string;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  as?: 'div' | 'main' | 'section' | 'article' | 'header' | 'footer';
}

const maxWidthClasses = {
  sm: 'max-w-screen-sm',
  md: 'max-w-screen-md', 
  lg: 'max-w-screen-lg',
  xl: 'max-w-screen-xl',
  '2xl': 'max-w-screen-2xl',
  full: 'max-w-full',
};

const paddingClasses = {
  none: '',
  sm: 'px-4 py-2',
  md: 'px-6 py-4',
  lg: 'px-8 py-6',
  xl: 'px-12 py-8',
};

export function Container({
  children,
  className,
  maxWidth = 'xl',
  padding = 'md',
  as: Component = 'div',
}: ContainerProps) {
  return (
    <Component
      className={cn(
        // 基礎樣式
        'mx-auto w-full',
        // 最大寬度
        maxWidthClasses[maxWidth],
        // 內距
        paddingClasses[padding],
        // 自訂樣式
        className
      )}
    >
      {children}
    </Component>
  );
}

// 預定義的容器變體
export function PageContainer({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <Container
      as="main"
      maxWidth="full"
      padding="none"
      className={cn('min-h-screen', className)}
    >
      {children}
    </Container>
  );
}

export function ContentContainer({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <Container
      maxWidth="xl"
      padding="lg"
      className={cn('space-y-6', className)}
    >
      {children}
    </Container>
  );
}

export function SectionContainer({ children, className }: { children: ReactNode; className?: string }) {
  const containerProps = {
    as: "section" as const,
    maxWidth: "lg" as const,
    padding: "md" as const,
    ...(className && { className }),
  };
  
  return (
    <Container {...containerProps}>
      {children}
    </Container>
  );
}