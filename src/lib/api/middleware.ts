import { NextRequest, NextResponse } from 'next/server';
import type { RateLimitConfig } from '@/types/api';
import { CommonErrorResponses } from './responses';
import { RATE_LIMITS, CORS_CONFIG, LIMITS } from '@/lib/constants';

// CORS 配置
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': CORS_CONFIG.ALLOWED_METHODS.join(', '),
  'Access-Control-Allow-Headers': CORS_CONFIG.ALLOWED_HEADERS.join(', '),
  'Access-Control-Max-Age': CORS_CONFIG.MAX_AGE.toString(),
};

// 簡單的記憶體速率限制（生產環境應使用 Redis）
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

// 清理過期的速率限制記錄
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of rateLimitStore.entries()) {
    if (now > value.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}, 60000); // 每分鐘清理一次

// CORS 中介層
export function corsMiddleware(request: NextRequest): NextResponse | null {
  // 處理 OPTIONS 預檢請求
  if (request.method === 'OPTIONS') {
    return new NextResponse(null, {
      status: 200,
      headers: CORS_HEADERS,
    });
  }

  return null; // 不攔截，繼續處理請求
}

// 速率限制中介層
export function rateLimitMiddleware(
  request: NextRequest,
  config: RateLimitConfig = RATE_LIMITS.SLIDE_GENERATION!
): NextResponse | null {
  const clientIp =
    request.headers.get('x-forwarded-for')?.split(',')[0] ||
    request.headers.get('x-real-ip') ||
    'unknown';

  const key = `rate_limit_${clientIp}`;
  const now = Date.now();
  const resetTime = now + config.windowMs;

  const record = rateLimitStore.get(key);

  if (!record || now > record.resetTime) {
    // 新的時間窗口或第一次請求
    rateLimitStore.set(key, { count: 1, resetTime });
    return null; // 允許請求
  }

  if (record.count >= config.maxRequests) {
    // 超過速率限制
    const retryAfter = Math.ceil((record.resetTime - now) / 1000);
    const response = CommonErrorResponses.rateLimit(
      `請求過於頻繁，請在 ${retryAfter} 秒後重試`
    );

    response.headers.set('Retry-After', retryAfter.toString());
    response.headers.set('X-RateLimit-Limit', config.maxRequests.toString());
    response.headers.set('X-RateLimit-Remaining', '0');
    response.headers.set('X-RateLimit-Reset', record.resetTime.toString());

    return response;
  }

  // 增加計數
  record.count++;
  rateLimitStore.set(key, record);

  return null; // 允許請求
}

// 請求日誌記錄
export function logRequest(request: NextRequest): void {
  const timestamp = new Date().toISOString();
  const method = request.method;
  const url = request.url;
  const userAgent = request.headers.get('user-agent') || 'unknown';
  const clientIp =
    request.headers.get('x-forwarded-for')?.split(',')[0] ||
    request.headers.get('x-real-ip') ||
    'unknown';

  console.log(
    `[${timestamp}] ${method} ${url} - IP: ${clientIp} - UA: ${userAgent}`
  );
}

// API Key 驗證中介層（用於需要 OpenAI API Key 的端點）
export function validateApiKeyMiddleware(
  request: NextRequest
): NextResponse | null {
  const apiKey =
    request.headers.get('x-api-key') ||
    request.headers.get('authorization')?.replace('Bearer ', '');

  if (!apiKey) {
    return CommonErrorResponses.missingApiKey();
  }

  // 基本 API Key 格式驗證（OpenAI API Key 通常以 'sk-' 開頭）
  if (!apiKey.startsWith('sk-') || apiKey.length < 20) {
    return CommonErrorResponses.invalidInput('無效的 API Key 格式');
  }

  return null; // API Key 有效，繼續處理
}

// 請求大小限制中介層
export async function requestSizeLimitMiddleware(
  request: NextRequest,
  maxSizeBytes: number = LIMITS.REQUEST.MAX_SIZE
): Promise<NextResponse | null> {
  const contentLength = request.headers.get('content-length');

  if (contentLength && parseInt(contentLength) > maxSizeBytes) {
    return CommonErrorResponses.invalidInput(
      `請求內容過大，最大允許 ${Math.round(maxSizeBytes / 1024)} KB`
    );
  }

  return null;
}

// 組合中介層執行器
export async function executeMiddlewares(
  request: NextRequest,
  middlewares: Array<
    (request: NextRequest) => NextResponse | Promise<NextResponse | null> | null
  >
): Promise<NextResponse | null> {
  for (const middleware of middlewares) {
    const result = await middleware(request);
    if (result) {
      // 添加 CORS 標頭到所有回應
      Object.entries(CORS_HEADERS).forEach(([key, value]) => {
        result.headers.set(key, value);
      });
      return result;
    }
  }
  return null;
}

// 為回應添加 CORS 標頭
export function addCorsHeaders(response: NextResponse): NextResponse {
  Object.entries(CORS_HEADERS).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
  return response;
}

// 預定義的中介層組合
export const slideGenerationMiddlewares = [
  corsMiddleware,
  (req: NextRequest) => rateLimitMiddleware(req, RATE_LIMITS.SLIDE_GENERATION),
  (req: NextRequest) =>
    requestSizeLimitMiddleware(req, LIMITS.REQUEST.MAX_SIZE),
];

export const exportMiddlewares = [
  corsMiddleware,
  (req: NextRequest) => rateLimitMiddleware(req, RATE_LIMITS.EXPORT),
  (req: NextRequest) =>
    requestSizeLimitMiddleware(req, LIMITS.REQUEST.MAX_EXPORT_SIZE),
];
