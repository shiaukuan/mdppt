'use client';

import React, { useState, useCallback } from 'react';
import { Input } from '@/components/UI/Input';
import { Button } from '@/components/UI/Button';
import LoadingSpinner from '@/components/UI/LoadingSpinner';
import TokenUsage from '@/components/UI/TokenUsage';
import ApiKeyInput from './ApiKeyInput';
import { useSlideGeneration } from '@/hooks/useSlideGeneration';
import { useToastActions } from '@/contexts/ToastContext';
import ErrorBoundary from '@/components/ErrorBoundary';

// 表單資料介面
export interface SlideGeneratorFormData {
  topic: string;
  model: 'gpt-4o-mini' | 'gpt-4o' | 'gpt-4';
  pageCount: number;
  style: 'professional' | 'academic' | 'creative' | 'simple';
  language: 'zh-TW' | 'zh-CN' | 'en';
  includeImages: boolean;
  additionalInstructions: string;
}

// 組件 Props
export interface GeneratorFormProps {
  /** 是否顯示 API Key 輸入（預設顯示） */
  showApiKeyInput?: boolean;
  /** 初始表單資料 */
  initialData?: Partial<SlideGeneratorFormData>;
  /** 自定義樣式類名 */
  className?: string;
  /** 關閉表單回調 */
  onClose?: () => void;
  /** 成功生成回調 */
  onSuccess?: (content: string) => void;
}

// 預設表單資料
const DEFAULT_FORM_DATA: SlideGeneratorFormData = {
  topic: '',
  model: 'gpt-4o-mini',
  pageCount: 10,
  style: 'professional',
  language: 'zh-TW',
  includeImages: false,
  additionalInstructions: '',
};

// 模型選項
const MODEL_OPTIONS = [
  { value: 'gpt-4o-mini', label: 'GPT-4O Mini', description: '快速、經濟實惠' },
  { value: 'gpt-4o', label: 'GPT-4O', description: '平衡性能與成本' },
  { value: 'gpt-4', label: 'GPT-4', description: '最高品質' },
] as const;

// 風格選項
const STYLE_OPTIONS = [
  { value: 'professional', label: '專業風格', description: '商務簡報適用' },
  { value: 'academic', label: '學術風格', description: '學術報告適用' },
  { value: 'creative', label: '創意風格', description: '創意展示適用' },
  { value: 'simple', label: '簡約風格', description: '簡潔明瞭' },
] as const;

// 語言選項
const LANGUAGE_OPTIONS = [
  { value: 'zh-TW', label: '繁體中文' },
  { value: 'zh-CN', label: '簡體中文' },
  { value: 'en', label: 'English' },
] as const;

