declare module 'node-nlp' {
  export class NLP {
    constructor();
    sentiment(text: string): Promise<{
      score: number;
      comparative: number;
      calculation: any;
      vote: string;
    }>;
  }
} 