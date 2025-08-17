import React, { useState } from 'react';
import FileUploadModal from './FileUploadModal';
import { LibraryFile } from '../types';

/**
 * Example component showing how to integrate FileUploadModal
 * This demonstrates the typical usage pattern for the modal
 */
const FileUploadModalExample: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<LibraryFile[]>([]);
  
  // Example existing chapters (would come from API in real app)
  const existingChapters = ['Introduction', 'Chapter 1', 'Chapter 2', 'Conclusion'];

  const handleUploadSuccess = (file: LibraryFile) => {
    console.log('File uploaded successfully:', file);
    setUploadedFiles(prev => [...prev, file]);
    // In real app, you would refresh the file library here
  };

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  return (
    <div style={{ padding: '20px' }}>
      <h2>File Upload Modal Example</h2>
      
      <button
        onClick={openModal}
        style={{
          padding: '12px 24px',
          background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
          color: 'white',
          border: 'none',
          borderRadius: '6px',
          cursor: 'pointer',
          fontWeight: '600',
          fontSize: '16px'
        }}
      >
        Upload Course Material
      </button>

      {uploadedFiles.length > 0 && (
        <div style={{ marginTop: '20px' }}>
          <h3>Uploaded Files:</h3>
          <ul>
            {uploadedFiles.map(file => (
              <li key={file.id}>
                <strong>{file.originalName}</strong> - {file.chapter} 
                <span style={{ color: '#666', fontSize: '14px' }}>
                  ({new Date(file.uploadedAt).toLocaleDateString()})
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <FileUploadModal
        isOpen={isModalOpen}
        onClose={closeModal}
        onUploadSuccess={handleUploadSuccess}
        existingChapters={existingChapters}
      />
    </div>
  );
};

export default FileUploadModalExample;