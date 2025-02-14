declare module '@web-llm/core' {
  export interface GenerateOptions {
    maxTokens?: number;
    temperature?: number;
    topP?: number;
    repetitionPenalty?: number;
  }

  export interface PipelineOptions {
    modelPath: string;
    wasmPath: string;
    threads?: number;
  }

  export class Pipeline {
    static create(options: PipelineOptions): Promise<Pipeline>;
    generate(prompt: string, options?: GenerateOptions): Promise<string>;
    close(): Promise<void>;
  }
}
