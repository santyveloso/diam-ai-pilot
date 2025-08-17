import React, { useState, useCallback, useRef, useEffect } from 'react';
import { QuestionInputProps } from '../types';

interface QuestionInputPropsWithFile extends QuestionInputProps {
  selectedFileName?: string;
  selectedFileChapter?: string;
}

const QuestionInput: React.FC<QuestionInputPropsWithFile> = ({
  onSubmit,
  disabled,
  isLoading,
  selectedFileName,
  selectedFileChapter
}) => {
  const [question, setQuestion] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Character limits
  const MIN_QUESTION_LENGTH = 10;
  const MAX_QUESTION_LENGTH = 1000;

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${textarea.scrollHeight}px`;
    }
  }, [question]);

  const validateQuestion = useCallback((questionText: string): string | null => {
    const trimmedQuestion = questionText.trim();

    if (trimmedQuestion.length === 0) {
      return 'Please enter a question.';
    }

    if (trimmedQuestion.length < MIN_QUESTION_LENGTH) {
      return `Question must be at least ${MIN_QUESTION_LENGTH} characters long.`;
    }

    if (trimmedQuestion.length > MAX_QUESTION_LENGTH) {
      return `Question must be less than ${MAX_QUESTION_LENGTH} characters.`;
    }

    return null;
  }, []);

  const handleQuestionChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newQuestion = e.target.value;
    setQuestion(newQuestion);
    
    // Clear validation error when user starts typing
    if (validationError) {
      setValidationError(null);
    }
  }, [validationError]);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    
    if (disabled || isLoading) {
      return;
    }

    const error = validateQuestion(question);
    if (error) {
      setValidationError(error);
      return;
    }

    setValidationError(null);
    onSubmit(question.trim());
  }, [question, disabled, isLoading, validateQuestion, onSubmit]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Submit on Ctrl+Enter or Cmd+Enter
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSubmit(e as any);
    }
  }, [handleSubmit]);

  const handleClear = useCallback(() => {
    setQuestion('');
    setValidationError(null);
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  }, []);

  const remainingChars = MAX_QUESTION_LENGTH - question.length;
  const isNearLimit = remainingChars < 100;
  const isOverLimit = remainingChars < 0;

  return (
    <div className="question-input">
      {selectedFileName && (
        <div className="selected-file-info">
          <div className="file-name">{selectedFileName}</div>
          {selectedFileChapter && (
            <div className="file-chapter">Chapter: {selectedFileChapter}</div>
          )}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="question-form">
        <div className="question-field">
          <label htmlFor="question-textarea" className="question-label">
            Ask a question about your PDF
          </label>
          
          <div className="textarea-container">
            <textarea
              ref={textareaRef}
              id="question-textarea"
              className={`question-textarea ${validationError ? 'error' : ''} ${
                disabled ? 'disabled' : ''
              }`}
              value={question}
              onChange={handleQuestionChange}
              onKeyDown={handleKeyDown}
              placeholder={
                disabled
                  ? 'Please select a file from the library or upload a new one...'
                  : 'Type your question here... (Ctrl+Enter to submit)'
              }
              disabled={disabled || isLoading}
              rows={3}
              maxLength={MAX_QUESTION_LENGTH + 50} // Allow slight overflow for better UX
              aria-describedby={
                validationError ? 'question-error' : 'question-hint'
              }
              aria-invalid={!!validationError}
            />
            
            {question && !disabled && (
              <button
                type="button"
                className="clear-question-button"
                onClick={handleClear}
                aria-label="Clear question"
                disabled={isLoading}
              >
                ×
              </button>
            )}
          </div>

          <div className="question-meta">
            <div className="character-count">
              <span
                className={`char-count ${isNearLimit ? 'warning' : ''} ${
                  isOverLimit ? 'error' : ''
                }`}
              >
                {question.length}/{MAX_QUESTION_LENGTH}
              </span>
            </div>
            
            {!disabled && (
              <div className="question-hint" id="question-hint">
                Press Ctrl+Enter to submit quickly
              </div>
            )}
          </div>
        </div>

        {validationError && (
          <div className="validation-error" id="question-error" role="alert">
            {validationError}
          </div>
        )}

        <div className="question-actions">
          <button
            type="submit"
            className={`submit-button ${isLoading ? 'loading' : ''}`}
            disabled={disabled || isLoading || isOverLimit}
            aria-describedby="submit-button-hint"
          >
            {isLoading ? (
              <>
                <span className="loading-spinner"></span>
                Processing...
              </>
            ) : (
              'Ask Question'
            )}
          </button>
          
          {disabled && (
            <div className="submit-hint disabled" id="submit-button-hint">
              Select a file from the library or upload a new one to ask questions
            </div>
          )}
          
          {!disabled && !isLoading && (
            <div className="submit-hint" id="submit-button-hint">
              Make sure your question is clear and specific
            </div>
          )}
        </div>
      </form>
    </div>
  );
};

export default QuestionInput;