import { OpenAIClient, createOpenAIClient } from '../client';

// Mock fetch globally
global.fetch = jest.fn();

const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;

describe('OpenAIClient', () => {
  let client: OpenAIClient;
  const validApiKey = 'sk-test1234567890abcdef1234567890abcdef';
  const testTopic = 'Test Topic';

  beforeEach(() => {
    client = createOpenAIClient({ apiKey: validApiKey });
    mockFetch.mockClear();
  });

  afterEach(() => {
    jest.clearAllTimers();
  });

  describe('Constructor and Configuration', () => {
    it('should create client with valid API key', () => {
      const testClient = createOpenAIClient({ apiKey: validApiKey });
      expect(testClient).toBeInstanceOf(OpenAIClient);
    });

    it('should use default configuration values', () => {
      const config = client.getConfig();
      expect(config.baseURL).toBe('https://api.openai.com/v1');
      expect(config.defaultModel).toBe('gpt-3.5-turbo');
      expect(config.timeout).toBe(30000);
    });

    it('should accept custom configuration', () => {
      const customClient = createOpenAIClient({
        apiKey: validApiKey,
        baseURL: 'https://custom.openai.com/v1',
        defaultModel: 'gpt-4',
        timeout: 60000,
        retryAttempts: 5
      });
      
      const config = customClient.getConfig();
      expect(config.baseURL).toBe('https://custom.openai.com/v1');
      expect(config.defaultModel).toBe('gpt-4');
      expect(config.timeout).toBe(60000);
      expect(config.retryAttempts).toBe(5);
    });
  });

  describe('API Key Validation', () => {
    it('should throw validation error for empty API key', async () => {
      const invalidClient = createOpenAIClient({ apiKey: '' });
      
      await expect(invalidClient.generateCompletion('test')).rejects.toMatchObject({
        type: 'validation_error',
        message: 'API key is required'
      });
    });

    it('should throw validation error for invalid API key format', async () => {
      const invalidClient = createOpenAIClient({ apiKey: 'invalid-key' });
      
      await expect(invalidClient.generateCompletion('test')).rejects.toMatchObject({
        type: 'validation_error',
        message: 'Invalid API key format'
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle 401 authentication errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({
          error: { message: 'Invalid API key', code: 'invalid_api_key' }
        })
      } as Response);

      await expect(client.generateCompletion('test')).rejects.toMatchObject({
        type: 'auth_error',
        message: 'Invalid API key',
        code: 'invalid_api_key',
        statusCode: 401
      });
    });

    it('should handle 429 rate limit errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 429,
        json: async () => ({
          error: { message: 'Rate limit exceeded', code: 'rate_limit_exceeded' }
        })
      } as Response);

      await expect(client.generateCompletion('test')).rejects.toMatchObject({
        type: 'rate_limit',
        message: 'Rate limit exceeded',
        statusCode: 429
      });
    });

    it('should handle 400 validation errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({
          error: { message: 'Invalid request', code: 'invalid_request' }
        })
      } as Response);

      await expect(client.generateCompletion('test')).rejects.toMatchObject({
        type: 'validation_error',
        message: 'Invalid request',
        statusCode: 400
      });
    });

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      await expect(client.generateCompletion('test')).rejects.toMatchObject({
        type: 'network_error',
        message: 'Network connection failed'
      });
    });

    it('should handle timeout errors', async () => {
      const timeoutClient = createOpenAIClient({ 
        apiKey: validApiKey, 
        timeout: 100 
      });

      mockFetch.mockImplementationOnce(() => 
        new Promise(resolve => setTimeout(resolve, 200))
      );

      await expect(timeoutClient.generateCompletion('test')).rejects.toMatchObject({
        type: 'network_error',
        message: 'Request timeout'
      });
    });
  });

  describe('Retry Logic', () => {
    it('should retry on network errors', async () => {
      const retryClient = createOpenAIClient({ 
        apiKey: validApiKey, 
        retryAttempts: 2,
        retryDelay: 10
      });

      mockFetch
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            choices: [{ message: { content: 'Success' } }],
            usage: { prompt_tokens: 10, completion_tokens: 20, total_tokens: 30 }
          })
        } as Response);

      const result = await retryClient.generateCompletion('test');
      expect(result.content).toBe('Success');
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it('should not retry on authentication errors', async () => {
      const retryClient = createOpenAIClient({ 
        apiKey: validApiKey, 
        retryAttempts: 3 
      });

      mockFetch.mockResolvedValue({
        ok: false,
        status: 401,
        json: async () => ({
          error: { message: 'Invalid API key' }
        })
      } as Response);

      await expect(retryClient.generateCompletion('test')).rejects.toMatchObject({
        type: 'auth_error'
      });
      
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });
  });

  describe('generateCompletion', () => {
    it('should generate completion successfully', async () => {
      const mockResponse = {
        choices: [{ message: { content: 'Generated content' } }],
        usage: { prompt_tokens: 10, completion_tokens: 20, total_tokens: 30 }
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      } as Response);

      const result = await client.generateCompletion('test prompt');
      
      expect(result.content).toBe('Generated content');
      expect(result.usage).toEqual({
        prompt_tokens: 10,
        completion_tokens: 20,
        total_tokens: 30
      });
    });

    it('should use custom options', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [{ message: { content: 'test' } }]
        })
      } as Response);

      await client.generateCompletion('test', {
        model: 'gpt-4',
        temperature: 0.5,
        max_tokens: 1000
      });

      const [, options] = mockFetch.mock.calls[0];
      const body = JSON.parse(options!.body as string);
      
      expect(body.model).toBe('gpt-4');
      expect(body.temperature).toBe(0.5);
      expect(body.max_tokens).toBe(1000);
    });

    it('should throw error when no choices returned', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ choices: [] })
      } as Response);

      await expect(client.generateCompletion('test')).rejects.toMatchObject({
        type: 'api_error',
        message: 'No completion choices returned'
      });
    });
  });

  describe('generateSlides', () => {
    it('should generate slides successfully', async () => {
      const mockMarkdown = `# Test Slides\n\nSlide 1 content\n\n---\n\n# Slide 2\n\nSlide 2 content`;
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [{ message: { content: mockMarkdown } }],
          usage: { prompt_tokens: 50, completion_tokens: 100, total_tokens: 150 }
        })
      } as Response);

      const result = await client.generateSlides({
        topic: testTopic,
        apiKey: validApiKey,
        templateType: 'basic'
      });

      expect(result.markdown).toBe(mockMarkdown);
      expect(result.metadata.slideCount).toBe(2);
      expect(result.metadata.model).toBe('gpt-3.5-turbo');
      expect(result.metadata.tokenUsage).toEqual({
        prompt_tokens: 50,
        completion_tokens: 100,
        total_tokens: 150
      });
    });

    it('should use default template when not specified', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [{ message: { content: 'test' } }]
        })
      } as Response);

      await client.generateSlides({
        topic: testTopic,
        apiKey: validApiKey
      });

      const [, options] = mockFetch.mock.calls[0];
      const body = JSON.parse(options!.body as string);
      
      expect(body.messages[0].content).toContain('基礎簡報');
    });
  });

  describe('validateConnection', () => {
    it('should return true for valid connection', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: [] })
      } as Response);

      const isValid = await client.validateConnection();
      expect(isValid).toBe(true);
    });

    it('should return false for invalid connection', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({})
      } as Response);

      const isValid = await client.validateConnection();
      expect(isValid).toBe(false);
    });
  });

  describe('updateApiKey', () => {
    it('should update API key', () => {
      const newApiKey = 'sk-newkey1234567890abcdef1234567890abcdef';
      client.updateApiKey(newApiKey);
      
      // We can't directly test the private apiKey property,
      // but we can test that operations work with the new key
      expect(() => client.updateApiKey(newApiKey)).not.toThrow();
    });
  });
});