import { Router, Request, Response, NextFunction } from 'express';
import { uploadMiddleware } from '../middleware/upload';
import { rateLimitMiddleware, getRateLimitStatus } from '../middleware/rateLimiter';
import { verifyGoogleToken, AuthenticatedRequest } from '../middleware/googleAuth';
import { PDFProcessor } from '../services/pdfProcessor';
import { GeminiClient } from '../services/geminiClient';
import { ErrorService } from '../services/errorService';
import { FileLibraryService } from '../services/fileLibraryService';
import { 
  AskRequest, 
  AskResponse, 
  FileUploadRequest, 
  FileUploadResponse, 
  FileLibraryResponse, 
  FileResponse, 
  ChapterRenameRequest, 
  FileOperationResponse 
} from '../types';

const router = Router();

// Initialize Gemini client lazily to avoid issues in tests
let geminiClient: GeminiClient;

/**
 * POST /api/ask
 * Main endpoint for processing questions with PDF context
 * Rate limited to 2 requests per minute per session
 * 
 * Supports two modes:
 * 1. File upload mode (backward compatibility): Upload file with question
 * 2. File library mode: Reference existing file by ID
 */
router.post('/ask', rateLimitMiddleware, verifyGoogleToken, uploadMiddleware.single('file'), async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  let uploadedFilePath: string | undefined;

  try {
    // Validate request inputs
    const { question, fileId }: AskRequest = req.body;
    const file = req.file;

    // Use error service for validation and sanitization
    const sanitizedQuestion = ErrorService.validateQuestion(question);

    let textContent: string;
    let fileName: string;

    // Determine processing mode: file upload or file library
    if (fileId) {
      // File library mode: retrieve file by ID
      console.log(`Processing question with library file: ${fileId}`);
      
      // Validate fileId parameter
      if (typeof fileId !== 'string' || fileId.trim().length === 0) {
        throw ErrorService.createError('INVALID_FILE_ID', 'File ID must be a non-empty string');
      }

      // Retrieve file from library
      const libraryFile = await FileLibraryService.getFileById(fileId.trim());
      
      if (!libraryFile) {
        throw ErrorService.createError('FILE_NOT_FOUND', 'Referenced file not found in library');
      }

      // Use library file content
      textContent = libraryFile.textContent;
      fileName = libraryFile.originalName;

      // Validate that we have content
      if (!textContent || textContent.trim().length === 0) {
        throw ErrorService.createError('INVALID_CONTENT', 'Library file has no readable content');
      }

    } else if (file) {
      // File upload mode: process uploaded file (backward compatibility)
      console.log(`Processing uploaded PDF: ${file.originalname} (${file.size} bytes)`);
      
      // Validate file upload
      ErrorService.validateFileUpload(file);
      uploadedFilePath = file.path;

      // Process the PDF file
      const processedFile = await PDFProcessor.processFile(file);

      // Validate extracted text content
      PDFProcessor.validateTextContent(processedFile.textContent);

      // Use processed file content
      textContent = processedFile.textContent;
      fileName = processedFile.originalName;

    } else {
      // Neither fileId nor file provided
      throw ErrorService.createError('MISSING_FILE_OR_ID', 'Either file upload or fileId parameter is required');
    }

    // Initialize Gemini client if not already done
    if (!geminiClient) {
      geminiClient = new GeminiClient();
    }

    // Create question context with sanitized question
    const questionContext = geminiClient.createQuestionContext(
      sanitizedQuestion,
      textContent
    );

    console.log(`Generating AI response for question in ${questionContext.language} using file: ${fileName}`);

    // Generate AI response
    const aiResponse = await geminiClient.generateResponse(questionContext);

    // Clean up uploaded file if it was uploaded
    if (uploadedFilePath) {
      await PDFProcessor.cleanupFile(uploadedFilePath);
    }

    // Return successful response
    const response: AskResponse = {
      success: true,
      response: aiResponse.answer,
      fileUsed: fileName
    };

    console.log(`Response generated successfully (${aiResponse.processingTime}ms) using file: ${fileName}`);
    res.json(response);

  } catch (error) {
    // Clean up uploaded file on error
    if (uploadedFilePath) {
      await PDFProcessor.cleanupFile(uploadedFilePath);
    }

    // Pass error to error handler middleware
    next(error);
  }
});

/**
 * GET /api/rate-limit-status
 * Get current rate limit status for the session
 */
router.get('/rate-limit-status', (req: Request, res: Response) => {
  try {
    const status = getRateLimitStatus(req);
    
    res.json({
      success: true,
      rateLimit: {
        limit: 2,
        remaining: status.remaining,
        resetTime: status.resetTime.toISOString(),
        windowStart: status.windowStart.toISOString(),
        requests: status.requests,
        sessionId: status.sessionId.substring(0, 8) + '...' // Partial session ID for privacy
      }
    });
  } catch (error) {
    console.error('Rate limit status error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to get rate limit status'
      }
    });
  }
});

/**
 * GET /api/health
 * Health check endpoint for the API
 */
