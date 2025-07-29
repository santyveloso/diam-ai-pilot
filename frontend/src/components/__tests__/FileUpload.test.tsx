import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import FileUpload from '../FileUpload';

// Mock file creation helper
const createMockFile = (
  name: string = 'test.pdf',
  type: string = 'application/pdf',
  size: number = 1024
): File => {
  const file = new File(['test content'], name, { type });
  // Override the size property since File constructor doesn't always respect it in tests
  Object.defineProperty(file, 'size', {
    value: size,
    writable: false,
  });
  return file;
};

describe('FileUpload Component', () => {
  const mockOnFileSelect = jest.fn();

  beforeEach(() => {
    mockOnFileSelect.mockClear();
  });

  it('renders upload prompt when no file is selected', () => {
    render(
      <FileUpload
        onFileSelect={mockOnFileSelect}
        selectedFile={null}
        isUploading={false}
      />
    );

    expect(screen.getByText('Click to upload')).toBeInTheDocument();
    expect(screen.getByText('or drag and drop')).toBeInTheDocument();
    expect(screen.getByText('PDF files only (max 10MB)')).toBeInTheDocument();
  });

  it('displays selected file information', () => {
    const mockFile = createMockFile('document.pdf', 'application/pdf', 2048);
    
    render(
      <FileUpload
        onFileSelect={mockOnFileSelect}
        selectedFile={mockFile}
        isUploading={false}
      />
    );

    expect(screen.getByText('document.pdf')).toBeInTheDocument();
    expect(screen.getByText('2 KB')).toBeInTheDocument();
  });

  it('shows uploading state', () => {
    const mockFile = createMockFile();
    
    render(
      <FileUpload
        onFileSelect={mockOnFileSelect}
        selectedFile={mockFile}
        isUploading={true}
      />
    );

    expect(screen.getByText('Uploading...')).toBeInTheDocument();
    expect(document.querySelector('.upload-spinner')).toBeInTheDocument();
  });

  it('handles file input change', () => {
    render(
      <FileUpload
        onFileSelect={mockOnFileSelect}
        selectedFile={null}
        isUploading={false}
      />
    );

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    const mockFile = createMockFile();

    Object.defineProperty(fileInput, 'files', {
      value: [mockFile],
      writable: false,
    });

    fireEvent.change(fileInput);

    expect(mockOnFileSelect).toHaveBeenCalledWith(mockFile);
  });

  it('validates file type - rejects non-PDF files', () => {
    render(
      <FileUpload
        onFileSelect={mockOnFileSelect}
        selectedFile={null}
        isUploading={false}
      />
    );

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    const invalidFile = createMockFile('document.txt', 'text/plain');

    Object.defineProperty(fileInput, 'files', {
      value: [invalidFile],
      writable: false,
    });

    fireEvent.change(fileInput);

    expect(screen.getByText('Please select a PDF file only.')).toBeInTheDocument();
    expect(mockOnFileSelect).not.toHaveBeenCalled();
  });

  it('validates file size - rejects files over 10MB', () => {
    render(
      <FileUpload
        onFileSelect={mockOnFileSelect}
        selectedFile={null}
        isUploading={false}
      />
    );

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    const largeFile = createMockFile('large.pdf', 'application/pdf', 11 * 1024 * 1024); // 11MB

    Object.defineProperty(fileInput, 'files', {
      value: [largeFile],
      writable: false,
    });

    fireEvent.change(fileInput);

    expect(screen.getByText('File size must be less than 10MB.')).toBeInTheDocument();
    expect(mockOnFileSelect).not.toHaveBeenCalled();
  });

  it('validates file extension', () => {
    render(
      <FileUpload
        onFileSelect={mockOnFileSelect}
        selectedFile={null}
        isUploading={false}
      />
    );

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    // File with correct MIME type but wrong extension
    const invalidFile = createMockFile('document.doc', 'application/pdf');

    Object.defineProperty(fileInput, 'files', {
      value: [invalidFile],
      writable: false,
    });

    fireEvent.change(fileInput);

    expect(screen.getByText('Please select a PDF file only.')).toBeInTheDocument();
    expect(mockOnFileSelect).not.toHaveBeenCalled();
  });

  it('handles drag and drop', () => {
    render(
      <FileUpload
        onFileSelect={mockOnFileSelect}
        selectedFile={null}
        isUploading={false}
      />
    );

    const dropArea = document.querySelector('.file-upload-area') as HTMLElement;
    const mockFile = createMockFile();

    // Create a mock DataTransfer object
    const mockDataTransfer = {
      files: [mockFile],
    };

    const dropEvent = new Event('drop', { bubbles: true });
    Object.defineProperty(dropEvent, 'dataTransfer', {
      value: mockDataTransfer,
    });

    fireEvent(dropArea, dropEvent);

    expect(mockOnFileSelect).toHaveBeenCalledWith(mockFile);
  });

  it('shows drag over state', () => {
    render(
      <FileUpload
        onFileSelect={mockOnFileSelect}
        selectedFile={null}
        isUploading={false}
      />
    );

    const dropArea = document.querySelector('.file-upload-area') as HTMLElement;

    fireEvent.dragEnter(dropArea);
    expect(dropArea).toHaveClass('drag-over');

    fireEvent.dragLeave(dropArea);
    expect(dropArea).not.toHaveClass('drag-over');
  });

  it('clears selected file when clear button is clicked', () => {
    const mockFile = createMockFile();
    
    render(
      <FileUpload
        onFileSelect={mockOnFileSelect}
        selectedFile={mockFile}
        isUploading={false}
      />
    );

    const clearButton = screen.getByLabelText('Remove selected file');
    fireEvent.click(clearButton);

    expect(mockOnFileSelect).toHaveBeenCalledWith(null);
  });

  it('opens file dialog when upload area is clicked', () => {
    render(
      <FileUpload
        onFileSelect={mockOnFileSelect}
        selectedFile={null}
        isUploading={false}
      />
    );

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    const clickSpy = jest.spyOn(fileInput, 'click').mockImplementation(() => {});

    const uploadArea = document.querySelector('.file-upload-area') as HTMLElement;
    fireEvent.click(uploadArea);

    expect(clickSpy).toHaveBeenCalled();
    clickSpy.mockRestore();
  });

  it('handles keyboard navigation', () => {
    render(
      <FileUpload
        onFileSelect={mockOnFileSelect}
        selectedFile={null}
        isUploading={false}
      />
    );

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    const clickSpy = jest.spyOn(fileInput, 'click').mockImplementation(() => {});

    const uploadArea = document.querySelector('.file-upload-area') as HTMLElement;
    
    // Test Enter key
    fireEvent.keyDown(uploadArea, { key: 'Enter' });
    expect(clickSpy).toHaveBeenCalled();

    clickSpy.mockClear();

    // Test Space key
    fireEvent.keyDown(uploadArea, { key: ' ' });
    expect(clickSpy).toHaveBeenCalled();

    clickSpy.mockRestore();
  });

  it('formats file size correctly', () => {
    const testCases = [
      { file: createMockFile('test.pdf', 'application/pdf', 0), expected: '0 Bytes' },
      { file: createMockFile('test.pdf', 'application/pdf', 1024), expected: '1 KB' },
      { file: createMockFile('test.pdf', 'application/pdf', 1024 * 1024), expected: '1 MB' },
      { file: createMockFile('test.pdf', 'application/pdf', 2.5 * 1024 * 1024), expected: '2.5 MB' },
    ];

    testCases.forEach(({ file, expected }) => {
      const { rerender } = render(
        <FileUpload
          onFileSelect={mockOnFileSelect}
          selectedFile={file}
          isUploading={false}
        />
      );

      expect(screen.getByText(expected)).toBeInTheDocument();

      rerender(
        <FileUpload
          onFileSelect={mockOnFileSelect}
          selectedFile={null}
          isUploading={false}
        />
      );
    });
  });

  it('prevents file dialog when uploading', () => {
    render(
      <FileUpload
        onFileSelect={mockOnFileSelect}
        selectedFile={null}
        isUploading={true}
      />
    );

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    const clickSpy = jest.spyOn(fileInput, 'click').mockImplementation(() => {});

    const uploadArea = document.querySelector('.file-upload-area') as HTMLElement;
    fireEvent.click(uploadArea);

    expect(clickSpy).not.toHaveBeenCalled();
    clickSpy.mockRestore();
  });
});