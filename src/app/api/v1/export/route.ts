/**
 * 匯出 API 路由 - 使用統一的型別系統
 */

import { NextRequest, NextResponse } from 'next/server';
import type { ExportRequest } from '@/types/api';
import {
  CommonErrorResponses,
  createValidationErrorResponse,
  generateRequestId,
  extractRequestId,
} from '@/lib/api/responses';
import {
  executeMiddlewares,
  exportMiddlewares,
  logRequest,
  addCorsHeaders,
} from '@/lib/api/middleware';
import { validateExportRequest } from '@/lib/validation';
import { DEFAULT_CONFIG } from '@/lib/constants';

// ============================================================================
// 匯出功能實作
// ============================================================================

/**
 * 生成 PPTX 檔案（模擬實作）
 */
async function generatePPTX(request: ExportRequest): Promise<Buffer> {
  const slideCount = request.markdown.split('---').length - 1;

  const mockContent = `模擬的 PPTX 檔案內容
===================

檔案資訊：
- 檔案名稱: ${request.filename || 'slides'}.pptx
- 主題: ${request.theme || DEFAULT_CONFIG.EXPORT.THEME}
- 投影片數量: ${slideCount}
- 生成時間: ${new Date().toISOString()}

匯出選項：
- 包含備註: ${request.options?.includeNotes ? '是' : '否'}
- 投影片尺寸: ${request.options?.slideSize || DEFAULT_CONFIG.EXPORT.SLIDE_SIZE}
- 字體大小: ${request.options?.fontSize || DEFAULT_CONFIG.EXPORT.FONT_SIZE}
- 品質: ${request.options?.quality || DEFAULT_CONFIG.EXPORT.QUALITY}

Markdown 內容預覽:
${request.markdown.substring(0, 500)}${request.markdown.length > 500 ? '...' : ''}

這是一個模擬的 PPTX 檔案，實際實作時會使用 pptxgenjs 生成真正的 PowerPoint 檔案。`;

  return Buffer.from(mockContent, 'utf-8');
}

/**
 * 生成 PDF 檔案（模擬實作）
 */
async function generatePDF(request: ExportRequest): Promise<Buffer> {
  const slideCount = request.markdown.split('---').length - 1;

  const mockContent = `%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj

模擬的 PDF 檔案內容
- 檔案: ${request.filename || 'slides'}.pdf
- 主題: ${request.theme || DEFAULT_CONFIG.EXPORT.THEME}  
- 投影片: ${slideCount} 張
- 生成: ${new Date().toISOString()}

實際實作時會使用 Puppeteer 或類似工具生成真正的 PDF。`;

  return Buffer.from(mockContent, 'utf-8');
}

/**
 * 生成 HTML 檔案
 */
