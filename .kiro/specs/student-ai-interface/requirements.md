# Requirements Document

## Introduction

UNDEFINED is an educational AI application prototype designed to help students in the DIAM (Desenvolvimento para Internet e Aplicações Móveis) course at ISCTE better understand course content. The application allows students to upload professor's teaching materials (PDFs) and ask questions in natural language, receiving AI-generated responses based on the uploaded content. This first version focuses on validating the core interaction flow between students, content, and AI without user authentication or persistent storage.

## Requirements

### Requirement 1

**User Story:** As a student, I want to upload PDF files containing course materials, so that I can ask questions about the content within those documents.

#### Acceptance Criteria

1. WHEN a student accesses the application THEN the system SHALL display a clean, intuitive user interface
2. WHEN a student clicks on the file upload area THEN the system SHALL open a file selection dialog
3. WHEN a student selects a file THEN the system SHALL only accept PDF file formats
4. IF a student attempts to upload a non-PDF file THEN the system SHALL display an error message and reject the upload
5. WHEN a PDF file is successfully selected THEN the system SHALL display the filename to confirm the upload
6. WHEN a PDF file is uploaded THEN the system SHALL store the file content temporarily for processing

### Requirement 2

**User Story:** As a student, I want to ask questions in natural language about the uploaded materials, so that I can get AI-generated explanations and clarifications.

#### Acceptance Criteria

1. WHEN a student has uploaded a PDF THEN the system SHALL enable a text input field for questions
2. WHEN a student types a question THEN the system SHALL accept natural language input in Portuguese or English
3. WHEN a student submits a question THEN the system SHALL validate that both a PDF and question are present
4. IF no PDF is uploaded THEN the system SHALL prevent question submission and display an appropriate message
5. WHEN a valid question is submitted THEN the system SHALL send the question and PDF content to the backend for processing

### Requirement 3

**User Story:** As a student, I want to receive AI-generated responses to my questions, so that I can better understand the course content.

#### Acceptance Criteria

1. WHEN the backend receives a question and PDF content THEN the system SHALL process the input using Gemini 2.5 Flash
2. WHEN processing is complete THEN the system SHALL return an AI-generated response based on the uploaded content
3. WHEN a response is received THEN the system SHALL display it clearly in the user interface
4. WHEN processing takes time THEN the system SHALL show a loading indicator to inform the student
5. IF an error occurs during processing THEN the system SHALL display a user-friendly error message

### Requirement 4

**User Story:** As a student, I want the application to be responsive and easy to use, so that I can focus on learning rather than struggling with the interface.

#### Acceptance Criteria

1. WHEN a student accesses the application on different devices THEN the system SHALL display a responsive design that works on desktop and mobile
2. WHEN a student interacts with the interface THEN the system SHALL provide clear visual feedback for all actions
3. WHEN a student uploads a file or submits a question THEN the system SHALL provide immediate feedback about the action status
4. WHEN displaying AI responses THEN the system SHALL format the text for readability with proper spacing and structure
5. WHEN the application loads THEN the system SHALL display within 3 seconds on a standard internet connection

### Requirement 5

**User Story:** As a developer, I want the application to have a simple architecture without authentication or database, so that we can quickly validate the core concept.

#### Acceptance Criteria

1. WHEN the application starts THEN the system SHALL not require user login or registration
2. WHEN processing requests THEN the system SHALL handle file uploads and questions without persistent storage
3. WHEN a session ends THEN the system SHALL not retain any uploaded files or conversation history
4. WHEN the backend processes requests THEN the system SHALL use Node.js with Gemini 2.5 Flash integration
5. WHEN the frontend renders THEN the system SHALL use React with a clean, minimal design