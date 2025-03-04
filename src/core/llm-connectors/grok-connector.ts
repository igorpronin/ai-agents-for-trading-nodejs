import axios, { AxiosInstance } from 'axios';
import { 
  BaseLLMConnector, 
  BaseLLMConfig, 
  LLMMessage, 
  LLMRequestOptions, 
  LLMResponse 
} from './base-llm-connector';

/**
 * Grok-specific configuration options
 */
export interface GrokConfig extends BaseLLMConfig {
  apiVersion?: string;
}

/**
 * Available Grok models
 */
export enum GrokModels {
  GROK_1 = 'grok-1',
  GROK_1_5 = 'grok-1.5'
}

/**
 * Connector for Grok's API
 * Note: This is a hypothetical implementation as Grok's API details are not fully public
 */
export class GrokConnector extends BaseLLMConnector {
  private client: AxiosInstance;
  
  constructor(config: GrokConfig) {
    super({
      ...config,
      model: config.model || GrokModels.GROK_1_5
    });
    
    this.client = axios.create({
      baseURL: config.baseUrl || 'https://api.grok.x.ai/v1',
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
    return 'Grok';
  }
  
  /**
   * List available models
   */
  async listModels(): Promise<string[]> {
    try {
      const response = await this.client.get('/models');
      return response.data.data.map((model: any) => model.id);
    } catch (error) {
      this.logger.error('Error listing Grok models:', error);
      // Fallback to known models if API call fails
      return Object.values(GrokModels);
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
      this.logger.error('Error in Grok completion:', error);
      throw error;
    }
  }
  
  /**
   * Send a chat completion request
   */
  async chat(messages: LLMMessage[], options?: LLMRequestOptions): Promise<LLMResponse> {
    const mergedOptions = this.mergeOptions(options);
    
    try {
      // Convert our standardized messages to Grok format
      // Assuming Grok uses a format similar to OpenAI
      const grokMessages = messages.map(msg => ({
        role: msg.role,
        content: msg.content,
        ...(msg.name ? { name: msg.name } : {})
      }));
      
      const requestBody: any = {
        model: this.config.model,
        messages: grokMessages,
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
      this.logger.error('Error in Grok chat completion:', error);
      throw error;
    }
  }
  
  /**
   * Stream a chat completion
   */
  streamChat(messages: LLMMessage[], options?: LLMRequestOptions): void {
    const mergedOptions = this.mergeOptions({ ...options, stream: true });
    
    // Convert our standardized messages to Grok format
    const grokMessages = messages.map(msg => ({
      role: msg.role,
      content: msg.content,
      ...(msg.name ? { name: msg.name } : {})
    }));
    
    const requestBody: any = {
      model: this.config.model,
      messages: grokMessages,
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
      this.logger.error('Error in Grok stream:', error);
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
      this.logger.error('Invalid Grok credentials:', error);
      return false;
    }
  }
} 