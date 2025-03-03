import dotenv from 'dotenv';
import { AgentFactory } from '../src/core/agent-framework/agent-factory';
import { TechnicalAnalysisAgent } from '../src/agents/market-analysis/technical-analysis-agent';
import { createContextLogger } from '../src/core/utils/logger';
import { AlphaVantageProvider } from '../src/core/data-providers/alpha-vantage-provider';

// Load environment variables
dotenv.config();

const logger = createContextLogger('TechnicalAnalysisExample');

/**
 * Example script demonstrating how to use the Technical Analysis Agent
 */
async function runTechnicalAnalysisExample() {
  logger.info('Starting Technical Analysis Example');
  
  try {
    // Create AlphaVantage provider with storage options
    const alphaVantageProvider = new AlphaVantageProvider({
      apiKey: process.env.ALPHAVANTAGE_API_KEY,
      store: true,
      storageDir: './data/market-data'
    });
    
    // Check if Alpha Vantage API key is available
    if (!alphaVantageProvider.hasValidApiKey()) {
      logger.error('Alpha Vantage API key not found or invalid. Please set ALPHAVANTAGE_API_KEY in your .env file.');
      logger.info('Falling back to sample data...');
      await runWithSampleData();
      return;
    }
    
    // Define symbols to analyze
    const symbols = ['AAPL', 'MSFT', 'GOOGL'];
    
    // Create an instance of the TechnicalAnalysisAgent
    const agent = new TechnicalAnalysisAgent('tech-analysis-example');
    
    // Initialize the agent with configuration
    await agent.initialize({
      indicators: ['sma', 'rsi', 'macd', 'bollinger']
    });
    
    // Fetch market data for all symbols
    logger.info('Fetching market data for all symbols...');
    const marketDataBySymbol = await alphaVantageProvider.fetchMultipleSymbols(symbols);
    
    // Analyze each symbol
    for (const symbol of symbols) {
      logger.info(`Analyzing ${symbol} with real market data from Alpha Vantage...`);
      
      try {
        const marketData = marketDataBySymbol[symbol];
        
        if (!marketData || marketData.length === 0) {
          logger.warn(`No market data available for ${symbol}, skipping...`);
          continue;
        }
        
        logger.info(`Retrieved ${marketData.length} data points for ${symbol}`);
        
        // Execute technical analysis
        const results = await agent.execute({
          symbol,
          data: marketData,
          indicators: ['sma', 'rsi', 'macd']
        });
        
        // Display results
        displayResults(results);
        
        // Add a separator between symbols
        logger.info('-----------------------------------');
      } catch (error) {
        logger.error(`Error analyzing ${symbol}:`, error);
      }
    }
    
    // Clean up resources
    await agent.cleanup();
    
    logger.info('Technical Analysis Example completed successfully');
  } catch (error) {
    logger.error('Error in Technical Analysis Example:', error);
  }
}

/**
 * Run the example with sample data if API key is not available
 */
async function runWithSampleData() {
  try {
    // Create an instance of the TechnicalAnalysisAgent
    const agent = new TechnicalAnalysisAgent('tech-analysis-sample');
    
    // Initialize the agent with configuration
    await agent.initialize({
      indicators: ['sma', 'rsi', 'macd', 'bollinger']
    });
    
    // Use sample data for AAPL
    const symbol = 'AAPL';
    logger.info(`Analyzing ${symbol} with sample data...`);
    
    const marketData = generateSampleMarketData(symbol);
    
    // Execute technical analysis
    const results = await agent.execute({
      symbol,
      data: marketData,
      indicators: ['sma', 'rsi', 'macd']
    });
    
    // Display results
    displayResults(results);
    
    // Clean up resources
    await agent.cleanup();
    
    logger.info('Sample data analysis completed successfully');
  } catch (error) {
    logger.error('Error in sample data analysis:', error);
  }
}

/**
 * Display technical analysis results in a readable format
 * @param results - Technical analysis results
 */
