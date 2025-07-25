/**
 * 投影片相關的 TypeScript 型別定義
 */

import type { SlideTheme, Language } from './api';

// ============================================================================
// 基礎投影片型別
// ============================================================================

export interface Slide {
  id: string;
  index: number;
  title: string;
  content: string;
  rawMarkdown: string;
  type: SlideType;
  metadata: SlideContentMetadata;
  layout: SlideLayout;
  transitions?: SlideTransition;
  notes?: string;
  duration?: number; // 預計停留時間（秒）
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}

export type SlideType =
  | 'title' // 標題投影片
  | 'content' // 內容投影片
  | 'section' // 章節分隔投影片
  | 'code' // 程式碼投影片
  | 'image' // 圖片投影片
  | 'quote' // 引用投影片
  | 'comparison' // 比較投影片
  | 'timeline' // 時間軸投影片
  | 'summary' // 總結投影片
  | 'thankyou'; // 感謝投影片

export interface SlideContentMetadata {
  wordCount: number;
  characterCount: number;
  bulletPoints: number;
  codeBlocks: CodeBlock[];
  images: ImageReference[];
  links: LinkReference[];
  hasLists: boolean;
  hasTable: boolean;
  estimatedReadingTime: number; // 秒
  complexity: 'simple' | 'moderate' | 'complex';
}

export interface CodeBlock {
  id: string;
  language: string;
  code: string;
  startLine: number;
  endLine: number;
  isExecutable?: boolean;
  highlightLines?: number[];
  filename?: string;
}

export interface ImageReference {
  id: string;
  src: string;
  alt: string;
  title?: string;
  width?: number;
  height?: number;
  position: 'left' | 'center' | 'right' | 'full';
  caption?: string;
}

export interface LinkReference {
  id: string;
  url: string;
  text: string;
  title?: string;
  isExternal: boolean;
}

// ============================================================================
// 投影片佈局和樣式
// ============================================================================

export type SlideLayout =
  | 'title-only' // 僅標題
  | 'title-content' // 標題 + 內容
  | 'two-column' // 雙欄
  | 'three-column' // 三欄
  | 'image-left' // 圖片在左
  | 'image-right' // 圖片在右
  | 'image-background' // 背景圖片
  | 'full-image' // 全螢幕圖片
  | 'code-focus' // 程式碼專用
  | 'quote-center' // 居中引用
  | 'comparison' // 對比佈局
  | 'timeline' // 時間軸佈局
  | 'blank'; // 空白佈局

export interface SlideStyle {
  theme: SlideTheme;
  colors: ColorScheme;
  typography: Typography;
  spacing: Spacing;
  borders: BorderStyle;
  shadows: ShadowStyle;
  animations?: AnimationConfig;
}

export interface ColorScheme {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  surface: string;
  text: {
    primary: string;
    secondary: string;
    muted: string;
    inverse: string;
  };
  semantic: {
    success: string;
    warning: string;
    error: string;
    info: string;
  };
}

export interface Typography {
  fontFamily: {
    heading: string;
    body: string;
    mono: string;
  };
  fontSize: {
    xs: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
    xxl: string;
    xxxl: string;
  };
  fontWeight: {
    light: number;
    normal: number;
    medium: number;
    semibold: number;
    bold: number;
  };
  lineHeight: {
    tight: number;
    normal: number;
    relaxed: number;
  };
  letterSpacing: {
    tight: string;
    normal: string;
    wide: string;
  };
}

export interface Spacing {
  xs: string;
  sm: string;
  md: string;
  lg: string;
  xl: string;
  xxl: string;
}

export interface BorderStyle {
  width: {
    thin: string;
    normal: string;
    thick: string;
  };
  radius: {
    none: string;
    sm: string;
    md: string;
    lg: string;
    full: string;
  };
  style: 'solid' | 'dashed' | 'dotted';
}

export interface ShadowStyle {
  sm: string;
  md: string;
  lg: string;
  xl: string;
}

// ============================================================================
// 動畫和轉場效果
// ============================================================================

export interface SlideTransition {
  enter: TransitionConfig;
  exit: TransitionConfig;
  duration: number; // 毫秒
  easing: EasingFunction;
}

export interface TransitionConfig {
  type: TransitionType;
  direction?: TransitionDirection;
  customCSS?: string;
}

export type TransitionType =
  | 'fade'
  | 'slide'
  | 'zoom'
  | 'flip'
  | 'cube'
  | 'push'
  | 'cover'
  | 'uncover'
  | 'none';

export type TransitionDirection = 'up' | 'down' | 'left' | 'right';

export type EasingFunction =
  | 'linear'
  | 'ease'
  | 'ease-in'
  | 'ease-out'
  | 'ease-in-out'
  | 'cubic-bezier';

export interface AnimationConfig {
  enabled: boolean;
  bulletPointDelay: number; // 毫秒
  imageLoadDelay: number;
  codeHighlightDelay: number;
  autoAdvance?: {
    enabled: boolean;
    duration: number; // 秒
    pauseOnHover: boolean;
  };
}

// ============================================================================
// 投影片集合和簡報
// ============================================================================

export interface Presentation {
  id: string;
  title: string;
  description?: string;
  author: PresentationAuthor;
  slides: Slide[];
  metadata: PresentationMetadata;
  settings: PresentationSettings;
  theme: SlideTheme;
  createdAt: string;
  updatedAt: string;
  version: string;
  tags: string[];
  isPublic: boolean;
  shareSettings?: ShareSettings;
}

