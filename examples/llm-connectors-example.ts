import dotenv from 'dotenv';
import { LLMConnectorFactory, LLMProvider } from '../src/core/llm-connectors/llm-connector-factory';
import { BaseLLMConnector, MessageRole } from '../src/core/llm-connectors/base-llm-connector';
import { OpenAIModels } from '../src/core/llm-connectors/openai-connector';
import { ClaudeModels } from '../src/core/llm-connectors/anthropic-connector';
import { createContextLogger } from '../src/core/utils/logger';

// Load environment variables
dotenv.config();

const logger = createContextLogger('LLMConnectorsExample');

/**
 * Example of using different LLM connectors
 */
async function runLLMConnectorsExample() {
  logger.info('Starting LLM Connectors Example');
  
  try {
    // Example 1: Using OpenAI (ChatGPT)
    await useOpenAI();
    
    // Example 2: Using Anthropic (Claude)
    await useAnthropic();
    
    // Example 3: Comparing responses from different providers
    await compareProviders();
    
    logger.info('LLM Connectors Example completed successfully');
  } catch (error) {
    logger.error('Error in LLM Connectors Example:', error);
  }
}

/**
 * Example of using OpenAI (ChatGPT)
 */
async function useOpenAI() {
  logger.info('--- OpenAI (ChatGPT) Example ---');
  
  const apiKey = process.env.OPENAI_API_KEY;
  
  if (!apiKey) {
    logger.error('OPENAI_API_KEY not found in environment variables');
    return;
  }
  
  // Create OpenAI connector
  const openai = LLMConnectorFactory.createConnector(LLMProvider.OPENAI, {
    apiKey,
    model: OpenAIModels.GPT_3_5_TURBO
  });
  
  // Check if credentials are valid
  const isValid = await openai.hasValidCredentials();
  
  if (!isValid) {
    logger.error('Invalid OpenAI credentials');
    return;
  }
  
  logger.info(`Using model: ${openai.getModel()}`);
  
  // Simple chat example
  const messages = [
    openai.createSystemMessage('You are a helpful assistant that provides concise responses.'),
    openai.createUserMessage('What are the key features of TypeScript?')
  ];
  
  const response = await openai.chat(messages, {
    temperature: 0.7,
    maxTokens: 500
  });
  
  logger.info('OpenAI Response:');
  logger.info(`Content: ${response.content}`);
  logger.info(`Model: ${response.model}`);
  logger.info(`Tokens: ${response.usage?.totalTokens}`);
}

/**
 * Example of using Anthropic (Claude)
 */
async function useAnthropic() {
  logger.info('--- Anthropic (Claude) Example ---');
  
  const apiKey = process.env.ANTHROPIC_API_KEY;
  
  if (!apiKey) {
    logger.error('ANTHROPIC_API_KEY not found in environment variables');
    return;
  }
  
  // Create Anthropic connector
  const claude = LLMConnectorFactory.createConnector(LLMProvider.ANTHROPIC, {
    apiKey,
    model: ClaudeModels.CLAUDE_3_HAIKU
  });
  
  // Check if credentials are valid
  const isValid = await claude.hasValidCredentials();
  
  if (!isValid) {
    logger.error('Invalid Anthropic credentials');
    return;
  }
  
  logger.info(`Using model: ${claude.getModel()}`);
  
  // Simple chat example
  const messages = [
    claude.createSystemMessage('You are a helpful assistant that provides concise responses.'),
    claude.createUserMessage('What are the key features of TypeScript?')
  ];
  
  const response = await claude.chat(messages, {
    temperature: 0.7,
    maxTokens: 500
  });
  
  logger.info('Claude Response:');
  logger.info(`Content: ${response.content}`);
  logger.info(`Model: ${response.model}`);
  logger.info(`Tokens: ${response.usage?.totalTokens}`);
}

/**
 * Example of comparing responses from different providers
 */
async function compareProviders() {
  logger.info('--- Comparing Different LLM Providers ---');
  
  const providers = [
    {
      name: 'OpenAI',
      provider: LLMProvider.OPENAI,
      apiKey: process.env.OPENAI_API_KEY
    },
    {
      name: 'Anthropic',
      provider: LLMProvider.ANTHROPIC,
      apiKey: process.env.ANTHROPIC_API_KEY
    }
    // Uncomment to add more providers when you have API keys
    // {
    //   name: 'Grok',
    //   provider: LLMProvider.GROK,
    //   apiKey: process.env.GROK_API_KEY
    // },
    // {
    //   name: 'DeepSeek',
    //   provider: LLMProvider.DEEPSEEK,
    //   apiKey: process.env.DEEPSEEK_API_KEY
    // }
  ];
  
  const question = 'What are the advantages and disadvantages of using TypeScript over JavaScript?';
  
  logger.info(`Question: ${question}`);
  
  for (const provider of providers) {
    if (!provider.apiKey) {
      logger.warn(`Skipping ${provider.name} - API key not found`);
      continue;
    }
    
    try {
      const connector = LLMConnectorFactory.createConnector(provider.provider, {
        apiKey: provider.apiKey,
        model: LLMConnectorFactory.getDefaultModel(provider.provider)
      });
      
      const isValid = await connector.hasValidCredentials();
      
      if (!isValid) {
        logger.error(`Invalid ${provider.name} credentials`);
        continue;
      }
      
      logger.info(`Getting response from ${provider.name} (${connector.getModel()})...`);
      
      const messages = [
        connector.createSystemMessage('You are a helpful assistant that provides concise responses.'),
        connector.createUserMessage(question)
      ];
      
      const response = await connector.chat(messages, {
        temperature: 0.7,
        maxTokens: 500
      });
      
      logger.info(`${provider.name} Response:`);
      logger.info(`Content: ${response.content}`);
      logger.info(`Tokens: ${response.usage?.totalTokens}`);
      logger.info('---');
    } catch (error) {
      logger.error(`Error with ${provider.name}:`, error);
    }
  }
}

/**
 * Example of streaming responses
 */
async function streamExample(connector: BaseLLMConnector) {
  logger.info(`--- Streaming Example with ${connector.getProviderName()} ---`);
  
  const messages = [
    connector.createSystemMessage('You are a helpful assistant that provides concise responses.'),
    connector.createUserMessage('Write a short poem about artificial intelligence.')
  ];
  
  logger.info('Streaming response...');
  
  return new Promise<void>((resolve) => {
    let responseText = '';
    
    connector.on('data', (data) => {
      process.stdout.write(data.content);
      responseText += data.content;
    });
    
    connector.on('error', (error) => {
      logger.error('Stream error:', error);
      resolve();
    });
    
    connector.on('end', () => {
      process.stdout.write('\n');
      logger.info(`Complete response length: ${responseText.length} characters`);
      resolve();
    });
    
    connector.streamChat(messages, {
      temperature: 0.7,
      maxTokens: 500
    });
  });
}

// Run the example
runLLMConnectorsExample().catch(error => {
  logger.error('Unhandled error:', error);
  process.exit(1);
}); 