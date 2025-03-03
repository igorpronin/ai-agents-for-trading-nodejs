import dotenv from 'dotenv';
import { YahooFinanceProvider } from '../src/core/data-providers/yahoo-finance-provider';
import { createContextLogger } from '../src/core/utils/logger';
import path from 'path';

// Load environment variables
dotenv.config();

const logger = createContextLogger('CollectYahooData');

const dataDir = path.join(process.cwd(), 'data', 'market-data');

/**
 * Script to collect Yahoo Finance data examples with different periods and intervals
 */
async function collectYahooFinanceData() {
  logger.info('Starting Yahoo Finance data collection');
  
  try {
    // Define storage directory
    const storageDir = dataDir;
    
    // Create Yahoo Finance provider with storage options
    const yahooProvider = new YahooFinanceProvider({
      store: true,
      storageDir
    });
    
    // Check if Yahoo Finance provider is available
    if (!yahooProvider.hasValidCredentials()) {
      logger.error('Yahoo Finance provider is not available.');
      process.exit(1);
    }
    
    // Define symbols to collect data for
    const symbols = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'META'];
    
    // Define different period and interval combinations to collect
    const configurations = [
      { period: '1mo' as '1mo', interval: '1d' as '1d' },
      { period: '6mo' as '6mo', interval: '1d' as '1d' },
      { period: '1y' as '1y', interval: '1wk' as '1wk' },
      { period: '5y' as '5y', interval: '1mo' as '1mo' }
    ];
    
    // Collect data for each configuration
    for (const config of configurations) {
      logger.info(`Collecting data with period: ${config.period}, interval: ${config.interval}`);
      await collectData(yahooProvider, symbols, config.period, config.interval);
      
      // Add a small delay between configurations to avoid overwhelming the API
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    logger.info('Yahoo Finance data collection completed successfully');
    
  } catch (error) {
    logger.error('Error collecting Yahoo Finance data:', error);
    process.exit(1);
  }
}

/**
 * Collect data for multiple symbols with specified period and interval
 */
async function collectData(
  provider: YahooFinanceProvider, 
  symbols: string[], 
  period: '1d' | '5d' | '1mo' | '3mo' | '6mo' | '1y' | '2y' | '5y' | '10y' | 'max',
  interval: '1d' | '1wk' | '1mo'
) {
  const errors: Record<string, string> = {};
  let successCount = 0;
  
  for (const symbol of symbols) {
    try {
      logger.info(`Fetching data for ${symbol} with period: ${period}, interval: ${interval}`);
      
      // Fetch data for the symbol
      const data = await provider.fetchDailyTimeSeries(symbol, { period, interval });
      
      logger.info(`Successfully collected ${data.length} data points for ${symbol}`);
      successCount++;
      
      // Add a small delay between requests
      await new Promise(resolve => setTimeout(resolve, 500));
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error(`Error fetching data for ${symbol}: ${errorMessage}`);
      errors[symbol] = errorMessage;
    }
  }
  
  // Log summary
  logger.info(`Successfully collected data for ${successCount} out of ${symbols.length} symbols`);
  
  if (Object.keys(errors).length > 0) {
    logger.error(`Encountered errors for ${Object.keys(errors).length} symbols`);
    logger.error(`Error summary: ${JSON.stringify(errors)}`);
  }
}

// Run the collection function
collectYahooFinanceData().catch(error => {
  logger.error('Unhandled error in data collection:', error);
  process.exit(1);
}); 