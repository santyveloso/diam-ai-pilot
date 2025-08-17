import React, { useState, useCallback, useEffect } from "react";
import { Link } from "react-router-dom";
import FileUpload from "./FileUpload";
import QuestionInput from "./QuestionInput";
import ResponseDisplay from "./ResponseDisplay";
import FileLibraryPanel from "./FileLibraryPanel";
import FileUploadModal from "./FileUploadModal";
import { askQuestion, askQuestionWithFileId } from "../services/api";
import { getFileLibrary } from "../services/api";
import { ErrorService } from "../services/errorService";
import { EnhancedError, ChapterFiles } from "../types";
import { useAuth } from "../contexts/AuthContext";
import "../styles/index.css";

// Application state interface
interface AppState {
  selectedFile: File | null;
  selectedFileId: string | null;
  question: string;
  response: string | null;
  isLoading: boolean;
  error: EnhancedError | null;
  isUploading: boolean;
  language: "en" | "pt";
  selectedChapter: string;
  isProfileOpen: boolean;
  showQuickAsk: boolean;
  quickAskPreset: "hints" | "steps" | "full";
  quickAskText: string;
  // File library state
  fileLibrary: {
    chapters: ChapterFiles[];
    isLoading: boolean;
    error: string | null;
  };
  // Upload modal state
  uploadModal: {
    isOpen: boolean;
    isUploading: boolean;
  };
}

