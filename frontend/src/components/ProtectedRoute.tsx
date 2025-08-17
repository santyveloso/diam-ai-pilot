import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Navigate, useLocation } from 'react-router-dom';
import LoginPage from './LoginPage';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const location = useLocation();

  console.log('ProtectedRoute: isAuthenticated:', isAuthenticated, 'isLoading:', isLoading, 'user:', user?.email);

  if (isLoading) {
    console.log('ProtectedRoute: Showing loading screen');
    return (
      <div className="loading-screen">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Carregando...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    console.log('ProtectedRoute: User not authenticated, showing login page');
    return <LoginPage />;
  }

  console.log('ProtectedRoute: User authenticated, showing protected content');
  return <>{children}</>;
};

export default ProtectedRoute;