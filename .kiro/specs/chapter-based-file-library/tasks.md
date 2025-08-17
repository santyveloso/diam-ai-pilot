# Implementation Plan

- [x] 1. Set up backend file library service and data structures

  - Create FileLibraryService class with in-memory storage using Map data structures
  - Implement core CRUD operations for files and chapters
  - Add file ID generation and validation utilities
  - _Requirements: 5.1, 5.2_

- [x] 2. Create backend API endpoints for file library management

  - Implement POST /api/files/upload endpoint with chapter assignment
  - Implement GET /api/files/library endpoint to retrieve organized file structure
  - Implement GET /api/files/:fileId endpoint for individual file access
  - Implement DELETE /api/files/:fileId endpoint for file removal
  - Implement PUT /api/files/chapters/:oldName endpoint for chapter renaming
  - _Requirements: 1.1, 1.2, 1.3, 4.1, 4.2, 4.3_

- [x] 3. Modify existing /api/ask endpoint to support file library

  - Update endpoint to accept fileId parameter instead of file upload
  - Integrate with FileLibraryService to retrieve file content by ID
  - Maintain backward compatibility and existing error handling
  - Add file reference validation and error responses
  - _Requirements: 6.1, 6.2, 6.3_

- [x] 4. Create frontend data types and interfaces

  - Define LibraryFile, Chapter, and ChapterFiles interfaces
  - Create API request/response types for new endpoints
  - Update existing types to support file library functionality
  - Add error types for file library operations
  - _Requirements: 1.1, 2.1, 3.1_

- [x] 5. Implement FileLibraryPanel component

  - Create expandable chapter sections with file listings
  - Implement file selection with visual active state indicators
  - Add chapter expansion/collapse functionality
  - Integrate with API service for file library data
  - Handle loading states and error display
  - _Requirements: 2.1, 2.2, 3.1, 3.2_

- [x] 6. Implement FileUploadModal component

  - Create modal dialog with file upload drag-and-drop functionality
  - Implement chapter selection dropdown with existing chapters
  - Add new chapter creation input field
  - Integrate file validation and upload progress indication
  - Handle upload success/error states and user feedback
  - _Requirements: 1.1, 1.2, 1.3_

- [x] 7. Create frontend API service functions

  - Implement uploadFile function for POST /api/files/upload
  - Implement getFileLibrary function for GET /api/files/library
  - Implement deleteFile function for DELETE /api/files/:fileId
  - Implement renameChapter function for PUT /api/files/chapters/:oldName
  - Add error handling and response validation for all functions
  - _Requirements: 1.1, 2.1, 4.1, 4.2, 4.3_

- [x] 8. Integrate file library components into main App component

  - Add FileLibraryPanel to left sidebar replacing static chapter list
  - Add FileUploadModal with trigger from header upload button
  - Update app state to track selected file ID instead of File object
  - Modify question submission to use selected file ID
  - Handle file selection state changes and UI updates
  - _Requirements: 2.2, 3.1, 3.2, 6.4_

- [x] 9. Update QuestionInput component for file library integration

  - Modify component to show selected file name and chapter
  - Add file selection prompt when no file is selected
  - Update disabled state logic to check for selected file ID
  - Maintain existing question submission functionality
  - _Requirements: 3.3, 6.4_

- [x] 10. Add file management functionality for teachers

  - Implement delete file action in FileLibraryPanel
  - Add chapter rename functionality with inline editing
  - Create confirmation dialogs for destructive actions
  - Add teacher-only UI elements and permissions checking
  - _Requirements: 4.1, 4.2, 4.3, 4.4_

- [x] 11. Implement error handling and validation

  - Add comprehensive error handling for all file library operations
  - Implement client-side validation for file uploads and chapter names
  - Create user-friendly error messages for common failure scenarios
  - Add retry mechanisms for transient network failures
  - _Requirements: 1.4, 2.4, 4.4, 6.4_

- [x] 12. Add CSS styles for new components

  - Style FileLibraryPanel to match existing Moodle-inspired design
  - Create modal styles for FileUploadModal component
  - Add file selection states and hover effects
  - Implement responsive design for mobile compatibility
  - Add loading states and progress indicators
  - _Requirements: 2.1, 2.2, 3.1_

- [x] 13. Write unit tests for backend services

  - Test FileLibraryService CRUD operations and error handling
  - Test new API endpoints with various input scenarios
  - Test modified /api/ask endpoint with file ID parameter
  - Verify error responses and validation logic
  - _Requirements: 1.1, 1.2, 4.1, 6.1_

- [x] 14. Write unit tests for frontend components

  - Test FileLibraryPanel file selection and chapter expansion
  - Test FileUploadModal form validation and upload functionality
  - Test App component integration with file library state
  - Test error handling and loading states
  - _Requirements: 2.1, 2.2, 3.1, 6.4_

- [x] 15. Create integration tests for complete workflows
  - Test end-to-end file upload and organization workflow
  - Test file selection to question submission workflow
  - Test chapter management operations (create, rename, delete)
  - Verify cross-component state synchronization
  - _Requirements: 1.1, 2.1, 4.1, 6.1_
