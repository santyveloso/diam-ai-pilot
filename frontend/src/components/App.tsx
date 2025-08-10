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
    selectedChapter: string;
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
    selectedChapter: 'general',
  });

  const chapters = [
    { id: 'general', label: 'General' },
    { id: 'ch1', label: 'Chapter 1 - HTML' },
    { id: 'ch2', label: 'Chapter 2 - CSS & JS' },
    { id: 'project', label: 'Project' },
    { id: 'assessments', label: 'Assessments' },
  ];

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
        {/* Top header bar, Moodle-inspired */}
        <header className="app-header">
          <h1>DIAM AI Pilot</h1>
          <p>Educational AI for ISCTE students</p>
          {/* badges removed per design request */}
          <div className="header-meta">
            <span className="course-meta">2024/25 • ISCTE</span>
            <div className="header-actions">
              <input
                type="search"
                className="header-search"
                placeholder="Search materials or questions"
                aria-label="Search"
              />
              {/* Hidden file input controlled by header button */}
              <input
                id="header-file-input"
                type="file"
                accept=".pdf,application/pdf"
                style={{ display: 'none' }}
                onChange={(e) => {
                  const files = e.target.files;
                  if (!files || files.length === 0) return;
                  const file = files[0];
                  // Validate like FileUpload
                  const isPdfType = file.type === 'application/pdf';
                  const isPdfExt = file.name.toLowerCase().endsWith('.pdf');
                  const underLimit = file.size <= 10 * 1024 * 1024;
                  if (!isPdfType || !isPdfExt) {
                    const err = ErrorService.processError(
                      { message: 'Please select a PDF file only.' },
                      state.language
                    );
                    setState((prev) => ({ ...prev, error: err }));
                    return;
                  }
                  if (!underLimit) {
                    const err = ErrorService.processError(
                      { message: 'File size must be less than 10MB.' },
                      state.language
                    );
                    setState((prev) => ({ ...prev, error: err }));
                    return;
                  }
                  handleFileSelect(file);
                }}
              />
              <button
                type="button"
                className="header-upload-cta"
                onClick={() => (document.getElementById('header-file-input') as HTMLInputElement)?.click()}
              >
                Upload file (test)
              </button>
            </div>
          </div>
        </header>

        <main className="app-main moodle-body">
          {/* Left rail - simplified navigation for familiarity */}
          <aside className="moodle-left" aria-label="Course navigation">
            <div className="nav-section">
              <div className="nav-title">Chapters</div>
              <ul className="nav-list">
                {chapters.map((c) => (
                  <li
                    key={c.id}
                    className={`nav-item ${state.selectedChapter === c.id ? 'active' : ''}`}
                    onClick={() => setState((prev) => ({ ...prev, selectedChapter: c.id }))}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') setState((prev) => ({ ...prev, selectedChapter: c.id }));
                    }}
                    aria-current={state.selectedChapter === c.id ? 'page' : undefined}
                  >
                    {c.label}
                  </li>
                ))}
              </ul>
            </div>

            <div className="nav-section">
              <div className="nav-title">My questions</div>
              <ul className="nav-list compact">
                <li className="nav-chip">Doubt: div vs section</li>
                <li className="nav-chip">Project scope</li>
                <li className="nav-chip">Final grade</li>
              </ul>
            </div>
          </aside>

          {/* Center column - main interaction */}
          <main className="moodle-center">
            <div className="chapter-header">
              <h2 className="chapter-title">
                {chapters.find((c) => c.id === state.selectedChapter)?.label}
              </h2>
            </div>
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

            {/* Keep FileUpload in DOM for tests, but visually hidden as header handles uploads */}
            <section id="upload" className="upload-section compact hidden-upload" aria-hidden="true">
              <FileUpload
                onFileSelect={handleFileSelect}
                selectedFile={state.selectedFile}
                isUploading={state.isUploading}
              />
            </section>

            <section className="question-section">
              <QuestionInput
                onSubmit={handleQuestionSubmit}
                disabled={!state.selectedFile}
                isLoading={state.isLoading}
              />
            </section>

            <section className="response-section">
              <ResponseDisplay
                response={state.response}
                isLoading={state.isLoading}
                error={state.error ? ErrorService.getUserMessage(state.error, state.language) : null}
              />
            </section>
          </main>

          {/* Right rail - concise course info */}
          <aside className="moodle-right">
            <div className="info-card">
              <div className="info-title">Chapter progress</div>
              <div className="info-value">50%</div>
            </div>
            <div className="info-card">
              <div className="info-title">Upcoming</div>
              <ul className="info-list">
                <li>Project — Nov 21</li>
                <li>Exam — Dec 15</li>
              </ul>
            </div>
            <div className="info-card">
              <div className="info-title">Question summary</div>
              <div className="info-note">5 open • 2 answered by teacher</div>
            </div>
          </aside>
        </main>

        <footer className="app-footer">
          <p>© 2024 ISCTE - DIAM Course AI Assistant</p>
        </footer>
      </div>
    </div>
  );
};

export default App;