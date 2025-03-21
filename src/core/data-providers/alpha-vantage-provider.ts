import axios from 'axios';
import dotenv from 'dotenv';
import { createContextLogger } from '../utils/logger';
import { BaseMarketDataProvider, BaseMarketDataProviderOptions, MarketDataPoint } from './base-market-data-provider';

dotenv.config();

const logger = createContextLogger('AlphaVantageProvider');

/**
 * Configuration options for AlphaVantageProvider
 */
export interface AlphaVantageProviderOptions extends BaseMarketDataProviderOptions {
  /** API key for Alpha Vantage (optional, will use env var if not provided) */
  apiKey?: string;
}

/**
 * Provider class for fetching data from Alpha Vantage API
 */
export class AlphaVantageProvider extends BaseMarketDataProvider {
  private apiKey: string;
  private baseUrl: string = 'https://www.alphavantage.co/query';
  
  /**
   * Create a new Alpha Vantage provider
   * @param options - Configuration options
   */
  constructor(options: AlphaVantageProviderOptions = {}) {
    super(options, 'ALPHAVANTAGE');
    this.apiKey = options.apiKey || process.env.ALPHAVANTAGE_API_KEY || '';
    
    if (!this.apiKey) {
      logger.warn('No Alpha Vantage API key provided. Set ALPHAVANTAGE_API_KEY in your .env file');
    }
  }
  
  /**
   * Check if the provider has a valid API key
   * @returns boolean indicating if the API key is available
   */
  public hasValidCredentials(): boolean {
    return !!this.apiKey && this.apiKey.length > 0 && this.apiKey !== 'your_alphavantage_api_key';
  }
  
  /**
   * Fetch daily time series data for a symbol
   * @param symbol - The stock symbol to fetch data for
   * @param options - Additional options for the request
   * @returns Formatted market data array
   */
  public async fetchDailyTimeSeries(
    symbol: string, 
    options?: { outputSize?: 'compact' | 'full' }
  ): Promise<MarketDataPoint[]> {
    const outputSize = options?.outputSize || 'compact';
    
    try {
      if (!this.hasValidCredentials()) {
        throw new Error('Valid Alpha Vantage API key is required');
      }
      
      const response = await axios.get(this.baseUrl, {
        params: {
          function: 'TIME_SERIES_DAILY',
          symbol,
          outputsize: outputSize,
          apikey: this.apiKey
        }
      });
      
      // Log response structure for debugging
      logger.debug(`Response received for ${symbol}. Status: ${response.status}`);
      logger.debug(`Response headers: ${JSON.stringify(response.headers)}`);
      
      // Check for error messages in the response
      if (response.data['Error Message']) {
        logger.error(`Alpha Vantage API error for ${symbol}: ${response.data['Error Message']}`);
        logger.error(`Full response: ${JSON.stringify(response.data)}`);
        throw new Error(`Alpha Vantage API error: ${response.data['Error Message']}`);
      }
      
      // Check for rate limiting
      const rateLimited = this.isRateLimited(response.data);
      if (rateLimited) {
        logger.warn(`Rate limiting detected for ${symbol}. Consider increasing delays between requests.`);
      }
      
      // Check for information messages (often rate limiting info)
      if (response.data['Information']) {
        logger.warn(`Alpha Vantage API information for ${symbol}: ${response.data['Information']}`);
      }
      
      // Check for note messages (often about API call frequency)
      if (response.data['Note']) {
        logger.warn(`Alpha Vantage API note for ${symbol}: ${response.data['Note']}`);
      }
      
      // Validate response format
      if (!response.data['Time Series (Daily)']) {
        logger.error(`Invalid response format from Alpha Vantage API for ${symbol}`);
        logger.error(`Response keys: ${Object.keys(response.data).join(', ')}`);
        logger.error(`Full response: ${JSON.stringify(response.data)}`);
        throw new Error(`Invalid response format from Alpha Vantage API for ${symbol}`);
      }
      
      // Store response to file if enabled
      if (this.store && this.storageDir) {
        await this.storeResponseToFile(symbol, response.data, { outputSize });
      }
      
      const timeSeriesData = response.data['Time Series (Daily)'];
      const formattedData = Object.entries(timeSeriesData).map(([date, values]: [string, any]) => ({
        time: date,
        open: parseFloat(values['1. open']),
        high: parseFloat(values['2. high']),
        low: parseFloat(values['3. low']),
        close: parseFloat(values['4. close']),
        volume: parseInt(values['5. volume'], 10)
      }));
      
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
    options?: { outputSize?: 'compact' | 'full' }
  ): Promise<Record<string, MarketDataPoint[]>> {
    const outputSize = options?.outputSize || 'compact';
    const result: Record<string, MarketDataPoint[]> = {};
    const errors: Record<string, string> = {};
    let isRateLimited = false;
    
    // Use sequential requests to avoid rate limiting
    for (const symbol of symbols) {
      try {
        // Apply appropriate delay based on rate limiting status
        if (symbols.indexOf(symbol) > 0) {
          const delayTime = this.getRecommendedDelay(isRateLimited);
          logger.info(`Waiting ${delayTime/1000} seconds before next request${isRateLimited ? ' (rate limited)' : ''}...`);
          await new Promise(resolve => setTimeout(resolve, delayTime));
          isRateLimited = false; // Reset rate limit flag after waiting
        }
        
        logger.info(`Fetching data for ${symbol}...`);
        const data = await this.fetchDailyTimeSeries(symbol, { outputSize });
        result[symbol] = data;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        logger.error(`Failed to fetch data for ${symbol}: ${errorMessage}`);
        errors[symbol] = errorMessage;
        
        // Check if this might be a rate limiting issue
        if (errorMessage.includes('call frequency') || errorMessage.includes('Thank you for using Alpha Vantage')) {
          logger.warn('Detected possible rate limiting. Will increase delay for next requests.');
          isRateLimited = true;
        }
        
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
  
  /**
   * Check if the API response indicates rate limiting
   * @param responseData - The API response data
   * @returns boolean indicating if rate limiting is active
   */
  private isRateLimited(responseData: any): boolean {
    if (!responseData) return false;
    
    // Check for standard rate limit messages
    if (responseData['Note'] && 
        (responseData['Note'].includes('call frequency') || 
         responseData['Note'].includes('Thank you for using Alpha Vantage!'))) {
      return true;
    }
    
    // Check for information messages about rate limiting
    if (responseData['Information'] && 
        responseData['Information'].includes('call frequency')) {
      return true;
    }
    
    return false;
  }
  
  /**
   * Get a recommended delay in milliseconds based on rate limiting status
   * @param isLimited - Whether rate limiting is active
   * @returns Delay in milliseconds
   */
  public getRecommendedDelay(isLimited: boolean): number {
    // If rate limited, wait 60 seconds to be safe
    // Otherwise use a standard delay of 1.5 seconds between requests
    return isLimited ? 60000 : 1500;
  }
} 