async function generateHTML(request: ExportRequest): Promise<Buffer> {
  const slides = request.markdown.split('---').filter(slide => slide.trim());
  const theme = request.theme || DEFAULT_CONFIG.EXPORT.THEME;

  const htmlContent = `<!DOCTYPE html>
<html lang="zh-TW">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${request.filename || 'slides'}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: ${theme === 'dark' ? '#f1f5f9' : '#1e293b'};
            background: ${theme === 'dark' ? '#0f172a' : '#ffffff'};
        }
        
        .presentation {
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
        }
        
        .slide {
            min-height: 100vh;
            padding: 60px 40px;
            border-bottom: 2px solid ${theme === 'dark' ? '#334155' : '#e2e8f0'};
            page-break-after: always;
            display: flex;
            flex-direction: column;
            justify-content: center;
        }
        
        .slide:last-child {
            page-break-after: auto;
            border-bottom: none;
        }
        
        .slide h1 {
            font-size: 3rem;
            font-weight: 700;
            margin-bottom: 2rem;
            color: ${theme === 'dark' ? '#60a5fa' : '#3b82f6'};
            text-align: center;
        }
        
        .slide h2 {
            font-size: 2.5rem;
            font-weight: 600;
            margin-bottom: 1.5rem;
            color: ${theme === 'dark' ? '#60a5fa' : '#3b82f6'};
        }
        
        .slide h3 {
            font-size: 2rem;
            font-weight: 500;
            margin-bottom: 1rem;
            color: ${theme === 'dark' ? '#94a3b8' : '#64748b'};
        }
        
        .slide p {
            font-size: 1.25rem;
            margin-bottom: 1rem;
            max-width: 800px;
        }
        
        .slide ul, .slide ol {
            font-size: 1.25rem;
            margin: 1rem 0;
            padding-left: 2rem;
        }
        
        .slide li {
            margin-bottom: 0.5rem;
        }
        
        .slide pre {
            background: ${theme === 'dark' ? '#1e293b' : '#f8fafc'};
            border: 1px solid ${theme === 'dark' ? '#334155' : '#e2e8f0'};
            border-radius: 8px;
            padding: 1.5rem;
            margin: 1.5rem 0;
            overflow-x: auto;
            font-size: 1rem;
        }
        
        .slide code {
            background: ${theme === 'dark' ? '#1e293b' : '#f1f5f9'};
            padding: 0.25rem 0.5rem;
            border-radius: 4px;
            font-family: 'SF Mono', Monaco, 'Cascadia Code', monospace;
            font-size: 0.9em;
        }
        
        .slide blockquote {
            border-left: 4px solid ${theme === 'dark' ? '#60a5fa' : '#3b82f6'};
            padding: 1rem 2rem;
            margin: 1.5rem 0;
            background: ${theme === 'dark' ? '#1e293b' : '#f8fafc'};
            font-style: italic;
        }
        
        .slide img {
            max-width: 100%;
            height: auto;
            margin: 1rem 0;
            border-radius: 8px;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }
        
        .slide-number {
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: ${theme === 'dark' ? '#374151' : '#f3f4f6'};
            color: ${theme === 'dark' ? '#d1d5db' : '#6b7280'};
            padding: 0.5rem 1rem;
            border-radius: 20px;
            font-size: 0.875rem;
            font-weight: 500;
        }
        
        .footer {
            text-align: center;
            padding: 40px 20px;
            border-top: 1px solid ${theme === 'dark' ? '#334155' : '#e2e8f0'};
            color: ${theme === 'dark' ? '#94a3b8' : '#64748b'};
            font-size: 0.875rem;
        }
        
        @media print {
            .slide {
                page-break-after: always;
            }
            .slide-number {
                display: none;
            }
        }
        
        @media (max-width: 768px) {
            .slide {
                padding: 40px 20px;
            }
            .slide h1 {
                font-size: 2rem;
            }
            .slide h2 {
                font-size: 1.75rem;
            }
            .slide h3 {
                font-size: 1.5rem;
            }
            .slide p, .slide ul, .slide ol {
                font-size: 1rem;
            }
        }
    </style>
</head>
<body>
    <div class="presentation">
        ${slides
          .map((slide, index) => {
            const processedSlide = slide
              .trim()
              .replace(/\n/g, '<br>')
              .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
              .replace(/\*(.*?)\*/g, '<em>$1</em>')
              .replace(/`([^`]+)`/g, '<code>$1</code>')
              .replace(/^### (.*$)/gim, '<h3>$1</h3>')
              .replace(/^## (.*$)/gim, '<h2>$1</h2>')
              .replace(/^# (.*$)/gim, '<h1>$1</h1>')
              .replace(/^- (.*$)/gim, '<li>$1</li>')
              .replace(/(<li>.*<\/li>)/gm, '<ul>$1</ul>')
              .replace(/> (.*$)/gim, '<blockquote>$1</blockquote>');

            return `<div class="slide">
            <div class="slide-content">
              ${processedSlide}
            </div>
            <div class="slide-number">投影片 ${index + 1} / ${slides.length}</div>
          </div>`;
          })
          .join('\n')}
    </div>
    
    <footer class="footer">
        <p>使用 Markdown 投影片產生器生成 - ${new Date().toLocaleString('zh-TW')}</p>
        <p>主題: ${theme} | 格式: HTML | 投影片數量: ${slides.length}</p>
        ${request.options?.headerFooter?.footer ? `<p>${request.options.headerFooter.footer}</p>` : ''}
    </footer>
    
    <script>
        // 鍵盤導航
        document.addEventListener('keydown', function(e) {
            const slides = document.querySelectorAll('.slide');
            let currentSlide = 0;
            
            // 找到目前可見的投影片
            slides.forEach((slide, index) => {
                const rect = slide.getBoundingClientRect();
                if (rect.top <= window.innerHeight / 2 && rect.bottom >= window.innerHeight / 2) {
                    currentSlide = index;
                }
            });
            
            if (e.key === 'ArrowRight' || e.key === ' ') {
                e.preventDefault();
                if (currentSlide < slides.length - 1) {
                    slides[currentSlide + 1].scrollIntoView({ behavior: 'smooth' });
                }
            } else if (e.key === 'ArrowLeft') {
                e.preventDefault();
                if (currentSlide > 0) {
                    slides[currentSlide - 1].scrollIntoView({ behavior: 'smooth' });
                }
            }
        });
        
        // 點擊導航
        document.addEventListener('click', function(e) {
            if (e.target.closest('.slide')) {
                const slides = document.querySelectorAll('.slide');
                let currentSlide = 0;
                
                slides.forEach((slide, index) => {
                    const rect = slide.getBoundingClientRect();
                    if (rect.top <= window.innerHeight / 2 && rect.bottom >= window.innerHeight / 2) {
                        currentSlide = index;
                    }
                });
                
                if (e.clientX > window.innerWidth / 2) {
                    // 右半邊點擊，下一張
                    if (currentSlide < slides.length - 1) {
                        slides[currentSlide + 1].scrollIntoView({ behavior: 'smooth' });
                    }
                } else {
                    // 左半邊點擊，上一張
                    if (currentSlide > 0) {
                        slides[currentSlide - 1].scrollIntoView({ behavior: 'smooth' });
                    }
                }
            }
        });
    </script>
</body>
</html>`;

  return Buffer.from(htmlContent, 'utf-8');
}

/**
 * 生成 Markdown 檔案
 */
async function generateMarkdown(request: ExportRequest): Promise<Buffer> {
  // 為匯出添加元資料標頭
  const metadata = `---
title: ${request.filename || 'slides'}
theme: ${request.theme || DEFAULT_CONFIG.EXPORT.THEME}
generated: ${new Date().toISOString()}
slideCount: ${request.markdown.split('---').length - 1}
---

`;

  const content = metadata + request.markdown;
  return Buffer.from(content, 'utf-8');
}

/**
 * 根據格式生成對應的檔案
 */
async function generateFile(
  request: ExportRequest
): Promise<{ buffer: Buffer; contentType: string; extension: string }> {
  let buffer: Buffer;
  let contentType: string;
  let extension: string;

  switch (request.format) {
    case 'pptx':
      buffer = await generatePPTX(request);
      contentType =
        'application/vnd.openxmlformats-officedocument.presentationml.presentation';
      extension = 'pptx';
      break;

    case 'pdf':
      buffer = await generatePDF(request);
      contentType = 'application/pdf';
      extension = 'pdf';
      break;

    case 'html':
      buffer = await generateHTML(request);
      contentType = 'text/html';
      extension = 'html';
      break;

    case 'markdown':
      buffer = await generateMarkdown(request);
      contentType = 'text/markdown';
      extension = 'md';
      break;

    default:
      throw new Error(`不支援的匯出格式: ${request.format}`);
  }

  return { buffer, contentType, extension };
}

// ============================================================================
// API 路由處理器
// ============================================================================

/**
 * POST 方法處理器 - 匯出檔案
 */
export async function POST(request: NextRequest) {
  const requestId = extractRequestId(request.headers) || generateRequestId();

  try {
    // 記錄請求
    logRequest(request);

    // 執行中介層驗證
    const middlewareResponse = await executeMiddlewares(
      request,
      exportMiddlewares
    );
    if (middlewareResponse) {
      return middlewareResponse;
    }

    // 解析請求內容
    let requestData;
    try {
      requestData = await request.json();
    } catch (error) {
      return addCorsHeaders(
        CommonErrorResponses.invalidInput(
          '無效的 JSON 格式',
          { parseError: error instanceof Error ? error.message : '未知錯誤' },
          undefined,
          requestId
        )
      );
    }

    // 驗證請求參數
    const validation = validateExportRequest(requestData);
    if (!validation.success) {
      return addCorsHeaders(
        createValidationErrorResponse(validation.errors, requestId)
      );
    }

    // 生成檔案
    const { buffer, contentType, extension } = await generateFile(
      validation.data
    );

    // 建立檔案名稱
    const baseFilename = validation.data.filename || `slides-${Date.now()}`;
    const filename = `${baseFilename}.${extension}`;

    // 建立回應標頭
    const headers = new Headers({
      'Content-Type': contentType,
      'Content-Disposition': `attachment; filename="${encodeURIComponent(filename)}"`,
      'Content-Length': buffer.length.toString(),
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      Pragma: 'no-cache',
      Expires: '0',
      'X-Generated-At': new Date().toISOString(),
      'X-Slide-Count': validation.data.markdown.split('---').length.toString(),
      'X-Export-Format': validation.data.format,
      'X-Request-ID': requestId,
    });

    // 建立並返回檔案回應
    const response = new NextResponse(buffer, {
      status: 200,
      headers,
    });

    return addCorsHeaders(response);
  } catch (error) {
    console.error('檔案匯出 API 錯誤:', error);
    return addCorsHeaders(
      CommonErrorResponses.internalError(
        '檔案匯出失敗',
        process.env.NODE_ENV === 'development'
          ? { error: error instanceof Error ? error.message : '未知錯誤' }
          : undefined,
        requestId
      )
    );
  }
}

// ============================================================================
// 其他 HTTP 方法處理器
// ============================================================================

export async function GET() {
  return addCorsHeaders(CommonErrorResponses.methodNotAllowed('GET'));
}

export async function PUT() {
  return addCorsHeaders(CommonErrorResponses.methodNotAllowed('PUT'));
}

export async function DELETE() {
  return addCorsHeaders(CommonErrorResponses.methodNotAllowed('DELETE'));
}

export async function PATCH() {
  return addCorsHeaders(CommonErrorResponses.methodNotAllowed('PATCH'));
}
