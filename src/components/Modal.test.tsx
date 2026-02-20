import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Modal } from './Modal';

describe('Modal', () => {
  it('should render children', () => {
    render(
      <Modal onClose={vi.fn()} label="Test Modal">
        <div>Modal Content</div>
      </Modal>
    );
    expect(screen.getByText('Modal Content')).toBeInTheDocument();
  });

  it('should have dialog role and aria-modal', () => {
    render(
      <Modal onClose={vi.fn()} label="Test Modal">
        <div>Content</div>
      </Modal>
    );

    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog).toHaveAttribute('aria-label', 'Test Modal');
  });

  it('should call onClose when Escape key is pressed', async () => {
    const onClose = vi.fn();
    render(
      <Modal onClose={onClose} label="Test">
        <button>Focus me</button>
      </Modal>
    );

    await userEvent.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('should call onClose when clicking the overlay', async () => {
    const onClose = vi.fn();
    render(
      <Modal onClose={onClose} label="Test">
        <div>Content</div>
      </Modal>
    );

    // Click on the overlay (dialog element itself)
    const overlay = screen.getByRole('dialog');
    await userEvent.click(overlay);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('should NOT call onClose when clicking inside modal content', async () => {
    const onClose = vi.fn();
    render(
      <Modal onClose={onClose} label="Test">
        <div data-testid="inner">Inner Content</div>
      </Modal>
    );

    await userEvent.click(screen.getByTestId('inner'));
    expect(onClose).not.toHaveBeenCalled();
  });
});
