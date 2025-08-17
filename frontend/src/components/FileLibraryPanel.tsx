import React, { useState, useEffect, useCallback } from 'react';
import { 
  FileLibraryPanelProps, 
  FileLibraryPanelState, 
  Chapter, 
  LibraryFile,
  ChapterFiles 
} from '../types';
import { getFileLibrary, deleteFile, renameChapter } from '../services/api';
import { ErrorService } from '../services/errorService';

const FileLibraryPanel: React.FC<FileLibraryPanelProps> = ({
  selectedFileId,
  onFileSelect,
  userRole,
  isLoading: externalLoading = false,
  error: externalError = null
}) => {
  const [state, setState] = useState<FileLibraryPanelState>({
    chapters: [],
    expandedChapters: new Set(),
    isLoading: true,
    error: null,
    isOperationInProgress: false
  });

  const [editingChapter, setEditingChapter] = useState<string | null>(null);
  const [editingChapterName, setEditingChapterName] = useState<string>('');

  // Load file library data
  const loadFileLibrary = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const response = await getFileLibrary();
      
      if (response.success) {
        // Transform ChapterFiles[] to Chapter[]
        setState(prev => {
          const chapters: Chapter[] = response.chapters.map((chapterData: ChapterFiles) => ({
            name: chapterData.chapter,
            files: chapterData.files,
            fileCount: chapterData.files.length,
            isExpanded: prev.expandedChapters.has(chapterData.chapter)
          }));

          return {
            ...prev,
            chapters,
            isLoading: false,
            error: null
          };
        });
      } else {
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: response.error || 'Failed to load file library'
        }));
      }
    } catch (error: any) {
      console.error('Error loading file library:', error);
      const errorMessage = ErrorService.processError(error, 'pt');
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: ErrorService.getUserMessage(errorMessage, 'pt')
      }));
    }
  }, []);

  // Load data on component mount
  useEffect(() => {
    loadFileLibrary();
  }, [loadFileLibrary]);

  // Toggle chapter expansion
  const toggleChapterExpansion = useCallback((chapterName: string) => {
    setState(prev => {
      const newExpandedChapters = new Set(prev.expandedChapters);
      if (newExpandedChapters.has(chapterName)) {
        newExpandedChapters.delete(chapterName);
      } else {
        newExpandedChapters.add(chapterName);
      }

      return {
        ...prev,
        expandedChapters: newExpandedChapters,
        chapters: prev.chapters.map(chapter => ({
          ...chapter,
          isExpanded: newExpandedChapters.has(chapter.name)
        }))
      };
    });
  }, []);

  // Handle file selection
  const handleFileSelect = useCallback((fileId: string | null) => {
    onFileSelect(fileId);
  }, [onFileSelect]);

  // Handle file deletion (teacher only)
  const handleDeleteFile = useCallback(async (fileId: string, fileName: string) => {
    if (userRole !== 'teacher') return;
    
    const confirmed = window.confirm(`Tem certeza que deseja excluir o arquivo "${fileName}"?`);
    if (!confirmed) return;

    setState(prev => ({ ...prev, isOperationInProgress: true }));

    try {
      const response = await deleteFile(fileId);
      
      if (response.success) {
        // Remove file from state and reload library
        await loadFileLibrary();
        
        // Clear selection if deleted file was selected
        if (selectedFileId === fileId) {
          onFileSelect(null);
        }
      } else {
        setState(prev => ({
          ...prev,
          error: response.error || 'Failed to delete file'
        }));
      }
    } catch (error: any) {
      console.error('Error deleting file:', error);
      const errorMessage = ErrorService.processError(error, 'pt');
      setState(prev => ({
        ...prev,
        error: ErrorService.getUserMessage(errorMessage, 'pt')
      }));
    } finally {
      setState(prev => ({ ...prev, isOperationInProgress: false }));
    }
  }, [userRole, selectedFileId, onFileSelect, loadFileLibrary]);

  // Handle chapter rename (teacher only)
  const handleRenameChapter = useCallback(async (oldName: string, newName: string) => {
    if (userRole !== 'teacher' || !newName.trim() || newName === oldName) {
      setEditingChapter(null);
      return;
    }

    setState(prev => ({ ...prev, isOperationInProgress: true }));

    try {
      const response = await renameChapter(oldName, newName.trim());
      
      if (response.success) {
        await loadFileLibrary();
        setEditingChapter(null);
      } else {
        setState(prev => ({
          ...prev,
          error: response.error || 'Failed to rename chapter'
        }));
      }
    } catch (error: any) {
      console.error('Error renaming chapter:', error);
      const errorMessage = ErrorService.processError(error, 'pt');
      setState(prev => ({
        ...prev,
        error: ErrorService.getUserMessage(errorMessage, 'pt')
      }));
    } finally {
      setState(prev => ({ ...prev, isOperationInProgress: false }));
    }
  }, [userRole, loadFileLibrary]);

  // Start editing chapter name
  const startEditingChapter = useCallback((chapterName: string) => {
    if (userRole !== 'teacher') return;
    setEditingChapter(chapterName);
    setEditingChapterName(chapterName);
  }, [userRole]);

  // Cancel editing
  const cancelEditing = useCallback(() => {
    setEditingChapter(null);
    setEditingChapterName('');
  }, []);

  // Format file size
  const formatFileSize = useCallback((bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }, []);

  // Format upload date
  const formatUploadDate = useCallback((date: Date): string => {
    const now = new Date();
    const uploadDate = new Date(date);
    const diffTime = Math.abs(now.getTime() - uploadDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return 'Hoje';
    if (diffDays === 2) return 'Ontem';
    if (diffDays <= 7) return `${diffDays - 1} dias atrás`;
    
    return uploadDate.toLocaleDateString('pt-BR');
  }, []);

  const isLoading = state.isLoading || externalLoading;
  const error = state.error || externalError;

  if (isLoading) {
    return (
      <div className="file-library-panel">
        <div className="library-header">
          <h3 className="library-title">Biblioteca de Arquivos</h3>
        </div>
        <div className="library-loading">
          <div className="loading-spinner"></div>
          <p>Carregando biblioteca...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="file-library-panel">
        <div className="library-header">
          <h3 className="library-title">Biblioteca de Arquivos</h3>
        </div>
        <div className="library-error">
          <p className="error-message">{error}</p>
          <button 
            className="retry-button"
            onClick={loadFileLibrary}
          >
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="file-library-panel">
      <div className="library-header">
        <h3 className="library-title">Biblioteca de Arquivos</h3>
        {state.chapters.length > 0 && (
          <span className="library-count">
            {state.chapters.reduce((total, chapter) => total + chapter.fileCount, 0)} arquivos
          </span>
        )}
      </div>

      {state.chapters.length === 0 ? (
        <div className="library-empty">
          <p>Nenhum arquivo encontrado</p>
          {userRole === 'teacher' && (
            <p className="empty-hint">Use o botão "Carregar ficheiro" para adicionar materiais</p>
          )}
        </div>
      ) : (
        <div className="chapters-list">
          {state.chapters.map((chapter) => (
            <div key={chapter.name} className="chapter-section">
              <div 
                className={`chapter-header ${chapter.isExpanded ? 'expanded' : ''}`}
                onClick={() => toggleChapterExpansion(chapter.name)}
              >
                <div className="chapter-info">
                  {editingChapter === chapter.name ? (
                    <input
                      type="text"
                      value={editingChapterName}
                      onChange={(e) => setEditingChapterName(e.target.value)}
                      onBlur={() => handleRenameChapter(chapter.name, editingChapterName)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleRenameChapter(chapter.name, editingChapterName);
                        } else if (e.key === 'Escape') {
                          cancelEditing();
                        }
                      }}
                      className="chapter-name-input"
                      autoFocus
                      onClick={(e) => e.stopPropagation()}
                    />
                  ) : (
                    <h4 
                      className="chapter-name"
                      onDoubleClick={(e) => {
                        e.stopPropagation();
                        startEditingChapter(chapter.name);
                      }}
                      style={{ userSelect: 'none' }}
                    >
                      {chapter.name}
                    </h4>
                  )}
                  <span className="chapter-count">{chapter.fileCount} arquivos</span>
                </div>
                <div className="chapter-actions">
                  {userRole === 'teacher' && !editingChapter && (
                    <button
                      className="edit-chapter-button"
                      onClick={(e) => {
                        e.stopPropagation();
                        startEditingChapter(chapter.name);
                      }}
                      title="Renomear capítulo"
                    >
                      ✏️
                    </button>
                  )}
                  <span className={`expand-icon ${chapter.isExpanded ? 'expanded' : ''}`}>
                    ▼
                  </span>
                </div>
              </div>

              {chapter.isExpanded && (
                <div className="files-list">
                  {chapter.files.map((file: LibraryFile) => (
                    <div 
                      key={file.id}
                      className={`file-item ${selectedFileId === file.id ? 'selected' : ''}`}
                      onClick={() => handleFileSelect(file.id)}
                    >
                      <div className="file-info">
                        <div className="file-name" title={file.originalName}>
                          {file.originalName}
                        </div>
                        <div className="file-meta">
                          <span className="file-size">{formatFileSize(file.size)}</span>
                          <span className="file-date">{formatUploadDate(file.uploadedAt)}</span>
                        </div>
                      </div>
                      {userRole === 'teacher' && (
                        <button
                          className="delete-file-button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteFile(file.id, file.originalName);
                          }}
                          title="Excluir arquivo"
                          disabled={state.isOperationInProgress}
                        >
                          🗑️
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {state.isOperationInProgress && (
        <div className="operation-overlay">
          <div className="loading-spinner"></div>
        </div>
      )}
    </div>
  );
};

export default FileLibraryPanel;