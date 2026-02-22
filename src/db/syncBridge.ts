import { setMutationCallback } from './indexeddb';
import { initSync, handleMutation } from './sync';

let setupDone = false;

export function setupSync(): void {
  if (setupDone) return;
  setupDone = false;

  // Skip sync in test environment
  if (import.meta.env.MODE === 'test') return;

  setupDone = true;

  // Wire up mutation callback: fire-and-forget sync on every IndexedDB write
  setMutationCallback((op, store, data, id) => {
    handleMutation(op, store, data, id).catch(() => {
      // Errors are handled inside handleMutation (queued for retry)
    });
  });

  // Initial hydration from server
  initSync().catch(() => {
    // Server unreachable — app works offline
  });
}
