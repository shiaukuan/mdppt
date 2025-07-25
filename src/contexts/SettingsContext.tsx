'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useApiKeyStorage, useThemeStorage, useEditorSettingsStorage } from '@/hooks/useLocalStorage';

// 應用程式設定型別定義
export interface AppSettings {
  // API 相關設定
  openaiApiKey: string;
  
  // 主題設定
  theme: 'light' | 'dark' | 'system';
  
  // 編輯器設定
  editor: {
    fontSize: number;
    wordWrap: boolean;
    minimap: boolean;
    lineNumbers: boolean;
    tabSize: number;
  };
  
  // 一般偏好設定
  preferences: {
    autoSave: boolean;
    previewDelay: number;
    defaultLanguage: string;
    defaultTemplateType: 'basic' | 'academic' | 'business' | 'creative';
    showWelcome: boolean;
  };
}

// Context 介面定義
export interface SettingsContextType {
  // 設定值
  settings: AppSettings;
  
  // 更新函數
  updateApiKey: (apiKey: string) => void;
  updateTheme: (theme: 'light' | 'dark' | 'system') => void;
  updateEditorSettings: (settings: Partial<AppSettings['editor']>) => void;
  updatePreferences: (preferences: Partial<AppSettings['preferences']>) => void;
  
  // 工具函數
  resetSettings: () => void;
  isApiKeyValid: () => boolean;
  
  // 載入狀態
  isLoading: boolean;
}

// 預設設定
const DEFAULT_SETTINGS: AppSettings = {
  openaiApiKey: '',
  theme: 'system',
  editor: {
    fontSize: 14,
    wordWrap: true,
    minimap: true,
    lineNumbers: true,
    tabSize: 2,
  },
  preferences: {
    autoSave: true,
    previewDelay: 300,
    defaultLanguage: 'zh-TW',
    defaultTemplateType: 'basic',
    showWelcome: true,
  },
};

// 建立 Context
const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

// Provider 元件
export function SettingsProvider({ children }: { children: ReactNode }) {
  const [isLoading, setIsLoading] = useState(true);
  
  // 使用 localStorage hooks
  const [apiKey, setApiKey] = useApiKeyStorage();
  const [theme, setTheme] = useThemeStorage();
  const [editorSettings, setEditorSettings] = useEditorSettingsStorage();
  
  // 偏好設定（使用 localStorage）
  const [preferences, setPreferences] = useState(DEFAULT_SETTINGS.preferences);

  // 載入偏好設定
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const savedPreferences = localStorage.getItem('app-preferences');
        if (savedPreferences) {
          const parsed = JSON.parse(savedPreferences);
          setPreferences({ ...DEFAULT_SETTINGS.preferences, ...parsed });
        }
      } catch (error) {
        console.error('Failed to load preferences:', error);
      } finally {
        setIsLoading(false);
      }
    } else {
      setIsLoading(false);
    }
  }, []);

  // 儲存偏好設定
  useEffect(() => {
    if (!isLoading && typeof window !== 'undefined') {
      try {
        localStorage.setItem('app-preferences', JSON.stringify(preferences));
      } catch (error) {
        console.error('Failed to save preferences:', error);
      }
    }
  }, [preferences, isLoading]);

  // 組合所有設定
  const settings: AppSettings = {
    openaiApiKey: apiKey,
    theme,
    editor: editorSettings,
    preferences,
  };

  // 更新函數
  const updateApiKey = (newApiKey: string) => {
    setApiKey(newApiKey);
  };

  const updateTheme = (newTheme: 'light' | 'dark' | 'system') => {
    setTheme(newTheme);
  };

  const updateEditorSettings = (newSettings: Partial<AppSettings['editor']>) => {
    setEditorSettings(prev => ({ ...prev, ...newSettings }));
  };

  const updatePreferences = (newPreferences: Partial<AppSettings['preferences']>) => {
    setPreferences(prev => ({ ...prev, ...newPreferences }));
  };

  const resetSettings = () => {
    setApiKey('');
    setTheme('system');
    setEditorSettings(DEFAULT_SETTINGS.editor);
    setPreferences(DEFAULT_SETTINGS.preferences);
  };

  const isApiKeyValid = (): boolean => {
    return apiKey.startsWith('sk-') && apiKey.length > 20;
  };

  const contextValue: SettingsContextType = {
    settings,
    updateApiKey,
    updateTheme,
    updateEditorSettings,
    updatePreferences,
    resetSettings,
    isApiKeyValid,
    isLoading,
  };

  return (
    <SettingsContext.Provider value={contextValue}>
      {children}
    </SettingsContext.Provider>
  );
}

// Hook 用於使用 Settings Context
export function useSettings(): SettingsContextType {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}

// 工具 hooks
export function useApiKey() {
  const { settings, updateApiKey, isApiKeyValid } = useSettings();
  return {
    apiKey: settings.openaiApiKey,
    setApiKey: updateApiKey,
    isValid: isApiKeyValid(),
  };
}

export function useTheme() {
  const { settings, updateTheme } = useSettings();
  return {
    theme: settings.theme,
    setTheme: updateTheme,
  };
}

export function useEditorPreferences() {
  const { settings, updateEditorSettings } = useSettings();
  return {
    editorSettings: settings.editor,
    updateEditorSettings,
  };
}

export function useAppPreferences() {
  const { settings, updatePreferences } = useSettings();
  return {
    preferences: settings.preferences,
    updatePreferences,
  };
}