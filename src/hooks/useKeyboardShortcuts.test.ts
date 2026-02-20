import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useKeyboardShortcuts } from './useKeyboardShortcuts';

function fireKey(key: string, target?: HTMLElement) {
  const event = new KeyboardEvent('keydown', {
    key,
    bubbles: true,
    cancelable: true,
  });
  (target || document).dispatchEvent(event);
}

describe('useKeyboardShortcuts', () => {
  it('should call handler for matching key', () => {
    const handler = vi.fn();
    renderHook(() => useKeyboardShortcuts({ n: handler }));

    fireKey('n');
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('should not call handler for non-matching key', () => {
    const handler = vi.fn();
    renderHook(() => useKeyboardShortcuts({ n: handler }));

    fireKey('x');
    expect(handler).not.toHaveBeenCalled();
  });

  it('should ignore keystrokes in input elements', () => {
    const handler = vi.fn();
    renderHook(() => useKeyboardShortcuts({ n: handler }));

    const input = document.createElement('input');
    document.body.appendChild(input);

    const event = new KeyboardEvent('keydown', { key: 'n', bubbles: true });
    Object.defineProperty(event, 'target', { value: input });
    document.dispatchEvent(event);

    expect(handler).not.toHaveBeenCalled();
    document.body.removeChild(input);
  });

  it('should ignore keystrokes in textarea elements', () => {
    const handler = vi.fn();
    renderHook(() => useKeyboardShortcuts({ '/': handler }));

    const textarea = document.createElement('textarea');
    document.body.appendChild(textarea);

    const event = new KeyboardEvent('keydown', { key: '/', bubbles: true });
    Object.defineProperty(event, 'target', { value: textarea });
    document.dispatchEvent(event);

    expect(handler).not.toHaveBeenCalled();
    document.body.removeChild(textarea);
  });

  it('should ignore keystrokes in select elements', () => {
    const handler = vi.fn();
    renderHook(() => useKeyboardShortcuts({ n: handler }));

    const select = document.createElement('select');
    document.body.appendChild(select);

    const event = new KeyboardEvent('keydown', { key: 'n', bubbles: true });
    Object.defineProperty(event, 'target', { value: select });
    document.dispatchEvent(event);

    expect(handler).not.toHaveBeenCalled();
    document.body.removeChild(select);
  });

  it('should support multiple shortcuts', () => {
    const handler1 = vi.fn();
    const handler2 = vi.fn();
    renderHook(() => useKeyboardShortcuts({ n: handler1, '/': handler2 }));

    fireKey('n');
    fireKey('/');

    expect(handler1).toHaveBeenCalledTimes(1);
    expect(handler2).toHaveBeenCalledTimes(1);
  });

  it('should clean up listener on unmount', () => {
    const handler = vi.fn();
    const { unmount } = renderHook(() => useKeyboardShortcuts({ n: handler }));

    unmount();
    fireKey('n');

    expect(handler).not.toHaveBeenCalled();
  });
});
