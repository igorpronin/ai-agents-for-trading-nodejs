import dotenv from 'dotenv';
import { TechnicalAnalysisAgent } from '../src/agents/market-analysis/technical-analysis-agent';
import { createContextLogger } from '../src/core/utils/logger';

// Load environment variables
dotenv.config();

// Create a logger for this example
const logger = createContextLogger('SimpleTechnicalAnalysisExample');

/**
 * Simple example demonstrating how to use the TechnicalAnalysisAgent
 */
async function runSimpleTechnicalAnalysis() {
  logger.info('Starting Simple Technical Analysis Example');
  
  try {
    // Create an instance of the TechnicalAnalysisAgent
    const agent = new TechnicalAnalysisAgent('simple-tech-analysis');
    
    // Initialize the agent with configuration
    await agent.initialize({
      indicators: ['sma', 'rsi', 'macd']
    });
    
    // Sample market data for AAPL (Apple Inc.)
    const marketData = [
      { time: '2023-01-01', open: 150.0, high: 152.5, low: 149.5, close: 151.0, volume: 1000000 },
      { time: '2023-01-02', open: 151.0, high: 153.0, low: 150.0, close: 152.5, volume: 1200000 },
      { time: '2023-01-03', open: 152.5, high: 155.0, low: 151.5, close: 154.0, volume: 1500000 },
      { time: '2023-01-04', open: 154.0, high: 156.5, low: 153.0, close: 156.0, volume: 1300000 },
      { time: '2023-01-05', open: 156.0, high: 158.0, low: 155.0, close: 157.5, volume: 1400000 },
      { time: '2023-01-06', open: 157.5, high: 159.0, low: 156.5, close: 158.0, volume: 1100000 },
      { time: '2023-01-07', open: 158.0, high: 160.0, low: 157.0, close: 159.5, volume: 1200000 },
      { time: '2023-01-08', open: 159.5, high: 161.0, low: 158.5, close: 160.0, volume: 1300000 },
      { time: '2023-01-09', open: 160.0, high: 162.5, low: 159.0, close: 162.0, volume: 1400000 },
      { time: '2023-01-10', open: 162.0, high: 164.0, low: 161.0, close: 163.5, volume: 1500000 },
      { time: '2023-01-11', open: 163.5, high: 165.0, low: 162.5, close: 164.0, volume: 1600000 },
      { time: '2023-01-12', open: 164.0, high: 166.0, low: 163.0, close: 165.5, volume: 1700000 },
      { time: '2023-01-13', open: 165.5, high: 167.0, low: 164.5, close: 166.0, volume: 1800000 },
      { time: '2023-01-14', open: 166.0, high: 168.0, low: 165.0, close: 167.5, volume: 1900000 },
      { time: '2023-01-15', open: 167.5, high: 169.0, low: 166.5, close: 168.0, volume: 2000000 },
      // Add more data points for better indicator calculations
      { time: '2023-01-16', open: 168.0, high: 170.0, low: 167.0, close: 169.5, volume: 2100000 },
      { time: '2023-01-17', open: 169.5, high: 171.0, low: 168.5, close: 170.0, volume: 2200000 },
      { time: '2023-01-18', open: 170.0, high: 172.5, low: 169.0, close: 172.0, volume: 2300000 },
      { time: '2023-01-19', open: 172.0, high: 174.0, low: 171.0, close: 173.5, volume: 2400000 },
      { time: '2023-01-20', open: 173.5, high: 175.0, low: 172.5, close: 174.0, volume: 2500000 },
      { time: '2023-01-21', open: 174.0, high: 176.0, low: 173.0, close: 175.5, volume: 2600000 },
      { time: '2023-01-22', open: 175.5, high: 177.0, low: 174.5, close: 176.0, volume: 2700000 },
      { time: '2023-01-23', open: 176.0, high: 178.0, low: 175.0, close: 177.5, volume: 2800000 },
      { time: '2023-01-24', open: 177.5, high: 179.0, low: 176.5, close: 178.0, volume: 2900000 },
      { time: '2023-01-25', open: 178.0, high: 180.0, low: 177.0, close: 179.5, volume: 3000000 },
    ];
    
    // Execute the technical analysis
    const results = await agent.execute({
      symbol: 'AAPL',
      data: marketData,
      indicators: ['sma', 'rsi', 'macd']
    });
    
    // Print the results in a readable format
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
    
    // Clean up resources
    await agent.cleanup();
    
    logger.info('Simple Technical Analysis Example completed successfully');
  } catch (error) {
    logger.error('Error in Simple Technical Analysis Example:', error);
  }
}

// Run the example
runSimpleTechnicalAnalysis().catch(error => {
  logger.error('Unhandled error:', error);
  process.exit(1);
});

// For importing as a module
export { runSimpleTechnicalAnalysis }; 