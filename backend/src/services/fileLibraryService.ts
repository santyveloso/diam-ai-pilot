/**
 * File Library Service
 * Manages file storage, retrieval, and organization for the chapter-based file library
 */

import { randomUUID } from 'crypto';
import { ProcessedFile } from '../types/index';

/**
 * Library file interface representing a stored file with metadata
 */
export interface LibraryFile {
  /** Unique file identifier */
  id: string;
  /** Original filename */
  originalName: string;
  /** Chapter assignment */
  chapter: string;
  /** File size in bytes */
  size: number;
  /** Upload timestamp */
  uploadedAt: Date;
  /** Extracted PDF text content */
  textContent: string;
  /** File MIME type */
  mimeType: string;
}

/**
 * Chapter interface for organizing files
 */
export interface Chapter {
  /** Chapter display name */
  name: string;
  /** Files in this chapter */
  files: LibraryFile[];
  /** Number of files */
  fileCount: number;
  /** UI state for expansion (optional) */
  isExpanded?: boolean;
}

/**
 * Chapter files interface for API responses
 */
export interface ChapterFiles {
  /** Chapter name */
  chapter: string;
  /** Files in the chapter */
  files: LibraryFile[];
}

/**
 * File Library Service
 * Provides in-memory storage and management for the file library system
 */
export class FileLibraryService {
  /** In-memory storage for files: fileId -> LibraryFile */
  private static files: Map<string, LibraryFile> = new Map();
  
  /** In-memory storage for chapters: chapterName -> fileId[] */
  private static chapters: Map<string, string[]> = new Map();

  /**
   * Generate a unique file ID
   * @returns Unique file identifier
   */
  private static generateFileId(): string {
    return randomUUID();
  }

  /**
   * Validate file ID format
   * @param fileId File ID to validate
   * @returns True if valid UUID format
   */
  private static isValidFileId(fileId: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(fileId);
  }

  /**
   * Validate chapter name
   * @param chapterName Chapter name to validate
   * @returns True if valid chapter name
   */
  private static isValidChapterName(chapterName: string): boolean {
    if (!chapterName || typeof chapterName !== 'string') {
      return false;
    }
    
    // Check length (1-100 characters)
    if (chapterName.length < 1 || chapterName.length > 100) {
      return false;
    }
    
    // Check for invalid characters (allow letters, numbers, spaces, hyphens, underscores)
    const validChapterRegex = /^[a-zA-Z0-9\s\-_]+$/;
    return validChapterRegex.test(chapterName.trim());
  }

  /**
   * Upload a new file to the library
   * @param processedFile Processed file data from PDF processor
   * @param chapter Chapter to assign the file to
   * @returns Promise resolving to the created LibraryFile
   */
  static async uploadFile(processedFile: ProcessedFile, chapter: string): Promise<LibraryFile> {
    // Validate chapter name
    if (!this.isValidChapterName(chapter)) {
      throw new Error('Invalid chapter name. Must be 1-100 characters and contain only letters, numbers, spaces, hyphens, and underscores.');
    }

    // Generate unique file ID
    const fileId = this.generateFileId();

    // Create library file object
    const libraryFile: LibraryFile = {
      id: fileId,
      originalName: processedFile.originalName,
      chapter: chapter.trim(),
      size: processedFile.size,
      uploadedAt: new Date(),
      textContent: processedFile.textContent,
      mimeType: processedFile.mimeType
    };

    // Store file in files map
    this.files.set(fileId, libraryFile);

    // Add file to chapter
    const chapterName = chapter.trim();
    if (!this.chapters.has(chapterName)) {
      this.chapters.set(chapterName, []);
    }
    this.chapters.get(chapterName)!.push(fileId);

    return libraryFile;
  }

  /**
   * Get all files organized by chapter
   * @returns Promise resolving to array of ChapterFiles
   */
  static async getFilesByChapter(): Promise<ChapterFiles[]> {
    const result: ChapterFiles[] = [];

    // Iterate through all chapters
    for (const [chapterName, fileIds] of this.chapters.entries()) {
      const chapterFiles: LibraryFile[] = [];
      
      // Get all files for this chapter
      for (const fileId of fileIds) {
        const file = this.files.get(fileId);
        if (file) {
          chapterFiles.push(file);
        }
      }

      // Sort files by upload date (newest first)
      chapterFiles.sort((a, b) => b.uploadedAt.getTime() - a.uploadedAt.getTime());

      result.push({
        chapter: chapterName,
        files: chapterFiles
      });
    }

    // Sort chapters alphabetically
    result.sort((a, b) => a.chapter.localeCompare(b.chapter));

    return result;
  }

