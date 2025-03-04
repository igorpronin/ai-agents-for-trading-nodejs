import axios, { AxiosInstance } from 'axios';
import { 
  BaseLLMConnector, 
  BaseLLMConfig, 
  LLMMessage, 
  LLMRequestOptions, 
  LLMResponse,
  MessageRole
} from './base-llm-connector';

/**
 * Anthropic-specific configuration options
 */
export interface AnthropicConfig extends BaseLLMConfig {
  apiVersion?: string;
}

/**
 * Available Anthropic Claude models
 */
export enum ClaudeModels {
  CLAUDE_3_OPUS = 'claude-3-opus-20240229',
  CLAUDE_3_SONNET = 'claude-3-sonnet-20240229',
  CLAUDE_3_HAIKU = 'claude-3-haiku-20240307',
  CLAUDE_2_1 = 'claude-2.1',
  CLAUDE_2 = 'claude-2',
  CLAUDE_INSTANT = 'claude-instant-1.2'
}

/**
 * Connector for Anthropic's API (Claude)
 */
export class AnthropicConnector extends BaseLLMConnector {
  private client: AxiosInstance;
  
  constructor(config: AnthropicConfig) {
    super({
      ...config,
      model: config.model || ClaudeModels.CLAUDE_3_HAIKU
    });
    
    this.client = axios.create({
      baseURL: config.baseUrl || 'https://api.anthropic.com',
      timeout: config.timeout || 30000,
      headers: {
        'x-api-key': config.apiKey,
        'anthropic-version': config.apiVersion || '2023-06-01',
        'Content-Type': 'application/json'
      }
    });
  }
  
  /**
   * Get the provider name
   */
  getProviderName(): string {
    return 'Anthropic';
  }
  
  /**
   * List available models
   */
  async listModels(): Promise<string[]> {
    // Anthropic doesn't have a models endpoint, so we return the known models
    return Object.values(ClaudeModels);
  }
  
  /**
   * Send a completion request
   * Note: Anthropic doesn't have a separate completion endpoint, so we use messages API
   */
  async complete(prompt: string, options?: LLMRequestOptions): Promise<LLMResponse> {
    // Convert the prompt to a message and use the chat method
    const messages = [{ role: MessageRole.USER, content: prompt }];
    return this.chat(messages, options);
  }
  
  /**
   * Convert our standard messages format to Anthropic's format
   */
  private convertToAnthropicMessages(messages: LLMMessage[]): any[] {
    return messages.map(msg => {
      // Anthropic only supports user and assistant roles in their messages API
      if (msg.role === MessageRole.SYSTEM) {
        // For system messages, we'll add them as a special content block
        return {
          role: 'user',
          content: [
            {
              type: 'text',
              text: msg.content
            }
          ]
        };
      } else if (msg.role === MessageRole.FUNCTION) {
        // For function messages, we'll convert them to assistant messages
        // with a special format to indicate they're function responses
        return {
          role: 'assistant',
          content: [
            {
              type: 'text',
              text: `Function ${msg.name} result: ${msg.content}`
            }
          ]
        };
      } else {
        // For user and assistant messages, map directly
        return {
          role: msg.role === MessageRole.USER ? 'user' : 'assistant',
          content: [
            {
              type: 'text',
              text: msg.content
            }
          ]
        };
      }
    });
  }
  
  /**
   * Send a chat completion request
   */
  async chat(messages: LLMMessage[], options?: LLMRequestOptions): Promise<LLMResponse> {
    const mergedOptions = this.mergeOptions(options);
    
    try {
      // Extract system message if present
      let systemPrompt = '';
      const nonSystemMessages = messages.filter(msg => {
        if (msg.role === MessageRole.SYSTEM) {
          systemPrompt = msg.content;
          return false;
        }
        return true;
      });
      
      // Convert our messages to Anthropic format
      const anthropicMessages = this.convertToAnthropicMessages(nonSystemMessages);
      
      const requestBody: any = {
        model: this.config.model,
        messages: anthropicMessages,
        max_tokens: mergedOptions.maxTokens,
        temperature: mergedOptions.temperature,
        top_p: mergedOptions.topP,
        stop_sequences: mergedOptions.stopSequences
      };
      
      // Add system prompt if present
      if (systemPrompt) {
        requestBody.system = systemPrompt;
      }
      
      const response = await this.client.post('/v1/messages', requestBody);
      
      const data = response.data;
      
      return {
        id: data.id,
        content: data.content[0].text,
        model: data.model,
        usage: {
          promptTokens: data.usage.input_tokens,
          completionTokens: data.usage.output_tokens,
          totalTokens: data.usage.input_tokens + data.usage.output_tokens
        },
        finishReason: data.stop_reason
      };
    } catch (error) {
      this.logger.error('Error in Anthropic chat completion:', error);
      throw error;
    }
  }
  
  /**
   * Stream a chat completion
   */
  streamChat(messages: LLMMessage[], options?: LLMRequestOptions): void {
    const mergedOptions = this.mergeOptions({ ...options, stream: true });
    
    // Extract system message if present
    let systemPrompt = '';
    const nonSystemMessages = messages.filter(msg => {
      if (msg.role === MessageRole.SYSTEM) {
        systemPrompt = msg.content;
        return false;
      }
      return true;
    });
    
    // Convert our messages to Anthropic format
    const anthropicMessages = this.convertToAnthropicMessages(nonSystemMessages);
    
    const requestBody: any = {
      model: this.config.model,
      messages: anthropicMessages,
      max_tokens: mergedOptions.maxTokens,
      temperature: mergedOptions.temperature,
      top_p: mergedOptions.topP,
      stop_sequences: mergedOptions.stopSequences,
      stream: true
    };
    
    // Add system prompt if present
    if (systemPrompt) {
      requestBody.system = systemPrompt;
    }
    
    this.client.post('/v1/messages', requestBody, {
      responseType: 'stream'
    }).then(response => {
      response.data.on('data', (chunk: Buffer) => {
        const lines = chunk.toString().split('\n').filter(line => line.trim() !== '');
        
        for (const line of lines) {
          if (line.includes('event: message_stop')) {
            this.emit('end');
            return;
          }
          
          try {
            if (line.startsWith('data:')) {
              const message = line.replace(/^data: /, '');
              if (message) {
                const parsed = JSON.parse(message);
                if (parsed.type === 'content_block_delta' && parsed.delta.text) {
                  this.emit('data', {
                    id: parsed.message_id,
                    content: parsed.delta.text,
                    model: this.config.model
                  });
                }
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
      this.logger.error('Error in Anthropic stream:', error);
      this.emit('error', error);
    });
  }
  
  /**
   * Check if the connector has valid credentials
   */
  async hasValidCredentials(): Promise<boolean> {
    try {
      // Anthropic doesn't have a simple endpoint to check credentials
      // So we'll make a minimal request to see if the API key works
      await this.client.post('/v1/messages', {
        model: this.config.model,
        messages: [{ role: 'user', content: [{ type: 'text', text: 'Hello' }] }],
        max_tokens: 1
      });
      return true;
    } catch (error) {
      this.logger.error('Invalid Anthropic credentials:', error);
      return false;
    }
  }
} 