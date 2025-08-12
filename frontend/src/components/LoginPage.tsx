import React, { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import "./LoginPage.css";

declare global {
  interface Window {
    google: any;
  }
}

const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogleLogin = async (credentialResponse: any) => {
    try {
      setIsLoading(true);
      setError(null);

      // Safely decode the JWT to get user info
      if (!credentialResponse || !credentialResponse.credential) {
        throw new Error("Invalid credential response");
      }

      const tokenParts = credentialResponse.credential.split(".");
      if (tokenParts.length < 2) {
        throw new Error("Malformed JWT token");
      }

      // Convert base64url to standard base64
      let base64Payload = tokenParts[1];
      base64Payload = base64Payload.replace(/-/g, "+").replace(/_/g, "/");

      // Add padding if needed
      const padding = base64Payload.length % 4;
      if (padding) {
        base64Payload += "=".repeat(4 - padding);
      }

      // Safely decode the payload
      let payload: any;
      try {
        const decodedString = atob(base64Payload);
        payload = JSON.parse(decodedString);
      } catch (decodeError) {
        console.error("JWT decode error:", decodeError);
        throw new Error("Failed to decode JWT token");
      }

      // Validate required fields
      if (!payload.sub || !payload.email || !payload.name) {
        console.error("Missing required JWT fields:", payload);
        throw new Error("Invalid JWT payload - missing required fields");
      }

      const userInfo = {
        id: payload.sub,
        email: payload.email,
        name: payload.name,
        picture: payload.picture || null,
      };

      const success = login(credentialResponse.credential, userInfo);
      if (!success) {
        setError("Falha no login. Tente novamente.");
      }
    } catch (error) {
      console.error("Login error:", error);
      setError(
        "Erro durante o login. Verifique sua conexão e tente novamente."
      );
    } finally {
      setIsLoading(false);
    }
  };

  React.useEffect(() => {
    // Load Google Identity Services
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);

    script.onload = () => {
      if (window.google) {
        window.google.accounts.id.initialize({
          client_id: process.env.REACT_APP_GOOGLE_CLIENT_ID,
          callback: handleGoogleLogin,
          auto_select: false,
          cancel_on_tap_outside: true,
        });

        window.google.accounts.id.renderButton(
          document.getElementById("google-signin-button"),
          {
            theme: "outline",
            size: "large",
            width: 280,
            text: "signin_with",
            shape: "rectangular",
            logo_alignment: "left",
          }
        );
      }
    };

    return () => {
      document.head.removeChild(script);
    };
  }, []);

  return (
    <div className="login-page">
      <div className="login-container">
        {/* Header similar to main app */}
        <header className="login-header">
          <div className="brand-group">
            <h1 className="brand-title">BridgEdu</h1>
            <span className="brand-meta">2025/2026 • ISCTE</span>
          </div>
        </header>

        <main className="login-main">
          <div className="login-card">
            <div className="login-content">
              <div className="login-welcome">
                <h2>Bem-vindo ao BridgEdu</h2>
                <p>
                  Faça login com sua conta Google para acessar o assistente de
                  IA do curso DIAM
                </p>
              </div>

              {error && (
                <div className="login-error">
                  <span className="error-icon">⚠️</span>
                  <span>{error}</span>
                </div>
              )}

              <div className="login-form">
                <div className="google-signin-container">
                  {isLoading ? (
                    <div className="loading-button">
                      <div className="loading-spinner"></div>
                      <span>Fazendo login...</span>
                    </div>
                  ) : (
                    <div id="google-signin-button"></div>
                  )}
                </div>

                <div className="login-info">
                  <div className="info-item">
                    <span className="info-icon">📚</span>
                    <span>Acesso aos materiais do curso DIAM</span>
                  </div>
                  <div className="info-item">
                    <span className="info-icon">🤖</span>
                    <span>Assistente de IA personalizado</span>
                  </div>
                  <div className="info-item">
                    <span className="info-icon">💬</span>
                    <span>Perguntas e respostas em tempo real</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>

        <footer className="login-footer">
          <p>© 2024 ISCTE - DIAM Course AI Assistant</p>
        </footer>
      </div>
    </div>
  );
};

export default LoginPage;
