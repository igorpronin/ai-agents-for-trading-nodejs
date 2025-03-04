# AI Agents for Trading

A modular collection of AI-powered agents for automating various trading, investment, and financial analysis operations.

## Project Overview

This project provides a suite of independent but interoperable agents that can:
- Perform market data analysis
- Conduct sentiment analysis on financial news and social media
- Execute trading strategies
- Monitor portfolio performance
- Generate investment reports
- Detect market anomalies and opportunities

Each agent is designed to be used either as a standalone script or as a module that can be imported into other applications.

## Project Structure

```
ai-agents-for-trading-nodejs/
├── src/                      # Source code
│   ├── agents/               # Agent implementations
│   │   ├── market-analysis/  # Market analysis agents
│   │   ├── sentiment/        # Sentiment analysis agents
│   │   ├── trading/          # Trading execution agents
│   │   ├── portfolio/        # Portfolio management agents
│   │   └── reporting/        # Reporting and visualization agents
│   ├── core/                 # Core functionality
│   │   ├── agent-framework/  # Base agent framework
│   │   ├── data-providers/   # Data source connectors
│   │   ├── models/           # ML/AI models
│   │   └── utils/            # Utility functions
│   └── interfaces/           # Type definitions and interfaces
├── config/                   # Configuration files
├── data/                     # Data storage
│   ├── raw/                  # Raw data
│   └── processed/            # Processed data
|   └── market-data/          # Other market data or data examples
├── tests/                    # Test suite
├── examples/                 # Example usage scripts
├── docs/                     # Documentation
└── scripts/                  # Utility scripts
```

## Getting Started

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/ai-agents-for-trading-nodejs.git
   cd ai-agents-for-trading-nodejs
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   npm run init-env
   ```
   Then edit the `.env` file and add your API keys. At minimum, you'll need:
   - For technical analysis with real data: `ALPHAVANTAGE_API_KEY` (get from [Alpha Vantage](https://www.alphavantage.co/support/#api-key))
   - For sentiment analysis: `NEWS_API_KEY`

   If you update your `.env.example` file with new variables, you can sync them to your `.env` file:
   ```bash
   npm run sync-env
   ```
   This will add any missing environment variables from `.env.example` to your `.env` file with empty values.

4. **Run an example**
   ```bash
   # Run technical analysis example with sample data
   npm run tech-analysis
   
   # Run technical analysis with real market data from Alpha Vantage
   npm run real-market-analysis
   
   # Collect market data examples from Alpha Vantage (both compact and full datasets)
   npm run collect-market-data
   
   # Collect market data examples from Yahoo Finance (with various periods and intervals)
   npm run collect-yahoo-data
   ```

## Data providers

The project supports multiple market data providers:

#### Alpha Vantage

- Free tier: 5 API calls per minute, 500 calls per day
- Requires API key: Yes
- Get an API key here: https://www.alphavantage.co/support/#api-key

#### Yahoo Finance

- Free tier: Unlimited (unofficial API)
- Requires API key: No
- No registration required

To compare data from different providers, run:
```bash
npm run compare-providers
```

## LLM Connectors

The project includes a modular system for connecting to various Large Language Model (LLM) providers:

#### OpenAI (ChatGPT)

- Models: GPT-3.5-Turbo, GPT-4, GPT-4-Turbo, etc.
- Requires API key: Yes
- Get an API key here: https://platform.openai.com/api-keys

#### Anthropic (Claude)

- Models: Claude 3 Opus, Claude 3 Sonnet, Claude 3 Haiku, etc.
- Requires API key: Yes
- Get an API key here: https://console.anthropic.com/

#### Grok

- Models: Grok-1, Grok-1.5
- Requires API key: Yes
- Currently in limited availability

#### DeepSeek

- Models: DeepSeek Chat, DeepSeek Coder, etc.
- Requires API key: Yes
- Get an API key from DeepSeek's website

To run the LLM connectors example:
```bash
npm run llm-example
```

## Usage Examples

[Basic usage examples will go here]

## Contributing

[Contribution guidelines will go here]

## License

[License information will go here] 