import { setMutationCallback, addToSyncQueue } from './indexeddb';
import { initSync, handleMutation } from './sync';

let setupDone = false;

export function setupSync(): void {
  if (setupDone) return;

  // Skip sync in test environment
  if (import.meta.env.MODE === 'test') return;

  setupDone = true;

  // Wire up mutation callback: fire-and-forget sync on every IndexedDB write
  setMutationCallback((op, store, data, id) => {
    handleMutation(op, store, data, id).catch(() => {
      // Sync failed — queue for offline retry
      addToSyncQueue({ op, store, data, entityId: id, timestamp: Date.now() }).catch(() => {});
    });
  });

  // Initial hydration from server
  initSync().catch(() => {
    // Server unreachable — app works offline
  });
}
