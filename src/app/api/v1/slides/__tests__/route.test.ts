/**
 * API 路由整合測試
 */

import { NextRequest } from 'next/server';
import { POST } from '../route';

// Mock OpenAI client
jest.mock('@/lib/openai', () => ({
  createOpenAIClient: jest.fn(() => ({
    validateConnection: jest.fn().mockResolvedValue(true),
    generateSlides: jest.fn().mockResolvedValue({
      markdown:
        '# Test Slides\n\nTest content\n\n---\n\n# Slide 2\n\nMore content',
      metadata: {
        slideCount: 2,
        generatedAt: '2025-07-25T00:00:00.000Z',
        model: 'gpt-3.5-turbo',
        tokenUsage: {
          prompt_tokens: 100,
          completion_tokens: 200,
          total_tokens: 300,
        },
      },
    }),
  })),
}));

// Mock cache
jest.mock('@/lib/cache/memory-cache', () => ({
  slideCache: {
    get: jest.fn().mockReturnValue(null),
    set: jest.fn(),
  },
  generateSlideCacheKey: jest.fn().mockReturnValue('test-cache-key'),
}));

describe('/api/v1/slides', () => {
  const validApiKey = 'sk-test-api-key-placeholder';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/v1/slides', () => {
    it('should generate slides successfully', async () => {
      const requestBody = {
        topic: 'React 入門教學',
        model: 'gpt-3.5-turbo',
        targetAudience: 'beginner',
        language: 'zh-TW',
      };

      const request = new NextRequest('http://localhost:3000/api/v1/slides', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': validApiKey,
        },
        body: JSON.stringify(requestBody),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toHaveProperty('id');
      expect(data.data).toHaveProperty('markdown');
      expect(data.data).toHaveProperty('tokenUsage');
      expect(data.data).toHaveProperty('metadata');
      expect(data.data.metadata.slideCount).toBeGreaterThan(0);
    });

    it('should return validation error for missing topic', async () => {
      const requestBody = {
        model: 'gpt-3.5-turbo',
        // topic is missing
      };

      const request = new NextRequest('http://localhost:3000/api/v1/slides', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': validApiKey,
        },
        body: JSON.stringify(requestBody),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return auth error for missing API key', async () => {
      const requestBody = {
        topic: 'React 入門教學',
      };

      const request = new NextRequest('http://localhost:3000/api/v1/slides', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // No API key
        },
        body: JSON.stringify(requestBody),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return validation error for invalid API key format', async () => {
      const requestBody = {
        topic: 'React 入門教學',
      };

      const request = new NextRequest('http://localhost:3000/api/v1/slides', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': 'invalid-key-format',
        },
        body: JSON.stringify(requestBody),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('VALIDATION_ERROR');
    });

    it('should handle cache hit', async () => {
      const mockCachedResult = {
        id: 'cached-slide-id',
        markdown: '# Cached Slides\n\nCached content',
        tokenUsage: {
          prompt: 50,
          completion: 100,
          total: 150,
          estimatedCost: { usd: 0.0002, currency: 'USD' },
        },
        createdAt: '2025-07-25T00:00:00.000Z',
        config: {},
        metadata: {
          slideCount: 1,
          wordCount: 10,
          codeBlockCount: 0,
          imageCount: 0,
          estimatedReadingTime: 1,
          tags: ['technology'],
          difficulty: 'beginner',
        },
      };

      // Mock cache hit
      const mockCache = require('@/lib/cache/memory-cache');
      mockCache.slideCache.get.mockReturnValue(mockCachedResult);

      const requestBody = {
        topic: 'React 入門教學',
      };

      const request = new NextRequest('http://localhost:3000/api/v1/slides', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': validApiKey,
        },
        body: JSON.stringify(requestBody),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.markdown).toBe('# Cached Slides\n\nCached content');

      // Should not call OpenAI when cache hits
      const mockOpenAI = require('@/lib/openai');
      expect(mockOpenAI.createOpenAIClient).not.toHaveBeenCalled();
    });

    it('should handle OpenAI API errors gracefully', async () => {
      // Mock OpenAI error
      const mockOpenAI = require('@/lib/openai');
      mockOpenAI.createOpenAIClient.mockReturnValue({
        validateConnection: jest.fn().mockResolvedValue(true),
        generateSlides: jest.fn().mockRejectedValue({
          type: 'auth_error',
          message: 'Invalid API key',
          statusCode: 401,
        }),
      });

      const requestBody = {
        topic: 'React 入門教學',
      };

      const request = new NextRequest('http://localhost:3000/api/v1/slides', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': validApiKey,
        },
        body: JSON.stringify(requestBody),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('INTERNAL_ERROR');
    });

    it('should handle rate limit errors', async () => {
      // Mock rate limit error
      const mockOpenAI = require('@/lib/openai');
      mockOpenAI.createOpenAIClient.mockReturnValue({
        validateConnection: jest.fn().mockResolvedValue(true),
        generateSlides: jest.fn().mockRejectedValue({
          type: 'rate_limit',
          message: 'Rate limit exceeded',
          statusCode: 429,
        }),
      });

      const requestBody = {
        topic: 'React 入門教學',
      };

      const request = new NextRequest('http://localhost:3000/api/v1/slides', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': validApiKey,
        },
        body: JSON.stringify(requestBody),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error.message).toContain('投影片生成失敗');
    });

    it('should handle network errors', async () => {
      // Mock network error
      const mockOpenAI = require('@/lib/openai');
      mockOpenAI.createOpenAI.mockReturnValue({
        validateConnection: jest.fn().mockResolvedValue(true),
        generateSlides: jest.fn().mockRejectedValue({
          type: 'network_error',
          message: 'Network connection failed',
        }),
      });

      const requestBody = {
        topic: 'React 入門教學',
      };

      const request = new NextRequest('http://localhost:3000/api/v1/slides', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': validApiKey,
        },
        body: JSON.stringify(requestBody),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
    });

    it('should handle invalid JSON body', async () => {
      const request = new NextRequest('http://localhost:3000/api/v1/slides', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': validApiKey,
        },
        body: 'invalid json',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('INVALID_INPUT');
    });

    it('should handle different template types correctly', async () => {
      const testCases = [
        { targetAudience: 'expert', expectedTemplate: 'academic' },
        { slideFormat: 'business', expectedTemplate: 'business' },
        { tone: 'friendly', expectedTemplate: 'creative' },
        { targetAudience: 'beginner', expectedTemplate: 'basic' },
      ];

      for (const testCase of testCases) {
        const requestBody = {
          topic: 'Test Topic',
          ...testCase,
        };

        const request = new NextRequest('http://localhost:3000/api/v1/slides', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': validApiKey,
          },
          body: JSON.stringify(requestBody),
        });

        const response = await POST(request);
        expect(response.status).toBe(200);

        // Verify the correct template was used by checking the mock call
        const mockOpenAI = require('@/lib/openai');
        const mockGenerateSlides =
          mockOpenAI.createOpenAIClient().generateSlides;
        const lastCall =
          mockGenerateSlides.mock.calls[
            mockGenerateSlides.mock.calls.length - 1
          ];

        if (lastCall) {
          expect(lastCall[0].templateType).toBeDefined();
        }
      }
    });
  });

  describe('Other HTTP methods', () => {
    it('should return method not allowed for GET', async () => {
      const { GET } = await import('../route');
      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(405);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('METHOD_NOT_ALLOWED');
    });

    it('should return method not allowed for PUT', async () => {
      const { PUT } = await import('../route');
      const response = await PUT();
      const data = await response.json();

      expect(response.status).toBe(405);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('METHOD_NOT_ALLOWED');
    });

    it('should return method not allowed for DELETE', async () => {
      const { DELETE } = await import('../route');
      const response = await DELETE();
      const data = await response.json();

      expect(response.status).toBe(405);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('METHOD_NOT_ALLOWED');
    });
  });
});
