/**
 * Base interface for all agents in the system
 */
export interface Agent {
  /**
   * Unique identifier for the agent
   */
  id: string;
  
  /**
   * Human-readable name of the agent
   */
  name: string;
  
  /**
   * Description of the agent's purpose and capabilities
   */
  description: string;
  
  /**
   * Initialize the agent with configuration
   * @param config - Configuration object for the agent
   */
  initialize(config: Record<string, any>): Promise<void>;
  
  /**
   * Execute the agent's main functionality
   * @param inputs - Input data for the agent
   * @returns The result of the agent's execution
   */
  execute(inputs: Record<string, any>): Promise<Record<string, any>>;
  
  /**
   * Clean up resources used by the agent
   */
  cleanup(): Promise<void>;
} 