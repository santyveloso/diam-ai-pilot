import React, { useState, useCallback } from "react";
import { Link } from "react-router-dom";
import FileUpload from "./FileUpload";
import QuestionInput from "./QuestionInput";
import ResponseDisplay from "./ResponseDisplay";
import { askQuestion } from "../services/api";
import { ErrorService } from "../services/errorService";
import { EnhancedError } from "../types";
import { useAuth } from "../contexts/AuthContext";
import "./App.css";

// Application state interface
interface AppState {
  selectedFile: File | null;
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
  });

  const chapters = [
    { id: "general", label: "General" },
    { id: "ch1", label: "Chapter 1 - HTML" },
    { id: "ch2", label: "Chapter 2 - CSS & JS" },
    { id: "project", label: "Project" },
    { id: "assessments", label: "Assessments" },
  ];

  // File selection handler
  const handleFileSelect = useCallback((file: File | null) => {
    setState((prev) => ({
      ...prev,
      selectedFile: file,
      error: null,
      response: null, // Clear previous response when new file is selected
      question: file ? prev.question : "", // Clear question when file is removed
      isUploading: false, // Reset upload state
    }));
  }, []);

  // Question submission handler
  const handleQuestionSubmit = useCallback(
    async (question: string) => {
      if (!state.selectedFile) {
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
        const response = await askQuestion(question, state.selectedFile);

        if (response.success) {
          setState((prev) => ({
            ...prev,
            isLoading: false,
            response: response.response,
            error: null,
          }));
        } else {
          const error = ErrorService.processError(
            { message: response.error || "API response error" },
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
    [state.selectedFile, state.language]
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
                onClick={() =>
                  (
                    document.getElementById(
                      "header-file-input"
                    ) as HTMLInputElement
                  )?.click()
                }
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
          {/* Left rail - simplified navigation for familiarity */}
          <aside className="moodle-left" aria-label="Navegação do curso">
            <div className="nav-section">
              <div className="nav-title">Capítulos</div>
              <ul className="nav-list">
                {chapters.map((c) => (
                  <li
                    key={c.id}
                    className={`nav-item ${
                      state.selectedChapter === c.id ? "active" : ""
                    }`}
                    onClick={() =>
                      setState((prev) => ({ ...prev, selectedChapter: c.id }))
                    }
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ")
                        setState((prev) => ({
                          ...prev,
                          selectedChapter: c.id,
                        }));
                    }}
                    aria-current={
                      state.selectedChapter === c.id ? "page" : undefined
                    }
                  >
                    {c.label}
                  </li>
                ))}
              </ul>
            </div>

            <div className="nav-section">
              <div className="nav-title">Minhas perguntas</div>
              <ul className="nav-list compact">
                <li className="nav-chip">Dúvida: div vs section</li>
                <li className="nav-chip">Scope do projeto</li>
                <li className="nav-chip">Nota final</li>
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
                disabled={!state.selectedFile}
                isLoading={state.isLoading}
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
                Capítulo:{" "}
                {chapters.find((c) => c.id === state.selectedChapter)?.label}
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
