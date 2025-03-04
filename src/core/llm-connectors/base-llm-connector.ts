import { EventEmitter } from 'events';
import { createContextLogger } from '../utils/logger';

/**
 * Message role types for LLM conversations
 */
export enum MessageRole {
  SYSTEM = 'system',
  USER = 'user',
  ASSISTANT = 'assistant',
  FUNCTION = 'function'
}

/**
 * Standard message format for LLM interactions
 */
export interface LLMMessage {
  role: MessageRole;
  content: string;
  name?: string; // For function messages
}

/**
 * Options for LLM requests
 */
export interface LLMRequestOptions {
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
  stopSequences?: string[];
  stream?: boolean;
  functions?: any[]; // Function calling definitions
  functionCall?: 'auto' | 'none' | { name: string };
}

/**
 * Response format from LLM providers
 */
export interface LLMResponse {
  id: string;
  content: string;
  model: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  finishReason?: string;
  functionCall?: {
    name: string;
    arguments: string;
  };
}

/**
 * Base configuration for LLM connectors
 */
export interface BaseLLMConfig {
  apiKey: string;
  model: string;
  defaultOptions?: LLMRequestOptions;
  baseUrl?: string;
  timeout?: number;
  organization?: string; // For OpenAI
}

/**
 * Base class for all LLM connectors
 * Provides common functionality and standardized interfaces
 */
export abstract class BaseLLMConnector extends EventEmitter {
  protected config: BaseLLMConfig;
  protected logger = createContextLogger('LLMConnector');
  
  constructor(config: BaseLLMConfig) {
    super();
    this.config = {
      ...config,
      defaultOptions: {
        temperature: 0.7,
        maxTokens: 1000,
        topP: 1,
        frequencyPenalty: 0,
        presencePenalty: 0,
        stream: false,
        ...config.defaultOptions
      }
    };
    
    this.logger.info(`Initialized ${this.constructor.name} with model: ${this.config.model}`);
  }
  
  /**
   * Get available models from the provider
   */
  abstract listModels(): Promise<string[]>;
  
  /**
   * Send a completion request to the LLM
   */
  abstract complete(prompt: string, options?: LLMRequestOptions): Promise<LLMResponse>;
  
  /**
   * Send a chat completion request to the LLM
   */
  abstract chat(messages: LLMMessage[], options?: LLMRequestOptions): Promise<LLMResponse>;
  
  /**
   * Stream a chat completion request to the LLM
   * Emits 'data', 'error', and 'end' events
   */
  abstract streamChat(messages: LLMMessage[], options?: LLMRequestOptions): void;
  
  /**
   * Check if the connector has valid credentials
   */
  abstract hasValidCredentials(): Promise<boolean>;
  
  /**
   * Get the current model being used
   */
  getModel(): string {
    return this.config.model;
  }
  
  /**
   * Set a new model to use
   */
  setModel(model: string): void {
    this.logger.info(`Changing model from ${this.config.model} to ${model}`);
    this.config.model = model;
  }
  
  /**
   * Get the provider name
   */
  abstract getProviderName(): string;
  
  /**
   * Create a system message
   */
  createSystemMessage(content: string): LLMMessage {
    return { role: MessageRole.SYSTEM, content };
  }
  
  /**
   * Create a user message
   */
  createUserMessage(content: string): LLMMessage {
    return { role: MessageRole.USER, content };
  }
  
  /**
   * Create an assistant message
   */
  createAssistantMessage(content: string): LLMMessage {
    return { role: MessageRole.ASSISTANT, content };
  }
  
  /**
   * Create a function message
   */
  createFunctionMessage(name: string, content: string): LLMMessage {
    return { role: MessageRole.FUNCTION, content, name };
  }
  
  /**
   * Merge default options with provided options
   */
  protected mergeOptions(options?: LLMRequestOptions): LLMRequestOptions {
    return {
      ...this.config.defaultOptions,
      ...options
    };
  }
} 