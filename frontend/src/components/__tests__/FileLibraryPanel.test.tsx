import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import FileLibraryPanel from '../FileLibraryPanel';
import { getFileLibrary, deleteFile, renameChapter } from '../../services/api';

// Mock the API services
jest.mock('../../services/api', () => ({
  getFileLibrary: jest.fn(),
  deleteFile: jest.fn(),
  renameChapter: jest.fn()
}));

const mockGetFileLibrary = getFileLibrary as jest.MockedFunction<typeof getFileLibrary>;
const mockDeleteFile = deleteFile as jest.MockedFunction<typeof deleteFile>;
const mockRenameChapter = renameChapter as jest.MockedFunction<typeof renameChapter>;

describe('FileLibraryPanel', () => {
  const defaultProps = {
    selectedFileId: null,
    onFileSelect: jest.fn(),
    userRole: 'student' as const
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders loading state initially', () => {
    mockGetFileLibrary.mockResolvedValue({
      success: true,
      chapters: []
    });

    render(<FileLibraryPanel {...defaultProps} />);
    
    expect(screen.getByText('Carregando biblioteca...')).toBeInTheDocument();
  });

  it('renders empty state when no files exist', async () => {
    mockGetFileLibrary.mockResolvedValue({
      success: true,
      chapters: []
    });

    render(<FileLibraryPanel {...defaultProps} />);
    
    await waitFor(() => {
      expect(screen.getByText('Nenhum arquivo encontrado')).toBeInTheDocument();
    });
  });

  it('renders file library with chapters and files', async () => {
    const mockChapters = [
      {
        chapter: 'Chapter 1',
        files: [
          {
            id: 'file-1',
            originalName: 'test1.pdf',
            chapter: 'Chapter 1',
            size: 1024,
            uploadedAt: new Date(),
            textContent: 'Content 1',
            mimeType: 'application/pdf'
          }
        ]
      },
      {
        chapter: 'Chapter 2',
        files: [
          {
            id: 'file-2',
            originalName: 'test2.pdf',
            chapter: 'Chapter 2',
            size: 2048,
            uploadedAt: new Date(),
            textContent: 'Content 2',
            mimeType: 'application/pdf'
          }
        ]
      }
    ];

    mockGetFileLibrary.mockResolvedValue({
      success: true,
      chapters: mockChapters
    });

    render(<FileLibraryPanel {...defaultProps} />);
    
    await waitFor(() => {
      expect(screen.getByText('Chapter 1')).toBeInTheDocument();
      expect(screen.getByText('Chapter 2')).toBeInTheDocument();
      expect(screen.getByText('test1.pdf')).toBeInTheDocument();
      expect(screen.getByText('test2.pdf')).toBeInTheDocument();
    });
  });

  it('handles file selection', async () => {
    const mockChapters = [
      {
        chapter: 'Chapter 1',
        files: [
          {
            id: 'file-1',
            originalName: 'test.pdf',
            chapter: 'Chapter 1',
            size: 1024,
            uploadedAt: new Date(),
            textContent: 'Content',
            mimeType: 'application/pdf'
          }
        ]
      }
    ];

    mockGetFileLibrary.mockResolvedValue({
      success: true,
      chapters: mockChapters
    });

    const mockOnFileSelect = jest.fn();
    render(<FileLibraryPanel {...defaultProps} onFileSelect={mockOnFileSelect} />);
    
    await waitFor(() => {
      const fileItem = screen.getByText('test.pdf');
      fireEvent.click(fileItem);
      expect(mockOnFileSelect).toHaveBeenCalledWith('file-1');
    });
  });

  it('expands and collapses chapters', async () => {
    const mockChapters = [
      {
        chapter: 'Chapter 1',
        files: [
          {
            id: 'file-1',
            originalName: 'test.pdf',
            chapter: 'Chapter 1',
            size: 1024,
            uploadedAt: new Date(),
            textContent: 'Content',
            mimeType: 'application/pdf'
          }
        ]
      }
    ];

    mockGetFileLibrary.mockResolvedValue({
      success: true,
      chapters: mockChapters
    });

    render(<FileLibraryPanel {...defaultProps} />);
    
    await waitFor(() => {
      const chapterHeader = screen.getByText('Chapter 1');
      fireEvent.click(chapterHeader);
      
      // File should be visible after expanding
      expect(screen.getByText('test.pdf')).toBeInTheDocument();
      
      // Click again to collapse
      fireEvent.click(chapterHeader);
      
      // File should not be visible after collapsing
      expect(screen.queryByText('test.pdf')).not.toBeInTheDocument();
    });
  });

  it('shows teacher-only features for teachers', async () => {
    const mockChapters = [
      {
        chapter: 'Chapter 1',
        files: [
          {
            id: 'file-1',
            originalName: 'test.pdf',
            chapter: 'Chapter 1',
            size: 1024,
            uploadedAt: new Date(),
            textContent: 'Content',
            mimeType: 'application/pdf'
          }
        ]
      }
    ];

    mockGetFileLibrary.mockResolvedValue({
      success: true,
      chapters: mockChapters
    });

    render(<FileLibraryPanel {...defaultProps} userRole="teacher" />);
    
    await waitFor(() => {
      // Teacher should see delete button
      expect(screen.getByTitle('Excluir arquivo')).toBeInTheDocument();
      
      // Teacher should see edit chapter button
      expect(screen.getByTitle('Renomear capítulo')).toBeInTheDocument();
    });
  });

  it('hides teacher-only features for students', async () => {
    const mockChapters = [
      {
        chapter: 'Chapter 1',
        files: [
          {
            id: 'file-1',
            originalName: 'test.pdf',
            chapter: 'Chapter 1',
            size: 1024,
            uploadedAt: new Date(),
            textContent: 'Content',
            mimeType: 'application/pdf'
          }
        ]
      }
    ];

    mockGetFileLibrary.mockResolvedValue({
      success: true,
      chapters: mockChapters
    });

    render(<FileLibraryPanel {...defaultProps} userRole="student" />);
    
    await waitFor(() => {
      // Student should not see delete button
      expect(screen.queryByTitle('Excluir arquivo')).not.toBeInTheDocument();
      
      // Student should not see edit chapter button
      expect(screen.queryByTitle('Renomear capítulo')).not.toBeInTheDocument();
    });
  });

  it('handles file deletion for teachers', async () => {
    const mockChapters = [
      {
        chapter: 'Chapter 1',
        files: [
          {
            id: 'file-1',
            originalName: 'test.pdf',
            chapter: 'Chapter 1',
            size: 1024,
            uploadedAt: new Date(),
            textContent: 'Content',
            mimeType: 'application/pdf'
          }
        ]
      }
    ];

    mockGetFileLibrary.mockResolvedValueOnce({
      success: true,
      chapters: mockChapters
    });

    mockDeleteFile.mockResolvedValue({
      success: true,
      message: 'File deleted successfully'
    });

    // Mock window.confirm to return true
    jest.spyOn(window, 'confirm').mockImplementation(() => true);

    render(<FileLibraryPanel {...defaultProps} userRole="teacher" />);
    
    await waitFor(() => {
      const deleteButton = screen.getByTitle('Excluir arquivo');
      fireEvent.click(deleteButton);
    });

    expect(mockDeleteFile).toHaveBeenCalledWith('file-1');
  });

  it('handles chapter renaming for teachers', async () => {
    const mockChapters = [
      {
        chapter: 'Chapter 1',
        files: [
          {
            id: 'file-1',
            originalName: 'test.pdf',
            chapter: 'Chapter 1',
            size: 1024,
            uploadedAt: new Date(),
            textContent: 'Content',
            mimeType: 'application/pdf'
          }
        ]
      }
    ];

    mockGetFileLibrary.mockResolvedValue({
      success: true,
      chapters: mockChapters
    });

    mockRenameChapter.mockResolvedValue({
      success: true,
      message: 'Chapter renamed successfully'
    });

    render(<FileLibraryPanel {...defaultProps} userRole="teacher" />);
    
    await waitFor(() => {
      const editButton = screen.getByTitle('Renomear capítulo');
      fireEvent.click(editButton);
      
      const input = screen.getByDisplayValue('Chapter 1');
      fireEvent.change(input, { target: { value: 'New Chapter Name' } });
      fireEvent.blur(input);
    });

    expect(mockRenameChapter).toHaveBeenCalledWith('Chapter 1', 'New Chapter Name');
  });

  it('handles API errors gracefully', async () => {
    mockGetFileLibrary.mockRejectedValue(new Error('Failed to load library'));

    render(<FileLibraryPanel {...defaultProps} />);
    
    await waitFor(() => {
      expect(screen.getByText(/Failed to load library/i)).toBeInTheDocument();
    });
  });
});