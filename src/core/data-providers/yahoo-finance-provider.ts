import axios from 'axios';
import { createContextLogger } from '../utils/logger';
import { BaseMarketDataProvider, BaseMarketDataProviderOptions, MarketDataPoint } from './base-market-data-provider';

const logger = createContextLogger('YahooFinanceProvider');

/**
 * Configuration options for YahooFinanceProvider
 */
export interface YahooFinanceProviderOptions extends BaseMarketDataProviderOptions {
  /** Base URL for Yahoo Finance API (optional, defaults to standard endpoint) */
  baseUrl?: string;
}

/**
 * Provider class for fetching data from Yahoo Finance API
 */
export class YahooFinanceProvider extends BaseMarketDataProvider {
  private baseUrl: string;
  
  /**
   * Create a new Yahoo Finance provider
   * @param options - Configuration options
   */
  constructor(options: YahooFinanceProviderOptions = {}) {
    super(options, 'YAHOO');
    this.baseUrl = options.baseUrl || 'https://query1.finance.yahoo.com/v8/finance/chart';
    
    logger.info('Initialized Yahoo Finance provider');
  }
  
  /**
   * Check if the provider has valid credentials
   * Yahoo Finance doesn't require API keys for basic functionality
   * @returns Always returns true as no API key is required
   */
  public hasValidCredentials(): boolean {
    return true;
  }
  
  /**
   * Fetch daily time series data for a symbol
   * @param symbol - The stock symbol to fetch data for
   * @param options - Additional options for the request
   * @returns Formatted market data array
   */
  public async fetchDailyTimeSeries(
    symbol: string, 
    options?: { 
      period?: '1d' | '5d' | '1mo' | '3mo' | '6mo' | '1y' | '2y' | '5y' | '10y' | 'max',
      interval?: '1d' | '1wk' | '1mo'
    }
  ): Promise<MarketDataPoint[]> {
    try {
      const period = options?.period || '1mo';
      const interval = options?.interval || '1d';
      
      logger.info(`Fetching ${period} data for ${symbol} with ${interval} interval from Yahoo Finance...`);
      
      const response = await axios.get(`${this.baseUrl}/${symbol}`, {
        params: {
          period,
          interval,
          includePrePost: false,
          events: 'div,split'
        }
      });
      
      // Log response structure for debugging
      logger.debug(`Response received for ${symbol}. Status: ${response.status}`);
      
      // Check if the response contains the expected data
      if (!response.data || !response.data.chart || !response.data.chart.result || response.data.chart.result.length === 0) {
        logger.error(`Invalid response format from Yahoo Finance API for ${symbol}`);
        logger.error(`Response structure: ${JSON.stringify(Object.keys(response.data || {}))}`);
        throw new Error(`Invalid response format from Yahoo Finance API for ${symbol}`);
      }
      
      // Store response to file if enabled
      if (this.store && this.storageDir) {
        await this.storeResponseToFile(symbol, response.data, { period, interval });
      }
      
      // Extract the data from the response
      const result = response.data.chart.result[0];
      const timestamps = result.timestamp;
      const quote = result.indicators.quote[0];
      
      if (!timestamps || !quote || !quote.open || !quote.high || !quote.low || !quote.close || !quote.volume) {
        logger.error(`Missing required data fields in Yahoo Finance response for ${symbol}`);
        throw new Error(`Missing required data fields in Yahoo Finance response for ${symbol}`);
      }
      
      // Format the data
      const formattedData: MarketDataPoint[] = [];
      for (let i = 0; i < timestamps.length; i++) {
        // Skip data points with null values
        if (quote.open[i] === null || quote.high[i] === null || 
            quote.low[i] === null || quote.close[i] === null || 
            quote.volume[i] === null) {
          continue;
        }
        
        formattedData.push({
          time: new Date(timestamps[i] * 1000).toISOString().split('T')[0],
          open: quote.open[i],
          high: quote.high[i],
          low: quote.low[i],
          close: quote.close[i],
          volume: quote.volume[i]
        });
      }
      
      // Sort by date (newest first)
      return formattedData.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
    } catch (error) {
      logger.error(`Error fetching data for ${symbol}: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }
  
  /**
   * Fetch market data for multiple symbols
   * @param symbols - Array of stock symbols to fetch data for
   * @param options - Additional options for the request
   * @returns Object with symbols as keys and market data arrays as values
   */
  public async fetchMultipleSymbols(
    symbols: string[], 
    options?: { 
      period?: '1d' | '5d' | '1mo' | '3mo' | '6mo' | '1y' | '2y' | '5y' | '10y' | 'max',
      interval?: '1d' | '1wk' | '1mo'
    }
  ): Promise<Record<string, MarketDataPoint[]>> {
    const result: Record<string, MarketDataPoint[]> = {};
    const errors: Record<string, string> = {};
    
    // Use sequential requests
    for (const symbol of symbols) {
      try {
        // Add a small delay between requests to avoid rate limiting
        if (symbols.indexOf(symbol) > 0) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
        
        logger.info(`Fetching data for ${symbol}...`);
        const data = await this.fetchDailyTimeSeries(symbol, options);
        result[symbol] = data;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        logger.error(`Failed to fetch data for ${symbol}: ${errorMessage}`);
        errors[symbol] = errorMessage;
        // Continue with other symbols even if one fails
      }
    }
    
    // Log summary of errors if any occurred
    if (Object.keys(errors).length > 0) {
      logger.error(`Encountered errors for ${Object.keys(errors).length} out of ${symbols.length} symbols`);
      logger.error(`Error summary: ${JSON.stringify(errors)}`);
    }
    
    return result;
  }
} 