function displayResults(results: any) {
  logger.info('Technical Analysis Results:');
  logger.info(`Symbol: ${results.symbol}`);
  logger.info(`Timestamp: ${results.timestamp}`);
  
  // Print signal strength
  logger.info(`Signal Strength: ${results.signals.strength.toUpperCase()}`);
  
  // Print buy signals
  if (results.signals.buy.length > 0) {
    logger.info('Buy Signals:');
    results.signals.buy.forEach((signal: any, index: number) => {
      logger.info(`  ${index + 1}. ${signal.indicator}: ${signal.reason}`);
    });
  } else {
    logger.info('No buy signals detected');
  }
  
  // Print sell signals
  if (results.signals.sell.length > 0) {
    logger.info('Sell Signals:');
    results.signals.sell.forEach((signal: any, index: number) => {
      logger.info(`  ${index + 1}. ${signal.indicator}: ${signal.reason}`);
    });
  } else {
    logger.info('No sell signals detected');
  }
  
  // Print RSI value if available
  if (results.indicators.rsi && results.indicators.rsi.latest !== undefined) {
    logger.info(`RSI (14): ${results.indicators.rsi.latest.toFixed(2)}`);
  }
  
  // Print MACD values if available
  if (results.indicators.macd && results.indicators.macd.latest) {
    const macd = results.indicators.macd.latest;
    logger.info(`MACD: ${macd.MACD.toFixed(2)}, Signal: ${macd.signal.toFixed(2)}, Histogram: ${macd.histogram.toFixed(2)}`);
  }
  
  // Print SMA values if available
  if (results.indicators.sma) {
    const sma = results.indicators.sma;
    logger.info('Simple Moving Averages:');
    Object.keys(sma).forEach(period => {
      const values = sma[period];
      if (values.length > 0) {
        logger.info(`  ${period}: ${values[values.length - 1].toFixed(2)}`);
      }
    });
  }
}

/**
 * Generate sample market data for demonstration purposes
 * @param symbol - The stock symbol
 * @returns Sample market data
 */
function generateSampleMarketData(symbol: string): any[] {
  // Base price varies by symbol to make the example more realistic
  let basePrice;
  switch (symbol) {
    case 'AAPL': basePrice = 150.0; break;
    case 'MSFT': basePrice = 300.0; break;
    case 'GOOGL': basePrice = 2800.0; break;
    case 'AMZN': basePrice = 3300.0; break;
    case 'TSLA': basePrice = 900.0; break;
    default: basePrice = 100.0;
  }
  
  // Define the type for market data
  type MarketData = {
    time: string;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
  };
  
  const data: MarketData[] = [];
  const days = 30; // Generate 30 days of data
  
  for (let i = 0; i < days; i++) {
    // Generate a date for each candle, starting from 30 days ago
    const date = new Date();
    date.setDate(date.getDate() - (days - i));
    
    // Generate random price movements
    const dailyVolatility = 0.02; // 2% daily volatility
    const randomChange = (Math.random() - 0.5) * 2 * dailyVolatility;
    
    // Calculate prices with some randomness
    const open: number = basePrice * (1 + (i > 0 ? randomChange : 0));
    const high: number = open * (1 + Math.random() * 0.01);
    const low: number = open * (1 - Math.random() * 0.01);
    const close: number = (high + low) / 2 + (Math.random() - 0.5) * (high - low);
    
    // Update base price for next iteration
    basePrice = close;
    
    // Generate random volume
    const volume: number = Math.floor(1000000 + Math.random() * 9000000);
    
    // Add candle to data array
    data.push({
      time: date.toISOString().split('T')[0],
      open,
      high,
      low,
      close,
      volume
    });
  }
  
  return data;
}

// Run the example
runTechnicalAnalysisExample().catch(error => {
  logger.error('Unhandled error:', error);
  process.exit(1);
});

// For importing as a module
export { runTechnicalAnalysisExample }; 