'use client';

import React, { useState } from 'react';
import { useApiKey } from '@/contexts/SettingsContext';
import { Input } from '@/components/UI/Input';
import { Button } from '@/components/UI/Button';

export interface ApiKeyInputProps {
  /** 標籤 */
  label?: string;
  /** 說明文字 */
  description?: string;
  /** 是否必填 */
  required?: boolean;
  /** 自定義樣式類名 */
  className?: string;
  /** 驗證變更回調 */
  onValidationChange?: (isValid: boolean) => void;
}

const ApiKeyInput: React.FC<ApiKeyInputProps> = ({
  label = 'OpenAI API Key',
  description = '請輸入您的 OpenAI API Key，用於生成投影片內容',
  required = true,
  className,
  onValidationChange,
}) => {
  const { apiKey, setApiKey, isValid } = useApiKey();
  const [showKey, setShowKey] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  // 當 API Key 或驗證狀態改變時，通知父組件
  React.useEffect(() => {
    onValidationChange?.(isValid);
  }, [isValid, onValidationChange]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setApiKey(value);
  };

  const handleToggleVisibility = () => {
    setShowKey(prev => !prev);
  };

  const handleClearKey = () => {
    setApiKey('');
  };

  // 格式化顯示的 API Key（部分隱藏）
  const getDisplayValue = () => {
    if (showKey || isFocused) {
      return apiKey;
    }
    
    if (apiKey.length > 8) {
      return `${apiKey.slice(0, 7)}${'*'.repeat(Math.max(0, apiKey.length - 14))}${apiKey.slice(-7)}`;
    }
    
    return '*'.repeat(apiKey.length);
  };

  // 驗證狀態和錯誤訊息
  const getValidationState = () => {
    if (!apiKey) {
      return { error: required ? '請輸入 API Key' : undefined };
    }
    
    if (!apiKey.startsWith('sk-')) {
      return { error: 'API Key 必須以 "sk-" 開頭' };
    }
    
    if (apiKey.length < 20) {
      return { error: 'API Key 格式不正確（長度不足）' };
    }
    
    return { error: undefined, success: true };
  };

  const validation = getValidationState();

  // 右側動作按鈕
  const rightActions = (
    <div className="flex items-center space-x-1">
      {/* 顯示/隱藏按鈕 */}
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="p-1 h-6 w-6"
        onClick={handleToggleVisibility}
        title={showKey ? '隱藏 API Key' : '顯示 API Key'}
      >
        {showKey ? (
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L8.464 8.464M9.878 9.878A3 3 0 1012 6l4.242 4.242m0 0L18.656 12.656M14.12 14.12l4.242 4.242m-4.242-4.242L12 12m2.12 2.12l4.242 4.242" />
          </svg>
        ) : (
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
        )}
      </Button>

      {/* 清除按鈕 */}
      {apiKey && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="p-1 h-6 w-6"
          onClick={handleClearKey}
          title="清除 API Key"
        >
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </Button>
      )}

      {/* 驗證狀態指示器 */}
      {apiKey && (
        <div className="flex items-center">
          {validation.success ? (
            <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          ) : (
            <svg className="w-4 h-4 text-red-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          )}
        </div>
      )}
    </div>
  );

  return (
    <div className={className}>
      <Input
        type="text"
        value={getDisplayValue()}
        onChange={handleInputChange}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        label={label}
        description={validation.success ? '✓ API Key 格式正確' : description}
        error={validation.error || undefined}
        success={validation.success ? true : undefined}
        required={required}
        placeholder="sk-..."
        rightAction={rightActions}
        fullWidth
        autoComplete="off"
        spellCheck={false}
      />

      {/* 額外的安全提示 */}
      {apiKey && !isFocused && (
        <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-md">
          <div className="flex items-start">
            <svg className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <div className="text-xs text-blue-800 dark:text-blue-200">
              <p className="font-medium">安全提示</p>
              <p>您的 API Key 僅儲存在本機瀏覽器中，不會傳送到我們的伺服器。</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ApiKeyInput;