import { ProviderStatus } from '../types';
import { PipelineContext } from '../types';

export interface IProvider<TResult> {
  name: string;
  initialize(): Promise<void>;
  analyze(context: PipelineContext): Promise<TResult>;
  cleanup(): Promise<void>;
  healthCheck(): Promise<boolean>;
  status(): ProviderStatus;
  timeout(): number; // timeout in milliseconds
}
