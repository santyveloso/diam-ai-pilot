import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ResponseDisplay from '../ResponseDisplay';

// Mock clipboard API
Object.assign(navigator, {
  clipboard: {
    writeText: jest.fn(),
  },
});

// Mock scrollIntoView
Element.prototype.scrollIntoView = jest.fn();

describe('ResponseDisplay Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Empty State', () => {
    it('renders empty state when no response, loading, or error', () => {
      render(
        <ResponseDisplay
          response={null}
          isLoading={false}
          error={null}
        />
      );

      expect(screen.getByText('Ready to help!')).toBeInTheDocument();
      expect(screen.getByText('Upload a PDF and ask a question to get started.')).toBeInTheDocument();
      expect(screen.getByText('💬')).toBeInTheDocument();
    });

    it('has correct accessibility attributes in empty state', () => {
      render(
        <ResponseDisplay
          response={null}
          isLoading={false}
          error={null}
        />
      );

      const container = document.querySelector('.response-display');
      expect(container).toHaveClass('empty-state');
    });
  });

  describe('Loading State', () => {
    it('renders loading state correctly', () => {
      render(
        <ResponseDisplay
          response={null}
          isLoading={true}
          error={null}
        />
      );

      expect(screen.getByText('Processing your question...')).toBeInTheDocument();
      expect(screen.getByText('Analyzing your PDF content')).toBeInTheDocument();
      expect(screen.getByText('This may take a few moments')).toBeInTheDocument();
      expect(document.querySelector('.response-spinner')).toBeInTheDocument();
      expect(document.querySelector('.progress-bar')).toBeInTheDocument();
    });

    it('has correct accessibility attributes in loading state', () => {
      render(
        <ResponseDisplay
          response={null}
          isLoading={true}
          error={null}
        />
      );

      const container = document.querySelector('.response-display');
      expect(container).toHaveAttribute('role', 'status');
      expect(container).toHaveAttribute('aria-live', 'polite');
      expect(container).toHaveClass('loading-state');
    });
  });

  describe('Error State', () => {
    it('renders error state correctly', () => {
      const errorMessage = 'Network connection failed';
      
      render(
        <ResponseDisplay
          response={null}
          isLoading={false}
          error={errorMessage}
        />
      );

      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
      expect(screen.getByText('Please try again or check your internet connection.')).toBeInTheDocument();
      expect(screen.getByText('⚠️')).toBeInTheDocument();
      expect(screen.getByText('Refresh Page')).toBeInTheDocument();
    });

    it('has correct accessibility attributes in error state', () => {
      render(
        <ResponseDisplay
          response={null}
          isLoading={false}
          error="Test error"
        />
      );

      const container = document.querySelector('.response-display');
      expect(container).toHaveAttribute('role', 'alert');
      expect(container).toHaveAttribute('aria-live', 'assertive');
      expect(container).toHaveClass('error-state');
    });

    it('handles refresh button click', () => {
      // Mock window.location.reload
      const mockReload = jest.fn();
      Object.defineProperty(window, 'location', {
        value: {
          reload: mockReload,
        },
        writable: true,
      });

      render(
        <ResponseDisplay
          response={null}
          isLoading={false}
          error="Test error"
        />
      );

      const refreshButton = screen.getByText('Refresh Page');
      fireEvent.click(refreshButton);

      expect(mockReload).toHaveBeenCalled();
    });
  });

  describe('Success State', () => {
    const mockResponse = 'This is a test response from the AI.';

    it('renders success state correctly', () => {
      render(
        <ResponseDisplay
          response={mockResponse}
          isLoading={false}
          error={null}
        />
      );

      expect(screen.getByText('AI Response')).toBeInTheDocument();
      expect(screen.getByText(mockResponse)).toBeInTheDocument();
      expect(screen.getByText('📋 Copy')).toBeInTheDocument();
      expect(screen.getByText(/AI-generated response based on your uploaded content/)).toBeInTheDocument();
    });

    it('has correct accessibility attributes in success state', () => {
      render(
        <ResponseDisplay
          response={mockResponse}
          isLoading={false}
          error={null}
        />
      );

      const container = document.querySelector('.response-display');
      expect(container).toHaveAttribute('role', 'region');
      expect(container).toHaveAttribute('aria-live', 'polite');
      expect(container).toHaveAttribute('aria-label', 'AI Response');
      expect(container).toHaveClass('success-state');
    });

    it('displays timestamp', () => {
      render(
        <ResponseDisplay
          response={mockResponse}
          isLoading={false}
          error={null}
        />
      );

      // Check that a timestamp is displayed (format may vary)
      const timestamp = document.querySelector('.response-timestamp');
      expect(timestamp).toBeInTheDocument();
      expect(timestamp?.textContent).toMatch(/\d{1,2}:\d{2}:\d{2}/); // Basic time format check
    });

    it('handles copy button click', async () => {
      render(
        <ResponseDisplay
          response={mockResponse}
          isLoading={false}
          error={null}
        />
      );

      const copyButton = screen.getByText('📋 Copy');
      fireEvent.click(copyButton);

      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(mockResponse);
    });

    it('scrolls into view when response appears', () => {
      const { rerender } = render(
        <ResponseDisplay
          response={null}
          isLoading={false}
          error={null}
        />
      );

      // Initially no scroll
      expect(Element.prototype.scrollIntoView).not.toHaveBeenCalled();

      // When response appears, should scroll
      rerender(
        <ResponseDisplay
          response={mockResponse}
          isLoading={false}
          error={null}
        />
      );

      expect(Element.prototype.scrollIntoView).toHaveBeenCalledWith({
        behavior: 'smooth',
        block: 'start'
      });
    });
  });

  describe('Response Formatting', () => {
    it('formats bold text correctly', () => {
      const responseWithBold = 'This is **bold text** in the response.';
      
      render(
        <ResponseDisplay
          response={responseWithBold}
          isLoading={false}
          error={null}
        />
      );

      const formattedResponse = document.querySelector('.formatted-response');
      expect(formattedResponse?.innerHTML).toContain('<strong>bold text</strong>');
    });

    it('formats italic text correctly', () => {
      const responseWithItalic = 'This is *italic text* in the response.';
      
      render(
        <ResponseDisplay
          response={responseWithItalic}
          isLoading={false}
          error={null}
        />
      );

      const formattedResponse = document.querySelector('.formatted-response');
      expect(formattedResponse?.innerHTML).toContain('<em>italic text</em>');
    });

    it('formats line breaks correctly', () => {
      const responseWithBreaks = 'Line 1\nLine 2\nLine 3';
      
      render(
        <ResponseDisplay
          response={responseWithBreaks}
          isLoading={false}
          error={null}
        />
      );

      const formattedResponse = document.querySelector('.formatted-response');
      expect(formattedResponse?.innerHTML).toContain('<br>');
    });

    it('formats numbered lists correctly', () => {
      const responseWithList = '1. First item\n2. Second item\n3. Third item';
      
      render(
        <ResponseDisplay
          response={responseWithList}
          isLoading={false}
          error={null}
        />
      );

      const formattedResponse = document.querySelector('.formatted-response');
      expect(formattedResponse?.innerHTML).toContain('1. First item');
      expect(formattedResponse?.innerHTML).toContain('2. Second item');
    });

    it('formats bullet points correctly', () => {
      const responseWithBullets = '- First bullet\n• Second bullet';
      
      render(
        <ResponseDisplay
          response={responseWithBullets}
          isLoading={false}
          error={null}
        />
      );

      const formattedResponse = document.querySelector('.formatted-response');
      expect(formattedResponse?.innerHTML).toContain('- First bullet');
      expect(formattedResponse?.innerHTML).toContain('• Second bullet');
    });

    it('handles complex formatting combinations', () => {
      const complexResponse = 'This is **bold** and *italic*.\n\n1. First item\n2. **Bold item**\n\n- Bullet with *emphasis*';
      
      render(
        <ResponseDisplay
          response={complexResponse}
          isLoading={false}
          error={null}
        />
      );

      const formattedResponse = document.querySelector('.formatted-response');
      expect(formattedResponse?.innerHTML).toContain('<strong>bold</strong>');
      expect(formattedResponse?.innerHTML).toContain('<em>italic</em>');
      expect(formattedResponse?.innerHTML).toContain('<strong>Bold item</strong>');
      expect(formattedResponse?.innerHTML).toContain('<em>emphasis</em>');
    });
  });

  describe('State Transitions', () => {
    it('transitions from loading to success', () => {
      const { rerender } = render(
        <ResponseDisplay
          response={null}
          isLoading={true}
          error={null}
        />
      );

      expect(screen.getByText('Processing your question...')).toBeInTheDocument();

      rerender(
        <ResponseDisplay
          response="Success response"
          isLoading={false}
          error={null}
        />
      );

      expect(screen.getByText('AI Response')).toBeInTheDocument();
      expect(screen.getByText('Success response')).toBeInTheDocument();
    });

    it('transitions from loading to error', () => {
      const { rerender } = render(
        <ResponseDisplay
          response={null}
          isLoading={true}
          error={null}
        />
      );

      expect(screen.getByText('Processing your question...')).toBeInTheDocument();

      rerender(
        <ResponseDisplay
          response={null}
          isLoading={false}
          error="Network error occurred"
        />
      );

      expect(screen.getByText('Network error occurred')).toBeInTheDocument();
    });

    it('prioritizes error over response when both are present', () => {
      render(
        <ResponseDisplay
          response="This should not be shown"
          isLoading={false}
          error="Error message"
        />
      );

      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
      expect(screen.queryByText('This should not be shown')).not.toBeInTheDocument();
    });

    it('prioritizes loading over other states', () => {
      render(
        <ResponseDisplay
          response="This should not be shown"
          isLoading={true}
          error="This should not be shown either"
        />
      );

      expect(screen.getByText('Processing your question...')).toBeInTheDocument();
      expect(screen.queryByText('This should not be shown')).not.toBeInTheDocument();
      expect(screen.queryByText('This should not be shown either')).not.toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels and roles', () => {
      render(
        <ResponseDisplay
          response="Test response"
          isLoading={false}
          error={null}
        />
      );

      const container = document.querySelector('.response-display');
      expect(container).toHaveAttribute('role', 'region');
      expect(container).toHaveAttribute('aria-label', 'AI Response');
    });

    it('copy button has proper accessibility attributes', () => {
      render(
        <ResponseDisplay
          response="Test response"
          isLoading={false}
          error={null}
        />
      );

      const copyButton = screen.getByText('📋 Copy');
      expect(copyButton).toHaveAttribute('title', 'Copy response to clipboard');
      expect(copyButton).toHaveAttribute('type', 'button');
    });

    it('refresh button has proper accessibility attributes', () => {
      render(
        <ResponseDisplay
          response={null}
          isLoading={false}
          error="Test error"
        />
      );

      const refreshButton = screen.getByText('Refresh Page');
      expect(refreshButton).toHaveAttribute('type', 'button');
    });
  });
});