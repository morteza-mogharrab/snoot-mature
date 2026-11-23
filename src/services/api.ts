import type { Database, ID } from '../types';
import type { Mutation } from './mutations';
import { createMockApi } from './mockApi';

/** Server-pushed events (a WebSocket in production). */
export type ServerEvent =
  | { type: 'mutation'; mutation: Mutation }
  | { type: 'typing'; conversationId: ID; typing: boolean };

/**
 * The only data surface the UI talks to. Swap `createMockApi()` for
 * `createHttpApi(url, getToken)` (see httpApi.ts) once a backend exists.
 */
export interface ApiClient {
  bootstrap(): Promise<Database>;
  mutate(mutation: Mutation): Promise<void>;
  subscribe(listener: (event: ServerEvent) => void): () => void;
  /** Demo only: restore the sample data. */
  reset(): Promise<Database>;
}

export const api: ApiClient = createMockApi();