  /**
   * Get a specific file by ID
   * @param fileId File identifier
   * @returns Promise resolving to LibraryFile or null if not found
   */
  static async getFileById(fileId: string): Promise<LibraryFile | null> {
    // Validate file ID format
    if (!this.isValidFileId(fileId)) {
      return null;
    }

    return this.files.get(fileId) || null;
  }

  /**
   * Delete a file from the library
   * @param fileId File identifier
   * @returns Promise resolving to true if deleted, false if not found
   */
  static async deleteFile(fileId: string): Promise<boolean> {
    // Validate file ID format
    if (!this.isValidFileId(fileId)) {
      return false;
    }

    // Get file to find its chapter
    const file = this.files.get(fileId);
    if (!file) {
      return false;
    }

    // Remove file from files map
    this.files.delete(fileId);

    // Remove file from chapter
    const chapterFileIds = this.chapters.get(file.chapter);
    if (chapterFileIds) {
      const fileIndex = chapterFileIds.indexOf(fileId);
      if (fileIndex > -1) {
        chapterFileIds.splice(fileIndex, 1);
      }

      // If chapter is now empty, remove it
      if (chapterFileIds.length === 0) {
        this.chapters.delete(file.chapter);
      }
    }

    return true;
  }

  /**
   * Rename a chapter
   * @param oldName Current chapter name
   * @param newName New chapter name
   * @returns Promise resolving to true if renamed, false if chapter not found or invalid name
   */
  static async renameChapter(oldName: string, newName: string): Promise<boolean> {
    // Validate new chapter name
    if (!this.isValidChapterName(newName)) {
      return false;
    }

    const trimmedOldName = oldName.trim();
    const trimmedNewName = newName.trim();

    // Check if old chapter exists
    if (!this.chapters.has(trimmedOldName)) {
      return false;
    }

    // Check if new name already exists (and is different from old name)
    if (trimmedNewName !== trimmedOldName && this.chapters.has(trimmedNewName)) {
      throw new Error('Chapter with the new name already exists');
    }

    // If names are the same, no operation needed
    if (trimmedOldName === trimmedNewName) {
      return true;
    }

    // Get file IDs from old chapter
    const fileIds = this.chapters.get(trimmedOldName)!;

    // Update chapter name in all files
    for (const fileId of fileIds) {
      const file = this.files.get(fileId);
      if (file) {
        file.chapter = trimmedNewName;
      }
    }

    // Move chapter in chapters map
    this.chapters.set(trimmedNewName, fileIds);
    this.chapters.delete(trimmedOldName);

    return true;
  }

  /**
   * Get all chapter names
   * @returns Array of chapter names sorted alphabetically
   */
  static async getChapterNames(): Promise<string[]> {
    return Array.from(this.chapters.keys()).sort();
  }

  /**
   * Get total number of files in the library
   * @returns Total file count
   */
  static getTotalFileCount(): number {
    return this.files.size;
  }

  /**
   * Get total number of chapters
   * @returns Total chapter count
   */
  static getTotalChapterCount(): number {
    return this.chapters.size;
  }

  /**
   * Clear all files and chapters (for testing purposes)
   * @returns Promise resolving when cleared
   */
  static async clearLibrary(): Promise<void> {
    this.files.clear();
    this.chapters.clear();
  }

  /**
   * Get library statistics
   * @returns Object with library statistics
   */
  static getLibraryStats(): {
    totalFiles: number;
    totalChapters: number;
    chaptersWithFiles: { chapter: string; fileCount: number }[];
  } {
    const chaptersWithFiles = Array.from(this.chapters.entries()).map(([chapter, fileIds]) => ({
      chapter,
      fileCount: fileIds.length
    }));

    return {
      totalFiles: this.files.size,
      totalChapters: this.chapters.size,
      chaptersWithFiles: chaptersWithFiles.sort((a, b) => a.chapter.localeCompare(b.chapter))
    };
  }
}