router.get('/health', async (_req: Request, res: Response) => {
  try {
    // Initialize Gemini client if not already done
    if (!geminiClient) {
      geminiClient = new GeminiClient();
    }
    
    // Check Gemini API health
    const geminiHealthy = await geminiClient.healthCheck();
    
    res.json({
      status: 'OK',
      message: 'API is running',
      services: {
        gemini: geminiHealthy ? 'healthy' : 'unhealthy'
      },
      rateLimit: {
        enabled: true,
        limit: 2,
        windowMs: 60000
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Health check error:', error);
    res.status(500).json({
      status: 'ERROR',
      message: 'Health check failed',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * File Library Management Endpoints
 */

/**
 * POST /api/files/upload
 * Upload a new file to the library with chapter assignment
 */
router.post('/files/upload', verifyGoogleToken, uploadMiddleware.single('file'), async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  let uploadedFilePath: string | undefined;

  try {
    // Validate request inputs
    const { chapter }: FileUploadRequest = req.body;
    const file = req.file;

    // Validate file upload
    ErrorService.validateFileUpload(file);
    uploadedFilePath = file!.path;

    // Validate chapter parameter
    if (!chapter || typeof chapter !== 'string' || chapter.trim().length === 0) {
      throw ErrorService.createError('MISSING_CHAPTER', 'Chapter name is required');
    }

    console.log(`Processing file upload: ${file!.originalname} to chapter: ${chapter}`);

    // Process the PDF file
    const processedFile = await PDFProcessor.processFile(file!);

    // Validate extracted text content
    PDFProcessor.validateTextContent(processedFile.textContent);

    // Upload file to library
    const libraryFile = await FileLibraryService.uploadFile(processedFile, chapter);

    // Clean up uploaded file
    await PDFProcessor.cleanupFile(uploadedFilePath);

    // Return successful response
    const response: FileUploadResponse = {
      success: true,
      file: libraryFile
    };

    console.log(`File uploaded successfully: ${libraryFile.id} in chapter: ${libraryFile.chapter}`);
    res.json(response);

  } catch (error) {
    // Clean up uploaded file on error
    if (uploadedFilePath) {
      await PDFProcessor.cleanupFile(uploadedFilePath);
    }

    // Pass error to error handler middleware
    next(error);
  }
});

/**
 * GET /api/files/library
 * Get all files organized by chapter
 */
router.get('/files/library', verifyGoogleToken, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    console.log('Retrieving file library');

    // Get files organized by chapter
    const chapters = await FileLibraryService.getFilesByChapter();

    // Return successful response
    const response: FileLibraryResponse = {
      success: true,
      chapters
    };

    console.log(`File library retrieved: ${chapters.length} chapters, ${chapters.reduce((total, chapter) => total + chapter.files.length, 0)} total files`);
    res.json(response);

  } catch (error) {
    // Pass error to error handler middleware
    next(error);
  }
});

/**
 * GET /api/files/:fileId
 * Get a specific file by ID
 */
router.get('/files/:fileId', verifyGoogleToken, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { fileId } = req.params;

    console.log(`Retrieving file: ${fileId}`);

    // Get file by ID
    const file = await FileLibraryService.getFileById(fileId);

    if (!file) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'FILE_NOT_FOUND',
          message: 'File not found'
        }
      });
    }

    // Return successful response
    const response: FileResponse = {
      success: true,
      file
    };

    console.log(`File retrieved: ${file.originalName} from chapter: ${file.chapter}`);
    res.json(response);

  } catch (error) {
    // Pass error to error handler middleware
    next(error);
  }
});

/**
 * DELETE /api/files/:fileId
 * Delete a file from the library
 */
router.delete('/files/:fileId', verifyGoogleToken, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { fileId } = req.params;

    console.log(`Deleting file: ${fileId}`);

    // Delete file from library
    const deleted = await FileLibraryService.deleteFile(fileId);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'FILE_NOT_FOUND',
          message: 'File not found'
        }
      });
    }

    // Return successful response
    const response: FileOperationResponse = {
      success: true,
      message: 'File deleted successfully'
    };

    console.log(`File deleted successfully: ${fileId}`);
    res.json(response);

  } catch (error) {
    // Pass error to error handler middleware
    next(error);
  }
});

/**
 * PUT /api/files/chapters/:oldName
 * Rename a chapter
 */
router.put('/files/chapters/:oldName', verifyGoogleToken, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { oldName } = req.params;
    const { newName }: ChapterRenameRequest = req.body;

    // Validate new name parameter
    if (!newName || typeof newName !== 'string' || newName.trim().length === 0) {
      throw ErrorService.createError('MISSING_CHAPTER_NAME', 'New chapter name is required');
    }

    console.log(`Renaming chapter: ${oldName} to ${newName}`);

    // Rename chapter
    const renamed = await FileLibraryService.renameChapter(oldName, newName);

    if (!renamed) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'CHAPTER_NOT_FOUND',
          message: 'Chapter not found'
        }
      });
    }

    // Return successful response
    const response: FileOperationResponse = {
      success: true,
      message: 'Chapter renamed successfully'
    };

    console.log(`Chapter renamed successfully: ${oldName} -> ${newName}`);
    res.json(response);

  } catch (error) {
    // Handle specific chapter rename errors
    if (error instanceof Error && error.message === 'Chapter with the new name already exists') {
      return res.status(409).json({
        success: false,
        error: {
          code: 'CHAPTER_NAME_EXISTS',
          message: 'A chapter with the new name already exists'
        }
      });
    }

    // Pass error to error handler middleware
    next(error);
  }
});

export default router;