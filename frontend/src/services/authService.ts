import axios from 'axios';

export interface User {
  id: string;
  email: string;
  name: string;
  picture?: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface LoginResponse {
  success: boolean;
  user: User;
  tokens: AuthTokens;
}

class AuthService {
  private readonly API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';
  private readonly ACCESS_TOKEN_KEY = 'bridgedu_access_token';
  private readonly REFRESH_TOKEN_KEY = 'bridgedu_refresh_token';

  constructor() {
    // Set up axios interceptor for automatic token attachment
    axios.interceptors.request.use((config) => {
      const token = this.getAccessToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    // Set up axios interceptor for automatic token refresh
    axios.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;
        
        if (error.response?.status === 403 && !originalRequest._retry) {
          originalRequest._retry = true;
          
          const refreshed = await this.refreshAccessToken();
          if (refreshed) {
            const token = this.getAccessToken();
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return axios(originalRequest);
          }
        }
        
        return Promise.reject(error);
      }
    );
  }

  async loginWithGoogle(googleToken: string): Promise<LoginResponse> {
    try {
      const response = await axios.post(`${this.API_BASE_URL}/auth/google`, {
        token: googleToken,
      });

      if (response.data.success) {
        const { user, tokens } = response.data.data;
        this.storeTokens(tokens);
        return { success: true, user, tokens };
      }

      throw new Error('Login failed');
    } catch (error) {
      console.error('Google login error:', error);
      throw error;
    }
  }

  async getCurrentUser(): Promise<User | null> {
    try {
      const token = this.getAccessToken();
      if (!token) {
        return null;
      }

      const response = await axios.get(`${this.API_BASE_URL}/auth/me`);
      
      if (response.data.success) {
        return response.data.data.user;
      }

      return null;
    } catch (error) {
      console.error('Get current user error:', error);
      return null;
    }
  }

  async refreshAccessToken(): Promise<boolean> {
    try {
      const refreshToken = this.getRefreshToken();
      if (!refreshToken) {
        return false;
      }

      const response = await axios.post(`${this.API_BASE_URL}/auth/refresh`, {
        refreshToken,
      });

      if (response.data.success) {
        const { accessToken } = response.data.data;
        localStorage.setItem(this.ACCESS_TOKEN_KEY, accessToken);
        return true;
      }

      return false;
    } catch (error) {
      console.error('Token refresh error:', error);
      return false;
    }
  }

  async logout(): Promise<void> {
    try {
      // Call logout endpoint to log the action
      await axios.post(`${this.API_BASE_URL}/auth/logout`);
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      this.clearTokens();
    }
  }

  private storeTokens(tokens: AuthTokens): void {
    localStorage.setItem(this.ACCESS_TOKEN_KEY, tokens.accessToken);
    localStorage.setItem(this.REFRESH_TOKEN_KEY, tokens.refreshToken);
  }

  private getAccessToken(): string | null {
    return localStorage.getItem(this.ACCESS_TOKEN_KEY);
  }

  private getRefreshToken(): string | null {
    return localStorage.getItem(this.REFRESH_TOKEN_KEY);
  }

  clearTokens(): void {
    localStorage.removeItem(this.ACCESS_TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_TOKEN_KEY);
  }

  isAuthenticated(): boolean {
    return !!this.getAccessToken();
  }
}

export const authService = new AuthService();