const GeneratorForm: React.FC<GeneratorFormProps> = ({
  showApiKeyInput = true,
  initialData,
  className,
  onClose,
  onSuccess,
}) => {
  const toast = useToastActions();
  
  // 使用投影片生成 hook
  const {
    isGenerating,
    isValidating,
    progress,
    error,
    tokenUsage,
    generateSlides,
    clearError,
    cancelGeneration,
  } = useSlideGeneration();
  const [formData, setFormData] = useState<SlideGeneratorFormData>({
    ...DEFAULT_FORM_DATA,
    ...initialData,
  });
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
  const [isApiKeyFormValid, setIsApiKeyFormValid] = useState(false);

  // 表單驗證
  const validateForm = useCallback(() => {
    const isTopicValid = formData.topic.trim().length >= 3;
    const isApiValid = !showApiKeyInput || isApiKeyFormValid;
    const isPageCountValid = formData.pageCount >= 5 && formData.pageCount <= 50;
    
    return isTopicValid && isApiValid && isPageCountValid;
  }, [formData, showApiKeyInput, isApiKeyFormValid]);

  // 清除錯誤當表單資料變更時
  React.useEffect(() => {
    if (error) {
      clearError();
    }
  }, [formData, error, clearError]);

  // 處理表單欄位變更
  const handleFieldChange = (field: keyof SlideGeneratorFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  // 處理表單提交
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm() || isGenerating) {
      if (!validateForm()) {
        toast.showError('請檢查表單資料是否正確', {
          title: '表單驗證失敗',
          duration: 4000,
        });
      }
      return;
    }

    try {
      await generateSlides(formData);
      // 生成成功後的處理將在 hook 內部完成
      onSuccess?.(formData.topic); // 通知父組件成功
    } catch (error) {
      // 錯誤已經在 hook 中處理，這裡添加額外的用戶反饋
      toast.handleApiError(error, '生成投影片時發生錯誤');
    }
  };

  // 處理取消
  const handleCancel = () => {
    if (isGenerating) {
      cancelGeneration();
    }
    onClose?.();
  };

  // 處理 API Key 驗證狀態變化
  const handleApiKeyValidationChange = (isValid: boolean) => {
    setIsApiKeyFormValid(isValid);
  };

  // 切換進階選項
  const toggleAdvanced = () => {
    setIsAdvancedOpen(prev => !prev);
  };

  return (
    <ErrorBoundary
      onError={(error, errorInfo, errorId) => {
        toast.handleApiError(error, '表單發生意外錯誤');
        console.error('GeneratorForm error:', { error, errorInfo, errorId });
      }}
      maxRetries={2}
    >
      <form onSubmit={handleSubmit} className={className}>
        <div className="space-y-6">
        {/* 載入狀態覆蓋層 */}
        {isGenerating && (
          <div className="absolute inset-0 bg-white dark:bg-gray-900 bg-opacity-90 flex items-center justify-center z-10 rounded-lg">
            <div className="text-center">
              <LoadingSpinner
                size="lg"
                text={isValidating ? "驗證中..." : "正在生成投影片..."}
                progress={progress}
                showProgress={true}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleCancel}
                className="mt-4"
              >
                取消
              </Button>
            </div>
          </div>
        )}

        {/* 錯誤顯示 */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-4">
            <div className="flex">
              <svg className="w-5 h-5 text-red-400 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <div className="flex-1">
                <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                  {error.type === 'auth' ? 'API Key 錯誤' : 
                   error.type === 'quota' ? '配額限制' : 
                   error.type === 'network' ? '網路錯誤' : 
                   error.type === 'validation' ? '參數錯誤' : '生成失敗'}
                </h3>
                <p className="mt-1 text-sm text-red-700 dark:text-red-300">
                  {error.message}
                </p>
                {error.retry && (
                  <div className="mt-3">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleSubmit({ preventDefault: () => {} } as React.FormEvent)}
                      className="mr-2"
                    >
                      重試
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={clearError}
                    >
                      關閉
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Token 使用統計 */}
        {tokenUsage.requestCount > 0 && (
          <TokenUsage
            usage={tokenUsage}
            mode="compact"
            showCost={true}
            showSession={true}
          />
        )}
        {/* API Key 輸入 */}
        {showApiKeyInput && (
          <ApiKeyInput
            onValidationChange={handleApiKeyValidationChange}
            className="mb-6"
          />
        )}

        {/* 主題輸入 */}
        <Input
          label="投影片主題"
          description="請描述您想要生成的投影片主題，至少 3 個字元"
          value={formData.topic}
          onChange={(e) => handleFieldChange('topic', e.target.value)}
          placeholder="例如：人工智慧在醫療領域的應用"
          required
          error={(formData.topic.length > 0 && formData.topic.trim().length < 3 ? '主題至少需要 3 個字元' : undefined) || undefined}
          fullWidth
        />

        {/* 進階選項切換 */}
        <div className="border-t pt-4">
          <Button
            type="button"
            variant="ghost"
            onClick={toggleAdvanced}
            className="w-full justify-between"
            icon={
              <svg
                className={`w-4 h-4 transition-transform duration-200 ${
                  isAdvancedOpen ? 'rotate-180' : ''
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            }
            iconPosition="right"
          >
            進階選項 {isAdvancedOpen ? '(點擊隱藏)' : '(點擊展開)'}
          </Button>
        </div>

        {/* 進階選項內容 */}
        {isAdvancedOpen && (
          <div className="space-y-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
            {/* 模型選擇 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                AI 模型
              </label>
              <div className="grid grid-cols-1 gap-2">
                {MODEL_OPTIONS.map((option) => (
                  <label
                    key={option.value}
                    className="flex items-center p-3 border rounded-md cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <input
                      type="radio"
                      name="model"
                      value={option.value}
                      checked={formData.model === option.value}
                      onChange={(e) => handleFieldChange('model', e.target.value)}
                      className="mr-3 text-blue-600"
                    />
                    <div>
                      <div className="font-medium text-gray-900 dark:text-gray-100">
                        {option.label}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {option.description}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* 頁數設定 */}
            <Input
              type="number"
              label="投影片頁數"
              description="建議 5-50 頁，頁數越多生成時間越長"
              value={formData.pageCount}
              onChange={(e) => handleFieldChange('pageCount', parseInt(e.target.value) || 10)}
              min={5}
              max={50}
              error={(
                formData.pageCount < 5 || formData.pageCount > 50
                  ? '頁數必須在 5-50 之間'
                  : undefined
              ) || undefined}
              fullWidth
            />

            {/* 風格選擇 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                投影片風格
              </label>
              <div className="grid grid-cols-2 gap-2">
                {STYLE_OPTIONS.map((option) => (
                  <label
                    key={option.value}
                    className="flex items-center p-3 border rounded-md cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <input
                      type="radio"
                      name="style"
                      value={option.value}
                      checked={formData.style === option.value}
                      onChange={(e) => handleFieldChange('style', e.target.value)}
                      className="mr-3 text-blue-600"
                    />
                    <div>
                      <div className="font-medium text-gray-900 dark:text-gray-100">
                        {option.label}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {option.description}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* 語言選擇 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                語言
              </label>
              <div className="flex gap-2">
                {LANGUAGE_OPTIONS.map((option) => (
                  <label
                    key={option.value}
                    className="flex items-center p-2 border rounded-md cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex-1"
                  >
                    <input
                      type="radio"
                      name="language"
                      value={option.value}
                      checked={formData.language === option.value}
                      onChange={(e) => handleFieldChange('language', e.target.value)}
                      className="mr-2 text-blue-600"
                    />
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {option.label}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* 圖片包含選項 */}
            <div className="flex items-center">
              <input
                type="checkbox"
                id="includeImages"
                checked={formData.includeImages}
                onChange={(e) => handleFieldChange('includeImages', e.target.checked)}
                className="mr-3 text-blue-600"
              />
              <label htmlFor="includeImages" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                包含圖片建議
                <span className="block text-xs text-gray-500 dark:text-gray-400">
                  AI 將建議適合的圖片和圖表
                </span>
              </label>
            </div>

            {/* 額外指示 */}
            <div>
              <label htmlFor="additionalInstructions" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                額外指示 (選填)
              </label>
              <textarea
                id="additionalInstructions"
                value={formData.additionalInstructions}
                onChange={(e) => handleFieldChange('additionalInstructions', e.target.value)}
                placeholder="例如：請重點強調實際應用案例，包含統計數據..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
              />
            </div>
          </div>
        )}

        {/* 提交按鈕 */}
        <div className="flex space-x-3">
          <Button
            type="submit"
            variant="primary"
            size="lg"
            fullWidth
            loading={isGenerating}
            loadingText="正在生成投影片..."
            disabled={!validateForm() || isGenerating}
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            }
          >
            {isGenerating ? (isValidating ? '驗證中...' : '生成中...') : '生成投影片'}
          </Button>
          
          {onClose && (
            <Button
              type="button"
              variant="ghost"
              size="lg"
              onClick={handleCancel}
              disabled={isGenerating}
            >
              取消
            </Button>
          )}
        </div>

        {/* 表單提示 */}
        {!validateForm() && (
          <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md">
            <div className="flex">
              <svg className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <div className="text-sm text-yellow-800 dark:text-yellow-200">
                <p className="font-medium">請完成以下項目才能生成投影片：</p>
                <ul className="mt-1 list-disc list-inside space-y-1">
                  {formData.topic.trim().length < 3 && (
                    <li>請輸入至少 3 個字元的主題</li>
                  )}
                  {showApiKeyInput && !isApiKeyFormValid && (
                    <li>請輸入有效的 OpenAI API Key</li>
                  )}
                  {(formData.pageCount < 5 || formData.pageCount > 50) && (
                    <li>請設定 5-50 頁的頁數範圍</li>
                  )}
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
      </form>
    </ErrorBoundary>
  );
};

export default GeneratorForm;