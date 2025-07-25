/**
 * 投影片生成 API 路由 - 整合 OpenAI 服務
 */

import { NextRequest } from 'next/server';
import type {
  SlideGenerationRequest,
  SlideGenerationResponse,
} from '@/types/api';
import {
  createSuccessResponse,
  CommonErrorResponses,
  createValidationErrorResponse,
  generateRequestId,
  extractRequestId,
} from '@/lib/api/responses';
import {
  executeMiddlewares,
  slideGenerationMiddlewares,
  logRequest,
  addCorsHeaders,
} from '@/lib/api/middleware';
import {
  validateSlideGenerationRequest,
  validateApiKey,
} from '@/lib/validation';
import { DEFAULT_CONFIG } from '@/lib/constants';
import { createOpenAIClient } from '@/lib/openai';
import { slideCache, generateSlideCacheKey } from '@/lib/cache/memory-cache';

// ============================================================================
// 輔助函數
// 以下函數暫時保留以防需要回退到模擬模式
// ============================================================================

/**
 * 生成唯一的投影片 ID
 */
function generateSlideId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `sl_${timestamp}_${random}`;
}

/**
 * 使用 OpenAI 生成投影片
 */
async function generateSlides(
  request: SlideGenerationRequest,
  apiKey: string
): Promise<SlideGenerationResponse> {
  const slideId = generateSlideId();
  const createdAt = new Date().toISOString();

  // 使用預設值填充配置
  const config = {
    model: request.model || DEFAULT_CONFIG.SLIDE_GENERATION.MODEL,
    maxPages: request.maxPages || DEFAULT_CONFIG.SLIDE_GENERATION.MAX_PAGES,
    style: request.style || DEFAULT_CONFIG.SLIDE_GENERATION.THEME,
    includeCode:
      request.includeCode ?? DEFAULT_CONFIG.SLIDE_GENERATION.INCLUDE_CODE,
    includeImages:
      request.includeImages ?? DEFAULT_CONFIG.SLIDE_GENERATION.INCLUDE_IMAGES,
    language: request.language || DEFAULT_CONFIG.SLIDE_GENERATION.LANGUAGE,
    targetAudience:
      request.targetAudience || DEFAULT_CONFIG.SLIDE_GENERATION.TARGET_AUDIENCE,
    slideFormat:
      request.slideFormat || DEFAULT_CONFIG.SLIDE_GENERATION.SLIDE_FORMAT,
    tone: request.tone || DEFAULT_CONFIG.SLIDE_GENERATION.TONE,
  };

  // 生成快取鍵
  const cacheKey = generateSlideCacheKey(request.topic, {
    model: config.model,
    style: config.style,
    language: config.language,
    targetAudience: config.targetAudience,
    slideFormat: config.slideFormat,
    tone: config.tone,
  });

  console.log(`[API] 檢查快取: ${cacheKey.substring(0, 16)}...`);

  // 檢查快取
  const cachedResult = slideCache.get(cacheKey);
  if (cachedResult) {
    console.log('[API] 快取命中，返回快取結果');
    return {
      ...cachedResult,
      id: slideId, // 使用新的 ID
      createdAt, // 更新創建時間
    };
  }

  console.log('[API] 快取未命中，調用 OpenAI API');

  try {
    // 建立 OpenAI 客戶端
    const openaiClient = createOpenAIClient({ 
      apiKey,
      timeout: 45000, // 45 秒超時
    });

    // 驗證 API 連接
    const isValid = await openaiClient.validateConnection();
    if (!isValid) {
      throw new Error('OpenAI API 連接驗證失敗');
    }

    // 確定模板類型
    let templateType: 'basic' | 'academic' | 'business' | 'creative' = 'basic';
    
    if (config.targetAudience === 'expert' || config.slideFormat === 'academic') {
      templateType = 'academic';
    } else if (config.slideFormat === 'business' || config.tone === 'professional') {
      templateType = 'business';
    } else if (config.tone === 'friendly' || config.style === 'modern') {
      templateType = 'creative';
    }

    // 生成投影片
    const openaiResponse = await openaiClient.generateSlides({
      topic: request.topic,
      apiKey,
      templateType,
      options: {
        model: config.model === 'gpt-4o' ? 'gpt-4' : 
               config.model === 'gpt-4o-mini' ? 'gpt-3.5-turbo' :
               config.model || 'gpt-3.5-turbo',
        temperature: config.tone === 'professional' ? 0.3 : 0.7,
        max_tokens: config.maxPages && config.maxPages > 10 ? 2000 : 1500,
      }
    });

    // 計算投影片元資料
    const slideCount = openaiResponse.metadata.slideCount;
    const wordCount = openaiResponse.markdown.split(/\s+/).length;
    const codeBlockCount = (openaiResponse.markdown.match(/```/g) || []).length / 2;
    const imageCount = (openaiResponse.markdown.match(/!\[.*?\]\(.*?\)/g) || []).length;

    // 計算成本
    const tokenUsage = {
      prompt: openaiResponse.metadata.tokenUsage?.prompt_tokens || 0,
      completion: openaiResponse.metadata.tokenUsage?.completion_tokens || 0,
      total: openaiResponse.metadata.tokenUsage?.total_tokens || 0,
      estimatedCost: {
        usd: 0,
        currency: 'USD' as const,
      },
    };

    // 根據模型計算成本 (截至 2025年7月的價格)
    const modelPricing: Record<string, number> = {
      'gpt-3.5-turbo': 0.0015,  // $0.0015 per 1K tokens
      'gpt-4': 0.03,            // $0.03 per 1K tokens  
      'gpt-4o': 0.005,          // $0.005 per 1K tokens
      'gpt-4o-mini': 0.00015,   // $0.00015 per 1K tokens
    };

    const modelName = openaiResponse.metadata.model;
    const pricePerK = modelPricing[modelName] || modelPricing['gpt-3.5-turbo'] || 0.0015;
    tokenUsage.estimatedCost.usd = (tokenUsage.total / 1000) * pricePerK;

    const result: SlideGenerationResponse = {
      id: slideId,
      markdown: openaiResponse.markdown,
      tokenUsage,
      createdAt,
      config,
      metadata: {
        slideCount,
        wordCount,
        codeBlockCount,
        imageCount,
        estimatedReadingTime: Math.ceil(wordCount / 200),
        tags: extractTags(request.topic),
        difficulty: getDifficultyLevel(config.targetAudience),
        openaiMetadata: {
          model: openaiResponse.metadata.model,
          generatedAt: openaiResponse.metadata.generatedAt,
        }
      },
    };

    // 快取結果
    slideCache.set(cacheKey, result, 60 * 60 * 1000); // 1 小時快取
    console.log(`[API] 結果已快取: ${slideCount} 張投影片, ${tokenUsage.total} tokens`);

    return result;

  } catch (error) {
    console.error('[API] OpenAI 生成失敗:', error);
    
    // 如果是 OpenAI 錯誤，拋出具體錯誤信息
    if (error && typeof error === 'object' && 'type' in error) {
      const openaiError = error as { type: string; message: string; statusCode?: number };
      
      if (openaiError.type === 'auth_error') {
        throw new Error('OpenAI API Key 無效或已過期');
      } else if (openaiError.type === 'rate_limit') {
        throw new Error('OpenAI API 使用額度已達上限，請稍後再試');
      } else if (openaiError.type === 'network_error') {
        throw new Error('網路連接失敗，請檢查網路連接');
      } else {
        throw new Error(`OpenAI API 錯誤: ${openaiError.message}`);
      }
    }
    
    throw error;
  }
}

/**
 * 生成模擬 Markdown 內容
 */
/*
function generateMockMarkdown(
  request: SlideGenerationRequest,
  config: any
): string {
  const sections = [
    `---\n# ${request.topic}\n\n歡迎來到關於「${request.topic}」的${config.slideFormat === 'tutorial' ? '教學' : '簡報'}`,

    `---\n\n## 大綱\n\n- 簡介與背景\n- 核心概念解析\n- 實際應用案例${config.includeCode ? '\n- 程式碼範例與實作' : ''}${config.includeImages ? '\n- 視覺化展示' : ''}\n- 總結與展望`,

    `---\n\n## 簡介\n\n${request.topic} 是當今${getTechDomain(request.topic)}領域中的重要主題。\n\n**為什麼重要？**\n- 解決實際問題的關鍵技術\n- 提升效率和生產力\n- 符合現代發展趨勢`,

    `---\n\n## 核心概念\n\n讓我們深入了解 ${request.topic} 的核心概念：\n\n1. **基礎原理** - 理論基礎與基本概念\n2. **關鍵特性** - 主要功能與優勢\n3. **應用場景** - 實際使用情況與案例\n4. **最佳實踐** - 推薦的使用方法`,
  ];

  if (config.includeCode) {
    sections.push(
      `---\n\n## 程式碼範例\n\n以下是 ${request.topic} 的實際應用範例：\n\n\`\`\`javascript\n// ${request.topic} 實作範例\nfunction ${toCamelCase(request.topic)}Example() {\n  console.log('這是關於 ${request.topic} 的範例程式碼');\n  \n  // 核心邏輯實作\n  const result = performOperation({\n    topic: '${request.topic}',\n    config: { advanced: true }\n  });\n  \n  return result;\n}\n\n// 使用範例\nconst example = ${toCamelCase(request.topic)}Example();\nconsole.log('執行結果:', example);\n\`\`\``
    );
  }

  if (config.includeImages) {
    sections.push(
      `---\n\n## 視覺化展示\n\n![${request.topic} 架構圖](https://via.placeholder.com/600x400?text=${encodeURIComponent(request.topic)}+架構)\n\n*圖片說明：${request.topic} 的整體架構與流程*\n\n![實際應用案例](https://via.placeholder.com/500x300?text=應用案例)\n\n*展示實際使用情境與效果*`
    );
  }

  sections.push(
    `---\n\n## 實際應用\n\n${request.topic} 在以下領域有廣泛應用：\n\n- **${getApplicationDomain(request.topic)[0]}** - 提升工作效率\n- **${getApplicationDomain(request.topic)[1]}** - 優化使用者體驗\n- **${getApplicationDomain(request.topic)[2]}** - 降低開發成本\n\n> 💡 **小技巧**：選擇合適的工具和方法是成功的關鍵`
  );

  sections.push(
    `---\n\n## 總結\n\n通過今天的${config.slideFormat === 'tutorial' ? '教學' : '介紹'}，我們學習了：\n\n✅ ${request.topic} 的核心概念與原理\n✅ 實際應用場景與最佳實踐${config.includeCode ? '\n✅ 程式碼實作與技術細節' : ''}\n✅ 未來發展趨勢與機會\n\n**下一步行動**\n- 深入研究相關技術文件\n- 實際動手練習與實作\n- 持續關注最新發展動態`
  );

  if (config.tone === 'friendly') {
    sections.push(
      `---\n\n## 謝謝聆聽！ 🎉\n\n希望這次的分享對您有所幫助\n\n**有任何問題歡迎交流討論**\n\n📧 聯絡方式或 Q&A 時間`
    );
  } else {
    sections.push(
      `---\n\n## 謝謝\n\n感謝您的聆聽與參與\n\n如有疑問歡迎提出討論`
    );
  }

  return sections.join('\n\n');
}
*/

/**
 * 從主題提取標籤
 */
function extractTags(topic: string): string[] {
  const commonTags: Record<string, string[]> = {
    react: ['frontend', 'javascript', 'ui', 'web'],
    python: ['backend', 'programming', 'data', 'ai'],
    'machine learning': ['ai', 'data', 'python', 'algorithms'],
    docker: ['devops', 'containers', 'deployment'],
    typescript: ['frontend', 'javascript', 'types', 'web'],
    api: ['backend', 'integration', 'web', 'rest'],
  };

  const lowerTopic = topic.toLowerCase();
  for (const [key, tags] of Object.entries(commonTags)) {
    if (lowerTopic.includes(key)) {
      return tags;
    }
  }

  return ['technology', 'programming', 'development'];
}

/**
 * 獲取難度等級
 */
function getDifficultyLevel(
  audience: string
): 'beginner' | 'intermediate' | 'advanced' {
  switch (audience) {
    case 'beginner':
      return 'beginner';
    case 'advanced':
    case 'expert':
      return 'advanced';
    default:
      return 'intermediate';
  }
}


// ============================================================================
// API 路由處理器
// ============================================================================

/**
 * POST 方法處理器 - 生成投影片
 */
export async function POST(request: NextRequest) {
  const requestId = extractRequestId(request.headers) || generateRequestId();

  try {
    // 記錄請求
    logRequest(request);

    // 執行中介層驗證
    const middlewareResponse = await executeMiddlewares(
      request,
      slideGenerationMiddlewares
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
    const validation = validateSlideGenerationRequest(requestData);
    if (!validation.success) {
      return addCorsHeaders(
        createValidationErrorResponse(validation.errors, requestId)
      );
    }

    // 驗證 API Key
    const apiKey =
      request.headers.get('x-api-key') ||
      request.headers.get('authorization')?.replace('Bearer ', '');

    const apiKeyValidation = validateApiKey(apiKey);
    if (!apiKeyValidation.success) {
      return addCorsHeaders(
        createValidationErrorResponse(apiKeyValidation.errors, requestId)
      );
    }

    // 生成投影片
    const result = await generateSlides(validation.data, apiKeyValidation.data);

    // 返回成功回應
    return addCorsHeaders(createSuccessResponse(result, 200, requestId));
  } catch (error) {
    console.error('投影片生成 API 錯誤:', error);
    return addCorsHeaders(
      CommonErrorResponses.internalError(
        '投影片生成失敗',
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
