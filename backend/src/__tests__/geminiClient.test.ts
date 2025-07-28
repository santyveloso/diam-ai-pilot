import { GeminiClient } from '../services/geminiClient';
import { QuestionContext } from '../types';

// Mock the Google Generative AI SDK
const mockGenerateContent = jest.fn();
const mockGetGenerativeModel = jest.fn(() => ({
  generateContent: mockGenerateContent
}));

jest.mock('@google/generative-ai', () => ({
  GoogleGenerativeAI: jest.fn(() => ({
    getGenerativeModel: mockGetGenerativeModel
  }))
}));

const { GoogleGenerativeAI } = require('@google/generative-ai');

describe('GeminiClient', () => {
  let geminiClient: GeminiClient;
  const mockApiKey = 'test-api-key';

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.GEMINI_API_KEY = mockApiKey;
    geminiClient = new GeminiClient();
  });

  afterEach(() => {
    delete process.env.GEMINI_API_KEY;
  });

  describe('Constructor', () => {
    it('should initialize with API key from environment', () => {
      expect(GoogleGenerativeAI).toHaveBeenCalledWith(mockApiKey);
    });

    it('should initialize with provided API key', () => {
      const customKey = 'custom-api-key';
      new GeminiClient(customKey);
      expect(GoogleGenerativeAI).toHaveBeenCalledWith(customKey);
    });

    it('should throw error when no API key is provided', () => {
      delete process.env.GEMINI_API_KEY;
      expect(() => new GeminiClient()).toThrow('Gemini API key is required');
    });
  });

  describe('createQuestionContext', () => {
    it('should create context with Portuguese language detection', () => {
      const question = 'O que é programação orientada a objetos?';
      const documentContent = 'Test document content';

      const context = geminiClient.createQuestionContext(question, documentContent);

      expect(context).toEqual({
        question,
        documentContent,
        timestamp: expect.any(Date),
        language: 'pt'
      });
    });

    it('should create context with English language detection', () => {
      const question = 'What is object-oriented programming?';
      const documentContent = 'Test document content';

      const context = geminiClient.createQuestionContext(question, documentContent);

      expect(context).toEqual({
        question,
        documentContent,
        timestamp: expect.any(Date),
        language: 'en'
      });
    });

    it('should trim whitespace from inputs', () => {
      const question = '  What is OOP?  ';
      const documentContent = '  Test content  ';

      const context = geminiClient.createQuestionContext(question, documentContent);

      expect(context.question).toBe('What is OOP?');
      expect(context.documentContent).toBe('Test content');
    });
  });

  describe('generateResponse', () => {
    const mockContext: QuestionContext = {
      question: 'What is object-oriented programming?',
      documentContent: 'OOP is a programming paradigm based on objects.',
      timestamp: new Date(),
      language: 'en'
    };

    it('should generate successful response', async () => {
      const mockResponseText = 'Object-oriented programming is a paradigm based on objects.';
      mockGenerateContent.mockResolvedValue({
        response: {
          text: () => mockResponseText
        }
      });

      const result = await geminiClient.generateResponse(mockContext);

      expect(result).toEqual({
        answer: mockResponseText,
        processingTime: expect.any(Number),
        confidence: expect.any(Number),
        sources: ['Document content provided by user']
      });

      expect(mockGenerateContent).toHaveBeenCalledWith(expect.stringContaining('STUDENT QUESTION:'));
      expect(mockGenerateContent).toHaveBeenCalledWith(expect.stringContaining(mockContext.question));
    });

    it('should generate Portuguese response for Portuguese question', async () => {
      const ptContext: QuestionContext = {
        question: 'O que é programação orientada a objetos?',
        documentContent: 'POO é um paradigma baseado em objetos.',
        timestamp: new Date(),
        language: 'pt'
      };

      const mockResponseText = 'Programação orientada a objetos é um paradigma baseado em objetos.';
      mockGenerateContent.mockResolvedValue({
        response: {
          text: () => mockResponseText
        }
      });

      const result = await geminiClient.generateResponse(ptContext);

      expect(result.answer).toBe(mockResponseText);
      expect(mockGenerateContent).toHaveBeenCalledWith(expect.stringContaining('PERGUNTA DO ESTUDANTE:'));
    });

    it('should throw error for empty question', async () => {
      const invalidContext = { ...mockContext, question: '   ' };

      await expect(geminiClient.generateResponse(invalidContext)).rejects.toThrow('Question cannot be empty');
    });

    it('should throw error for empty document content', async () => {
      const invalidContext = { ...mockContext, documentContent: '   ' };

      await expect(geminiClient.generateResponse(invalidContext)).rejects.toThrow('Document content cannot be empty');
    });

    it('should handle API key errors', async () => {
      mockGenerateContent.mockRejectedValue(new Error('API_KEY invalid'));

      await expect(geminiClient.generateResponse(mockContext)).rejects.toThrow('Invalid or missing API key');
    });

    it('should handle rate limit errors', async () => {
      mockGenerateContent.mockRejectedValue(new Error('RATE_LIMIT exceeded'));

      await expect(geminiClient.generateResponse(mockContext)).rejects.toThrow('API rate limit exceeded');
    });

    it('should handle quota errors', async () => {
      mockGenerateContent.mockRejectedValue(new Error('QUOTA exceeded'));

      await expect(geminiClient.generateResponse(mockContext)).rejects.toThrow('API quota exceeded');
    });

    it('should handle empty AI response', async () => {
      mockGenerateContent.mockResolvedValue({
        response: {
          text: () => ''
        }
      });

      await expect(geminiClient.generateResponse(mockContext)).rejects.toThrow('Empty response from AI model');
    });

    it('should handle generic errors', async () => {
      mockGenerateContent.mockRejectedValue(new Error('Network error'));

      await expect(geminiClient.generateResponse(mockContext)).rejects.toThrow('AI generation failed: Network error');
    });

    it('should handle unknown errors', async () => {
      mockGenerateContent.mockRejectedValue('Unknown error');

      await expect(geminiClient.generateResponse(mockContext)).rejects.toThrow('AI generation failed: Unknown error');
    });
  });

  describe('healthCheck', () => {
    it('should return true for successful health check', async () => {
      mockGenerateContent.mockResolvedValue({
        response: {
          text: () => 'OK'
        }
      });

      const result = await geminiClient.healthCheck();

      expect(result).toBe(true);
      expect(mockGenerateContent).toHaveBeenCalledWith('Say "OK" if you can respond.');
    });

    it('should return false for failed health check', async () => {
      mockGenerateContent.mockRejectedValue(new Error('API error'));
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const result = await geminiClient.healthCheck();

      expect(result).toBe(false);
      expect(consoleSpy).toHaveBeenCalledWith('Gemini API health check failed:', expect.any(Error));

      consoleSpy.mockRestore();
    });

    it('should return false for empty response', async () => {
      mockGenerateContent.mockResolvedValue({
        response: {
          text: () => ''
        }
      });

      const result = await geminiClient.healthCheck();

      expect(result).toBe(false);
    });
  });

  describe('Language Detection', () => {
    it('should detect Portuguese correctly', () => {
      const portugueseQuestions = [
        'O que é programação?',
        'Como funciona o algoritmo?',
        'Qual é a diferença entre as duas abordagens?',
        'Por que isso acontece?',
        'Explique como fazer isso'
      ];

      portugueseQuestions.forEach(question => {
        const context = geminiClient.createQuestionContext(question, 'test content');
        expect(context.language).toBe('pt');
      });
    });

    it('should detect English correctly', () => {
      const englishQuestions = [
        'What is programming?',
        'How does the algorithm work?',
        'What is the difference between the two approaches?',
        'Why does this happen?',
        'Explain how to do this'
      ];

      englishQuestions.forEach(question => {
        const context = geminiClient.createQuestionContext(question, 'test content');
        expect(context.language).toBe('en');
      });
    });
  });

  describe('Confidence Calculation', () => {
    it('should calculate higher confidence for detailed responses with positive indicators', async () => {
      const detailedResponse = 'Based on the document provided, object-oriented programming is a comprehensive paradigm that organizes code around objects rather than functions. The document explains that this approach provides better code organization, reusability, and maintainability. As stated in the material, OOP includes concepts like encapsulation, inheritance, and polymorphism.';
      
      mockGenerateContent.mockResolvedValue({
        response: {
          text: () => detailedResponse
        }
      });

      const mockContext: QuestionContext = {
        question: 'What is OOP?',
        documentContent: 'OOP is a programming paradigm.',
        timestamp: new Date(),
        language: 'en'
      };

      const result = await geminiClient.generateResponse(mockContext);

      expect(result.confidence).toBeGreaterThan(0.7);
    });

    it('should calculate lower confidence for uncertain responses', async () => {
      const uncertainResponse = 'This information is not available in the document provided. I cannot answer this question based on the given material.';
      
      mockGenerateContent.mockResolvedValue({
        response: {
          text: () => uncertainResponse
        }
      });

      const mockContext: QuestionContext = {
        question: 'What is quantum computing?',
        documentContent: 'OOP is a programming paradigm.',
        timestamp: new Date(),
        language: 'en'
      };

      const result = await geminiClient.generateResponse(mockContext);

      expect(result.confidence).toBeLessThan(0.5);
    });
  });
});