import { BaseAgent } from '../../core/agent-framework/base-agent';
import { createContextLogger } from '../../core/utils/logger';
import * as technicalIndicators from 'technicalindicators';

const logger = createContextLogger('TechnicalAnalysisAgent');

/**
 * Agent for performing technical analysis on market data
 */
export class TechnicalAnalysisAgent extends BaseAgent {
  /**
   * Create a new technical analysis agent
   * @param id - Unique identifier for the agent
   */
  constructor(id: string) {
    super(
      id,
      'Technical Analysis Agent',
      'Performs technical analysis on market data to identify patterns and signals'
    );
  }
  
  /**
   * Initialize the agent with configuration
   * @param config - Configuration object for the agent
   */
  async initialize(config: Record<string, any>): Promise<void> {
    await super.initialize(config);
    logger.info(`Initializing TechnicalAnalysisAgent ${this.id}`);
    
    // Additional initialization logic can go here
  }
  
  /**
   * Execute technical analysis on market data
   * @param inputs - Input data containing market data to analyze
   * @returns Technical analysis results
   */
  async execute(inputs: Record<string, any>): Promise<Record<string, any>> {
    this.checkInitialized();
    logger.info(`Executing TechnicalAnalysisAgent ${this.id}`);
    
    const { symbol, data, indicators = ['sma', 'rsi', 'macd'] } = inputs;
    
    if (!data || !Array.isArray(data) || data.length === 0) {
      throw new Error('Invalid or empty market data provided');
    }
    
    try {
      const results: Record<string, any> = {
        symbol,
        timestamp: new Date().toISOString(),
        indicators: {}
      };
      
      // Extract price data
      const prices = this.extractPriceData(data);
      
      // Calculate requested indicators
      for (const indicator of indicators) {
        switch (indicator.toLowerCase()) {
          case 'sma':
            results.indicators.sma = this.calculateSMA(prices);
            break;
          case 'ema':
            results.indicators.ema = this.calculateEMA(prices);
            break;
          case 'rsi':
            results.indicators.rsi = this.calculateRSI(prices);
            break;
          case 'macd':
            results.indicators.macd = this.calculateMACD(prices);
            break;
          case 'bollinger':
            results.indicators.bollinger = this.calculateBollingerBands(prices);
            break;
          default:
            logger.warn(`Unknown indicator: ${indicator}`);
        }
      }
      
      // Generate signals based on indicators
      results.signals = this.generateSignals(results.indicators);
      
      logger.info(`TechnicalAnalysisAgent ${this.id} completed analysis for ${symbol}`);
      return results;
    } catch (error) {
      logger.error(`Error in TechnicalAnalysisAgent ${this.id}:`, error);
      throw error;
    }
  }
  
  /**
   * Clean up resources used by the agent
   */
  async cleanup(): Promise<void> {
    logger.info(`Cleaning up TechnicalAnalysisAgent ${this.id}`);
    await super.cleanup();
  }
  
  /**
   * Extract price data from market data
   * @param data - Market data array
   * @returns Extracted price data
   */
  private extractPriceData(data: any[]): { 
    open: number[], 
    high: number[], 
    low: number[], 
    close: number[], 
    volume: number[] 
  } {
    const open: number[] = [];
    const high: number[] = [];
    const low: number[] = [];
    const close: number[] = [];
    const volume: number[] = [];
    
    for (const candle of data) {
      open.push(Number(candle.open));
      high.push(Number(candle.high));
      low.push(Number(candle.low));
      close.push(Number(candle.close));
      volume.push(Number(candle.volume || 0));
    }
    
    return { open, high, low, close, volume };
  }
  
  /**
   * Calculate Simple Moving Average (SMA)
   * @param prices - Price data
   * @returns SMA values for different periods
   */
  private calculateSMA(prices: { close: number[] }): Record<string, number[]> {
    const periods = [9, 20, 50, 200];
    const results: Record<string, number[]> = {};
    
    for (const period of periods) {
      const sma = technicalIndicators.SMA.calculate({
        period,
        values: prices.close
      });
      
      results[`period${period}`] = sma;
    }
    
    return results;
  }
  
