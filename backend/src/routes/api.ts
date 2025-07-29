import { Router, Request, Response, NextFunction } from 'express';
import { uploadMiddleware } from '../middleware/upload';
import { PDFProcessor } from '../services/pdfProcessor';
import { GeminiClient } from '../services/geminiClient';
import { ErrorService } from '../services/errorService';
import { AskRequest, AskResponse } from '../types';

const router = Router();

// Initialize Gemini client lazily to avoid issues in tests
let geminiClient: GeminiClient;

/**
 * POST /api/ask
 * Main endpoint for processing questions with PDF context
 */
router.post('/ask', uploadMiddleware.single('file'), async (req: Request, res: Response, next: NextFunction) => {
  let uploadedFilePath: string | undefined;

  try {
    // Validate request inputs
    const { question }: AskRequest = req.body;
    const file = req.file;

    // Use error service for validation
    ErrorService.validateQuestion(question);
    ErrorService.validateFileUpload(file);

    uploadedFilePath = file!.path;

    // Process the PDF file
    console.log(`Processing PDF: ${file!.originalname} (${file!.size} bytes)`);
    const processedFile = await PDFProcessor.processFile(file!);

    // Validate extracted text content
    PDFProcessor.validateTextContent(processedFile.textContent);

    // Initialize Gemini client if not already done
    if (!geminiClient) {
      geminiClient = new GeminiClient();
    }

    // Create question context
    const questionContext = geminiClient.createQuestionContext(
      question,
      processedFile.textContent
    );

    console.log(`Generating AI response for question in ${questionContext.language}`);

    // Generate AI response
    const aiResponse = await geminiClient.generateResponse(questionContext);

    // Clean up uploaded file
    await PDFProcessor.cleanupFile(uploadedFilePath);

    // Return successful response
    const response: AskResponse = {
      success: true,
      response: aiResponse.answer
    };

    console.log(`Response generated successfully (${aiResponse.processingTime}ms)`);
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

export default router;