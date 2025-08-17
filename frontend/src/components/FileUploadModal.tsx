import React, { useState, useRef, useCallback, useEffect } from 'react';
import { FileUploadModalProps, FileUploadModalState, LibraryFile } from '../types';
import { uploadFile } from '../services/api';
import '../styles/components/modal.css';
import '../styles/components/file-upload.css';

const FileUploadModal: React.FC<FileUploadModalProps> = ({
  isOpen,
  onClose,
  onUploadSuccess,
  existingChapters,
  isUploading = false
}) => {
  const [state, setState] = useState<FileUploadModalState>({
    file: null,
    chapter: '',
    customChapterName: '',
    isCreatingNewChapter: false,
    uploadProgress: 0,
    errors: {}
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setState({
        file: null,
        chapter: '',
        customChapterName: '',
        isCreatingNewChapter: false,
        uploadProgress: 0,
        errors: {}
      });
      setIsDragOver(false);
      setIsProcessing(false);
    }
  }, [isOpen]);

  // File validation
  const validateFile = useCallback((file: File): string | null => {
    if (file.type !== 'application/pdf') {
      return 'Only PDF files are allowed';
    }
    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      return 'File size must be less than 10MB';
    }
    return null;
  }, []);

  // Chapter name validation
  const validateChapterName = useCallback((name: string): string | null => {
    if (!name.trim()) {
      return 'Chapter name is required';
    }
    if (name.trim().length < 2) {
      return 'Chapter name must be at least 2 characters';
    }
    if (name.trim().length > 50) {
      return 'Chapter name must be less than 50 characters';
    }
    if (!/^[a-zA-Z0-9\s\-_\.]+$/.test(name.trim())) {
      return 'Chapter name can only contain letters, numbers, spaces, hyphens, underscores, and periods';
    }
    if (existingChapters.includes(name.trim())) {
      return 'Chapter name already exists';
    }
    return null;
  }, [existingChapters]);

  // Handle file selection
  const handleFileSelect = useCallback((file: File) => {
    const error = validateFile(file);
    setState(prev => ({
      ...prev,
      file,
      errors: {
        ...prev.errors,
        file: error || undefined
      }
    }));
  }, [validateFile]);

  // Handle drag events
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  }, [handleFileSelect]);

  // Handle file input change
  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  }, [handleFileSelect]);

  // Handle chapter selection change
  const handleChapterChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setState(prev => ({
      ...prev,
      chapter: value,
      isCreatingNewChapter: value === '__new__',
      customChapterName: value === '__new__' ? prev.customChapterName : '',
      errors: {
        ...prev.errors,
        chapter: undefined,
        customChapterName: undefined
      }
    }));
  }, []);

  // Handle custom chapter name change
  const handleCustomChapterNameChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setState(prev => ({
      ...prev,
      customChapterName: value,
      errors: {
        ...prev.errors,
        customChapterName: undefined
      }
    }));
  }, []);

  // Clear selected file
  const clearFile = useCallback(() => {
    setState(prev => ({
      ...prev,
      file: null,
      errors: {
        ...prev.errors,
        file: undefined
      }
    }));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  // Validate form
  const validateForm = useCallback((): boolean => {
    const errors: FileUploadModalState['errors'] = {};

    // Validate file
    if (!state.file) {
      errors.file = 'Please select a file';
    } else {
      const fileError = validateFile(state.file);
      if (fileError) {
        errors.file = fileError;
      }
    }

    // Validate chapter
    if (state.isCreatingNewChapter) {
      const chapterError = validateChapterName(state.customChapterName);
      if (chapterError) {
        errors.customChapterName = chapterError;
      }
    } else if (!state.chapter) {
      errors.chapter = 'Please select a chapter';
    }

    setState(prev => ({ ...prev, errors }));
    return Object.keys(errors).length === 0;
  }, [state.file, state.chapter, state.isCreatingNewChapter, state.customChapterName, validateFile, validateChapterName]);

  // Handle form submission
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm() || !state.file) {
      return;
    }

    setIsProcessing(true);
    setState(prev => ({ ...prev, uploadProgress: 0 }));

    try {
      const chapterName = state.isCreatingNewChapter 
        ? state.customChapterName.trim() 
        : state.chapter;

      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setState(prev => ({
          ...prev,
          uploadProgress: Math.min(prev.uploadProgress + 10, 90)
        }));
      }, 200);

      const response = await uploadFile(state.file, chapterName);
      
      clearInterval(progressInterval);
      setState(prev => ({ ...prev, uploadProgress: 100 }));

      if (response.success) {
        setTimeout(() => {
          onUploadSuccess(response.file);
          onClose();
        }, 500);
      } else {
        throw new Error(response.error || 'Upload failed');
      }
    } catch (error) {
      console.error('Upload error:', error);
      setState(prev => ({
        ...prev,
        errors: {
          ...prev.errors,
          file: error instanceof Error ? error.message : 'Upload failed'
        },
        uploadProgress: 0
      }));
    } finally {
      setIsProcessing(false);
    }
  }, [state, validateForm, onUploadSuccess, onClose]);

  // Handle modal close
  const handleClose = useCallback(() => {
    if (!isProcessing) {
      onClose();
    }
  }, [isProcessing, onClose]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isProcessing) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen, isProcessing, onClose]);

  // Format file size
  const formatFileSize = useCallback((bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }, []);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Upload Course Material</h2>
          <button
            className="modal-close"
            onClick={handleClose}
            disabled={isProcessing}
            aria-label="Close modal"
          >
            ×
          </button>
        </div>
        
        <div className="modal-subtitle">
          Add a new PDF file to your course library
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {/* File Upload Area */}
            <div className="file-upload">
              <div
                className={`file-upload-area ${isDragOver ? 'drag-over' : ''} ${
                  state.file ? 'has-file' : ''
                } ${isProcessing ? 'uploading' : ''}`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => !isProcessing && fileInputRef.current?.click()}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if ((e.key === 'Enter' || e.key === ' ') && !isProcessing) {
                    e.preventDefault();
                    fileInputRef.current?.click();
                  }
                }}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,application/pdf"
                  onChange={handleFileInputChange}
                  className="hidden-upload"
                  disabled={isProcessing}
                />

                {!state.file ? (
                  <div className="upload-prompt">
                    <div className="upload-icon">📄</div>
                    <p className="upload-text">
                      <strong>Click to upload</strong> or drag and drop
                    </p>
                    <p className="upload-hint">PDF files only, up to 10MB</p>
                  </div>
                ) : isProcessing ? (
                  <div className="upload-status uploading">
                    <div className="upload-icon">⏳</div>
                    <p className="upload-text">Uploading...</p>
                    <div style={{ 
                      width: '200px', 
                      height: '4px', 
                      background: '#e5e7eb', 
                      borderRadius: '2px',
                      overflow: 'hidden'
                    }}>
                      <div 
                        style={{
                          width: `${state.uploadProgress}%`,
                          height: '100%',
                          background: 'linear-gradient(90deg, #3b82f6, #1d4ed8)',
                          transition: 'width 0.3s ease'
                        }}
                      />
                    </div>
                    <p className="upload-hint">{state.uploadProgress}% complete</p>
                  </div>
                ) : (
                  <div className="upload-status success">
                    <div className="file-icon">✅</div>
                    <div className="file-info">
                      <p className="file-name">{state.file.name}</p>
                      <p className="file-size">{formatFileSize(state.file.size)}</p>
                    </div>
                    <button
                      type="button"
                      className="clear-file-button"
                      onClick={(e) => {
                        e.stopPropagation();
                        clearFile();
                      }}
                      aria-label="Remove file"
                    >
                      ×
                    </button>
                  </div>
                )}
              </div>
              
              {state.errors.file && (
                <div className="validation-error">
                  {state.errors.file}
                </div>
              )}
            </div>

            {/* Chapter Selection */}
            <div className="modal-controls">
              <div style={{ flex: 1 }}>
                <label htmlFor="chapter-select" style={{ 
                  display: 'block', 
                  marginBottom: '8px', 
                  fontWeight: '600',
                  color: '#374151'
                }}>
                  Chapter
                </label>
                <select
                  id="chapter-select"
                  className="modal-select"
                  value={state.chapter}
                  onChange={handleChapterChange}
                  disabled={isProcessing}
                  style={{ width: '100%' }}
                >
                  <option value="">Select a chapter...</option>
                  {existingChapters.map(chapter => (
                    <option key={chapter} value={chapter}>
                      {chapter}
                    </option>
                  ))}
                  <option value="__new__">+ Create new chapter</option>
                </select>
                {state.errors.chapter && (
                  <div style={{ 
                    color: '#dc2626', 
                    fontSize: '0.875rem', 
                    marginTop: '4px',
                    fontWeight: '500'
                  }}>
                    {state.errors.chapter}
                  </div>
                )}
              </div>
            </div>

            {/* Custom Chapter Name Input */}
            {state.isCreatingNewChapter && (
              <div style={{ marginTop: '16px' }}>
                <label htmlFor="custom-chapter" style={{ 
                  display: 'block', 
                  marginBottom: '8px', 
                  fontWeight: '600',
                  color: '#374151'
                }}>
                  New Chapter Name
                </label>
                <input
                  id="custom-chapter"
                  type="text"
                  value={state.customChapterName}
                  onChange={handleCustomChapterNameChange}
                  placeholder="Enter chapter name..."
                  disabled={isProcessing}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '1rem'
                  }}
                />
                {state.errors.customChapterName && (
                  <div style={{ 
                    color: '#dc2626', 
                    fontSize: '0.875rem', 
                    marginTop: '4px',
                    fontWeight: '500'
                  }}>
                    {state.errors.customChapterName}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="modal-actions">
            <button
              type="button"
              onClick={handleClose}
              disabled={isProcessing}
              style={{
                padding: '10px 20px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                background: 'white',
                color: '#374151',
                cursor: isProcessing ? 'not-allowed' : 'pointer',
                opacity: isProcessing ? 0.6 : 1
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isProcessing || !state.file || (!state.chapter && !state.isCreatingNewChapter)}
              style={{
                padding: '10px 20px',
                border: 'none',
                borderRadius: '6px',
                background: isProcessing || !state.file || (!state.chapter && !state.isCreatingNewChapter)
                  ? '#9ca3af' 
                  : 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                color: 'white',
                cursor: isProcessing || !state.file || (!state.chapter && !state.isCreatingNewChapter)
                  ? 'not-allowed' 
                  : 'pointer',
                fontWeight: '600'
              }}
            >
              {isProcessing ? 'Uploading...' : 'Upload File'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FileUploadModal;