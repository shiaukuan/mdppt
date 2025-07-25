import { 
  OpenAIClientConfig, 
  OpenAIGenerateOptions, 
  SlideGenerationRequest, 
  SlideGenerationResponse, 
  OpenAIError 
} from './types';
import { getPromptForTemplate } from './prompts';

export class OpenAIClient {
  private apiKey: string;
  private baseURL: string;
  private defaultModel: string;
  private timeout: number;
  private retryAttempts: number;
  private retryDelay: number;

  constructor(config: OpenAIClientConfig) {
    this.apiKey = config.apiKey;
    this.baseURL = config.baseURL || 'https://api.openai.com/v1';
    this.defaultModel = config.defaultModel || 'gpt-3.5-turbo';
    this.timeout = config.timeout || 30000;
    this.retryAttempts = config.retryAttempts || 3;
    this.retryDelay = config.retryDelay || 1000;
  }

  private validateApiKey(): void {
    if (!this.apiKey) {
      throw this.createError('validation_error', 'API key is required');
    }
    
    if (!this.apiKey.startsWith('sk-')) {
      throw this.createError('validation_error', 'Invalid API key format');
    }
  }

  private createError(
    type: OpenAIError['type'], 
    message: string, 
    code?: string, 
    statusCode?: number
  ): OpenAIError {
    return { type, message, code, statusCode };
  }

  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private async makeRequest(
    endpoint: string,
    method: string,
    body?: any
  ): Promise<any> {
    this.validateApiKey();

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        ...(body && { body: JSON.stringify(body) }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        
        switch (response.status) {
          case 401:
            throw this.createError('auth_error', 'Invalid API key', errorData.error?.code, 401);
          case 429:
            throw this.createError('rate_limit', 'Rate limit exceeded', errorData.error?.code, 429);
          case 400:
            throw this.createError('validation_error', errorData.error?.message || 'Bad request', errorData.error?.code, 400);
          default:
            throw this.createError('api_error', errorData.error?.message || 'API request failed', errorData.error?.code, response.status);
        }
      }

      return await response.json();
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw this.createError('network_error', 'Request timeout');
        }
        if (error.message.includes('network') || error.message.includes('fetch')) {
          throw this.createError('network_error', 'Network connection failed');
        }
      }
      
      throw error;
    }
  }

  private async makeRequestWithRetry(
    endpoint: string,
    method: string,
    body?: any
  ): Promise<any> {
    let lastError: any;

    for (let attempt = 1; attempt <= this.retryAttempts; attempt++) {
      try {
        return await this.makeRequest(endpoint, method, body);
      } catch (error) {
        lastError = error;
        
        // Don't retry on auth errors or validation errors
        if (error && typeof error === 'object' && 'type' in error) {
          const openAIError = error as OpenAIError;
          if (openAIError.type === 'auth_error' || openAIError.type === 'validation_error') {
            throw error;
          }
        }
        
        if (attempt === this.retryAttempts) {
          break;
        }
        
        const delay = this.retryDelay * Math.pow(2, attempt - 1); // Exponential backoff
        await this.delay(delay);
        
        console.warn(`Request attempt ${attempt} failed, retrying in ${delay}ms...`);
      }
    }

    throw lastError;
  }

  async generateCompletion(
    prompt: string,
    options: OpenAIGenerateOptions = {}
  ): Promise<{
    content: string;
    usage?: {
      prompt_tokens: number;
      completion_tokens: number;
      total_tokens: number;
    };
  }> {
    const requestBody = {
      model: options.model || this.defaultModel,
      messages: [{ role: 'user', content: prompt }],
      temperature: options.temperature ?? 0.7,
      max_tokens: options.max_tokens ?? 2000,
      top_p: options.top_p ?? 1,
      frequency_penalty: options.frequency_penalty ?? 0,
      presence_penalty: options.presence_penalty ?? 0,
    };

    console.log(`[OpenAI] Generating completion with model: ${requestBody.model}`);
    console.log(`[OpenAI] Prompt length: ${prompt.length} characters`);

    const response = await this.makeRequestWithRetry('/chat/completions', 'POST', requestBody);

    if (!response.choices || response.choices.length === 0) {
      throw this.createError('api_error', 'No completion choices returned');
    }

    const content = response.choices[0].message?.content;
    if (!content) {
      throw this.createError('api_error', 'Empty completion content');
    }

    console.log(`[OpenAI] Completion generated successfully. Content length: ${content.length} characters`);
    
    if (response.usage) {
      console.log(`[OpenAI] Token usage: ${response.usage.total_tokens} total (${response.usage.prompt_tokens} prompt + ${response.usage.completion_tokens} completion)`);
    }

    return {
      content,
      usage: response.usage
    };
  }

  async generateSlides(request: SlideGenerationRequest): Promise<SlideGenerationResponse> {
    try {
      const templateType = request.templateType || 'basic';
      const prompt = getPromptForTemplate(templateType, { topic: request.topic });
      
      console.log(`[OpenAI] Generating slides for topic: "${request.topic}" using template: ${templateType}`);
      
      const completion = await this.generateCompletion(prompt, request.options);
      
      // Count slides by counting "---" separators
      const slideCount = (completion.content.match(/^---\s*$/gm) || []).length + 1;
      
      const response: SlideGenerationResponse = {
        markdown: completion.content,
        metadata: {
          slideCount,
          generatedAt: new Date().toISOString(),
          model: request.options?.model || this.defaultModel,
          ...(completion.usage && { tokenUsage: completion.usage })
        }
      };

      console.log(`[OpenAI] Successfully generated ${slideCount} slides`);
      
      return response;
    } catch (error) {
      console.error('[OpenAI] Slide generation failed:', error);
      throw error;
    }
  }

  async validateConnection(): Promise<boolean> {
    try {
      console.log('[OpenAI] Validating API connection...');
      
      // Use a minimal request to test the connection
      await this.makeRequest('/models', 'GET');
      
      console.log('[OpenAI] API connection validated successfully');
      return true;
    } catch (error) {
      console.error('[OpenAI] API connection validation failed:', error);
      return false;
    }
  }

  updateApiKey(apiKey: string): void {
    this.apiKey = apiKey;
    console.log('[OpenAI] API key updated');
  }

  getConfig(): Omit<OpenAIClientConfig, 'apiKey'> {
    return {
      baseURL: this.baseURL,
      defaultModel: this.defaultModel,
      timeout: this.timeout,
      retryAttempts: this.retryAttempts,
      retryDelay: this.retryDelay
    };
  }
}

// Singleton instance for default usage
let defaultClient: OpenAIClient | null = null;

export function createOpenAIClient(config: OpenAIClientConfig): OpenAIClient {
  return new OpenAIClient(config);
}

export function getDefaultClient(): OpenAIClient | null {
  return defaultClient;
}

export function setDefaultClient(client: OpenAIClient): void {
  defaultClient = client;
}

export function initializeDefaultClient(apiKey: string): OpenAIClient {
  const client = new OpenAIClient({ apiKey });
  setDefaultClient(client);
  return client;
}