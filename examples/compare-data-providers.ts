import dotenv from 'dotenv';
import { createContextLogger } from '../src/core/utils/logger';
import { MarketDataProviderFactory } from '../src/core/data-providers/market-data-provider-factory';
import path from 'path';
import fs from 'fs';

// Load environment variables
dotenv.config();

const logger = createContextLogger('CompareDataProviders');

/**
 * Example script to compare data from different market data providers
 */
async function compareDataProviders() {
  logger.info('Starting data provider comparison');
  
  try {
    // Define storage directory
    const storageDir = path.join(process.cwd(), 'data', 'provider-comparison');
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(storageDir)) {
      fs.mkdirSync(storageDir, { recursive: true });
    }
    
    // Define symbols to compare
    const symbols = ['AAPL', 'MSFT'];
    
    // Create Alpha Vantage provider
    logger.info('Creating Alpha Vantage provider...');
    const alphaVantageProvider = MarketDataProviderFactory.createProvider('alphavantage', {
      store: true,
      storageDir
    });
    
    // Create Yahoo Finance provider
    logger.info('Creating Yahoo Finance provider...');
    const yahooFinanceProvider = MarketDataProviderFactory.createProvider('yahoo', {
      store: true,
      storageDir
    });
    
    // Check if Alpha Vantage API key is available
    if (!alphaVantageProvider.hasValidCredentials()) {
      logger.warn('Alpha Vantage API key not found or invalid. Skipping Alpha Vantage data collection.');
    } else {
      // Fetch data from Alpha Vantage
      logger.info('Fetching data from Alpha Vantage...');
      const alphaVantageData = await alphaVantageProvider.fetchMultipleSymbols(symbols, { outputSize: 'compact' });
      
      // Log summary of Alpha Vantage data
      logDataSummary('Alpha Vantage', alphaVantageData);
    }
    
    // Fetch data from Yahoo Finance
    logger.info('Fetching data from Yahoo Finance...');
    const yahooFinanceData = await yahooFinanceProvider.fetchMultipleSymbols(symbols, { 
      period: '1mo',
      interval: '1d'
    });
    
    // Log summary of Yahoo Finance data
    logDataSummary('Yahoo Finance', yahooFinanceData);
    
    logger.info('Data provider comparison completed');
    logger.info(`Data stored in: ${storageDir}`);
  } catch (error) {
    logger.error(`Error in data provider comparison: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Log a summary of the data retrieved from a provider
 * @param providerName - The name of the provider
 * @param data - The data retrieved from the provider
 */
function logDataSummary(providerName: string, data: Record<string, any[]>) {
  logger.info(`Data summary for ${providerName}:`);
  
  for (const [symbol, symbolData] of Object.entries(data)) {
    if (!symbolData || symbolData.length === 0) {
      logger.warn(`No data available for ${symbol}`);
      continue;
    }
    
    // Get the date range
    const dates = symbolData.map(item => new Date(item.time));
    const oldestDate = new Date(Math.min(...dates.map(d => d.getTime()))).toISOString().split('T')[0];
    const newestDate = new Date(Math.max(...dates.map(d => d.getTime()))).toISOString().split('T')[0];
    
    // Calculate price range
    const closes = symbolData.map(item => item.close);
    const minClose = Math.min(...closes);
    const maxClose = Math.max(...closes);
    
    logger.info(`${symbol}: ${symbolData.length} data points`);
    logger.info(`  Date range: ${oldestDate} to ${newestDate}`);
    logger.info(`  Price range: $${minClose.toFixed(2)} to $${maxClose.toFixed(2)}`);
    
    // Log the most recent data point
    const mostRecent = symbolData[0];
    logger.info(`  Most recent (${mostRecent.time}): Open: $${mostRecent.open.toFixed(2)}, Close: $${mostRecent.close.toFixed(2)}`);
  }
}

// Run the script
compareDataProviders().catch(error => {
  logger.error('Unhandled error:', error);
  process.exit(1);
}); 