import { GoogleGenerativeAI } from "@google/generative-ai";
import { AIResponse, QuestionContext } from "../types";
import { ErrorService } from "./errorService";

export class GeminiClient {
  private genAI: GoogleGenerativeAI;
  private model: any; // TODO: Type this properly when @google/generative-ai exports proper types

  constructor(apiKey?: string) {
    const key = apiKey || process.env.GEMINI_API_KEY;
    if (!key) {
      throw ErrorService.createError(
        "API_CONFIGURATION_ERROR",
        "Gemini API key is required. Set GEMINI_API_KEY environment variable."
      );
    }

    this.genAI = new GoogleGenerativeAI(key);
    this.model = this.genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
    });
  }

  /**
   * Detects the language of the question (Portuguese or English)
   */
  private detectLanguage(question: string): "pt" | "en" {
    // Simple language detection based on common Portuguese words
    const portugueseWords = [
      "o",
      "a",
      "os",
      "as",
      "um",
      "uma",
      "de",
      "do",
      "da",
      "dos",
      "das",
      "em",
      "no",
      "na",
      "nos",
      "nas",
      "para",
      "por",
      "com",
      "sem",
      "sobre",
      "que",
      "qual",
      "quando",
      "onde",
      "como",
      "por que",
      "porque",
      "é",
      "são",
      "está",
      "estão",
      "tem",
      "têm",
      "foi",
      "foram",
      "ser",
      "estar",
      "ter",
      "fazer",
      "dizer",
      "ver",
      "dar",
      "saber",
      "explicar",
      "explique",
      "como",
      "o que",
      "qual é",
    ];

    const questionLower = question.toLowerCase();
    const portugueseMatches = portugueseWords.filter(
      (word) =>
        questionLower.includes(` ${word} `) ||
        questionLower.startsWith(`${word} `) ||
        questionLower.endsWith(` ${word}`)
    ).length;

    // If we find 2 or more Portuguese words, assume it's Portuguese
    return portugueseMatches >= 2 ? "pt" : "en";
  }

  /**
   * Constructs the prompt for the AI model
   */
  private constructPrompt(context: QuestionContext): string {
    const { question, documentContent, language } = context;

    const prompts = {
      pt: `Você é um assistente educacional para estudantes universitários.

CONTEXTO DO DOCUMENTO:
${documentContent}

PERGUNTA DO ESTUDANTE:
${question}

INSTRUÇÕES:
- Responde em português de portugal
- Baseia a resposta no conteúdo do documento fornecido
- Se a informação não estiver no documento, diz que não está disponível
- Sê claro e conciso
- Usa 1-3 parágrafos no máximo
- Foca apenas no que foi perguntado

RESPOSTA:`,

      en: `You are an educational assistant for university students.

DOCUMENT CONTEXT:
${documentContent}

STUDENT QUESTION:
${question}

INSTRUCTIONS:
- Answer in English
- Base your response on the provided document content
- If information is not in the document, state it's not available
- Be clear and concise
- Use 1-3 paragraphs maximum
- Focus only on what was asked

RESPONSE:`,
    };

    return prompts[language];
  }

  /**
   * Generates AI response for a question with document context
   */
  async generateResponse(context: QuestionContext): Promise<AIResponse> {
    const startTime = Date.now();

    try {
      // Validate input
      if (!context.question.trim()) {
        throw ErrorService.createError(
          "MISSING_QUESTION",
          "Question cannot be empty"
        );
      }

      if (!context.documentContent.trim()) {
        throw ErrorService.createError(
          "INVALID_CONTENT",
          "Document content cannot be empty"
        );
      }

      // Construct the prompt
      const prompt = this.constructPrompt(context);

      // Generate response
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      if (!text || text.trim().length === 0) {
        throw ErrorService.createError(
          "AI_GENERATION_ERROR",
          "Empty response from AI model"
        );
      }

      const processingTime = Date.now() - startTime;

      return {
        answer: text.trim(),
        processingTime,
        confidence: this.calculateConfidence(text),
        sources: ["Document content provided by user"],
      };
    } catch (error) {
      const processingTime = Date.now() - startTime;

      // If it's already a service error, re-throw it
      if (ErrorService.isServiceError(error)) {
        throw error;
      }

      if (error instanceof Error) {
        // Handle specific API errors
        if (
          error.message.includes("API_KEY") ||
          error.message.includes("Invalid API key")
        ) {
          throw ErrorService.createError(
            "API_CONFIGURATION_ERROR",
            "Invalid or missing API key"
          );
        }
        if (
          error.message.includes("RATE_LIMIT") ||
          error.message.includes("rate limit")
        ) {
          throw ErrorService.createError(
            "RATE_LIMIT_EXCEEDED",
            "API rate limit exceeded. Please try again later."
          );
        }
        if (
          error.message.includes("QUOTA") ||
          error.message.includes("quota")
        ) {
          throw ErrorService.createError(
            "RATE_LIMIT_EXCEEDED",
            "API quota exceeded. Please try again later."
          );
        }
        if (
          error.message.includes("timeout") ||
          error.message.includes("TIMEOUT")
        ) {
          throw ErrorService.createError(
            "AI_GENERATION_ERROR",
            "AI request timeout. Please try again."
          );
        }

        throw ErrorService.createError(
          "AI_GENERATION_ERROR",
          `AI generation failed: ${error.message}`
        );
      }

      throw ErrorService.createError(
        "AI_GENERATION_ERROR",
        `AI generation failed: Unknown error (Processing time: ${processingTime}ms)`
      );
    }
  }

  /**
   * Simple confidence calculation based on response characteristics
   */
  private calculateConfidence(response: string): number {
    let confidence = 0.5; // Base confidence

    // Increase confidence for longer, more detailed responses
    if (response.length > 200) confidence += 0.1;
    if (response.length > 500) confidence += 0.1;

    // Increase confidence if response contains specific indicators
    const positiveIndicators = [
      "based on the document",
      "according to the material",
      "as stated in",
      "the document explains",
      "conforme o documento",
      "de acordo com o material",
      "como explicado no",
      "o documento menciona",
    ];

    const hasPositiveIndicators = positiveIndicators.some((indicator) =>
      response.toLowerCase().includes(indicator.toLowerCase())
    );

    if (hasPositiveIndicators) confidence += 0.2;

    // Decrease confidence if response indicates uncertainty
    const uncertaintyIndicators = [
      "not available in the document",
      "cannot be answered",
      "não está disponível no documento",
      "não pode ser respondida",
    ];

    const hasUncertaintyIndicators = uncertaintyIndicators.some((indicator) =>
      response.toLowerCase().includes(indicator.toLowerCase())
    );

    if (hasUncertaintyIndicators) confidence -= 0.3;

    // Ensure confidence is between 0 and 1
    return Math.max(0, Math.min(1, confidence));
  }

  /**
   * Creates a question context object
   */
  createQuestionContext(
    question: string,
    documentContent: string
  ): QuestionContext {
    return {
      question: question.trim(),
      documentContent: documentContent.trim(),
      timestamp: new Date(),
      language: this.detectLanguage(question),
    };
  }

  /**
   * Health check for the Gemini API
   */
  async healthCheck(): Promise<boolean> {
    try {
      const result = await this.model.generateContent(
        'Say "OK" if you can respond.'
      );
      const response = await result.response;
      const text = response.text();

      return text.trim().length > 0;
    } catch (error) {
      console.error("Gemini API health check failed:", error);
      return false;
    }
  }
}
