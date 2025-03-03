import dotenv from 'dotenv';
import { AgentFactory } from './core/agent-framework/agent-factory';
import { NewsSentimentAgent } from './agents/sentiment/news-sentiment-agent';
import { TechnicalAnalysisAgent } from './agents/market-analysis/technical-analysis-agent';
import logger from './core/utils/logger';

// Load environment variables
dotenv.config();

/**
 * Main entry point for the AI Agents for Trading application
 */
async function main() {
  logger.info('Starting AI Agents for Trading');
  
  try {
    // Initialize agent factory
    const agentFactory = AgentFactory.getInstance();
    
    // Register agent types
    agentFactory.registerAgentType('news-sentiment', NewsSentimentAgent);
    agentFactory.registerAgentType('technical-analysis', TechnicalAnalysisAgent);
    
    // Create agent instances
    const sentimentAgent = agentFactory.createAgent(
      'news-sentiment', 
      'news-sentiment-1',
      'News Sentiment Agent',
      'Analyzes sentiment in financial news'
    );
    
    const technicalAgent = agentFactory.createAgent(
      'technical-analysis',
      'technical-analysis-1',
      'Technical Analysis Agent',
      'Performs technical analysis on market data'
    );
    
    // Initialize agents
    await sentimentAgent.initialize({
      // Configuration for sentiment agent
      apiKeys: {
        newsApi: process.env.NEWS_API_KEY
      }
    });
    
    await technicalAgent.initialize({
      // Configuration for technical analysis agent
      indicators: ['sma', 'rsi', 'macd', 'bollinger']
    });
    
    // Example: Run sentiment analysis
    const sentimentResults = await sentimentAgent.execute({
      sources: [
        'https://newsapi.org/v2/top-headlines?country=us&category=business',
        // Add more news sources as needed
      ]
    });
    
    logger.info('Sentiment Analysis Results:', sentimentResults);
    
    // Example: Run technical analysis
    const technicalResults = await technicalAgent.execute({
      symbol: 'AAPL',
      data: getSampleMarketData(), // This would be replaced with actual market data
      indicators: ['sma', 'rsi', 'macd']
    });
    
    logger.info('Technical Analysis Results:', technicalResults);
    
    // Clean up resources
    await sentimentAgent.cleanup();
    await technicalAgent.cleanup();
    
    logger.info('AI Agents for Trading completed successfully');
  } catch (error) {
    logger.error('Error in AI Agents for Trading:', error);
    process.exit(1);
  }
}

/**
 * Generate sample market data for demonstration purposes
 * @returns Sample market data
 */
function getSampleMarketData() {
  // This is just sample data for demonstration
  // In a real application, this would be fetched from a market data provider
  return [
    { time: '2023-01-01', open: 150.0, high: 152.5, low: 149.5, close: 151.0, volume: 1000000 },
    { time: '2023-01-02', open: 151.0, high: 153.0, low: 150.0, close: 152.5, volume: 1200000 },
    { time: '2023-01-03', open: 152.5, high: 155.0, low: 151.5, close: 154.0, volume: 1500000 },
    { time: '2023-01-04', open: 154.0, high: 156.5, low: 153.0, close: 156.0, volume: 1300000 },
    { time: '2023-01-05', open: 156.0, high: 158.0, low: 155.0, close: 157.5, volume: 1400000 },
    { time: '2023-01-06', open: 157.5, high: 159.0, low: 156.5, close: 158.0, volume: 1100000 },
    { time: '2023-01-07', open: 158.0, high: 160.0, low: 157.0, close: 159.5, volume: 1200000 },
    { time: '2023-01-08', open: 159.5, high: 161.0, low: 158.5, close: 160.0, volume: 1300000 },
    { time: '2023-01-09', open: 160.0, high: 162.5, low: 159.0, close: 162.0, volume: 1400000 },
    { time: '2023-01-10', open: 162.0, high: 164.0, low: 161.0, close: 163.5, volume: 1500000 },
    { time: '2023-01-11', open: 163.5, high: 165.0, low: 162.5, close: 164.0, volume: 1600000 },
    { time: '2023-01-12', open: 164.0, high: 166.0, low: 163.0, close: 165.5, volume: 1700000 },
    { time: '2023-01-13', open: 165.5, high: 167.0, low: 164.5, close: 166.0, volume: 1800000 },
    { time: '2023-01-14', open: 166.0, high: 168.0, low: 165.0, close: 167.5, volume: 1900000 },
    { time: '2023-01-15', open: 167.5, high: 169.0, low: 166.5, close: 168.0, volume: 2000000 },
    // Add more data points as needed
  ];
}

// Run the main function
if (require.main === module) {
  main().catch(error => {
    logger.error('Unhandled error:', error);
    process.exit(1);
  });
}

// Export for use as a module
export { main }; 