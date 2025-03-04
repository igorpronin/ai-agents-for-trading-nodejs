import { BaseLLMConnector, BaseLLMConfig } from './base-llm-connector';
import { OpenAIConnector, OpenAIConfig, OpenAIModels } from './openai-connector';
import { AnthropicConnector, AnthropicConfig, ClaudeModels } from './anthropic-connector';
import { GrokConnector, GrokConfig, GrokModels } from './grok-connector';
import { DeepSeekConnector, DeepSeekConfig, DeepSeekModels } from './deepseek-connector';
import { createContextLogger } from '../utils/logger';

/**
 * Supported LLM providers
 */
export enum LLMProvider {
  OPENAI = 'openai',
  ANTHROPIC = 'anthropic',
  GROK = 'grok',
  DEEPSEEK = 'deepseek'
}

/**
 * Factory for creating LLM connectors
 */
export class LLMConnectorFactory {
  private static logger = createContextLogger('LLMConnectorFactory');
  
  /**
   * Create an LLM connector for the specified provider
   */
  static createConnector(provider: LLMProvider, config: BaseLLMConfig): BaseLLMConnector {
    switch (provider) {
      case LLMProvider.OPENAI:
        return new OpenAIConnector(config as OpenAIConfig);
        
      case LLMProvider.ANTHROPIC:
        return new AnthropicConnector(config as AnthropicConfig);
        
      case LLMProvider.GROK:
        return new GrokConnector(config as GrokConfig);
        
      case LLMProvider.DEEPSEEK:
        return new DeepSeekConnector(config as DeepSeekConfig);
        
      default:
        this.logger.error(`Unsupported LLM provider: ${provider}`);
        throw new Error(`Unsupported LLM provider: ${provider}`);
    }
  }
  
  /**
   * Get the default model for a provider
   */
  static getDefaultModel(provider: LLMProvider): string {
    switch (provider) {
      case LLMProvider.OPENAI:
        return OpenAIModels.GPT_3_5_TURBO;
        
      case LLMProvider.ANTHROPIC:
        return ClaudeModels.CLAUDE_3_HAIKU;
        
      case LLMProvider.GROK:
        return GrokModels.GROK_1_5;
        
      case LLMProvider.DEEPSEEK:
        return DeepSeekModels.DEEPSEEK_CHAT;
        
      default:
        this.logger.error(`Unsupported LLM provider: ${provider}`);
        throw new Error(`Unsupported LLM provider: ${provider}`);
    }
  }
  
  /**
   * Get all available models for a provider
   */
  static getAvailableModels(provider: LLMProvider): string[] {
    switch (provider) {
      case LLMProvider.OPENAI:
        return Object.values(OpenAIModels);
        
      case LLMProvider.ANTHROPIC:
        return Object.values(ClaudeModels);
        
      case LLMProvider.GROK:
        return Object.values(GrokModels);
        
      case LLMProvider.DEEPSEEK:
        return Object.values(DeepSeekModels);
        
      default:
        this.logger.error(`Unsupported LLM provider: ${provider}`);
        throw new Error(`Unsupported LLM provider: ${provider}`);
    }
  }
} 