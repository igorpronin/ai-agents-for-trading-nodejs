import dotenv from 'dotenv';
import { AlphaVantageProvider } from '../src/core/data-providers/alpha-vantage-provider';
import { createContextLogger } from '../src/core/utils/logger';
import path from 'path';

// Load environment variables
dotenv.config();

const logger = createContextLogger('CollectAlphaVantageData');

const dataDir = path.join(process.cwd(), 'data', 'market-data');

/**
 * Script to collect Alpha Vantage data examples in both full and compact formats
 */
async function collectAlphaVantageData() {
  logger.info('Starting Alpha Vantage data collection');
  
  try {
    // Define storage directory
    const storageDir = dataDir;
    
    // Create Alpha Vantage provider with storage options
    const alphaVantageProvider = new AlphaVantageProvider({
      store: true,
      storageDir
    });
    
    // Check if Alpha Vantage API key is available
    if (!alphaVantageProvider.hasValidCredentials()) {
      logger.error('Alpha Vantage API key not found or invalid. Please set ALPHAVANTAGE_API_KEY in your .env file.');
      logger.error('You can get a free API key from: https://www.alphavantage.co/support/#api-key');
      process.exit(1);
    }
    
    // Define symbols to collect data for - using fewer symbols to avoid rate limiting
    // Free API keys are limited to 5 requests per minute and 500 per day
    const symbols = ['AAPL', 'MSFT'];
    
    // Collect compact data
    logger.info('Collecting compact data for symbols...');
    await collectData(alphaVantageProvider, symbols, 'compact');
    
    // Wait longer before requesting full data to avoid rate limiting
    logger.info('Waiting 60 seconds before requesting full data to avoid rate limiting...');
    await new Promise(resolve => setTimeout(resolve, 60000));
    
    // Collect full data (only for a subset to avoid excessive API calls)
    logger.info('Collecting full data for a subset of symbols...');
    await collectData(alphaVantageProvider, symbols.slice(0, 1), 'full');
    
    logger.info('Data collection completed successfully');
    logger.info(`Data stored in: ${storageDir}`);
  } catch (error) {
    logger.error(`Error in data collection: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  }
}

/**
 * Collect data for multiple symbols with specified output size
 * @param provider - Alpha Vantage provider instance
 * @param symbols - Array of symbols to collect data for
 * @param outputSize - Size of data to collect ('compact' or 'full')
 */
async function collectData(
  provider: AlphaVantageProvider, 
  symbols: string[], 
  outputSize: 'compact' | 'full'
) {
  logger.info(`Collecting ${outputSize} data for: ${symbols.join(', ')}`);
  
  try {
    // Fetch data for all symbols
    const data = await provider.fetchMultipleSymbols(symbols, { outputSize });
    
    // Log summary of collected data
    let successCount = 0;
    let failureCount = 0;
    
    for (const symbol of symbols) {
      if (data[symbol] && data[symbol].length > 0) {
        logger.info(`✓ ${symbol}: ${data[symbol].length} data points collected (${outputSize})`);
        successCount++;
      } else {
        logger.warn(`✗ ${symbol}: Failed to collect data or no data points returned`);
        failureCount++;
      }
    }
    
    // Log summary statistics
    logger.info(`Collection summary for ${outputSize} data:`);
    logger.info(`- Total symbols: ${symbols.length}`);
    logger.info(`- Successful: ${successCount}`);
    logger.info(`- Failed: ${failureCount}`);
    
    if (failureCount > 0) {
      logger.warn('Some symbols failed to collect data. Check logs for details.');
    }
  } catch (error) {
    logger.error(`Error collecting ${outputSize} data: ${error instanceof Error ? error.message : String(error)}`);
    if (error instanceof Error && error.stack) {
      logger.error(`Stack trace: ${error.stack}`);
    }
    throw error;
  }
}

// Run the script
collectAlphaVantageData().catch(error => {
  logger.error('Unhandled error:', error);
  process.exit(1);
}); 