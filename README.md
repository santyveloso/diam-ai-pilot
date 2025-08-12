# BridgEdu - DIAM AI Pilot

Educational AI prototype designed for the DIAM course at ISCTE university with Google OAuth authentication.

## Features

- 🔐 **Google OAuth Authentication** - Secure login with Gmail accounts
- 📚 **PDF Upload & Processing** - Upload course materials for AI analysis
- 🤖 **AI-Powered Q&A** - Get contextual answers using Google Gemini 2.5 Flash
- 🌍 **Bilingual Support** - Portuguese/English language detection
- 📱 **Responsive Design** - Works on desktop and mobile devices
- 🔒 **Secure & Stateless** - No persistent data storage for privacy

## Quick Start

### Prerequisites

- Node.js 16+ and npm
- Google Cloud Project with OAuth 2.0 credentials
- Google Gemini API key

### 1. Clone and Install

```bash
git clone <repository-url>
cd diam-ai-pilot

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 2. Configure Environment Variables

**Backend (.env):**
```bash
cd backend
cp .env.example .env
# Edit .env with your values:
# - GEMINI_API_KEY=your_gemini_api_key
# - GOOGLE_CLIENT_ID=your_google_client_id
# - GOOGLE_CLIENT_SECRET=your_google_client_secret
# - JWT_SECRET=your_secure_jwt_secret
```

**Frontend (.env):**
```bash
cd frontend
cp .env.example .env
# Edit .env with your values:
# - REACT_APP_GOOGLE_CLIENT_ID=your_google_client_id
```

### 3. Set Up Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable Google+ API
4. Create OAuth 2.0 credentials:
   - Application type: Web application
   - Authorized origins: `http://localhost:3000`
   - Authorized redirect URIs: `http://localhost:3000`

### 4. Run the Application

```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm start
```

Visit `http://localhost:3000` and log in with your Google account.

## Usage

1. **Login** - Click "Sign in with Google" on the login page
2. **Upload PDF** - Use the "Carregar ficheiro" button to upload course materials
3. **Ask Questions** - Type your questions in Portuguese or English
4. **Get AI Responses** - Receive contextual answers based on your uploaded content
5. **Logout** - Click your profile picture and select "Sair"

## Architecture

- **Frontend**: React 18 + TypeScript + Axios
- **Backend**: Node.js + Express + TypeScript
- **Authentication**: Google OAuth 2.0 + JWT
- **AI**: Google Gemini 2.5 Flash
- **File Processing**: PDF-parse for text extraction

## Security Features

- JWT-based authentication with refresh tokens
- File validation (PDF only, 10MB limit)
- Rate limiting (2 requests per minute)
- CORS protection
- Input sanitization
- Temporary file storage with auto-cleanup

## Development

```bash
# Run tests
npm test

# Type checking
npm run type-check

# Build for production
npm run build
```

## Environment Variables Reference

### Backend
- `GEMINI_API_KEY` - Google Gemini API key
- `GOOGLE_CLIENT_ID` - Google OAuth client ID
- `GOOGLE_CLIENT_SECRET` - Google OAuth client secret
- `JWT_SECRET` - Secret for JWT token signing
- `PORT` - Server port (default: 3001)
- `FRONTEND_URL` - Frontend URL for CORS (default: http://localhost:3000)

### Frontend
- `REACT_APP_API_URL` - Backend API URL (default: http://localhost:3001)
- `REACT_APP_GOOGLE_CLIENT_ID` - Google OAuth client ID

## License

Educational use only - ISCTE DIAM Course 2025/2026