import axios, { AxiosInstance } from 'axios';
import { 
  BaseLLMConnector, 
  BaseLLMConfig, 
  LLMMessage, 
  LLMRequestOptions, 
  LLMResponse 
} from './base-llm-connector';

/**
 * DeepSeek-specific configuration options
 */
export interface DeepSeekConfig extends BaseLLMConfig {
  apiVersion?: string;
}

/**
 * Available DeepSeek models
 */
export enum DeepSeekModels {
  DEEPSEEK_CHAT = 'deepseek-chat',
  DEEPSEEK_CODER = 'deepseek-coder',
  DEEPSEEK_LITE = 'deepseek-lite',
  DEEPSEEK_CHAT_V2 = 'deepseek-chat-v2'
}

/**
 * Connector for DeepSeek's API
 */
export class DeepSeekConnector extends BaseLLMConnector {
  private client: AxiosInstance;
  
  constructor(config: DeepSeekConfig) {
    super({
      ...config,
      model: config.model || DeepSeekModels.DEEPSEEK_CHAT
    });
    
    this.client = axios.create({
      baseURL: config.baseUrl || 'https://api.deepseek.com/v1',
      timeout: config.timeout || 30000,
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json',
        'X-API-Version': config.apiVersion || '2023-12-01'
      }
    });
  }
  
  /**
   * Get the provider name
   */
  getProviderName(): string {
    return 'DeepSeek';
  }
  
  /**
   * List available models
   */
  async listModels(): Promise<string[]> {
    try {
      const response = await this.client.get('/models');
      return response.data.data.map((model: any) => model.id);
    } catch (error) {
      this.logger.error('Error listing DeepSeek models:', error);
      // Fallback to known models if API call fails
      return Object.values(DeepSeekModels);
    }
  }
  
  /**
   * Send a completion request
   */
  async complete(prompt: string, options?: LLMRequestOptions): Promise<LLMResponse> {
    const mergedOptions = this.mergeOptions(options);
    
    try {
      const response = await this.client.post('/completions', {
        model: this.config.model,
        prompt,
        max_tokens: mergedOptions.maxTokens,
        temperature: mergedOptions.temperature,
        top_p: mergedOptions.topP,
        frequency_penalty: mergedOptions.frequencyPenalty,
        presence_penalty: mergedOptions.presencePenalty,
        stop: mergedOptions.stopSequences
      });
      
      const data = response.data;
      
      return {
        id: data.id,
        content: data.choices[0].text,
        model: data.model,
        usage: {
          promptTokens: data.usage.prompt_tokens,
          completionTokens: data.usage.completion_tokens,
          totalTokens: data.usage.total_tokens
        },
        finishReason: data.choices[0].finish_reason
      };
    } catch (error) {
      this.logger.error('Error in DeepSeek completion:', error);
      throw error;
    }
  }
  
  /**
   * Send a chat completion request
   */
  async chat(messages: LLMMessage[], options?: LLMRequestOptions): Promise<LLMResponse> {
    const mergedOptions = this.mergeOptions(options);
    
    try {
      // Convert our standardized messages to DeepSeek format
      // DeepSeek likely uses a format similar to OpenAI
      const deepseekMessages = messages.map(msg => ({
        role: msg.role,
        content: msg.content,
        ...(msg.name ? { name: msg.name } : {})
      }));
      
      const requestBody: any = {
        model: this.config.model,
        messages: deepseekMessages,
        max_tokens: mergedOptions.maxTokens,
        temperature: mergedOptions.temperature,
        top_p: mergedOptions.topP,
        frequency_penalty: mergedOptions.frequencyPenalty,
        presence_penalty: mergedOptions.presencePenalty,
        stop: mergedOptions.stopSequences
      };
      
      // Add function calling if provided
      if (mergedOptions.functions) {
        requestBody.functions = mergedOptions.functions;
        
        if (mergedOptions.functionCall) {
          requestBody.function_call = mergedOptions.functionCall;
        }
      }
      
      const response = await this.client.post('/chat/completions', requestBody);
      
      const data = response.data;
      const choice = data.choices[0];
      
      const result: LLMResponse = {
        id: data.id,
        content: choice.message.content || '',
        model: data.model,
        usage: {
          promptTokens: data.usage.prompt_tokens,
          completionTokens: data.usage.completion_tokens,
          totalTokens: data.usage.total_tokens
        },
        finishReason: choice.finish_reason
      };
      
      // Add function call if present
      if (choice.message.function_call) {
        result.functionCall = {
          name: choice.message.function_call.name,
          arguments: choice.message.function_call.arguments
        };
      }
      
      return result;
    } catch (error) {
      this.logger.error('Error in DeepSeek chat completion:', error);
      throw error;
    }
  }
  
  /**
   * Stream a chat completion
   */
  streamChat(messages: LLMMessage[], options?: LLMRequestOptions): void {
    const mergedOptions = this.mergeOptions({ ...options, stream: true });
    
    // Convert our standardized messages to DeepSeek format
    const deepseekMessages = messages.map(msg => ({
      role: msg.role,
      content: msg.content,
      ...(msg.name ? { name: msg.name } : {})
    }));
    
    const requestBody: any = {
      model: this.config.model,
      messages: deepseekMessages,
      max_tokens: mergedOptions.maxTokens,
      temperature: mergedOptions.temperature,
      top_p: mergedOptions.topP,
      frequency_penalty: mergedOptions.frequencyPenalty,
      presence_penalty: mergedOptions.presencePenalty,
      stop: mergedOptions.stopSequences,
      stream: true
    };
    
    // Add function calling if provided
    if (mergedOptions.functions) {
      requestBody.functions = mergedOptions.functions;
      
      if (mergedOptions.functionCall) {
        requestBody.function_call = mergedOptions.functionCall;
      }
    }
    
    this.client.post('/chat/completions', requestBody, {
      responseType: 'stream'
    }).then(response => {
      response.data.on('data', (chunk: Buffer) => {
        const lines = chunk.toString().split('\n').filter(line => line.trim() !== '');
        
        for (const line of lines) {
          if (line.includes('[DONE]')) {
            this.emit('end');
            return;
          }
          
          try {
            const message = line.replace(/^data: /, '');
            if (message) {
              const parsed = JSON.parse(message);
              if (parsed.choices && parsed.choices[0].delta) {
                const delta = parsed.choices[0].delta;
                this.emit('data', {
                  id: parsed.id,
                  content: delta.content || '',
                  model: this.config.model,
                  functionCall: delta.function_call ? {
                    name: delta.function_call.name,
                    arguments: delta.function_call.arguments
                  } : undefined
                });
              }
            }
          } catch (error) {
            this.logger.error('Error parsing stream data:', error);
          }
        }
      });
      
      response.data.on('end', () => {
        this.emit('end');
      });
      
    }).catch(error => {
      this.logger.error('Error in DeepSeek stream:', error);
      this.emit('error', error);
    });
  }
  
  /**
   * Check if the connector has valid credentials
   */
  async hasValidCredentials(): Promise<boolean> {
    try {
      await this.client.get('/models');
      return true;
    } catch (error) {
      this.logger.error('Invalid DeepSeek credentials:', error);
      return false;
    }
  }
} 