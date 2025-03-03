import { Agent } from '../../interfaces/agent';

/**
 * Factory for creating and managing agent instances
 */
export class AgentFactory {
  private static instance: AgentFactory;
  private agentRegistry: Map<string, new (...args: any[]) => Agent> = new Map();
  private agentInstances: Map<string, Agent> = new Map();

  /**
   * Get the singleton instance of the AgentFactory
   */
  public static getInstance(): AgentFactory {
    if (!AgentFactory.instance) {
      AgentFactory.instance = new AgentFactory();
    }
    return AgentFactory.instance;
  }

  /**
   * Register an agent class with the factory
   * @param agentType - Type identifier for the agent
   * @param agentClass - Constructor for the agent class
   */
  public registerAgentType(agentType: string, agentClass: new (...args: any[]) => Agent): void {
    this.agentRegistry.set(agentType, agentClass);
  }

  /**
   * Create a new agent instance
   * @param agentType - Type identifier for the agent
   * @param id - Unique identifier for the agent instance
   * @param args - Additional arguments to pass to the agent constructor
   * @returns The created agent instance
   */
  public createAgent(agentType: string, id: string, ...args: any[]): Agent {
    const AgentClass = this.agentRegistry.get(agentType);
    
    if (!AgentClass) {
      throw new Error(`Unknown agent type: ${agentType}`);
    }
    
    const agent = new AgentClass(id, ...args);
    this.agentInstances.set(id, agent);
    
    return agent;
  }

  /**
   * Get an existing agent instance by ID
   * @param id - Unique identifier for the agent instance
   * @returns The agent instance, or undefined if not found
   */
  public getAgent(id: string): Agent | undefined {
    return this.agentInstances.get(id);
  }

  /**
   * Get all registered agent instances
   * @returns Array of all agent instances
   */
  public getAllAgents(): Agent[] {
    return Array.from(this.agentInstances.values());
  }

  /**
   * Remove an agent instance
   * @param id - Unique identifier for the agent instance
   * @returns True if the agent was removed, false if it wasn't found
   */
  public removeAgent(id: string): boolean {
    const agent = this.agentInstances.get(id);
    
    if (agent) {
      agent.cleanup();
      return this.agentInstances.delete(id);
    }
    
    return false;
  }
} 