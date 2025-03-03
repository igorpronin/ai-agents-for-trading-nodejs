import dotenv from 'dotenv';
import { AgentFactory } from '../src/core/agent-framework/agent-factory';
import { NewsSentimentAgent } from '../src/agents/sentiment/news-sentiment-agent';
import { createContextLogger } from '../src/core/utils/logger';

// Load environment variables
dotenv.config();

const logger = createContextLogger('SentimentAnalysisExample');

/**
 * Example script demonstrating how to use the News Sentiment Agent
 */
async function runSentimentAnalysisExample() {
  logger.info('Starting Sentiment Analysis Example');
  
  try {
    // Initialize agent factory
    const agentFactory = AgentFactory.getInstance();
    
    // Register agent type
    agentFactory.registerAgentType('news-sentiment', NewsSentimentAgent);
    
    // Create agent instance
    const sentimentAgent = agentFactory.createAgent(
      'news-sentiment', 
      'news-sentiment-example',
      'News Sentiment Agent Example',
      'Analyzes sentiment in financial news for specific companies'
    );
    
    // Initialize agent
    await sentimentAgent.initialize({
      apiKeys: {
        newsApi: process.env.NEWS_API_KEY
      }
    });
    
    // Define companies to analyze
    const companies = ['Apple', 'Microsoft', 'Google', 'Amazon', 'Tesla'];
    
    // Analyze each company
    for (const company of companies) {
      logger.info(`Analyzing sentiment for ${company}`);
      
      // Execute sentiment analysis
      const results = await sentimentAgent.execute({
        sources: [
          `https://newsapi.org/v2/everything?q=${encodeURIComponent(company)}&language=en&sortBy=publishedAt&pageSize=10`
        ]
      });
      
      // Display results
      logger.info(`Sentiment results for ${company}:`);
      logger.info(`- Overall sentiment: ${results.overallSentiment.assessment} (score: ${results.overallSentiment.score.toFixed(2)})`);
      logger.info(`- Articles analyzed: ${results.overallSentiment.articleCount}`);
      
      // Display individual article sentiments
      logger.info('Top articles:');
      results.articleSentiments.slice(0, 3).forEach((article: any, index: number) => {
        logger.info(`  ${index + 1}. "${article.title}" - Sentiment: ${article.sentiment.vote} (${article.sentiment.score.toFixed(2)})`);
      });
      
      // Add a separator between companies
      logger.info('-----------------------------------');
    }
    
    // Clean up resources
    await sentimentAgent.cleanup();
    
    logger.info('Sentiment Analysis Example completed successfully');
  } catch (error) {
    logger.error('Error in Sentiment Analysis Example:', error);
  }
}

// Run the example
runSentimentAnalysisExample().catch(error => {
  logger.error('Unhandled error:', error);
  process.exit(1);
});

// For importing as a module
export { runSentimentAnalysisExample }; 