  /**
   * Calculate Exponential Moving Average (EMA)
   * @param prices - Price data
   * @returns EMA values for different periods
   */
  private calculateEMA(prices: { close: number[] }): Record<string, number[]> {
    const periods = [9, 20, 50, 200];
    const results: Record<string, number[]> = {};
    
    for (const period of periods) {
      const ema = technicalIndicators.EMA.calculate({
        period,
        values: prices.close
      });
      
      results[`period${period}`] = ema;
    }
    
    return results;
  }
  
  /**
   * Calculate Relative Strength Index (RSI)
   * @param prices - Price data
   * @returns RSI values
   */
  private calculateRSI(prices: { close: number[] }): Record<string, any> {
    const periods = [14];
    const results: Record<string, any> = {};
    
    for (const period of periods) {
      const rsi = technicalIndicators.RSI.calculate({
        period,
        values: prices.close
      });
      
      results[`period${period}`] = rsi;
      
      // Add the latest RSI value
      if (rsi.length > 0) {
        results.latest = rsi[rsi.length - 1];
      }
    }
    
    return results;
  }
  
  /**
   * Calculate Moving Average Convergence Divergence (MACD)
   * @param prices - Price data
   * @returns MACD values
   */
  private calculateMACD(prices: { close: number[] }): Record<string, any> {
    const macd = technicalIndicators.MACD.calculate({
      fastPeriod: 12,
      slowPeriod: 26,
      signalPeriod: 9,
      values: prices.close,
      SimpleMAOscillator: false,
      SimpleMASignal: false
    });
    
    return {
      macd: macd.map(item => item.MACD),
      signal: macd.map(item => item.signal),
      histogram: macd.map(item => item.histogram),
      latest: macd.length > 0 ? macd[macd.length - 1] : null
    };
  }
  
  /**
   * Calculate Bollinger Bands
   * @param prices - Price data
   * @returns Bollinger Bands values
   */
  private calculateBollingerBands(prices: { close: number[] }): Record<string, any> {
    const bollinger = technicalIndicators.BollingerBands.calculate({
      period: 20,
      stdDev: 2,
      values: prices.close
    });
    
    return {
      upper: bollinger.map(item => item.upper),
      middle: bollinger.map(item => item.middle),
      lower: bollinger.map(item => item.lower),
      latest: bollinger.length > 0 ? bollinger[bollinger.length - 1] : null
    };
  }
  
  /**
   * Generate trading signals based on technical indicators
   * @param indicators - Calculated technical indicators
   * @returns Trading signals
   */
  private generateSignals(indicators: Record<string, any>): Record<string, any> {
    const signals: Record<string, any> = {
      buy: [],
      sell: [],
      hold: [],
      strength: 'neutral'
    };
    
    // RSI signals
    if (indicators.rsi && indicators.rsi.latest !== undefined) {
      const rsiValue = indicators.rsi.latest;
      
      if (rsiValue < 30) {
        signals.buy.push({
          indicator: 'RSI',
          value: rsiValue,
          reason: 'Oversold (RSI < 30)'
        });
      } else if (rsiValue > 70) {
        signals.sell.push({
          indicator: 'RSI',
          value: rsiValue,
          reason: 'Overbought (RSI > 70)'
        });
      } else {
        signals.hold.push({
          indicator: 'RSI',
          value: rsiValue,
          reason: 'Neutral (30 < RSI < 70)'
        });
      }
    }
    
    // MACD signals
    if (indicators.macd && indicators.macd.latest) {
      const { MACD, signal, histogram } = indicators.macd.latest;
      
      if (MACD > signal && histogram > 0) {
        signals.buy.push({
          indicator: 'MACD',
          value: { MACD, signal, histogram },
          reason: 'MACD crossed above signal line'
        });
      } else if (MACD < signal && histogram < 0) {
        signals.sell.push({
          indicator: 'MACD',
          value: { MACD, signal, histogram },
          reason: 'MACD crossed below signal line'
        });
      } else {
        signals.hold.push({
          indicator: 'MACD',
          value: { MACD, signal, histogram },
          reason: 'No clear MACD signal'
        });
      }
    }
    
    // Determine overall signal strength
    if (signals.buy.length > signals.sell.length) {
      signals.strength = signals.buy.length > 2 ? 'strong buy' : 'buy';
    } else if (signals.sell.length > signals.buy.length) {
      signals.strength = signals.sell.length > 2 ? 'strong sell' : 'sell';
    } else {
      signals.strength = 'neutral';
    }
    
    return signals;
  }
} 