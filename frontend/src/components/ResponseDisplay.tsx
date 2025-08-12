import React, { useEffect, useRef } from 'react';
import { ResponseDisplayProps } from '../types';

const ResponseDisplay: React.FC<ResponseDisplayProps> = ({
  response,
  isLoading,
  error,
}) => {
  const responseRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to response when it appears
  useEffect(() => {
    if (response && responseRef.current) {
      responseRef.current.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'start' 
      });
    }
  }, [response]);

  // Format response text with basic markdown-like formatting
  const formatResponse = (text: string): string => {
    return text
      // Convert **bold** to <strong>
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      // Convert *italic* to <em>
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      // Convert line breaks to <br>
      .replace(/\n/g, '<br>')
      // Convert numbered lists
      .replace(/^\d+\.\s/gm, '<br>$&')
      // Convert bullet points
      .replace(/^[-•]\s/gm, '<br>$&');
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="response-display loading-state" role="status" aria-live="polite">
        <div className="response-header">
          <h3 className="response-title">Processing your question...</h3>
        </div>
        <div className="response-content">
          <div className="loading-container">
            <div className="response-spinner"></div>
            <div className="loading-text">
              <p>Analyzing your PDF content</p>
              <p className="loading-subtitle">This may take a few moments</p>
            </div>
          </div>
          <div className="loading-progress">
            <div className="progress-bar">
              <div className="progress-fill"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="response-display error-state" role="alert" aria-live="assertive">
        <div className="response-header">
          <h3 className="response-title error">Something went wrong</h3>
        </div>
        <div className="response-content">
          <div className="error-container">
            <div className="error-icon">⚠️</div>
            <div className="error-message">
              <p className="error-primary">{error}</p>
              <p className="error-secondary">
                Please try again or check your internet connection.
              </p>
            </div>
          </div>
          <div className="error-actions">
            <button 
              className="retry-button"
              onClick={() => window.location.reload()}
              type="button"
            >
              Refresh Page
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Success state with response
  if (response) {
    return (
      <div 
        ref={responseRef}
        className="response-display success-state" 
        role="region" 
        aria-live="polite"
        aria-label="AI Response"
      >
        <div className="response-header">
          <h3 className="response-title success">AI Response</h3>
          <div className="response-meta">
            <span className="response-timestamp">
              {new Date().toLocaleTimeString()}
            </span>
          </div>
        </div>
        <div className="response-content">
          <div className="response-text">
            <div className="formatted-response">
              {response.split('\n').map((line, index) => (
                <p key={index} style={{ margin: '0.5rem 0' }}>
                  {line.replace(/\*\*(.*?)\*\*/g, '$1').replace(/\*(.*?)\*/g, '$1')}
                </p>
              ))}
            </div>
          </div>
          <div className="response-footer">
            <div className="response-actions">
              <button 
                className="copy-button"
                onClick={() => {
                  navigator.clipboard.writeText(response);
                  // Could add toast notification here
                }}
                type="button"
                title="Copy response to clipboard"
              >
                📋 Copy
              </button>
            </div>
            <div className="response-disclaimer">
              <p>
                AI-generated response based on your uploaded content. 
                Please verify important information.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Empty state (no response yet)
  return (
    <div className="response-display empty-state">
      <div className="response-content">
        <div className="empty-container">
          <div className="empty-icon">💬</div>
          <div className="empty-message">
            <h3 className="empty-title">Ready to help!</h3>
            <p className="empty-subtitle">
              Upload a PDF and ask a question to get started.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResponseDisplay;