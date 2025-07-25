import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

// 編輯器狀態介面
export interface EditorState {
  // 內容狀態
  markdown: string;
  isModified: boolean;
  lastSaved: Date | null;
  
  // 編輯歷史
  history: {
    past: string[];
    present: string;
    future: string[];
  };
  
  // UI 狀態
  isPreviewVisible: boolean;
  isSplitView: boolean;
  isFullscreen: boolean;
  
  // 游標和選擇
  cursor: {
    line: number;
    column: number;
  };
  selection: {
    start: { line: number; column: number };
    end: { line: number; column: number };
  } | null;
  
  // 自動儲存狀態
  autoSave: {
    enabled: boolean;
    interval: number; // 毫秒
    lastAutoSave: Date | null;
  };
  
  // 錯誤狀態
  errors: Array<{
    line: number;
    message: string;
    type: 'error' | 'warning';
  }>;
}

// 動作介面
export interface EditorActions {
  // 內容操作
  setMarkdown: (markdown: string, addToHistory?: boolean) => void;
  appendMarkdown: (markdown: string) => void;
  insertMarkdown: (markdown: string, position?: { line: number; column: number }) => void;
  clearMarkdown: () => void;
  
  // 歷史操作
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
  clearHistory: () => void;
  
  // UI 操作
  togglePreview: () => void;
  toggleSplitView: () => void;
  toggleFullscreen: () => void;
  
  // 游標和選擇
  setCursor: (line: number, column: number) => void;
  setSelection: (start: { line: number; column: number }, end: { line: number; column: number }) => void;
  clearSelection: () => void;
  
  // 儲存操作
  markAsSaved: () => void;
  setAutoSave: (enabled: boolean, interval?: number) => void;
  
  // 錯誤處理
  addError: (line: number, message: string, type?: 'error' | 'warning') => void;
  clearErrors: () => void;
  removeError: (line: number) => void;
  
  // 重置
  reset: () => void;
  
  // 載入狀態
  loadFromStorage: () => void;
  saveToStorage: () => void;
}

// 初始狀態
const initialState: EditorState = {
  markdown: '',
  isModified: false,
  lastSaved: null,
  
  history: {
    past: [],
    present: '',
    future: [],
  },
  
  isPreviewVisible: true,
  isSplitView: true,
  isFullscreen: false,
  
  cursor: {
    line: 1,
    column: 1,
  },
  
  selection: null,
  
  autoSave: {
    enabled: true,
    interval: 30000, // 30 秒
    lastAutoSave: null,
  },
  
  errors: [],
};

