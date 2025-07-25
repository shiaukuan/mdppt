'use client';

import { useState, useRef } from 'react';
import { Container } from '@/components/Layout/Container';
import { AppHeader, ActionButton } from '@/components/Layout/Header';
import { ResponsiveSplitView } from '@/components/Layout/SplitView';
import GeneratorForm from '@/components/SlideGenerator/GeneratorForm';
import MarkdownEditor, {
  type MarkdownEditorApi,
} from '@/components/Editor/MarkdownEditor';
import EditorToolbar from '@/components/Editor/EditorToolbar';
import { ResponsiveIntegratedPreview } from '@/components/Preview/IntegratedPreview';
import { useToastActions } from '@/contexts/ToastContext';
import ErrorBoundary from '@/components/ErrorBoundary';
import type { SupportedTheme } from '@/lib/marp/config';

export default function Home() {
  const editorRef = useRef<MarkdownEditorApi>(null);
  const toast = useToastActions();
  const [showDebugPanel, setShowDebugPanel] = useState(
    process.env.NODE_ENV === 'development'
  );
  const [markdown, setMarkdown] = useState('');

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
    const loadingId = toast.showLoading(
      `正在匯出為 ${format?.toUpperCase() || 'PPTX'} 格式...`
    );

    try {
      // TODO: 實作匯出邏輯
      await new Promise(resolve => setTimeout(resolve, 2000)); // 模擬匯出過程

      toast.completeLoading(
        loadingId,
        `成功匯出為 ${format?.toUpperCase() || 'PPTX'} 格式`
      );
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
      {process.env.NODE_ENV === 'development' && (
        <ActionButton
          onClick={() => setShowDebugPanel(!showDebugPanel)}
          variant="secondary"
        >
          {showDebugPanel ? '隱藏除錯' : '顯示除錯'}
        </ActionButton>
      )}
      <ActionButton onClick={handleGenerate} variant="primary">
        生成投影片
      </ActionButton>
      <ActionButton onClick={handleExport} variant="secondary">
        匯出
      </ActionButton>
    </>
  );

  const editor = (
    <div className="h-full flex flex-col bg-white dark:bg-gray-900">
      <EditorToolbar
        editorRef={editorRef}
        showStats={true}
        showFormatButtons={true}
        showInsertButtons={true}
        markdown={markdown}
      />
      <div className="flex-1 overflow-hidden">
        <MarkdownEditor
          ref={editorRef}
          value={markdown}
          onChange={setMarkdown}
          placeholder="開始輸入 Markdown 內容，或點擊「生成投影片」使用 AI 協助..."
          className="h-full"
        />
      </div>
    </div>
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
        onError={error => {
          toast.handleApiError(error, '預覽渲染失敗');
        }}
        onReady={totalSlides => {
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

      <Container
        className="flex-1 flex flex-col p-0"
        maxWidth="full"
        padding="none"
      >
        <ResponsiveSplitView
          editor={editor}
          preview={preview}
          defaultSplit={50}
          className="flex-1"
        />
      </Container>

      {/* 除錯面板 */}
      {showDebugPanel && (
        <div className="fixed top-20 right-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-4 z-40 max-w-sm">
          <div className="text-sm">
            <h3 className="font-semibold mb-2 text-gray-900 dark:text-gray-100">
              🔍 Marp 除錯資訊
            </h3>
            <div className="space-y-1 text-gray-600 dark:text-gray-400">
              <div>Markdown 長度: {markdown.length}</div>
              <div>主題: {currentTheme}</div>
              <div>開發模式: {process.env.NODE_ENV}</div>
              <div className="mt-2 text-xs">
                <div>
                  💡 請查看瀏覽器主控台以獲取詳細的 Marp 初始化和渲染記錄
                </div>
                <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded">
                  <div>🎯 檢查項目:</div>
                  <div>
                    1. 是否看到 &ldquo;🎯 useMarpPreview: Hook 被調用&rdquo;？
                  </div>
                  <div>
                    2. 是否看到 &ldquo;✅ useMarpPreview: autoInitialize 為
                    true&rdquo;？
                  </div>
                  <div>
                    3. 是否看到 &ldquo;🎉 Marp Core 初始化完成！&rdquo;？
                  </div>
                  <div>
                    4. 是否看到 &ldquo;🎭 SlidePreview: 渲染狀態檢查&rdquo;？
                  </div>
                </div>
                <div className="mt-2">
                  <button
                    onClick={() => window.location.reload()}
                    className="w-full bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-xs"
                  >
                    🔄 強制重新載入頁面
                  </button>
                </div>
                <div className="mt-1">
                  <button
                    onClick={() => {
                      console.clear();
                      console.log('🧹 控制台已清空，開始新的除錯...');
                      setMarkdown(markdown + ' '); // 觸發重新渲染
                    }}
                    className="w-full bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-xs"
                  >
                    🧹 清空控制台並觸發渲染
                  </button>
                </div>
                <div className="mt-1">
                  <button
                    onClick={() => {
                      const timestamp = new Date().toLocaleTimeString();
                      console.log(`⏰ [${timestamp}] 手動狀態檢查`, {
                        markdownLength: markdown.length,
                        currentTheme,
                        timestamp,
                      });
                    }}
                    className="w-full bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded text-xs"
                  >
                    ⏰ 檢查當前狀態
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

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
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
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
