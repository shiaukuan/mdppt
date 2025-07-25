import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Debounce hook for delaying function execution
 * 用於延遲函數執行的 debounce hook
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Debounced callback hook
 * 用於創建防抖回調函數的 hook
 */
export function useDebouncedCallback<TArgs extends any[]>(
  callback: (...args: TArgs) => void,
  delay: number,
  deps: any[] = []
): (...args: TArgs) => void {
  const timeoutRef = useRef<NodeJS.Timeout>();
  const callbackRef = useRef(callback);

  // 更新回調函數引用
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback, ...deps]);

  return useCallback(
    (...args: TArgs) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        callbackRef.current(...args);
      }, delay);
    },
    [delay]
  );
}

/**
 * Debounced async callback hook
 * 支援異步函數的防抖 hook
 */
export function useDebouncedAsyncCallback<TArgs extends any[]>(
  callback: (...args: TArgs) => Promise<void>,
  delay: number,
  deps: any[] = []
): [(...args: TArgs) => void, boolean] {
  const [isExecuting, setIsExecuting] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout>();
  const callbackRef = useRef(callback);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback, ...deps]);

  const debouncedCallback = useCallback(
    (...args: TArgs) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(async () => {
        setIsExecuting(true);
        try {
          await callbackRef.current(...args);
        } catch (error) {
          console.error('Debounced async callback error:', error);
        } finally {
          setIsExecuting(false);
        }
      }, delay);
    },
    [delay]
  );

  // 清理超時
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return [debouncedCallback, isExecuting];
}

/**
 * 特化的預覽更新 debounce hook
 * 專門用於 Markdown 預覽更新
 */
export function usePreviewDebounce(
  markdown: string,
  delay: number = 300
): [string, boolean] {
  const [debouncedMarkdown, setDebouncedMarkdown] = useState(markdown);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    setIsUpdating(true);
    
    const handler = setTimeout(() => {
      setDebouncedMarkdown(markdown);
      setIsUpdating(false);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [markdown, delay]);

  return [debouncedMarkdown, isUpdating];
}

/**
 * 自動儲存 debounce hook
 * 用於自動儲存編輯器內容
 */
export function useAutoSave<T>(
  data: T,
  saveFunction: (data: T) => Promise<void> | void,
  delay: number = 2000,
  enabled: boolean = true
): {
  isSaving: boolean;
  lastSaved: Date | null;
  forceSave: () => void;
} {
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout>();
  const dataRef = useRef(data);

  // 更新資料引用
  useEffect(() => {
    dataRef.current = data;
  }, [data]);

  // 自動儲存邏輯
  useEffect(() => {
    if (!enabled) return;

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(async () => {
      setIsSaving(true);
      try {
        await saveFunction(dataRef.current);
        setLastSaved(new Date());
      } catch (error) {
        console.error('Auto-save error:', error);
      } finally {
        setIsSaving(false);
      }
    }, delay);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [data, delay, enabled, saveFunction]);

  // 強制儲存函數
  const forceSave = useCallback(async () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    setIsSaving(true);
    try {
      await saveFunction(dataRef.current);
      setLastSaved(new Date());
    } catch (error) {
      console.error('Force save error:', error);
    } finally {
      setIsSaving(false);
    }
  }, [saveFunction]);

  return { isSaving, lastSaved, forceSave };
}