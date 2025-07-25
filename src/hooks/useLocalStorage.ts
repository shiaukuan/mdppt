import { useState, useEffect, useCallback } from 'react';

/**
 * 類型安全的 localStorage hook
 * 支援 JSON 序列化和錯誤處理
 */
export function useLocalStorage<T>(
  key: string,
  initialValue: T,
  options: {
    serializer?: {
      stringify: (value: T) => string;
      parse: (value: string) => T;
    };
    onError?: (error: Error) => void;
  } = {}
): [T, (value: T | ((prevValue: T) => T)) => void, () => void] {
  const {
    serializer = {
      stringify: JSON.stringify,
      parse: JSON.parse,
    },
    onError = console.error,
  } = options;

  // 從 localStorage 讀取初始值
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === 'undefined') {
      return initialValue;
    }

    try {
      const item = window.localStorage.getItem(key);
      return item ? serializer.parse(item) : initialValue;
    } catch (error) {
      onError(error instanceof Error ? error : new Error('Failed to parse localStorage value'));
      return initialValue;
    }
  });

  // 更新 localStorage 和狀態
  const setValue = useCallback(
    (value: T | ((prevValue: T) => T)) => {
      try {
        // 允許使用函數來更新狀態
        const valueToStore = value instanceof Function ? value(storedValue) : value;
        
        setStoredValue(valueToStore);
        
        if (typeof window !== 'undefined') {
          window.localStorage.setItem(key, serializer.stringify(valueToStore));
        }
      } catch (error) {
        onError(error instanceof Error ? error : new Error('Failed to save to localStorage'));
      }
    },
    [key, storedValue, serializer, onError]
  );

  // 移除項目
  const removeValue = useCallback(() => {
    try {
      setStoredValue(initialValue);
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem(key);
      }
    } catch (error) {
      onError(error instanceof Error ? error : new Error('Failed to remove from localStorage'));
    }
  }, [key, initialValue, onError]);

  // 監聽 localStorage 變化（跨分頁同步）
  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === key && e.newValue !== null) {
        try {
          setStoredValue(serializer.parse(e.newValue));
        } catch (error) {
          onError(error instanceof Error ? error : new Error('Failed to sync localStorage change'));
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [key, serializer, onError]);

  return [storedValue, setValue, removeValue];
}

/**
 * 特化的 API Key localStorage hook
 */
export function useApiKeyStorage() {
  return useLocalStorage('openai-api-key', '', {
    onError: (error) => {
      console.error('API Key storage error:', error);
    },
  });
}

/**
 * 特化的主題設定 localStorage hook
 */
export function useThemeStorage() {
  return useLocalStorage<'light' | 'dark' | 'system'>('theme-preference', 'system', {
    onError: (error) => {
      console.error('Theme storage error:', error);
    },
  });
}

/**
 * 特化的編輯器設定 localStorage hook
 */
export function useEditorSettingsStorage() {
  return useLocalStorage(
    'editor-settings',
    {
      fontSize: 14,
      wordWrap: true,
      minimap: true,
      lineNumbers: true,
      tabSize: 2,
    },
    {
      onError: (error) => {
        console.error('Editor settings storage error:', error);
      },
    }
  );
}

/**
 * 特化的最近使用主題 localStorage hook
 */
export function useRecentTopicsStorage() {
  return useLocalStorage<string[]>('recent-topics', [], {
    onError: (error) => {
      console.error('Recent topics storage error:', error);
    },
  });
}