import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import QuestionInput from '../QuestionInput';

describe('QuestionInput Component', () => {
  const mockOnSubmit = jest.fn();

  beforeEach(() => {
    mockOnSubmit.mockClear();
  });

  it('renders question input form', () => {
    render(
      <QuestionInput
        onSubmit={mockOnSubmit}
        disabled={false}
        isLoading={false}
      />
    );

    expect(screen.getByLabelText('Ask a question about your PDF')).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Type your question here/)).toBeInTheDocument();
    expect(screen.getByText('Ask Question')).toBeInTheDocument();
  });

  it('shows disabled state when disabled prop is true', () => {
    render(
      <QuestionInput
        onSubmit={mockOnSubmit}
        disabled={true}
        isLoading={false}
      />
    );

    const textarea = screen.getByRole('textbox');
    const submitButton = screen.getByText('Ask Question');

    expect(textarea).toBeDisabled();
    expect(submitButton).toBeDisabled();
    expect(screen.getByPlaceholderText('Please upload a PDF file first...')).toBeInTheDocument();
    expect(screen.getByText('Upload a PDF file to ask questions')).toBeInTheDocument();
  });

  it('shows loading state when isLoading prop is true', () => {
    render(
      <QuestionInput
        onSubmit={mockOnSubmit}
        disabled={false}
        isLoading={true}
      />
    );

    const textarea = screen.getByRole('textbox');
    const submitButton = screen.getByText('Processing...');

    expect(textarea).toBeDisabled();
    expect(submitButton).toBeDisabled();
    expect(document.querySelector('.loading-spinner')).toBeInTheDocument();
  });

  it('handles text input and character count', async () => {
    render(
      <QuestionInput
        onSubmit={mockOnSubmit}
        disabled={false}
        isLoading={false}
      />
    );

    const textarea = screen.getByRole('textbox');
    const testQuestion = 'What is the main topic of this document?';

    await userEvent.type(textarea, testQuestion);

    expect(textarea).toHaveValue(testQuestion);
    expect(screen.getByText(`${testQuestion.length}/1000`)).toBeInTheDocument();
  });

  it('validates minimum question length', async () => {
    render(
      <QuestionInput
        onSubmit={mockOnSubmit}
        disabled={false}
        isLoading={false}
      />
    );

    const textarea = screen.getByRole('textbox');
    const submitButton = screen.getByText('Ask Question');

    // Type a short question
    await userEvent.type(textarea, 'Short');
    fireEvent.click(submitButton);

    expect(screen.getByText('Question must be at least 10 characters long.')).toBeInTheDocument();
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('validates maximum question length', async () => {
    render(
      <QuestionInput
        onSubmit={mockOnSubmit}
        disabled={false}
        isLoading={false}
      />
    );

    const textarea = screen.getByRole('textbox');
    const longQuestion = 'a'.repeat(1001); // Over the 1000 character limit

    await userEvent.type(textarea, longQuestion);

    // Character count should show over limit
    expect(screen.getByText('1001/1000')).toBeInTheDocument();
    expect(document.querySelector('.char-count.error')).toBeInTheDocument();
    
    // Submit button should be disabled
    const submitButton = screen.getByText('Ask Question');
    expect(submitButton).toBeDisabled();
  });

  it('validates empty question', async () => {
    render(
      <QuestionInput
        onSubmit={mockOnSubmit}
        disabled={false}
        isLoading={false}
      />
    );

    const submitButton = screen.getByText('Ask Question');
    fireEvent.click(submitButton);

    expect(screen.getByText('Please enter a question.')).toBeInTheDocument();
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('submits valid question', async () => {
    render(
      <QuestionInput
        onSubmit={mockOnSubmit}
        disabled={false}
        isLoading={false}
      />
    );

    const textarea = screen.getByRole('textbox');
    const submitButton = screen.getByText('Ask Question');
    const validQuestion = 'What is the main topic discussed in this document?';

    await userEvent.type(textarea, validQuestion);
    fireEvent.click(submitButton);

    expect(mockOnSubmit).toHaveBeenCalledWith(validQuestion);
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('handles form submission with Enter key', async () => {
    render(
      <QuestionInput
        onSubmit={mockOnSubmit}
        disabled={false}
        isLoading={false}
      />
    );

    const textarea = screen.getByRole('textbox');
    const validQuestion = 'What is the main topic discussed in this document?';

    await userEvent.type(textarea, validQuestion);
    
    // Submit with Ctrl+Enter
    fireEvent.keyDown(textarea, { key: 'Enter', ctrlKey: true });

    expect(mockOnSubmit).toHaveBeenCalledWith(validQuestion);
  });

  it('handles form submission with Cmd+Enter on Mac', async () => {
    render(
      <QuestionInput
        onSubmit={mockOnSubmit}
        disabled={false}
        isLoading={false}
      />
    );

    const textarea = screen.getByRole('textbox');
    const validQuestion = 'What is the main topic discussed in this document?';

    await userEvent.type(textarea, validQuestion);
    
    // Submit with Cmd+Enter (Mac)
    fireEvent.keyDown(textarea, { key: 'Enter', metaKey: true });

    expect(mockOnSubmit).toHaveBeenCalledWith(validQuestion);
  });

  it('shows and hides clear button', async () => {
    render(
      <QuestionInput
        onSubmit={mockOnSubmit}
        disabled={false}
        isLoading={false}
      />
    );

    const textarea = screen.getByRole('textbox');

    // Clear button should not be visible initially
    expect(screen.queryByLabelText('Clear question')).not.toBeInTheDocument();

    // Type some text
    await userEvent.type(textarea, 'Some question text');

    // Clear button should now be visible
    expect(screen.getByLabelText('Clear question')).toBeInTheDocument();
  });

  it('clears question when clear button is clicked', async () => {
    render(
      <QuestionInput
        onSubmit={mockOnSubmit}
        disabled={false}
        isLoading={false}
      />
    );

    const textarea = screen.getByRole('textbox');

    // Type some text
    await userEvent.type(textarea, 'Some question text');
    expect(textarea).toHaveValue('Some question text');

    // Click clear button
    const clearButton = screen.getByLabelText('Clear question');
    fireEvent.click(clearButton);

    // Text should be cleared
    expect(textarea).toHaveValue('');
  });

  it('clears validation error when user starts typing', async () => {
    render(
      <QuestionInput
        onSubmit={mockOnSubmit}
        disabled={false}
        isLoading={false}
      />
    );

    const textarea = screen.getByRole('textbox');
    const submitButton = screen.getByText('Ask Question');

    // Submit empty form to trigger validation error
    fireEvent.click(submitButton);
    expect(screen.getByText('Please enter a question.')).toBeInTheDocument();

    // Start typing - error should disappear
    await userEvent.type(textarea, 'N');
    expect(screen.queryByText('Please enter a question.')).not.toBeInTheDocument();
  });

  it('shows character count warning when approaching limit', async () => {
    render(
      <QuestionInput
        onSubmit={mockOnSubmit}
        disabled={false}
        isLoading={false}
      />
    );

    const textarea = screen.getByRole('textbox');
    const nearLimitText = 'a'.repeat(950); // Near the 1000 character limit

    await userEvent.type(textarea, nearLimitText);

    // Should show warning styling
    expect(document.querySelector('.char-count.warning')).toBeInTheDocument();
  });

  it('prevents submission when disabled', () => {
    render(
      <QuestionInput
        onSubmit={mockOnSubmit}
        disabled={true}
        isLoading={false}
      />
    );

    const form = document.querySelector('.question-form') as HTMLFormElement;
    fireEvent.submit(form);

    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('prevents submission when loading', () => {
    render(
      <QuestionInput
        onSubmit={mockOnSubmit}
        disabled={false}
        isLoading={true}
      />
    );

    const form = document.querySelector('.question-form') as HTMLFormElement;
    fireEvent.submit(form);

    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('has proper accessibility attributes', () => {
    render(
      <QuestionInput
        onSubmit={mockOnSubmit}
        disabled={false}
        isLoading={false}
      />
    );

    const textarea = screen.getByRole('textbox');
    const label = screen.getByText('Ask a question about your PDF');

    expect(textarea).toHaveAttribute('aria-describedby', 'question-hint');
    expect(textarea).toHaveAttribute('aria-invalid', 'false');
    expect(label).toHaveAttribute('for', 'question-textarea');
  });

  it('updates accessibility attributes when validation error occurs', async () => {
    render(
      <QuestionInput
        onSubmit={mockOnSubmit}
        disabled={false}
        isLoading={false}
      />
    );

    const textarea = screen.getByRole('textbox');
    const submitButton = screen.getByText('Ask Question');

    // Submit empty form to trigger validation error
    fireEvent.click(submitButton);

    expect(textarea).toHaveAttribute('aria-describedby', 'question-error');
    expect(textarea).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });
});