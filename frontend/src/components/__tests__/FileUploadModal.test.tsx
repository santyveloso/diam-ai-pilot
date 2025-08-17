import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import FileUploadModal from '../FileUploadModal';
import { uploadFile } from '../../services/api';

// Mock the API service
jest.mock('../../services/api', () => ({
  uploadFile: jest.fn()
}));

const mockUploadFile = uploadFile as jest.MockedFunction<typeof uploadFile>;

describe('FileUploadModal', () => {
  const defaultProps = {
    isOpen: true,
    onClose: jest.fn(),
    onUploadSuccess: jest.fn(),
    existingChapters: ['Chapter 1', 'Chapter 2'],
    isUploading: false
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders when open', () => {
    render(<FileUploadModal {...defaultProps} />);
    
    expect(screen.getByText('Upload Course Material')).toBeInTheDocument();
    expect(screen.getByText('Add a new PDF file to your course library')).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    render(<FileUploadModal {...defaultProps} isOpen={false} />);
    
    expect(screen.queryByText('Upload Course Material')).not.toBeInTheDocument();
  });

  it('displays existing chapters in dropdown', () => {
    render(<FileUploadModal {...defaultProps} />);
    
    const select = screen.getByLabelText('Chapter');
    expect(select).toBeInTheDocument();
    
    // Check that existing chapters are present
    expect(screen.getByText('Chapter 1')).toBeInTheDocument();
    expect(screen.getByText('Chapter 2')).toBeInTheDocument();
    expect(screen.getByText('+ Create new chapter')).toBeInTheDocument();
  });

  it('shows custom chapter input when creating new chapter', () => {
    render(<FileUploadModal {...defaultProps} />);
    
    const select = screen.getByLabelText('Chapter');
    fireEvent.change(select, { target: { value: '__new__' } });
    
    expect(screen.getByLabelText('New Chapter Name')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter chapter name...')).toBeInTheDocument();
  });

  it('validates file type', async () => {
    render(<FileUploadModal {...defaultProps} />);
    
    const fileInput = screen.getByRole('button', { name: /click to upload/i });
    const file = new File(['test'], 'test.txt', { type: 'text/plain' });
    
    // Mock the file input
    const hiddenInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    Object.defineProperty(hiddenInput, 'files', {
      value: [file],
      writable: false,
    });
    
    fireEvent.change(hiddenInput);
    
    await waitFor(() => {
      expect(screen.getByText('Only PDF files are allowed')).toBeInTheDocument();
    });
  });

  it('validates file size', async () => {
    render(<FileUploadModal {...defaultProps} />);
    
    // Create a file larger than 10MB
    const largeFile = new File(['x'.repeat(11 * 1024 * 1024)], 'large.pdf', { 
      type: 'application/pdf' 
    });
    
    const hiddenInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    Object.defineProperty(hiddenInput, 'files', {
      value: [largeFile],
      writable: false,
    });
    
    fireEvent.change(hiddenInput);
    
    await waitFor(() => {
      expect(screen.getByText('File size must be less than 10MB')).toBeInTheDocument();
    });
  });

  it('validates chapter selection', async () => {
    render(<FileUploadModal {...defaultProps} />);
    
    // Add a valid file
    const file = new File(['test'], 'test.pdf', { type: 'application/pdf' });
    const hiddenInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    Object.defineProperty(hiddenInput, 'files', {
      value: [file],
      writable: false,
    });
    fireEvent.change(hiddenInput);
    
    // Wait for file to be processed
    await waitFor(() => {
      expect(screen.getByText('test.pdf')).toBeInTheDocument();
    });
    
    // The submit button should be disabled when no chapter is selected
    const submitButton = screen.getByText('Upload File');
    expect(submitButton).toBeDisabled();
  });

  it('validates custom chapter name', async () => {
    render(<FileUploadModal {...defaultProps} />);
    
    // Select create new chapter
    const select = screen.getByLabelText('Chapter');
    fireEvent.change(select, { target: { value: '__new__' } });
    
    // Add a valid file
    const file = new File(['test'], 'test.pdf', { type: 'application/pdf' });
    const hiddenInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    Object.defineProperty(hiddenInput, 'files', {
      value: [file],
      writable: false,
    });
    fireEvent.change(hiddenInput);
    
    // Try to submit without chapter name
    const submitButton = screen.getByText('Upload File');
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText('Chapter name is required')).toBeInTheDocument();
    });
  });

  it('prevents duplicate chapter names', async () => {
    render(<FileUploadModal {...defaultProps} />);
    
    // Select create new chapter
    const select = screen.getByLabelText('Chapter');
    fireEvent.change(select, { target: { value: '__new__' } });
    
    // Enter existing chapter name
    const chapterInput = screen.getByLabelText('New Chapter Name');
    fireEvent.change(chapterInput, { target: { value: 'Chapter 1' } });
    
    // Add a valid file
    const file = new File(['test'], 'test.pdf', { type: 'application/pdf' });
    const hiddenInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    Object.defineProperty(hiddenInput, 'files', {
      value: [file],
      writable: false,
    });
    fireEvent.change(hiddenInput);
    
    // Try to submit
    const submitButton = screen.getByText('Upload File');
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText('Chapter name already exists')).toBeInTheDocument();
    });
  });

  it('successfully uploads file', async () => {
    const mockFile = {
      id: 'test-id',
      originalName: 'test.pdf',
      chapter: 'Chapter 1',
      size: 1024,
      uploadedAt: new Date(),
      textContent: 'test content',
      mimeType: 'application/pdf'
    };

    mockUploadFile.mockResolvedValue({
      success: true,
      file: mockFile
    });

    render(<FileUploadModal {...defaultProps} />);
    
    // Add a valid file
    const file = new File(['test'], 'test.pdf', { type: 'application/pdf' });
    const hiddenInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    Object.defineProperty(hiddenInput, 'files', {
      value: [file],
      writable: false,
    });
    fireEvent.change(hiddenInput);
    
    // Select chapter
    const select = screen.getByLabelText('Chapter');
    fireEvent.change(select, { target: { value: 'Chapter 1' } });
    
    // Submit form
    const submitButton = screen.getByText('Upload File');
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(mockUploadFile).toHaveBeenCalledWith(file, 'Chapter 1');
    });
    
    await waitFor(() => {
      expect(defaultProps.onUploadSuccess).toHaveBeenCalledWith(mockFile);
    });
  });

  it('handles upload errors', async () => {
    mockUploadFile.mockRejectedValue(new Error('Upload failed'));

    render(<FileUploadModal {...defaultProps} />);
    
    // Add a valid file
    const file = new File(['test'], 'test.pdf', { type: 'application/pdf' });
    const hiddenInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    Object.defineProperty(hiddenInput, 'files', {
      value: [file],
      writable: false,
    });
    fireEvent.change(hiddenInput);
    
    // Select chapter
    const select = screen.getByLabelText('Chapter');
    fireEvent.change(select, { target: { value: 'Chapter 1' } });
    
    // Submit form
    const submitButton = screen.getByText('Upload File');
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText('Upload failed')).toBeInTheDocument();
    });
  });

  it('closes modal on escape key', () => {
    render(<FileUploadModal {...defaultProps} />);
    
    fireEvent.keyDown(document, { key: 'Escape' });
    
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it('closes modal when clicking overlay', () => {
    render(<FileUploadModal {...defaultProps} />);
    
    const overlay = document.querySelector('.modal-overlay');
    fireEvent.click(overlay!);
    
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it('does not close modal when clicking modal content', () => {
    render(<FileUploadModal {...defaultProps} />);
    
    const modalCard = document.querySelector('.modal-card');
    fireEvent.click(modalCard!);
    
    expect(defaultProps.onClose).not.toHaveBeenCalled();
  });
});