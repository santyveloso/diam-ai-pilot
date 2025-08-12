import { OAuth2Client } from 'google-auth-library';
import jwt from 'jsonwebtoken';
import { env } from '../config/environment';
import { logger } from './logger';

export interface User {
  id: string;
  email: string;
  name: string;
  picture?: string;
  verified: boolean;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

class AuthService {
  private googleClient: OAuth2Client;
  private users: Map<string, User> = new Map(); // In-memory storage for demo

  constructor() {
    this.googleClient = new OAuth2Client(
      env.googleClientId,
      env.googleClientSecret,
      env.googleRedirectUri
    );
  }

  async verifyGoogleToken(token: string): Promise<User | null> {
    try {
      const ticket = await this.googleClient.verifyIdToken({
        idToken: token,
        audience: env.googleClientId,
      });

      const payload = ticket.getPayload();
      if (!payload) {
        logger.error('Invalid Google token payload');
        return null;
      }

      const user: User = {
        id: payload.sub,
        email: payload.email!,
        name: payload.name!,
        picture: payload.picture,
        verified: payload.email_verified || false,
      };

      // Store user in memory (in production, use a database)
      this.users.set(user.id, user);
      
      logger.info('User authenticated via Google', { userId: user.id, email: user.email });
      return user;
    } catch (error) {
      logger.error('Google token verification failed', { error: error instanceof Error ? error.message : 'Unknown error' });
      return null;
    }
  }

  generateTokens(user: User): AuthTokens {
    const accessToken = jwt.sign(
      { 
        userId: user.id, 
        email: user.email,
        name: user.name 
      },
      env.jwtSecret,
      { expiresIn: '1h' }
    );

    const refreshToken = jwt.sign(
      { userId: user.id },
      env.jwtSecret,
      { expiresIn: '7d' }
    );

    return { accessToken, refreshToken };
  }

  verifyAccessToken(token: string): User | null {
    try {
      const decoded = jwt.verify(token, env.jwtSecret) as any;
      const user = this.users.get(decoded.userId);
      return user || null;
    } catch (error) {
      logger.error('Access token verification failed', { error: error instanceof Error ? error.message : 'Unknown error' });
      return null;
    }
  }

  refreshAccessToken(refreshToken: string): string | null {
    try {
      const decoded = jwt.verify(refreshToken, env.jwtSecret) as any;
      const user = this.users.get(decoded.userId);
      
      if (!user) {
        return null;
      }

      const newAccessToken = jwt.sign(
        { 
          userId: user.id, 
          email: user.email,
          name: user.name 
        },
        env.jwtSecret,
        { expiresIn: '1h' }
      );

      return newAccessToken;
    } catch (error) {
      logger.error('Refresh token verification failed', { error: error instanceof Error ? error.message : 'Unknown error' });
      return null;
    }
  }

  getUserById(userId: string): User | null {
    return this.users.get(userId) || null;
  }
}

export const authService = new AuthService();