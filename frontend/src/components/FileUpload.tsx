import React, { useCallback, useState, useRef } from 'react';
import { FileUploadProps } from '../types';

const FileUpload: React.FC<FileUploadProps> = ({
  onFileSelect,
  selectedFile,
  isUploading,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // File validation constants
  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
  const ALLOWED_TYPES = ['application/pdf'];

  const validateFile = useCallback((file: File): string | null => {
    // Check file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return 'Please select a PDF file only.';
    }

    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      return 'File size must be less than 10MB.';
    }

    // Check file extension as additional validation
    const fileName = file.name.toLowerCase();
    if (!fileName.endsWith('.pdf')) {
      return 'Please select a PDF file only.';
    }

    return null;
  }, []);

  const handleFileSelection = useCallback((file: File) => {
    const error = validateFile(file);
    
    if (error) {
      setValidationError(error);
      return;
    }

    setValidationError(null);
    onFileSelect(file);
  }, [validateFile, onFileSelect]);

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelection(files[0]);
    }
  }, [handleFileSelection]);

  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelection(files[0]);
    }
  }, [handleFileSelection]);

  const handleClick = useCallback(() => {
    if (!isUploading && fileInputRef.current) {
      fileInputRef.current.click();
    }
  }, [isUploading]);

  const handleClearFile = useCallback(() => {
    setValidationError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    // Clear the selected file by calling onFileSelect with null
    // We need to cast null as File for TypeScript, but the parent component should handle null
    onFileSelect(null as any);
  }, [onFileSelect]);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="file-upload">
      <div
        className={`file-upload-area ${isDragOver ? 'drag-over' : ''} ${
          selectedFile ? 'has-file' : ''
        } ${isUploading ? 'uploading' : ''}`}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={handleClick}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleClick();
          }
        }}
        aria-label={selectedFile ? `Selected file: ${selectedFile.name}` : 'Click or drag to upload PDF file'}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,application/pdf"
          onChange={handleFileInputChange}
          style={{ display: 'none' }}
          disabled={isUploading}
          aria-hidden="true"
        />

        {isUploading ? (
          <div className="upload-status uploading">
            <div className="upload-spinner"></div>
            <p>Uploading...</p>
          </div>
        ) : selectedFile ? (
          <div className="upload-status success">
            <div className="file-icon">📄</div>
            <div className="file-info">
              <p className="file-name">{selectedFile.name}</p>
              <p className="file-size">{formatFileSize(selectedFile.size)}</p>
            </div>
            <button
              className="clear-file-button"
              onClick={(e) => {
                e.stopPropagation();
                handleClearFile();
              }}
              aria-label="Remove selected file"
              type="button"
            >
              ×
            </button>
          </div>
        ) : (
          <div className="upload-prompt">
            <div className="upload-icon">📁</div>
            <p className="upload-text">
              <strong>Click to upload</strong> or drag and drop
            </p>
            <p className="upload-hint">PDF files only (max 10MB)</p>
          </div>
        )}
      </div>

      {validationError && (
        <div className="validation-error" role="alert">
          {validationError}
        </div>
      )}
    </div>
  );
};

export default FileUpload;