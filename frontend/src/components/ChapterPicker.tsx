import React, { useState, useCallback, useEffect } from 'react';
import { ChapterFiles } from '../types';

interface ChapterPickerProps {
  chapters: ChapterFiles[];
  selectedChapter: string | null;
  onChapterSelect: (chapterName: string | null) => void;
  userRole: 'teacher' | 'student';
  isLoading?: boolean;
}

interface ChapterStats {
  questionCount: number;
  avgQuestionsPerStudent: number;
  difficulty: number;
  commonTopics: string[];
}

const ChapterPicker: React.FC<ChapterPickerProps> = ({
  chapters,
  selectedChapter,
  onChapterSelect,
  userRole,
  isLoading = false
}) => {
  const [showStats, setShowStats] = useState(false);

  // Mock stats data - in real app this would come from API
  const mockStats: Record<string, ChapterStats> = {
    'Chapter 1 - HTML': {
      questionCount: 42,
      avgQuestionsPerStudent: 1.8,
      difficulty: 3,
      commonTopics: ['Semantic tags', 'Structure', 'Forms']
    },
    'Chapter 2 - CSS & JS': {
      questionCount: 78,
      avgQuestionsPerStudent: 3.2,
      difficulty: 7,
      commonTopics: ['Flexbox', 'Selectors', 'Event handling']
    },
    'Project': {
      questionCount: 35,
      avgQuestionsPerStudent: 1.5,
      difficulty: 8,
      commonTopics: ['Scope', 'Requirements', 'Implementation']
    },
    'Assessments': {
      questionCount: 28,
      avgQuestionsPerStudent: 1.2,
      difficulty: 5,
      commonTopics: ['Grading', 'Exams', 'Criteria']
    }
  };

  const selectedChapterData = selectedChapter 
    ? chapters.find(ch => ch.chapter === selectedChapter)
    : null;

  const selectedStats = selectedChapter ? mockStats[selectedChapter] : null;

  const handleChapterClick = useCallback((chapterName: string) => {
    if (selectedChapter === chapterName) {
      // If clicking the same chapter, toggle stats view for teachers or deselect
      if (userRole === 'teacher') {
        setShowStats(!showStats);
      } else {
        onChapterSelect(null);
      }
    } else {
      // Select new chapter
      onChapterSelect(chapterName);
      if (userRole === 'teacher') {
        setShowStats(true);
      }
    }
  }, [selectedChapter, onChapterSelect, userRole, showStats]);

  const renderDifficultyBar = (difficulty: number) => (
    <div className="difficulty-bar">
      <div className="difficulty-track">
        <div
          className="difficulty-fill"
          style={{
            width: `${difficulty * 10}%`,
            backgroundColor:
              difficulty > 7 ? '#ef4444' :
              difficulty > 4 ? '#f59e0b' : '#10b981'
          }}
        />
      </div>
      <span className="difficulty-label">{difficulty}/10</span>
    </div>
  );

  if (isLoading) {
    return (
      <div className="chapter-picker">
        <div className="chapter-picker-header">
          <h3>Capítulos</h3>
        </div>
        <div className="chapter-picker-loading">
          <div className="loading-spinner"></div>
          <p>Carregando capítulos...</p>
        </div>
      </div>
    );
  }

  if (chapters.length === 0) {
    return (
      <div className="chapter-picker">
        <div className="chapter-picker-header">
          <h3>Capítulos</h3>
        </div>
        <div className="chapter-picker-empty">
          <p>Nenhum capítulo disponível</p>
        </div>
      </div>
    );
  }

  return (
    <div className="chapter-picker">
      <div className="chapter-picker-header">
        <h3>Capítulos</h3>
        {selectedChapter && (
          <button
            className="clear-selection-btn"
            onClick={() => {
              onChapterSelect(null);
              setShowStats(false);
            }}
            title="Limpar seleção"
          >
            ✕
          </button>
        )}
      </div>

      <div className="chapters-list">
        {chapters.map((chapter) => {
          const isSelected = selectedChapter === chapter.chapter;
          
          return (
            <div
              key={chapter.chapter}
              className={`chapter-item ${isSelected ? 'selected' : ''}`}
              onClick={() => handleChapterClick(chapter.chapter)}
            >
              <div className="chapter-icon">📚</div>
              <div className="chapter-info">
                <span className="chapter-name">{chapter.chapter}</span>
              </div>
              <span className="chapter-file-count">{chapter.files.length}</span>
            </div>
          );
        })}
      </div>

      {/* My Questions Section */}
      <div className="my-questions-section">
        <h4 className="section-title">Minhas perguntas</h4>
        <div className="questions-list">
          <div className="question-item">
            <span className="question-text">Dúvida: difference between ...</span>
            <span className="question-date">2025-08-10</span>
          </div>
          <div className="question-item">
            <span className="question-text">Erro no exercício 3 (JS)</span>
            <span className="question-date">2025-08-09</span>
          </div>
          <div className="question-item">
            <span className="question-text">Pergunta projeto - scope</span>
            <span className="question-date">2025-08-07</span>
          </div>
          <div className="question-item">
            <span className="question-text">Geral: nota final</span>
            <span className="question-date">2025-08-01</span>
          </div>
        </div>
      </div>

      {/* Shortcuts Section */}
      <div className="shortcuts-section">
        <h4 className="section-title">Atalhos</h4>
        <div className="shortcuts-list">
          <div className="shortcut-item">
            <span className="shortcut-text">Bookmarks</span>
          </div>
          <div className="shortcut-item">
            <span className="shortcut-text">Notas</span>
          </div>
          <div className="shortcut-item">
            <span className="shortcut-text">Timeline</span>
          </div>
        </div>
      </div>

      {/* Chapter Details Panel */}
      {selectedChapter && (
        <div className="chapter-details">
          <div className="chapter-details-header">
            <h4>{selectedChapter}</h4>
            {userRole === 'teacher' && (
              <button
                className={`stats-toggle ${showStats ? 'active' : ''}`}
                onClick={() => setShowStats(!showStats)}
              >
                {showStats ? 'Ver Arquivos' : 'Ver Estatísticas'}
              </button>
            )}
          </div>

          {userRole === 'teacher' && showStats && selectedStats ? (
            // Teacher Stats View
            <div className="chapter-stats">
              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-title">Perguntas Totais</div>
                  <div className="stat-value large">{selectedStats.questionCount}</div>
                  <div className="stat-subtitle">
                    {selectedStats.avgQuestionsPerStudent.toFixed(1)} por aluno
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-title">Nível de Dificuldade</div>
                  {renderDifficultyBar(selectedStats.difficulty)}
                  <div className="stat-subtitle">Baseado na complexidade das perguntas</div>
                </div>

                <div className="stat-card full-width">
                  <div className="stat-title">Tópicos Mais Perguntados</div>
                  <div className="topics-list">
                    {selectedStats.commonTopics.map((topic, index) => (
                      <span key={index} className="topic-tag">
                        {topic}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            // Files View (for both teacher and student)
            <div className="chapter-files">
              {selectedChapterData && selectedChapterData.files.length > 0 ? (
                <div className="files-list">
                  {selectedChapterData.files.map((file) => (
                    <div key={file.id} className="file-item">
                      <div className="file-icon">📄</div>
                      <div className="file-info">
                        <div className="file-name">{file.originalName}</div>
                        <div className="file-meta">
                          <span className="file-size">
                            {(file.size / 1024 / 1024).toFixed(1)} MB
                          </span>
                          <span className="file-date">
                            {new Date(file.uploadedAt).toLocaleDateString('pt-BR')}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="no-files">
                  <p>Nenhum arquivo neste capítulo</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ChapterPicker;