const App: React.FC = () => {
  const { user, logout } = useAuth();

  // Detect browser language
  const detectLanguage = (): "en" | "pt" => {
    const browserLang = navigator.language.toLowerCase();
    return browserLang.includes("pt") ? "pt" : "en";
  };

  // Global application state
  const [state, setState] = useState<AppState>({
    selectedFile: null,
    selectedFileId: null,
    question: "",
    response: null,
    isLoading: false,
    error: null,
    isUploading: false,
    language: detectLanguage(),
    selectedChapter: "general",
    isProfileOpen: false,
    showQuickAsk: false,
    quickAskPreset: "hints",
    quickAskText: "",
    // File library state
    fileLibrary: {
      chapters: [],
      isLoading: false,
      error: null,
    },
    // Upload modal state
    uploadModal: {
      isOpen: false,
      isUploading: false,
    },
  });

  // Load file library on component mount
  useEffect(() => {
    const loadFileLibrary = async () => {
      setState(prev => ({
        ...prev,
        fileLibrary: {
          ...prev.fileLibrary,
          isLoading: true,
          error: null
        }
      }));

      try {
        const response = await getFileLibrary();
        
        if (response.success) {
          setState(prev => ({
            ...prev,
            fileLibrary: {
              chapters: response.chapters,
              isLoading: false,
              error: null
            }
          }));
        } else {
          setState(prev => ({
            ...prev,
            fileLibrary: {
              ...prev.fileLibrary,
              isLoading: false,
              error: response.error || 'Failed to load file library'
            }
          }));
        }
      } catch (error: any) {
        console.error('Error loading file library:', error);
        const errorMessage = ErrorService.processError(error, 'pt');
        setState(prev => ({
          ...prev,
          fileLibrary: {
            ...prev.fileLibrary,
            isLoading: false,
            error: ErrorService.getUserMessage(errorMessage, 'pt')
          }
        }));
      }
    };

    loadFileLibrary();
  }, []);

  // File selection handler (legacy)
  const handleFileSelect = useCallback((file: File | null) => {
    setState((prev) => ({
      ...prev,
      selectedFile: file,
      selectedFileId: null, // Clear file ID when using direct file
      error: null,
      response: null, // Clear previous response when new file is selected
      question: file ? prev.question : "", // Clear question when file is removed
      isUploading: false, // Reset upload state
    }));
  }, []);

  // File library selection handler
  const handleFileLibrarySelect = useCallback((fileId: string | null) => {
    setState((prev) => ({
      ...prev,
      selectedFileId: fileId,
      selectedFile: null, // Clear direct file when using library
      error: null,
      response: null, // Clear previous response when new file is selected
    }));
  }, []);

  // Question submission handler
  const handleQuestionSubmit = useCallback(
    async (question: string) => {
      // Check if we have either a file or fileId
      if (!state.selectedFile && !state.selectedFileId) {
        const error = ErrorService.processError(
          { code: "MISSING_FILE", message: "No file selected" },
          state.language
        );
        setState((prev) => ({
          ...prev,
          error,
        }));
        return;
      }

      setState((prev) => ({
        ...prev,
        isLoading: true,
        error: null,
        question,
      }));

      try {
        let response: any = null;
        
        // Use file library if fileId is available, otherwise use direct file
        if (state.selectedFileId) {
          response = await askQuestionWithFileId(question, state.selectedFileId);
        } else if (state.selectedFile) {
          response = await askQuestion(question, state.selectedFile);
        }

        if (response && response.success) {
          setState((prev) => ({
            ...prev,
            isLoading: false,
            response: response.response,
            error: null,
          }));
        } else {
          const error = ErrorService.processError(
            { message: response?.error || "API response error" },
            state.language
          );
          setState((prev) => ({
            ...prev,
            isLoading: false,
            response: null,
            error,
          }));
        }
      } catch (error: any) {
        console.error("API Error:", error);

        const enhancedError = ErrorService.processError(error, state.language);
        ErrorService.logError(enhancedError, {
          selectedFile: state.selectedFile?.name,
          selectedFileId: state.selectedFileId,
          question: question.substring(0, 100), // Log first 100 chars only
        });

        setState((prev) => ({
          ...prev,
          isLoading: false,
          response: null,
          error: enhancedError,
        }));
      }
    },
    [state.selectedFile, state.selectedFileId, state.language]
  );

  // Clear error handler
  const handleClearError = useCallback(() => {
    setState((prev) => ({
      ...prev,
      error: null,
    }));
  }, []);

  // File validation function
  const validateFile = useCallback(
    (file: File): boolean => {
      const isPdfType = file.type === "application/pdf";
      const isPdfExt = file.name.toLowerCase().endsWith(".pdf");
      const underLimit = file.size <= 10 * 1024 * 1024;

      if (!isPdfType || !isPdfExt) {
        const err = ErrorService.processError(
          { message: "Por favor selecione apenas ficheiros PDF." },
          state.language
        );
        setState((prev) => ({ ...prev, error: err }));
        return false;
      }

      if (!underLimit) {
        const err = ErrorService.processError(
          { message: "O ficheiro deve ter menos de 10MB." },
          state.language
        );
        setState((prev) => ({ ...prev, error: err }));
        return false;
      }

      return true;
    },
    [state.language]
  );

  // Handle upload modal open
  const handleOpenUploadModal = useCallback(() => {
    setState(prev => ({
      ...prev,
      uploadModal: {
        ...prev.uploadModal,
        isOpen: true
      }
    }));
  }, []);

  // Handle upload modal close
  const handleCloseUploadModal = useCallback(() => {
    setState(prev => ({
      ...prev,
      uploadModal: {
        ...prev.uploadModal,
        isOpen: false
      }
    }));
  }, []);

  // Handle upload success
  const handleUploadSuccess = useCallback((file: any) => {
    // Refresh file library after successful upload
    const refreshFileLibrary = async () => {
      try {
        const response = await getFileLibrary();
        
        if (response.success) {
          setState(prev => ({
            ...prev,
            fileLibrary: {
              chapters: response.chapters,
              isLoading: false,
              error: null
            }
          }));
        }
      } catch (error: any) {
        console.error('Error refreshing file library:', error);
      }
    };

    refreshFileLibrary();
    handleCloseUploadModal();
  }, [handleCloseUploadModal]);

  // Get existing chapter names for upload modal
  const getExistingChapters = useCallback(() => {
    return state.fileLibrary.chapters.map(chapter => chapter.chapter);
  }, [state.fileLibrary.chapters]);

  return (
    <div className="app">
      <div className="app-container">
        {/* Top header bar, Moodle-inspired */}
        <header className="app-header">
          <div className="header-bar">
            <div className="brand-group">
              <h1 className="brand-title">BridgEdu</h1>
              <span className="brand-meta">2025/2026 • ISCTE</span>
            </div>
            <div className="actions-group">
              <Link to="/teacher" className="header-link">
                Teacher Dashboard
              </Link>
              <input
                type="search"
                className="header-search"
                placeholder="Procurar materiais ou perguntas"
                aria-label="Procurar"
              />
              <button
                type="button"
                className="quick-ask-cta"
                onClick={() =>
                  setState((prev) => ({ ...prev, showQuickAsk: true }))
                }
              >
                Pergunta Rápida
              </button>
              {/* Hidden file input controlled by header button */}
              <input
                id="header-file-input"
                type="file"
                accept=".pdf,application/pdf"
                style={{ display: "none" }}
                onChange={(e) => {
                  const files = e.target.files;
                  if (!files || files.length === 0) return;
                  const file = files[0];
                  if (validateFile(file)) {
                    handleFileSelect(file);
                  }
                }}
              />
              <button
                type="button"
                className="header-upload-cta"
                onClick={handleOpenUploadModal}
              >
                Carregar ficheiro
              </button>
              <div className="profile-wrapper">
                <button
                  type="button"
                  className="profile-avatar"
                  aria-haspopup="menu"
                  aria-expanded={state.isProfileOpen}
                  onClick={() =>
                    setState((prev) => ({
                      ...prev,
                      isProfileOpen: !prev.isProfileOpen,
                    }))
                  }
                >
                  {user?.picture ? (
                    <img
                      src={user.picture}
                      alt={user.name}
                      className="profile-image"
                    />
                  ) : (
                    <span aria-hidden>👤</span>
                  )}
                </button>
                {state.isProfileOpen && (
                  <div className="profile-menu" role="menu">
                    <div className="profile-info">
                      <div className="profile-name">{user?.name}</div>
                      <div className="profile-email">{user?.email}</div>
                    </div>
                    <div className="menu-divider"></div>
                    <button
                      className="menu-item"
                      role="menuitem"
                      onClick={() => {
                        setState((prev) => ({ ...prev, isProfileOpen: false }));
                        // Navigate to profile page
                        console.log("Navigate to profile");
                      }}
                    >
                      Perfil
                    </button>
                    <button
                      className="menu-item"
                      role="menuitem"
                      onClick={() => {
                        setState((prev) => ({ ...prev, isProfileOpen: false }));
                        // Open settings modal
                        console.log("Open settings modal");
                      }}
                    >
                      Definições
                    </button>
                    <button
                      className="menu-item logout-item"
                      role="menuitem"
                      onClick={() => {
                        setState((prev) => ({ ...prev, isProfileOpen: false }));
                        logout();
                      }}
                    >
                      Sair
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
          {/* badges removed per design request */}
        </header>

        <main className="app-main moodle-body">
          {/* Left rail - File Library Panel */}
          <aside className="moodle-left" aria-label="Biblioteca de arquivos">
            <FileLibraryPanel
              selectedFileId={state.selectedFileId}
              onFileSelect={handleFileLibrarySelect}
              userRole={user?.email?.includes('@iscte') ? 'teacher' : 'student'}
              isLoading={state.fileLibrary.isLoading}
              error={state.fileLibrary.error}
            />
          </aside>

          {/* Center column - main interaction */}
          <main className="moodle-center">
            <div className="chapter-header">
              <h2 className="chapter-title">
                {state.selectedFileId ? 'Arquivo Selecionado' : 
                 state.selectedFile ? 'Arquivo Carregado' : 
                 'Selecione um arquivo'}
              </h2>
              {(state.selectedFile || state.selectedFileId) && (
                <p className="selected-file-indicator">
                  {state.selectedFile ? state.selectedFile.name : 'Arquivo da biblioteca'}
                </p>
              )}
            </div>
            {state.error && (
              <div className={`error-banner error-${state.error.severity}`}>
                <div className="error-content">
                  <span className="error-message">
                    {ErrorService.getUserMessage(state.error, state.language)}
                  </span>
                  {ErrorService.isRetryable(state.error) && (
                    <span className="error-retry-hint">
                      {state.language === "pt"
                        ? "Você pode tentar novamente."
                        : "You can try again."}
                    </span>
                  )}
                </div>
                <button
                  onClick={handleClearError}
                  className="error-close"
                  aria-label={
                    state.language === "pt"
                      ? "Fechar mensagem de erro"
                      : "Close error message"
                  }
                >
                  ×
                </button>
              </div>
            )}

            {/* Keep FileUpload in DOM for tests, but visually hidden as header handles uploads */}
            <section
              id="upload"
              className="upload-section compact hidden-upload"
              aria-hidden="true"
            >
              <FileUpload
                onFileSelect={handleFileSelect}
                selectedFile={state.selectedFile}
                isUploading={state.isUploading}
              />
            </section>

            <section className="question-section">
              <QuestionInput
                onSubmit={handleQuestionSubmit}
                disabled={!state.selectedFile && !state.selectedFileId}
                isLoading={state.isLoading}
                selectedFileName={
                  state.selectedFileId 
                    ? state.fileLibrary.chapters
                        .flatMap(chapter => chapter.files)
                        .find(file => file.id === state.selectedFileId)?.originalName
                    : state.selectedFile?.name
                }
                selectedFileChapter={
                  state.selectedFileId 
                    ? state.fileLibrary.chapters
                        .find(chapter => 
                          chapter.files.some(file => file.id === state.selectedFileId)
                        )?.chapter
                    : undefined
                }
              />
            </section>

            <section className="response-section">
              <ResponseDisplay
                response={state.response}
                isLoading={state.isLoading}
                error={
                  state.error
                    ? ErrorService.getUserMessage(state.error, state.language)
                    : null
                }
              />
            </section>
          </main>

          {/* Right rail - concise course info */}
          <aside className="moodle-right">
            <div className="info-card">
              <div className="info-title">Progresso do capítulo</div>
              <div className="info-value">50%</div>
            </div>
            <div className="info-card">
              <div className="info-title">Próximas entregas</div>
              <ul className="info-list">
                <li>Projeto — 21 Nov</li>
                <li>Exame — 15 Dez</li>
              </ul>
            </div>
            <div className="info-card">
              <div className="info-title">Resumo das perguntas</div>
              <div className="info-note">
                5 abertas • 2 com resposta do professor
              </div>
            </div>
          </aside>
        </main>

        {/* File Upload Modal */}
        <FileUploadModal
          isOpen={state.uploadModal.isOpen}
          onClose={handleCloseUploadModal}
          onUploadSuccess={handleUploadSuccess}
          existingChapters={getExistingChapters()}
          isUploading={state.uploadModal.isUploading}
        />

        {state.showQuickAsk && (
          <div
            className="modal-overlay"
            role="dialog"
            aria-modal="true"
            aria-label="Pergunta rápida"
          >
            <div className="modal-card">
              <div className="modal-header">
                <h2>Pergunta rápida</h2>
                <button
                  className="modal-close"
                  aria-label="Fechar"
                  onClick={() =>
                    setState((prev) => ({ ...prev, showQuickAsk: false }))
                  }
                >
                  ×
                </button>
              </div>
              <div className="modal-subtitle">
                {state.selectedFileId ? 'Arquivo da biblioteca selecionado' : 
                 state.selectedFile ? `Arquivo: ${state.selectedFile.name}` : 
                 'Nenhum arquivo selecionado'}
              </div>
              <div className="modal-body">
                <textarea
                  className="modal-textarea"
                  placeholder="Escreve a tua pergunta aqui"
                  value={state.quickAskText}
                  onChange={(e) =>
                    setState((prev) => ({
                      ...prev,
                      quickAskText: e.target.value,
                    }))
                  }
                  rows={6}
                />

                <div className="modal-controls">
                  <select
                    className="modal-select"
                    value={state.quickAskPreset}
                    onChange={(e) =>
                      setState((prev) => ({
                        ...prev,
                        quickAskPreset: e.target.value as
                          | "hints"
                          | "steps"
                          | "full",
                      }))
                    }
                  >
                    <option value="hints">Apenas dicas</option>
                    <option value="steps">Mostrar passos</option>
                    <option value="full">Solução completa</option>
                  </select>

                  <input
                    type="file"
                    className="modal-file"
                    accept=".pdf,application/pdf"
                    onChange={(e) => {
                      const f = e.target.files && e.target.files[0];
                      if (f && validateFile(f)) {
                        handleFileSelect(f);
                      }
                    }}
                  />
                </div>
              </div>
              <div className="modal-actions">
                <button
                  className="btn-secondary"
                  onClick={() =>
                    setState((prev) => ({ ...prev, showQuickAsk: false }))
                  }
                >
                  Cancelar
                </button>
                <button
                  className="btn-primary"
                  onClick={() => {
                    const text = state.quickAskText.trim();
                    if (text) {
                      handleQuestionSubmit(text);
                    }
                    setState((prev) => ({
                      ...prev,
                      showQuickAsk: false,
                      quickAskText: "",
                    }));
                  }}
                >
                  Enviar
                </button>
              </div>
            </div>
          </div>
        )}

        <footer className="app-footer">
          <p>© 2025 ISCTE - DIAM Course AI Assistant</p>
        </footer>
      </div>
    </div>
  );
};

export default App;