// Zustand store
export const useEditorStore = create<EditorState & EditorActions>()(
  subscribeWithSelector(
    immer((set, get) => ({
      ...initialState,
      
      // 內容操作
      setMarkdown: (markdown: string, addToHistory = true) => {
        set((state) => {
          if (addToHistory && state.markdown !== markdown) {
            // 添加到歷史記錄
            state.history.past.push(state.history.present);
            state.history.present = markdown;
            state.history.future = [];
            
            // 限制歷史記錄長度
            if (state.history.past.length > 100) {
              state.history.past = state.history.past.slice(-100);
            }
          }
          
          state.markdown = markdown;
          state.isModified = true;
          state.errors = []; // 清除錯誤
        });
      },
      
      appendMarkdown: (markdown: string) => {
        set((state) => {
          const newMarkdown = state.markdown + markdown;
          state.history.past.push(state.history.present);
          state.history.present = newMarkdown;
          state.history.future = [];
          state.markdown = newMarkdown;
          state.isModified = true;
        });
      },
      
      insertMarkdown: (markdown: string, position) => {
        set((state) => {
          if (position) {
            // 在指定位置插入（這裡簡化處理）
            const lines = state.markdown.split('\n');
            const targetLine = lines[position.line - 1];
            if (targetLine !== undefined) {
              const before = targetLine.substring(0, position.column - 1);
              const after = targetLine.substring(position.column - 1);
              lines[position.line - 1] = before + markdown + after;
              const newMarkdown = lines.join('\n');
              
              state.history.past.push(state.history.present);
              state.history.present = newMarkdown;
              state.history.future = [];
              state.markdown = newMarkdown;
              state.isModified = true;
            }
          } else {
            // 在游標位置插入
            const newMarkdown = state.markdown + markdown;
            state.history.past.push(state.history.present);
            state.history.present = newMarkdown;
            state.history.future = [];
            state.markdown = newMarkdown;
            state.isModified = true;
          }
        });
      },
      
      clearMarkdown: () => {
        set((state) => {
          state.history.past.push(state.history.present);
          state.history.present = '';
          state.history.future = [];
          state.markdown = '';
          state.isModified = true;
          state.errors = [];
        });
      },
      
      // 歷史操作
      undo: () => {
        set((state) => {
          if (state.history.past.length > 0) {
            const previous = state.history.past.pop()!;
            state.history.future.unshift(state.history.present);
            state.history.present = previous;
            state.markdown = previous;
            state.isModified = true;
          }
        });
      },
      
      redo: () => {
        set((state) => {
          if (state.history.future.length > 0) {
            const next = state.history.future.shift()!;
            state.history.past.push(state.history.present);
            state.history.present = next;
            state.markdown = next;
            state.isModified = true;
          }
        });
      },
      
      canUndo: () => get().history.past.length > 0,
      canRedo: () => get().history.future.length > 0,
      
      clearHistory: () => {
        set((state) => {
          state.history.past = [];
          state.history.future = [];
          state.history.present = state.markdown;
        });
      },
      
      // UI 操作
      togglePreview: () => {
        set((state) => {
          state.isPreviewVisible = !state.isPreviewVisible;
        });
      },
      
      toggleSplitView: () => {
        set((state) => {
          state.isSplitView = !state.isSplitView;
        });
      },
      
      toggleFullscreen: () => {
        set((state) => {
          state.isFullscreen = !state.isFullscreen;
        });
      },
      
      // 游標和選擇
      setCursor: (line: number, column: number) => {
        set((state) => {
          state.cursor = { line, column };
        });
      },
      
      setSelection: (start, end) => {
        set((state) => {
          state.selection = { start, end };
        });
      },
      
      clearSelection: () => {
        set((state) => {
          state.selection = null;
        });
      },
      
      // 儲存操作
      markAsSaved: () => {
        set((state) => {
          state.isModified = false;
          state.lastSaved = new Date();
          state.autoSave.lastAutoSave = new Date();
        });
      },
      
      setAutoSave: (enabled: boolean, interval = 30000) => {
        set((state) => {
          state.autoSave.enabled = enabled;
          state.autoSave.interval = interval;
        });
      },
      
      // 錯誤處理
      addError: (line: number, message: string, type = 'error') => {
        set((state) => {
          // 移除同一行的舊錯誤
          state.errors = state.errors.filter(error => error.line !== line);
          // 添加新錯誤
          state.errors.push({ line, message, type });
        });
      },
      
      clearErrors: () => {
        set((state) => {
          state.errors = [];
        });
      },
      
      removeError: (line: number) => {
        set((state) => {
          state.errors = state.errors.filter(error => error.line !== line);
        });
      },
      
      // 重置
      reset: () => {
        set(() => ({ ...initialState }));
      },
      
      // 本地儲存
      loadFromStorage: () => {
        if (typeof window !== 'undefined') {
          try {
            const saved = localStorage.getItem('editor-state');
            if (saved) {
              const parsed = JSON.parse(saved);
              set((state) => {
                state.markdown = parsed.markdown || '';
                state.isPreviewVisible = parsed.isPreviewVisible ?? true;
                state.isSplitView = parsed.isSplitView ?? true;
                state.autoSave = { ...state.autoSave, ...parsed.autoSave };
                state.history.present = parsed.markdown || '';
              });
            }
          } catch (error) {
            console.error('Failed to load editor state:', error);
          }
        }
      },
      
      saveToStorage: () => {
        if (typeof window !== 'undefined') {
          try {
            const state = get();
            const toSave = {
              markdown: state.markdown,
              isPreviewVisible: state.isPreviewVisible,
              isSplitView: state.isSplitView,
              autoSave: state.autoSave,
            };
            localStorage.setItem('editor-state', JSON.stringify(toSave));
          } catch (error) {
            console.error('Failed to save editor state:', error);
          }
        }
      },
    }))
  )
);

// 選擇器 hooks
export const useMarkdown = () => useEditorStore((state) => state.markdown);
export const useIsModified = () => useEditorStore((state) => state.isModified);
export const useEditorHistory = () => useEditorStore((state) => ({
  canUndo: state.canUndo(),
  canRedo: state.canRedo(),
  undo: state.undo,
  redo: state.redo,
}));
export const useEditorUI = () => useEditorStore((state) => ({
  isPreviewVisible: state.isPreviewVisible,
  isSplitView: state.isSplitView,
  isFullscreen: state.isFullscreen,
  togglePreview: state.togglePreview,
  toggleSplitView: state.toggleSplitView,
  toggleFullscreen: state.toggleFullscreen,
}));
export const useEditorErrors = () => useEditorStore((state) => ({
  errors: state.errors,
  addError: state.addError,
  clearErrors: state.clearErrors,
  removeError: state.removeError,
}));

// 自動儲存訂閱
if (typeof window !== 'undefined') {
  useEditorStore.subscribe(
    (state) => state.markdown,
    () => {
      // 自動儲存到 localStorage
      const state = useEditorStore.getState();
      if (state.autoSave.enabled) {
        state.saveToStorage();
      }
    }
  );
}