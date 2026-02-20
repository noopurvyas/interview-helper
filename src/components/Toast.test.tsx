import { describe, it, expect, vi } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ToastProvider, useToast } from './Toast';

// Helper component that triggers toasts
function ToastTrigger({ message, type }: { message: string; type?: 'success' | 'error' | 'info' }) {
  const { toast } = useToast();
  return <button onClick={() => toast(message, type)}>Show Toast</button>;
}

describe('Toast', () => {
  it('should render children within provider', () => {
    render(
      <ToastProvider>
        <div>Hello</div>
      </ToastProvider>
    );
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });

  it('should display a toast message when triggered', async () => {
    render(
      <ToastProvider>
        <ToastTrigger message="Operation successful" />
      </ToastProvider>
    );

    await userEvent.click(screen.getByText('Show Toast'));
    expect(screen.getByText('Operation successful')).toBeInTheDocument();
  });

  it('should display toast with role=alert for accessibility', async () => {
    render(
      <ToastProvider>
        <ToastTrigger message="Alert message" />
      </ToastProvider>
    );

    await userEvent.click(screen.getByText('Show Toast'));
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('should auto-dismiss after 3 seconds', async () => {
    vi.useFakeTimers();

    render(
      <ToastProvider>
        <ToastTrigger message="Temporary toast" />
      </ToastProvider>
    );

    await act(async () => {
      screen.getByText('Show Toast').click();
    });

    expect(screen.getByText('Temporary toast')).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(3000);
    });

    expect(screen.queryByText('Temporary toast')).not.toBeInTheDocument();

    vi.useRealTimers();
  });

  it('should dismiss toast when clicking dismiss button', async () => {
    render(
      <ToastProvider>
        <ToastTrigger message="Dismissable toast" />
      </ToastProvider>
    );

    await userEvent.click(screen.getByText('Show Toast'));
    expect(screen.getByText('Dismissable toast')).toBeInTheDocument();

    await userEvent.click(screen.getByLabelText('Dismiss'));
    expect(screen.queryByText('Dismissable toast')).not.toBeInTheDocument();
  });

  it('should display multiple toasts', async () => {
    function MultiToast() {
      const { toast } = useToast();
      return (
        <>
          <button onClick={() => toast('Toast 1')}>First</button>
          <button onClick={() => toast('Toast 2', 'error')}>Second</button>
        </>
      );
    }

    render(
      <ToastProvider>
        <MultiToast />
      </ToastProvider>
    );

    await userEvent.click(screen.getByText('First'));
    await userEvent.click(screen.getByText('Second'));

    expect(screen.getByText('Toast 1')).toBeInTheDocument();
    expect(screen.getByText('Toast 2')).toBeInTheDocument();
  });

  it('should have aria-live region for accessibility', () => {
    render(
      <ToastProvider>
        <div>Content</div>
      </ToastProvider>
    );

    const liveRegion = document.querySelector('[aria-live="polite"]');
    expect(liveRegion).toBeInTheDocument();
  });
});
