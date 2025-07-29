import React, { useState, useCallback } from 'react';
import FileUpload from './FileUpload';
import QuestionInput from './QuestionInput';
import ResponseDisplay from './ResponseDisplay';
import { askQuestion } from '../services/api';
import { ErrorService } from '../services/errorService';
import { EnhancedError } from '../types';
import './App.css';

// Application state interface
interface AppState {
  selectedFile: File | null;
  question: string;
  response: string | null;
  isLoading: boolean;
  error: EnhancedError | null;
  isUploading: boolean;
  language: 'en' | 'pt';
}

const App: React.FC = () => {
  // Detect browser language
  const detectLanguage = (): 'en' | 'pt' => {
    const browserLang = navigator.language.toLowerCase();
    return browserLang.includes('pt') ? 'pt' : 'en';
  };

  // Global application state
  const [state, setState] = useState<AppState>({
    selectedFile: null,
    question: '',
    response: null,
    isLoading: false,
    error: null,
    isUploading: false,
    language: detectLanguage(),
  });

  // File selection handler
  const handleFileSelect = useCallback((file: File | null) => {
    setState(prev => ({
      ...prev,
      selectedFile: file,
      error: null,
      response: null, // Clear previous response when new file is selected
      question: file ? prev.question : '', // Clear question when file is removed
      isUploading: false, // Reset upload state
    }));
  }, []);

  // Question submission handler
  const handleQuestionSubmit = useCallback(async (question: string) => {
    if (!state.selectedFile) {
      const error = ErrorService.processError(
        { code: 'MISSING_FILE', message: 'No file selected' },
        state.language
      );
      setState(prev => ({
        ...prev,
        error,
      }));
      return;
    }

    setState(prev => ({
      ...prev,
      isLoading: true,
      error: null,
      question,
    }));

    try {
      const response = await askQuestion(question, state.selectedFile);
      
      if (response.success) {
        setState(prev => ({
          ...prev,
          isLoading: false,
          response: response.response,
          error: null,
        }));
      } else {
        const error = ErrorService.processError(
          { message: response.error || 'API response error' },
          state.language
        );
        setState(prev => ({
          ...prev,
          isLoading: false,
          response: null,
          error,
        }));
      }
    } catch (error: any) {
      console.error('API Error:', error);
      
      const enhancedError = ErrorService.processError(error, state.language);
      ErrorService.logError(enhancedError, { 
        selectedFile: state.selectedFile?.name,
        question: question.substring(0, 100) // Log first 100 chars only
      });
      
      setState(prev => ({
        ...prev,
        isLoading: false,
        response: null,
        error: enhancedError,
      }));
    }
  }, [state.selectedFile, state.language]);

  // Clear error handler
  const handleClearError = useCallback(() => {
    setState(prev => ({
      ...prev,
      error: null,
    }));
  }, []);



  return (
    <div className="app">
      <div className="app-container">
        <header className="app-header">
          <h1>DIAM AI Pilot</h1>
          <p>Educational AI for ISCTE students</p>
        </header>

        <main className="app-main">
          {state.error && (
            <div className={`error-banner error-${state.error.severity}`}>
              <div className="error-content">
                <span className="error-message">
                  {ErrorService.getUserMessage(state.error, state.language)}
                </span>
                {ErrorService.isRetryable(state.error) && (
                  <span className="error-retry-hint">
                    {state.language === 'pt' ? 'Você pode tentar novamente.' : 'You can try again.'}
                  </span>
                )}
              </div>
              <button 
                onClick={handleClearError}
                className="error-close"
                aria-label={state.language === 'pt' ? 'Fechar mensagem de erro' : 'Close error message'}
              >
                ×
              </button>
            </div>
          )}

          <div className="upload-section">
            <FileUpload
              onFileSelect={handleFileSelect}
              selectedFile={state.selectedFile}
              isUploading={state.isUploading}
            />
          </div>

          <div className="question-section">
            <QuestionInput
              onSubmit={handleQuestionSubmit}
              disabled={!state.selectedFile}
              isLoading={state.isLoading}
            />
          </div>

          <div className="response-section">
            <ResponseDisplay
              response={state.response}
              isLoading={state.isLoading}
              error={state.error ? ErrorService.getUserMessage(state.error, state.language) : null}
            />
          </div>
        </main>

        <footer className="app-footer">
          <p>© 2024 ISCTE - DIAM Course AI Assistant</p>
        </footer>
      </div>
    </div>
  );
};

export default App;