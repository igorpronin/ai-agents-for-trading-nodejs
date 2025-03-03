import { createContextLogger } from '../utils/logger';
import { IMarketDataProvider } from './base-market-data-provider';
import { AlphaVantageProvider, AlphaVantageProviderOptions } from './alpha-vantage-provider';
import { YahooFinanceProvider, YahooFinanceProviderOptions } from './yahoo-finance-provider';

const logger = createContextLogger('MarketDataProviderFactory');

/**
 * Supported market data provider types
 */
export type MarketDataProviderType = 'alphavantage' | 'yahoo';

/**
 * Factory class for creating market data providers
 */
export class MarketDataProviderFactory {
  /**
   * Create a market data provider of the specified type
   * @param type - The type of provider to create
   * @param options - Configuration options for the provider
   * @returns An instance of the requested provider
   */
  public static createProvider(
    type: MarketDataProviderType,
    options: Record<string, any> = {}
  ): IMarketDataProvider {
    logger.info(`Creating market data provider of type: ${type}`);
    
    switch (type) {
      case 'alphavantage':
        return new AlphaVantageProvider(options as AlphaVantageProviderOptions);
        
      case 'yahoo':
        return new YahooFinanceProvider(options as YahooFinanceProviderOptions);
        
      default:
        logger.error(`Unknown provider type: ${type}`);
        throw new Error(`Unknown provider type: ${type}`);
    }
  }
} 