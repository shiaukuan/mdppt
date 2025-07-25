'use client';

import { useEffect } from 'react';
import { useSettings, useTheme } from '@/contexts/SettingsContext';
import { useEditorStore } from '@/stores/editorStore';
import { ToastProvider } from '@/contexts/ToastContext';
import ErrorBoundary from '@/components/ErrorBoundary';

interface RootLayoutClientProps {
  children: React.ReactNode;
}

export function RootLayoutClient({ children }: RootLayoutClientProps) {
  const { isLoading } = useSettings();
  const { theme } = useTheme();
  const loadFromStorage = useEditorStore((state) => state.loadFromStorage);

  // 載入編輯器狀態
  useEffect(() => {
    loadFromStorage();
  }, [loadFromStorage]);

  // 應用主題
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const root = window.document.documentElement;
    
    // 移除所有主題類別
    root.classList.remove('light', 'dark');

    if (theme === 'system') {
      // 使用系統主題
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      root.classList.add(systemTheme);
    } else {
      // 使用指定主題
      root.classList.add(theme);
    }
  }, [theme]);

  // 監聽系統主題變化
  useEffect(() => {
    if (typeof window === 'undefined' || theme !== 'system') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = (e: MediaQueryListEvent) => {
      const root = window.document.documentElement;
      root.classList.remove('light', 'dark');
      root.classList.add(e.matches ? 'dark' : 'light');
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme]);

  // 顯示載入狀態
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">載入中...</p>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary
      onError={(error, errorInfo, errorId) => {
        console.error('Global error caught:', { error, errorInfo, errorId });
        // 可以在這裡發送錯誤報告到監控服務
      }}
      showDetails={process.env.NODE_ENV === 'development'}
      maxRetries={3}
    >
      <ToastProvider position="top-right" maxToasts={5}>
        <div className="min-h-screen bg-background text-foreground">
          <header className="border-b border-border bg-card">
            <div className="container mx-auto px-4 py-4">
              <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-primary">
                  Markdown Slide Generator
                </h1>
                <div className="flex items-center space-x-4">
                  <ThemeToggle />
                  <SettingsButton />
                </div>
              </div>
            </div>
          </header>
          
          <main className="flex-1">
            {children}
          </main>
          
          <footer className="border-t border-border bg-card mt-auto">
            <div className="container mx-auto px-4 py-4 text-center text-muted-foreground">
              <p>© 2025 Markdown Slide Generator - Powered by OpenAI</p>
            </div>
          </footer>
        </div>
      </ToastProvider>
    </ErrorBoundary>
  );
}

// 主題切換按鈕
function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  
  const toggleTheme = () => {
    const themes: Array<'light' | 'dark' | 'system'> = ['light', 'dark', 'system'];
    const currentIndex = themes.indexOf(theme);
    const nextIndex = (currentIndex + 1) % themes.length;
    const nextTheme = themes[nextIndex];
    if (nextTheme) {
      setTheme(nextTheme);
    }
  };

  const getThemeIcon = () => {
    switch (theme) {
      case 'light':
        return '☀️';
      case 'dark':
        return '🌙';
      case 'system':
        return '🖥️';
      default:
        return '🖥️';
    }
  };

  const getThemeLabel = () => {
    switch (theme) {
      case 'light':
        return '明亮模式';
      case 'dark':
        return '深色模式';
      case 'system':
        return '系統主題';
      default:
        return '系統主題';
    }
  };

  return (
    <button
      onClick={toggleTheme}
      className="flex items-center space-x-2 px-3 py-2 rounded-md bg-secondary hover:bg-secondary/80 transition-colors"
      title={`目前：${getThemeLabel()}，點擊切換`}
    >
      <span className="text-lg">{getThemeIcon()}</span>
      <span className="text-sm hidden sm:inline">{getThemeLabel()}</span>
    </button>
  );
}

// 設定按鈕
function SettingsButton() {
  const { isApiKeyValid } = useSettings();
  
  return (
    <button
      className="flex items-center space-x-2 px-3 py-2 rounded-md bg-secondary hover:bg-secondary/80 transition-colors"
      title="開啟設定"
    >
      <span className="text-lg">⚙️</span>
      <span className="text-sm hidden sm:inline">設定</span>
      {!isApiKeyValid() && (
        <span className="inline-flex h-2 w-2 rounded-full bg-red-500 animate-pulse" title="需要設定 API Key" />
      )}
    </button>
  );
}