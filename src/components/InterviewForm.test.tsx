import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { InterviewForm } from './InterviewForm';
import { makeInterview, makeQuestion } from '../test/factories';
import { DEFAULT_COMPANIES } from '../db/indexeddb';

const defaultProps = {
  companies: ['Acme Corp', 'Google'],
  onSubmit: vi.fn(),
  onCancel: vi.fn(),
};

describe('InterviewForm', () => {
  // ─── Rendering ──────────────────────────────────────────────

  it('should render Schedule title when no interview provided', () => {
    render(<InterviewForm {...defaultProps} />);
    expect(screen.getByRole('heading', { name: 'Schedule Interview' })).toBeInTheDocument();
  });

  it('should render Edit title when interview is provided', () => {
    const interview = makeInterview();
    render(<InterviewForm {...defaultProps} interview={interview} />);
    expect(screen.getByText('Edit Interview')).toBeInTheDocument();
  });

  // ─── Company datalist ─────────────────────────────────────

  it('should show company input with datalist suggestions', () => {
    render(<InterviewForm {...defaultProps} />);
    const input = screen.getByPlaceholderText('Type or select a company');
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute('list', 'company-suggestions-interview');
  });

  it('should include default companies in datalist', () => {
    const { container } = render(<InterviewForm {...defaultProps} />);
    const datalist = container.querySelector('#company-suggestions-interview');
    const options = datalist?.querySelectorAll('option') ?? [];
    const values = Array.from(options).map((o) => o.getAttribute('value'));
    for (const c of DEFAULT_COMPANIES) {
      expect(values).toContain(c);
    }
  });

  it('should include user companies in datalist', () => {
    const { container } = render(<InterviewForm {...defaultProps} />);
    const datalist = container.querySelector('#company-suggestions-interview');
    const options = datalist?.querySelectorAll('option') ?? [];
    const values = Array.from(options).map((o) => o.getAttribute('value'));
    expect(values).toContain('Acme Corp');
  });

  it('should deduplicate companies from defaults and user list', () => {
    const { container } = render(
      <InterviewForm {...defaultProps} companies={['Google', 'Meta']} />
    );
    const datalist = container.querySelector('#company-suggestions-interview');
    const options = datalist?.querySelectorAll('option') ?? [];
    const values = Array.from(options).map((o) => o.getAttribute('value'));
    // Google appears in both DEFAULT_COMPANIES and props — should only appear once
    expect(values.filter((v) => v === 'Google')).toHaveLength(1);
  });

  // ─── Free-text company ────────────────────────────────────

  it('should allow typing a custom company name', async () => {
    const onSubmit = vi.fn();
    render(<InterviewForm {...defaultProps} onSubmit={onSubmit} />);

    const companyInput = screen.getByPlaceholderText('Type or select a company');
    await userEvent.type(companyInput, 'My Startup');

    // Fill required date
    const dateField = document.querySelector('input[type="datetime-local"]') as HTMLInputElement;
    await userEvent.type(dateField, '2026-03-15T10:00');

    await userEvent.click(screen.getByRole('button', { name: /schedule interview/i }));
    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onSubmit.mock.calls[0][0].company).toBe('My Startup');
  });

  // ─── Edit prefill ─────────────────────────────────────────

  it('should prefill company in edit mode even if not in companies list', () => {
    const interview = makeInterview({ company: 'Unknown Corp' });
    render(<InterviewForm {...defaultProps} interview={interview} />);
    const input = screen.getByPlaceholderText('Type or select a company') as HTMLInputElement;
    expect(input.value).toBe('Unknown Corp');
  });

  it('should prefill all fields when editing', () => {
    const interview = makeInterview({
      company: 'Google',
      interviewType: 'onsite',
      duration: 90,
      status: 'completed',
      role: 'Senior SWE',
      notes: 'Prep for system design',
    });
    render(
      <InterviewForm {...defaultProps} interview={interview} questions={[]} />
    );

    expect(
      (screen.getByPlaceholderText('Type or select a company') as HTMLInputElement).value
    ).toBe('Google');
    expect(screen.getByDisplayValue('Onsite')).toBeInTheDocument();
    expect(screen.getByDisplayValue('90 min')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Completed')).toBeInTheDocument();
  });

  it('should auto-expand More Details when editing interview with optional fields', () => {
    const interview = makeInterview({
      role: 'Staff Engineer',
      notes: 'Review past projects',
    });
    render(<InterviewForm {...defaultProps} interview={interview} />);

    // The optional fields should be visible without clicking "More Details"
    expect(screen.getByDisplayValue('Staff Engineer')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Review past projects')).toBeInTheDocument();
  });

  it('should NOT auto-expand More Details for new interview', () => {
    render(<InterviewForm {...defaultProps} />);
    // Role field should not be visible
    expect(screen.queryByPlaceholderText('e.g. Senior Frontend Engineer')).not.toBeInTheDocument();
  });

  // ─── Default company prop ─────────────────────────────────

  it('should use defaultCompany prop when no interview', () => {
    render(<InterviewForm {...defaultProps} defaultCompany="Meta" />);
    const input = screen.getByPlaceholderText('Type or select a company') as HTMLInputElement;
    expect(input.value).toBe('Meta');
  });

  // ─── Question count hint ──────────────────────────────────

  it('should show question count when company matches questions', () => {
    const questions = [
      makeQuestion({ company: 'Google' }),
      makeQuestion({ company: 'Google' }),
    ];
    render(
      <InterviewForm
        {...defaultProps}
        defaultCompany="Google"
        questions={questions}
      />
    );
    expect(screen.getByText('2 questions prepared')).toBeInTheDocument();
  });

  // ─── Cancel ───────────────────────────────────────────────

  it('should call onCancel when Cancel is clicked', async () => {
    const onCancel = vi.fn();
    render(<InterviewForm {...defaultProps} onCancel={onCancel} />);
    await userEvent.click(screen.getByText('Cancel'));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});
