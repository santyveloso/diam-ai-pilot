import React, { useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
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
  isSettingsOpen: boolean;
  showQuickAsk: boolean;
  quickAskPreset: "hints" | "steps" | "full";
  quickAskText: string;
}

// Mock data for teacher dashboard statistics
interface ChapterStats {
  id: string;
  name: string;
  questionCount: number;
  avgQuestionsPerStudent: number;
  difficulty: number; // 1-10 scale
  commonTopics: string[];
}

interface StudentActivity {
  date: string;
  questions: number;
}

const TeacherDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

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
    isSettingsOpen: false,
    showQuickAsk: false,
    quickAskPreset: "hints",
    quickAskText: "",
  });

  // Mock data for chapter statistics
  const chapterStats: ChapterStats[] = [
    {
      id: "ch1",
      name: "Chapter 1 - HTML",
      questionCount: 42,
      avgQuestionsPerStudent: 1.8,
      difficulty: 3,
      commonTopics: ["Semantic tags", "Structure", "Forms"],
    },
    {
      id: "ch2",
      name: "Chapter 2 - CSS & JS",
      questionCount: 78,
      avgQuestionsPerStudent: 3.2,
      difficulty: 7,
      commonTopics: ["Flexbox", "Selectors", "Event handling"],
    },
    {
      id: "project",
      name: "Project",
      questionCount: 35,
      avgQuestionsPerStudent: 1.5,
      difficulty: 8,
      commonTopics: ["Scope", "Requirements", "Implementation"],
    },
    {
      id: "assessments",
      name: "Assessments",
      questionCount: 28,
      avgQuestionsPerStudent: 1.2,
      difficulty: 5,
      commonTopics: ["Grading", "Exams", "Criteria"],
    },
  ];

  // Mock data for student activity (last 7 days)
  const studentActivity: StudentActivity[] = [
    { date: "Mon", questions: 12 },
    { date: "Tue", questions: 18 },
    { date: "Wed", questions: 9 },
    { date: "Thu", questions: 22 },
    { date: "Fri", questions: 15 },
    { date: "Sat", questions: 7 },
    { date: "Sun", questions: 5 },
  ];

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
      } catch (error: unknown) {
        console.error("API Error:", error);

        const errorMessage =
          error instanceof Error ? error.message : String(error);
        const enhancedError = ErrorService.processError(
          error instanceof Error ? error : { message: errorMessage },
          state.language
        );
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
          {
            message:
              state.language === "pt"
                ? "Por favor selecione apenas ficheiros PDF."
                : "Please select only PDF files.",
          },
          state.language
        );
        setState((prev) => ({ ...prev, error: err }));
        return false;
      }

      if (!underLimit) {
        const err = ErrorService.processError(
          {
            message:
              state.language === "pt"
                ? "O ficheiro deve ter menos de 10MB."
                : "File must be less than 10MB.",
          },
          state.language
        );
        setState((prev) => ({ ...prev, error: err }));
        return false;
      }

      return true;
    },
    [state.language]
  );

  // Get stats for selected chapter
  const selectedChapterStats = chapterStats.find(
    (stats) => stats.id === state.selectedChapter
  );

  // Render heatmap cells
  const renderHeatmapCell = (stats: ChapterStats) => {
    const isSelected = stats.id === state.selectedChapter;
    let bgColorClass = "";
    
    if (stats.questionCount > 60) {
      bgColorClass = "heatmap-high";
    } else if (stats.questionCount > 40) {
      bgColorClass = "heatmap-medium-high";
    } else if (stats.questionCount > 20) {
      bgColorClass = "heatmap-medium";
    } else {
      bgColorClass = "heatmap-low";
    }

    return (
      <div
        key={stats.id}
        className={`p-3 rounded-lg cursor-pointer transition-all ${
          isSelected ? "ring-2 ring-blue-500 scale-105" : ""
        } ${bgColorClass} text-white`}
        onClick={() =>
          setState((prev) => ({ ...prev, selectedChapter: stats.id }))
        }
      >
        <div className="font-bold text-sm">{stats.name}</div>
        <div className="text-xs mt-1">{stats.questionCount} questions</div>
      </div>
    );
  };

  return (
    <div className="app">
      <div className="app-container">
        {/* Top header bar, Moodle-inspired */}
        <header className="app-header">
          <div className="header-bar">
            <div className="brand-group">
              <h1 className="brand-title">BridgEdu - Teacher</h1>
              <span className="brand-meta">2025/2026 • ISCTE</span>
            </div>
            <div className="actions-group">
              <Link to="/student" className="header-link">
                Student Dashboard
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
                onClick={() => {
                  const fileInput = document.getElementById(
                    "header-file-input"
                  ) as HTMLInputElement | null;
                  if (fileInput) {
                    fileInput.click();
                  }
                }}
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
                        navigate("/profile");
                      }}
                    >
                      Perfil
                    </button>
                    <button
                      className="menu-item"
                      role="menuitem"
                      onClick={() => {
                        setState((prev) => ({
                          ...prev,
                          isProfileOpen: false,
                          isSettingsOpen: true,
                        }));
                        // Open settings modal
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
              <div className="nav-title">Perguntas dos alunos</div>
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

            {/* Teacher Dashboard Statistics */}
            <section className="dashboard-section">
              <div className="stats-grid">
                {/* Heatmap visualization */}
                <div className="info-card span-cols">
                  <div className="info-title">Student Activity Heatmap</div>
                  <div className="heatmap-grid">
                    {chapterStats.map(renderHeatmapCell)}
                  </div>
                  <div className="heatmap-legend">
                    <div className="text-xs text-gray-600">
                      Areas with more questions indicate topics where students need more help
                    </div>
                  </div>
                </div>

                {/* Chapter Statistics */}
                {selectedChapterStats && (
                  <>
                    <div className="info-card">
                      <div className="info-title">Questions This Chapter</div>
                      <div className="info-value text-3xl">
                        {selectedChapterStats.questionCount}
                      </div>
                      <div className="info-note">
                        {selectedChapterStats.avgQuestionsPerStudent.toFixed(1)} per student
                      </div>
                    </div>

                    <div className="info-card">
                      <div className="info-title">Difficulty Level</div>
                      <div className="difficulty-bar">
                        <div className="difficulty-track">
                          <div
                            className="difficulty-fill"
                            style={{
                              width: `${selectedChapterStats.difficulty * 10}%`,
                              backgroundColor:
                                selectedChapterStats.difficulty > 7
                                  ? "#ef4444"
                                  : selectedChapterStats.difficulty > 4
                                  ? "#f59e0b"
                                  : "#10b981",
                            }}
                          ></div>
                        </div>
                        <div className="difficulty-label">
                          {selectedChapterStats.difficulty}/10
                        </div>
                      </div>
                      <div className="info-note">
                        Based on question complexity
                      </div>
                    </div>

                    <div className="info-card">
                      <div className="info-title">Common Topics</div>
                      <div className="topic-tags">
                        {selectedChapterStats.commonTopics.map((topic, index) => (
                          <span key={index} className="topic-tag">
                            {topic}
                          </span>
                        ))}
                      </div>
                      <div className="info-note mt-2">
                        Students frequently ask about these concepts
                      </div>
                    </div>
                  </>
                )}

                {/* Student Activity Chart */}
                <div className="info-card span-cols">
                  <div className="info-title">Student Activity (Last 7 Days)</div>
                  <div className="activity-chart">
                    {studentActivity.map((day, index) => {
                      // Find the maximum value for scaling
                      const maxValue = Math.max(...studentActivity.map(d => d.questions));
                      const heightPercentage = maxValue > 0 ? (day.questions / maxValue) * 100 : 0;
                      
                      return (
                        <div key={index} className="chart-bar-container">
                          <div
                            className="chart-bar"
                            style={{
                              height: `${heightPercentage}%`,
                              backgroundColor:
                                day.questions > 15
                                  ? "#ef4444"
                                  : day.questions > 10
                                  ? "#f59e0b"
                                  : "#10b981",
                            }}
                          ></div>
                          <div className="chart-label">{day.date}</div>
                          <div className="chart-value">{day.questions}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
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
              <div className="info-title">Atividade da turma</div>
              <div className="info-value">24 alunos ativos</div>
            </div>
            <div className="info-card">
              <div className="info-title">Próximas entregas</div>
              <ul className="info-list">
                <li>Projeto — 21 Nov</li>
                <li>Exame — 15 Dez</li>
              </ul>
            </div>
            <div className="info-card">
              <div className="info-title">Respostas pendentes</div>
              <div className="info-note">5 perguntas sem resposta</div>
            </div>
            
            {/* Additional teacher insights */}
            <div className="info-card">
              <div className="info-title">Insights</div>
              <ul className="info-list">
                <li className="insight-item high">
                  <span className="insight-icon">⚠️</span>
                  <span>Chapter 2 has 3x more questions than others</span>
                </li>
                <li className="insight-item medium">
                  <span className="insight-icon">📈</span>
                  <span>Activity increased this week</span>
                </li>
                <li className="insight-item low">
                  <span className="insight-icon">✅</span>
                  <span>Project questions decreasing</span>
                </li>
              </ul>
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
                    onChange={(e) => {
                      const value = e.target.value;
                      if (
                        value === "hints" ||
                        value === "steps" ||
                        value === "full"
                      ) {
                        setState((prev) => ({
                          ...prev,
                          quickAskPreset: value,
                        }));
                      }
                    }}
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
                    if (text && state.selectedFile) {
                      handleQuestionSubmit(text);
                    } else if (!state.selectedFile) {
                      const err = ErrorService.processError(
                        {
                          code: "MISSING_FILE",
                          message:
                            state.language === "pt"
                              ? "Por favor selecione um ficheiro PDF."
                              : "Please select a PDF file.",
                        },
                        state.language
                      );
                      setState((prev) => ({ ...prev, error: err }));
                      return;
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

export default TeacherDashboard;
