import { setMutationCallback, addToSyncQueue } from './indexeddb';
import { initSync, handleMutation, setHydrationCallback } from './sync';

let setupDone = false;

export function setupSync(onHydrated?: () => void): void {
  if (setupDone) return;

  // Skip sync in test environment
  if (import.meta.env.MODE === 'test') return;

  setupDone = true;

  // Wire up hydration callback so UI refreshes after data restore
  if (onHydrated) {
    setHydrationCallback(onHydrated);
  }

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