export interface PresentationAuthor {
  name: string;
  email?: string;
  avatar?: string;
  bio?: string;
  website?: string;
}

export interface PresentationMetadata {
  totalSlides: number;
  totalWordCount: number;
  estimatedDuration: number; // 分鐘
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  category: string[];
  language: Language;
  targetAudience: string;
  lastEditedBy?: string;
  changeHistory: ChangeHistoryEntry[];
}

export interface ChangeHistoryEntry {
  timestamp: string;
  user: string;
  action: 'create' | 'update' | 'delete' | 'reorder';
  details: string;
  slideId?: string;
}

export interface PresentationSettings {
  autoAdvance: boolean;
  slideTimer: boolean;
  showProgressBar: boolean;
  showSlideNumbers: boolean;
  enableKeyboardNavigation: boolean;
  enableMouseNavigation: boolean;
  enableTouchNavigation: boolean;
  fullscreenMode: boolean;
  speakerNotes: boolean;
  backgroundMusic?: {
    enabled: boolean;
    src: string;
    volume: number;
    loop: boolean;
  };
}

export interface ShareSettings {
  isPublic: boolean;
  allowComments: boolean;
  allowDownload: boolean;
  allowEmbed: boolean;
  passwordProtected: boolean;
  password?: string;
  expiresAt?: string;
  permissions: {
    view: boolean;
    comment: boolean;
    edit: boolean;
    admin: boolean;
  };
}

// ============================================================================
// 模板和預設值
// ============================================================================

export interface SlideTemplate {
  id: string;
  name: string;
  description: string;
  category: TemplateCategory;
  layout: SlideLayout;
  style: Partial<SlideStyle>;
  defaultContent: {
    title: string;
    content: string;
  };
  placeholders: TemplatePlaceholder[];
  previewImage: string;
  isCustom: boolean;
  createdBy?: string;
  usageCount: number;
  rating: number;
  tags: string[];
}

export type TemplateCategory =
  | 'business'
  | 'education'
  | 'technology'
  | 'science'
  | 'marketing'
  | 'creative'
  | 'minimal'
  | 'academic';

export interface TemplatePlaceholder {
  id: string;
  type: 'text' | 'image' | 'code' | 'chart';
  label: string;
  description?: string;
  required: boolean;
  defaultValue?: string;
  validation?: {
    minLength?: number;
    maxLength?: number;
    pattern?: string;
  };
}

// ============================================================================
// 輸出和匯出相關
// ============================================================================

export interface ExportConfiguration {
  format: 'pdf' | 'pptx' | 'html' | 'png' | 'svg';
  quality: 'low' | 'medium' | 'high';
  includeNotes: boolean;
  includeAnimations: boolean;
  slideRange?: {
    start: number;
    end: number;
  };
  customCSS?: string;
  watermark?: WatermarkConfig;
}

export interface WatermarkConfig {
  enabled: boolean;
  text?: string;
  image?: string;
  position:
    | 'top-left'
    | 'top-right'
    | 'bottom-left'
    | 'bottom-right'
    | 'center';
  opacity: number;
  size: 'small' | 'medium' | 'large';
}

// ============================================================================
// 互動和註解
// ============================================================================

export interface SlideComment {
  id: string;
  slideId: string;
  author: {
    name: string;
    avatar?: string;
  };
  content: string;
  position?: {
    x: number;
    y: number;
  };
  type: 'general' | 'suggestion' | 'question' | 'issue';
  status: 'open' | 'resolved' | 'dismissed';
  createdAt: string;
  updatedAt?: string;
  replies: CommentReply[];
}

export interface CommentReply {
  id: string;
  author: {
    name: string;
    avatar?: string;
  };
  content: string;
  createdAt: string;
}

export interface SlideAnnotation {
  id: string;
  slideId: string;
  type: 'highlight' | 'arrow' | 'circle' | 'rectangle' | 'text';
  position: {
    x: number;
    y: number;
    width?: number;
    height?: number;
  };
  style: {
    color: string;
    strokeWidth: number;
    opacity: number;
  };
  content?: string;
  createdBy: string;
  createdAt: string;
}

// ============================================================================
// 型別守衛和工具函數
// ============================================================================

export type SlidePartial = Partial<Slide> & Pick<Slide, 'id' | 'content'>;

export type PresentationSummary = Pick<
  Presentation,
  'id' | 'title' | 'author' | 'createdAt' | 'updatedAt' | 'tags' | 'isPublic'
> & {
  slideCount: number;
  previewImage?: string;
};

// 輔助型別：提取投影片的內容型別
export type SlideContent = Pick<Slide, 'title' | 'content' | 'rawMarkdown'>;

// 輔助型別：投影片導航資訊
export interface SlideNavigation {
  currentIndex: number;
  totalSlides: number;
  hasNext: boolean;
  hasPrevious: boolean;
  nextSlide?: Slide;
  previousSlide?: Slide;
}

// 輔助型別：投影片搜尋結果
export interface SlideSearchResult {
  slide: Slide;
  matches: Array<{
    field: keyof Slide;
    snippet: string;
    highlightPositions: Array<{ start: number; end: number }>;
  }>;
  relevanceScore: number;
}
