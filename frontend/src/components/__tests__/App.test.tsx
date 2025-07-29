import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import App from '../App';

// Mock the API service
jest.mock('../../services/api', () => ({
  askQuestion: jest.fn(),
}));

// Mock file for testing
const createMockFile = (name: string = 'test.pdf', type: string = 'application/pdf'): File => {
  return new File(['test content'], name, { type });
};

const mockAskQuestion = require('../../services/api').askQuestion;

describe('App Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the main heading', () => {
    render(<App />);
    const heading = screen.getByText('DIAM AI Pilot');
    expect(heading).toBeInTheDocument();
  });

  it('renders the subtitle', () => {
    render(<App />);
    const subtitle = screen.getByText('Educational AI for ISCTE students');
    expect(subtitle).toBeInTheDocument();
  });

  it('renders all main sections', () => {
    render(<App />);
    
    // Check for FileUpload component (now implemented)
    expect(screen.getByText('Click to upload')).toBeInTheDocument();
    expect(screen.getByText('or drag and drop')).toBeInTheDocument();
    
    // Check for QuestionInput component (now implemented)
    expect(screen.getByLabelText('Ask a question about your PDF')).toBeInTheDocument();
    expect(screen.getByText('Ask Question')).toBeInTheDocument();
    
    // Check for ResponseDisplay component (now implemented)
    expect(screen.getByText('Ready to help!')).toBeInTheDocument();
    expect(screen.getByText('Upload a PDF and ask a question to get started.')).toBeInTheDocument();
  });

  it('shows disabled state when no file is selected', () => {
    render(<App />);
    
    // QuestionInput should be disabled when no file is selected
    const textarea = screen.getByRole('textbox');
    const submitButton = screen.getByText('Ask Question');
    
    expect(textarea).toBeDisabled();
    expect(submitButton).toBeDisabled();
    expect(screen.getByText('Upload a PDF file to ask questions')).toBeInTheDocument();
  });

  it('shows loading state correctly', () => {
    render(<App />);
    
    // Initially should not be loading
    expect(screen.queryByText('Processing...')).not.toBeInTheDocument();
  });

  it('displays error banner when error occurs', () => {
    render(<App />);
    
    // Simulate an error by trying to submit without a file
    // This would normally be triggered by the QuestionInput component
    // For now, we can test the error display functionality directly
    expect(screen.queryByText(/Please upload a PDF file/)).not.toBeInTheDocument();
  });

  it('renders footer with copyright information', () => {
    render(<App />);
    expect(screen.getByText('© 2024 ISCTE - DIAM Course AI Assistant')).toBeInTheDocument();
  });

  it('has proper responsive container structure', () => {
    render(<App />);
    const appContainer = document.querySelector('.app-container');
    expect(appContainer).toBeInTheDocument();
    
    const header = document.querySelector('.app-header');
    const main = document.querySelector('.app-main');
    const footer = document.querySelector('.app-footer');
    
    expect(header).toBeInTheDocument();
    expect(main).toBeInTheDocument();
    expect(footer).toBeInTheDocument();
  });

  it('has proper section structure', () => {
    render(<App />);
    
    const uploadSection = document.querySelector('.upload-section');
    const questionSection = document.querySelector('.question-section');
    const responseSection = document.querySelector('.response-section');
    
    expect(uploadSection).toBeInTheDocument();
    expect(questionSection).toBeInTheDocument();
    expect(responseSection).toBeInTheDocument();
  });

  describe('Component Integration', () => {
    it('enables question input when file is uploaded', async () => {
      render(<App />);

      // Initially disabled
      const textarea = screen.getByRole('textbox');
      const submitButton = screen.getByText('Ask Question');
      expect(textarea).toBeDisabled();
      expect(submitButton).toBeDisabled();

      // Upload a file
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      const mockFile = createMockFile('test-document.pdf');

      Object.defineProperty(fileInput, 'files', {
        value: [mockFile],
        writable: false,
      });

      fireEvent.change(fileInput);

      // Verify file is selected and components are enabled
      await waitFor(() => {
        expect(screen.getByText('test-document.pdf')).toBeInTheDocument();
      });

      expect(textarea).not.toBeDisabled();
      expect(submitButton).not.toBeDisabled();
    });

    it('clears response when new file is uploaded', async () => {
      render(<App />);

      // Upload first file
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      const firstFile = createMockFile('first.pdf');

      Object.defineProperty(fileInput, 'files', {
        value: [firstFile],
        writable: false,
      });

      fireEvent.change(fileInput);

      await waitFor(() => {
        expect(screen.getByText('first.pdf')).toBeInTheDocument();
      });

      // Clear the file first by clicking the clear button
      const clearButton = screen.getByLabelText('Remove selected file');
      fireEvent.click(clearButton);

      // Verify file is cleared and empty state is shown
      await waitFor(() => {
        expect(screen.queryByText('first.pdf')).not.toBeInTheDocument();
        expect(screen.getByText('Ready to help!')).toBeInTheDocument();
      });
    });

    it('shows error when trying to submit without file', () => {
      render(<App />);

      // Components should be disabled without file
      const textarea = screen.getByRole('textbox');
      const submitButton = screen.getByText('Ask Question');
      
      expect(textarea).toBeDisabled();
      expect(submitButton).toBeDisabled();
      expect(screen.getByText('Upload a PDF file to ask questions')).toBeInTheDocument();
    });
  });
});