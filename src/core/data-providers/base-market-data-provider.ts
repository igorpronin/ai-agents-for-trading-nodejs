import fs from 'fs';
import path from 'path';
import { createContextLogger } from '../utils/logger';

const logger = createContextLogger('BaseMarketDataProvider');

/**
 * Common interface for market data
 */
export interface MarketDataPoint {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

/**
 * Base configuration options for market data providers
 */
export interface BaseMarketDataProviderOptions {
  /** Whether to store API responses to files */
  store?: boolean;
  /** Directory to store API responses (required if store is true) */
  storageDir?: string;
}

/**
 * Base interface for all market data providers
 */
export interface IMarketDataProvider {
  /**
   * Check if the provider has valid credentials
   */
  hasValidCredentials(): boolean;
  
  /**
   * Fetch daily time series data for a symbol
   * @param symbol - The stock symbol to fetch data for
   * @param options - Additional options for the request
   */
  fetchDailyTimeSeries(symbol: string, options?: Record<string, any>): Promise<MarketDataPoint[]>;
  
  /**
   * Fetch market data for multiple symbols
   * @param symbols - Array of stock symbols to fetch data for
   * @param options - Additional options for the request
   */
  fetchMultipleSymbols(symbols: string[], options?: Record<string, any>): Promise<Record<string, MarketDataPoint[]>>;
}

/**
 * Base class for market data providers with common functionality
 */
export abstract class BaseMarketDataProvider implements IMarketDataProvider {
  protected store: boolean;
  protected storageDir: string | null;
  protected providerName: string;
  
  /**
   * Create a new market data provider
   * @param options - Configuration options
   * @param providerName - Name of the provider (used for file naming)
   */
  constructor(options: BaseMarketDataProviderOptions = {}, providerName: string) {
    this.store = options.store || false;
    this.storageDir = options.storageDir || null;
    this.providerName = providerName;
    
    if (this.store && !this.storageDir) {
      throw new Error('Storage directory (storageDir) must be provided when store is set to true');
    }
    
    // Create storage directory if it doesn't exist
    if (this.store && this.storageDir) {
      try {
        if (!fs.existsSync(this.storageDir)) {
          fs.mkdirSync(this.storageDir, { recursive: true });
          logger.info(`Created storage directory: ${this.storageDir}`);
        }
      } catch (error) {
        logger.error(`Failed to create storage directory: ${error instanceof Error ? error.message : String(error)}`);
        throw new Error(`Failed to create storage directory: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  }
  
  /**
   * Check if the provider has valid credentials
   */
  abstract hasValidCredentials(): boolean;
  
  /**
   * Fetch daily time series data for a symbol
   * @param symbol - The stock symbol to fetch data for
   * @param options - Additional options for the request
   */
  abstract fetchDailyTimeSeries(symbol: string, options?: Record<string, any>): Promise<MarketDataPoint[]>;
  
  /**
   * Fetch market data for multiple symbols
   * @param symbols - Array of stock symbols to fetch data for
   * @param options - Additional options for the request
   */
  abstract fetchMultipleSymbols(symbols: string[], options?: Record<string, any>): Promise<Record<string, MarketDataPoint[]>>;
  
  /**
   * Store API response to a file
   * @param symbol - The stock symbol
   * @param data - The API response data
   * @param metadata - Additional metadata to include in the filename
   */
  protected async storeResponseToFile(
    symbol: string, 
    data: any,
    metadata: Record<string, string> = {}
  ): Promise<void> {
    try {
      if (!this.storageDir) return;
      
      // Create filename with datetime, provider, ticker, and metadata
      const now = new Date();
      const dateTimeStr = now.toISOString()
        .replace(/T/, '_')
        .replace(/\..+/, '')
        .replace(/:/g, '-');
      
      // Build metadata string for filename
      const metadataStr = Object.entries(metadata)
        .map(([key, value]) => `${key}-${value}`)
        .join('_');
      
      // Create filename with provider prefix
      const filename = `${this.providerName}_${dateTimeStr}_${symbol}${metadataStr ? '_' + metadataStr : ''}.json`;
      const filePath = path.join(this.storageDir, filename);
      
      // Write data to file
      await fs.promises.writeFile(
        filePath, 
        JSON.stringify(data, null, 2), 
        'utf8'
      );
      
      logger.info(`Stored ${this.providerName} response for ${symbol} to ${filePath}`);
    } catch (error) {
      logger.error(`Failed to store response to file: ${error instanceof Error ? error.message : String(error)}`);
      // Don't throw error here, just log it - we don't want to fail the main operation
    }
  }
} 