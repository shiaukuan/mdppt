'use client';

import { useState, useRef } from 'react';
import { Container } from '@/components/Layout/Container';
import { AppHeader, ActionButton } from '@/components/Layout/Header';
import { ResponsiveSplitView } from '@/components/Layout/SplitView';
import GeneratorForm from '@/components/SlideGenerator/GeneratorForm';
import MarkdownEditor, { type MarkdownEditorApi } from '@/components/Editor/MarkdownEditor';
import EditorToolbar from '@/components/Editor/EditorToolbar';
import { ResponsiveIntegratedPreview } from '@/components/Preview/IntegratedPreview';
import { useToastActions } from '@/contexts/ToastContext';
import ErrorBoundary from '@/components/ErrorBoundary';
import type { SupportedTheme } from '@/lib/marp/config';

export default function Home() {
  const editorRef = useRef<MarkdownEditorApi>(null);
  const toast = useToastActions();
  const [markdown, setMarkdown] = useState(`# 歡迎使用 Markdown 投影片產生器

## 功能特色

- 🚀 快速產生投影片
- 🎨 多種主題樣式
- 📱 響應式設計
- 💾 多格式匯出

## 開始使用

1. 在左側編輯器輸入 Markdown 內容
2. 右側即時預覽投影片效果
3. 點擊生成按鈕使用 AI 優化內容
4. 匯出為 PPTX、PDF 或 HTML 格式

---

## 範例投影片

這是一個範例投影片，展示基本的 Markdown 語法。

\`\`\`javascript
// 程式碼區塊範例
function generateSlides() {
  return "AI 生成的投影片";
}
\`\`\`

> 引用文字範例

- 列表項目 1
- 列表項目 2
- 列表項目 3
`);

  const [showGeneratorForm, setShowGeneratorForm] = useState(false);
  const [currentTheme, setCurrentTheme] = useState<SupportedTheme>('default');

  const handleGenerate = async () => {
    setShowGeneratorForm(true);
  };

  const handleFormSuccess = (topic: string) => {
    setShowGeneratorForm(false);
    toast.showSuccess(`成功生成「${topic}」的投影片`, {
      title: '生成完成',
      duration: 4000,
    });
  };

  const handleFormClose = () => {
    setShowGeneratorForm(false);
  };

  const handleExport = async (format?: 'pptx' | 'pdf' | 'html') => {
    const loadingId = toast.showLoading(`正在匯出為 ${format?.toUpperCase() || 'PPTX'} 格式...`);
    
    try {
      // TODO: 實作匯出邏輯
      await new Promise(resolve => setTimeout(resolve, 2000)); // 模擬匯出過程
      
      toast.completeLoading(loadingId, `成功匯出為 ${format?.toUpperCase() || 'PPTX'} 格式`);
    } catch (error) {
      toast.completeLoading(loadingId, undefined, '匯出失敗，請稍後再試');
      toast.handleApiError(error, '匯出過程中發生錯誤');
    }
  };

  const handleThemeChange = (theme: SupportedTheme) => {
    setCurrentTheme(theme);
    toast.showInfo(`已切換至「${theme}」主題`, {
      duration: 2000,
    });
  };

  const headerActions = (
    <>
      <ActionButton
        onClick={handleGenerate}
        variant="primary"
      >
        生成投影片
      </ActionButton>
      <ActionButton
        onClick={handleExport}
        variant="secondary"
      >
        匯出
      </ActionButton>
    </>
  );

  const editor = (
    <ErrorBoundary
      onError={(error, errorInfo, errorId) => {
        toast.handleApiError(error, '編輯器發生錯誤');
        console.error('Editor error:', { error, errorInfo, errorId });
      }}
      maxRetries={2}
    >
      <div className="h-full flex flex-col bg-white dark:bg-gray-900">
        <EditorToolbar
          editorRef={editorRef}
          showStats={true}
          showFormatButtons={true}
          showHistoryButtons={true}
          showInsertButtons={true}
        />
        <div className="flex-1 overflow-hidden">
          <MarkdownEditor
            ref={editorRef}
            showLineNumbers={true}
            enableSyntaxHighlight={true}
            autoFocus={false}
            fontSize={14}
            tabSize={2}
            placeholder="開始輸入 Markdown 內容，或點擊「生成投影片」使用 AI 協助..."
            onChange={(value) => setMarkdown(value)}
            onStatsChange={(stats) => {
              // 可以在這裡處理統計變更
              console.log('Stats updated:', stats);
            }}
            className="h-full"
          />
        </div>
      </div>
    </ErrorBoundary>
  );

  const preview = (
    <ErrorBoundary
      onError={(error, errorInfo, errorId) => {
        toast.handleApiError(error, '預覽系統發生錯誤');
        console.error('Preview error:', { error, errorInfo, errorId });
      }}
      maxRetries={2}
    >
      <ResponsiveIntegratedPreview
        markdown={markdown}
        initialTheme={currentTheme}
        initialMode="single"
        showToolbar={true}
        showControls={true}
        showProgress={true}
        toolbarPosition="top"
        controlsPosition="bottom"
        mobileBreakpoint={768}
        onThemeChange={handleThemeChange}
        onExport={handleExport}
        onError={(error) => {
          toast.handleApiError(error, '預覽渲染失敗');
        }}
        onReady={(totalSlides) => {
          if (totalSlides > 0) {
            toast.showInfo(`預覽已準備完成，共 ${totalSlides} 張投影片`, {
              duration: 3000,
            });
          }
        }}
        className="h-full"
      />
    </ErrorBoundary>
  );

  return (
    <div className="h-screen flex flex-col">
      <AppHeader actions={headerActions} />
      
      <Container className="flex-1 flex flex-col p-0" maxWidth="full" padding="none">
        <ResponsiveSplitView
          editor={editor}
          preview={preview}
          defaultSplit={50}
          className="flex-1"
        />
      </Container>

      {/* 投影片生成表單 Modal */}
      {showGeneratorForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                  生成投影片
                </h2>
                <button
                  onClick={handleFormClose}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <GeneratorForm
                onClose={handleFormClose}
                onSuccess={handleFormSuccess}
                className="space-y-4"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
