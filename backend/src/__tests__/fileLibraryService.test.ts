/**
 * File Library Service Tests
 * Unit tests for the FileLibraryService class
 */

import { FileLibraryService, LibraryFile } from '../services/fileLibraryService';
import { ProcessedFile } from '../types/index';

describe('FileLibraryService', () => {
  // Clear library before each test
  beforeEach(async () => {
    await FileLibraryService.clearLibrary();
  });

  describe('File Upload', () => {
    it('should upload a file successfully', async () => {
      const processedFile: ProcessedFile = {
        originalName: 'test.pdf',
        mimeType: 'application/pdf',
        size: 1024,
        textContent: 'Test content',
        extractedAt: new Date()
      };

      const result = await FileLibraryService.uploadFile(processedFile, 'Chapter 1');

      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect(result.originalName).toBe('test.pdf');
      expect(result.chapter).toBe('Chapter 1');
      expect(result.size).toBe(1024);
      expect(result.textContent).toBe('Test content');
      expect(result.mimeType).toBe('application/pdf');
      expect(result.uploadedAt).toBeInstanceOf(Date);
    });

    it('should reject invalid chapter names', async () => {
      const processedFile: ProcessedFile = {
        originalName: 'test.pdf',
        mimeType: 'application/pdf',
        size: 1024,
        textContent: 'Test content',
        extractedAt: new Date()
      };

      // Empty chapter name
      await expect(FileLibraryService.uploadFile(processedFile, '')).rejects.toThrow('Invalid chapter name');

      // Chapter name too long
      const longName = 'a'.repeat(101);
      await expect(FileLibraryService.uploadFile(processedFile, longName)).rejects.toThrow('Invalid chapter name');

      // Invalid characters
      await expect(FileLibraryService.uploadFile(processedFile, 'Chapter@#$')).rejects.toThrow('Invalid chapter name');
    });

    it('should trim chapter names', async () => {
      const processedFile: ProcessedFile = {
        originalName: 'test.pdf',
        mimeType: 'application/pdf',
        size: 1024,
        textContent: 'Test content',
        extractedAt: new Date()
      };

      const result = await FileLibraryService.uploadFile(processedFile, '  Chapter 1  ');
      expect(result.chapter).toBe('Chapter 1');
    });
  });

  describe('File Retrieval', () => {
    it('should retrieve files by chapter', async () => {
      const processedFile1: ProcessedFile = {
        originalName: 'test1.pdf',
        mimeType: 'application/pdf',
        size: 1024,
        textContent: 'Test content 1',
        extractedAt: new Date()
      };

      const processedFile2: ProcessedFile = {
        originalName: 'test2.pdf',
        mimeType: 'application/pdf',
        size: 2048,
        textContent: 'Test content 2',
        extractedAt: new Date()
      };

      await FileLibraryService.uploadFile(processedFile1, 'Chapter 1');
      await FileLibraryService.uploadFile(processedFile2, 'Chapter 2');

      const chapters = await FileLibraryService.getFilesByChapter();

      expect(chapters).toHaveLength(2);
      expect(chapters[0].chapter).toBe('Chapter 1');
      expect(chapters[0].files).toHaveLength(1);
      expect(chapters[1].chapter).toBe('Chapter 2');
      expect(chapters[1].files).toHaveLength(1);
    });

    it('should retrieve file by ID', async () => {
      const processedFile: ProcessedFile = {
        originalName: 'test.pdf',
        mimeType: 'application/pdf',
        size: 1024,
        textContent: 'Test content',
        extractedAt: new Date()
      };

      const uploadedFile = await FileLibraryService.uploadFile(processedFile, 'Chapter 1');
      const retrievedFile = await FileLibraryService.getFileById(uploadedFile.id);

      expect(retrievedFile).toBeDefined();
      expect(retrievedFile!.id).toBe(uploadedFile.id);
      expect(retrievedFile!.originalName).toBe('test.pdf');
    });

    it('should return null for invalid file ID', async () => {
      const result = await FileLibraryService.getFileById('invalid-id');
      expect(result).toBeNull();
    });

    it('should return null for non-existent file ID', async () => {
      const result = await FileLibraryService.getFileById('550e8400-e29b-41d4-a716-446655440000');
      expect(result).toBeNull();
    });
  });

  describe('File Deletion', () => {
    it('should delete a file successfully', async () => {
      const processedFile: ProcessedFile = {
        originalName: 'test.pdf',
        mimeType: 'application/pdf',
        size: 1024,
        textContent: 'Test content',
        extractedAt: new Date()
      };

      const uploadedFile = await FileLibraryService.uploadFile(processedFile, 'Chapter 1');
      const deleted = await FileLibraryService.deleteFile(uploadedFile.id);

      expect(deleted).toBe(true);

      const retrievedFile = await FileLibraryService.getFileById(uploadedFile.id);
      expect(retrievedFile).toBeNull();
    });

    it('should return false for invalid file ID', async () => {
      const result = await FileLibraryService.deleteFile('invalid-id');
      expect(result).toBe(false);
    });

    it('should return false for non-existent file ID', async () => {
      const result = await FileLibraryService.deleteFile('550e8400-e29b-41d4-a716-446655440000');
      expect(result).toBe(false);
    });

    it('should remove empty chapters after file deletion', async () => {
      const processedFile: ProcessedFile = {
        originalName: 'test.pdf',
        mimeType: 'application/pdf',
        size: 1024,
        textContent: 'Test content',
        extractedAt: new Date()
      };

      const uploadedFile = await FileLibraryService.uploadFile(processedFile, 'Chapter 1');
      await FileLibraryService.deleteFile(uploadedFile.id);

      const chapters = await FileLibraryService.getFilesByChapter();
      expect(chapters).toHaveLength(0);
    });
  });

  describe('Chapter Management', () => {
    it('should rename a chapter successfully', async () => {
      const processedFile: ProcessedFile = {
        originalName: 'test.pdf',
        mimeType: 'application/pdf',
        size: 1024,
        textContent: 'Test content',
        extractedAt: new Date()
      };

      const uploadedFile = await FileLibraryService.uploadFile(processedFile, 'Chapter 1');
      const renamed = await FileLibraryService.renameChapter('Chapter 1', 'Chapter One');

      expect(renamed).toBe(true);

      const retrievedFile = await FileLibraryService.getFileById(uploadedFile.id);
      expect(retrievedFile!.chapter).toBe('Chapter One');

      const chapters = await FileLibraryService.getFilesByChapter();
      expect(chapters[0].chapter).toBe('Chapter One');
    });

    it('should return false for non-existent chapter', async () => {
      const result = await FileLibraryService.renameChapter('Non-existent', 'New Name');
      expect(result).toBe(false);
    });

    it('should reject invalid new chapter names', async () => {
      const processedFile: ProcessedFile = {
        originalName: 'test.pdf',
        mimeType: 'application/pdf',
        size: 1024,
        textContent: 'Test content',
        extractedAt: new Date()
      };

      await FileLibraryService.uploadFile(processedFile, 'Chapter 1');

      const result = await FileLibraryService.renameChapter('Chapter 1', '');
      expect(result).toBe(false);
    });

    it('should throw error when new chapter name already exists', async () => {
      const processedFile1: ProcessedFile = {
        originalName: 'test1.pdf',
        mimeType: 'application/pdf',
        size: 1024,
        textContent: 'Test content 1',
        extractedAt: new Date()
      };

      const processedFile2: ProcessedFile = {
        originalName: 'test2.pdf',
        mimeType: 'application/pdf',
        size: 2048,
        textContent: 'Test content 2',
        extractedAt: new Date()
      };

      await FileLibraryService.uploadFile(processedFile1, 'Chapter 1');
      await FileLibraryService.uploadFile(processedFile2, 'Chapter 2');

      await expect(FileLibraryService.renameChapter('Chapter 1', 'Chapter 2')).rejects.toThrow('Chapter with the new name already exists');
    });

    it('should get chapter names', async () => {
      const processedFile1: ProcessedFile = {
        originalName: 'test1.pdf',
        mimeType: 'application/pdf',
        size: 1024,
        textContent: 'Test content 1',
        extractedAt: new Date()
      };

      const processedFile2: ProcessedFile = {
        originalName: 'test2.pdf',
        mimeType: 'application/pdf',
        size: 2048,
        textContent: 'Test content 2',
        extractedAt: new Date()
      };

      await FileLibraryService.uploadFile(processedFile1, 'Chapter B');
      await FileLibraryService.uploadFile(processedFile2, 'Chapter A');

      const chapterNames = await FileLibraryService.getChapterNames();
      expect(chapterNames).toEqual(['Chapter A', 'Chapter B']);
    });
  });

  describe('Statistics', () => {
    it('should return correct statistics', async () => {
      const processedFile1: ProcessedFile = {
        originalName: 'test1.pdf',
        mimeType: 'application/pdf',
        size: 1024,
        textContent: 'Test content 1',
        extractedAt: new Date()
      };

      const processedFile2: ProcessedFile = {
        originalName: 'test2.pdf',
        mimeType: 'application/pdf',
        size: 2048,
        textContent: 'Test content 2',
        extractedAt: new Date()
      };

      await FileLibraryService.uploadFile(processedFile1, 'Chapter 1');
      await FileLibraryService.uploadFile(processedFile2, 'Chapter 1');

      expect(FileLibraryService.getTotalFileCount()).toBe(2);
      expect(FileLibraryService.getTotalChapterCount()).toBe(1);

      const stats = FileLibraryService.getLibraryStats();
      expect(stats.totalFiles).toBe(2);
      expect(stats.totalChapters).toBe(1);
      expect(stats.chaptersWithFiles).toHaveLength(1);
      expect(stats.chaptersWithFiles[0].chapter).toBe('Chapter 1');
      expect(stats.chaptersWithFiles[0].fileCount).toBe(2);
    });
  });
});