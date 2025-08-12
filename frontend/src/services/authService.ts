declare global {
  interface Window {
    google: any;
  }
}

export interface User {
  id: string;
  email: string;
  name: string;
  picture?: string;
}

class AuthService {
  private readonly GOOGLE_TOKEN_KEY = 'google_id_token';
  private readonly USER_KEY = 'user_data';

  loginWithGoogle(credential: string, userInfo: any): boolean {
    try {
      // Store the Google ID token and user info
      localStorage.setItem(this.GOOGLE_TOKEN_KEY, credential);
      localStorage.setItem(this.USER_KEY, JSON.stringify(userInfo));
      return true;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  }

  getCurrentUser(): User | null {
    try {
      const userData = localStorage.getItem(this.USER_KEY);
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error('Get current user error:', error);
      return null;
    }
  }

  getGoogleToken(): string | null {
    return localStorage.getItem(this.GOOGLE_TOKEN_KEY);
  }

  logout(): void {
    localStorage.removeItem(this.GOOGLE_TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    
    // Sign out from Google
    if (window.google) {
      window.google.accounts.id.disableAutoSelect();
    }
  }

  isAuthenticated(): boolean {
    return !!this.getGoogleToken() && !!this.getCurrentUser();
  }
}

export const authService = new AuthService();