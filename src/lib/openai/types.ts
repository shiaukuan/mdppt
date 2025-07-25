export interface OpenAIGenerateOptions {
  model?: string;
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
  frequency_penalty?: number;
  presence_penalty?: number;
}

export interface SlideGenerationRequest {
  topic: string;
  apiKey: string;
  options?: OpenAIGenerateOptions;
  templateType?: 'basic' | 'academic' | 'business' | 'creative';
}

export interface SlideGenerationResponse {
  markdown: string;
  metadata: {
    slideCount: number;
    generatedAt: string;
    model: string;
    tokenUsage?: {
      prompt_tokens: number;
      completion_tokens: number;
      total_tokens: number;
    } | undefined;
  };
}

export interface OpenAIError {
  type: 'api_error' | 'auth_error' | 'rate_limit' | 'network_error' | 'validation_error';
  message: string;
  code?: string | undefined;
  statusCode?: number | undefined;
}

export interface PromptTemplate {
  id: string;
  name: string;
  description: string;
  template: string;
  variables: string[];
  maxSlides: number;
}

export interface OpenAIClientConfig {
  apiKey: string;
  baseURL?: string;
  defaultModel?: string;
  timeout?: number;
  retryAttempts?: number;
  retryDelay?: number;
}