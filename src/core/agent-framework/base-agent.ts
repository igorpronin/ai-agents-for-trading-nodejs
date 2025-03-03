import { Agent } from '../../interfaces/agent';

/**
 * Abstract base class for all agents in the system
 * Implements common functionality and enforces the Agent interface
 */
export abstract class BaseAgent implements Agent {
  id: string;
  name: string;
  description: string;
  protected isInitialized: boolean = false;
  protected config: Record<string, any> = {};

  /**
   * Create a new agent
   * @param id - Unique identifier for the agent
   * @param name - Human-readable name of the agent
   * @param description - Description of the agent's purpose and capabilities
   */
  constructor(id: string, name: string, description: string) {
    this.id = id;
    this.name = name;
    this.description = description;
  }

  /**
   * Initialize the agent with configuration
   * @param config - Configuration object for the agent
   */
  async initialize(config: Record<string, any>): Promise<void> {
    this.config = { ...this.config, ...config };
    this.isInitialized = true;
  }

  /**
   * Execute the agent's main functionality
   * This method must be implemented by derived classes
   * @param inputs - Input data for the agent
   * @returns The result of the agent's execution
   */
  abstract execute(inputs: Record<string, any>): Promise<Record<string, any>>;

  /**
   * Clean up resources used by the agent
   */
  async cleanup(): Promise<void> {
    this.isInitialized = false;
  }

  /**
   * Check if the agent is initialized
   * @throws Error if the agent is not initialized
   */
  protected checkInitialized(): void {
    if (!this.isInitialized) {
      throw new Error(`Agent ${this.id} is not initialized. Call initialize() first.`);
    }
  }
} 