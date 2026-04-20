import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import User from '../model/user.js';
import logger from '../utils/logger.js';
import { OAuth2Client } from 'google-auth-library';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || 'your-client-id';
const googleAuthClient = new OAuth2Client(GOOGLE_CLIENT_ID);

/**
 * Authentication Service
 * Handles user registration, login, OAuth flows (Google, GitHub), and JWT token generation.
 * All auth methods return AuthPayload: { accessToken, user }
 */
const authService = {
  /**
   * Register a new user with email and password
   * @async
   * @param {Object} userData - User registration data
   * @param {string} userData.username - Unique username
   * @param {string} userData.email - Unique email address
   * @param {string} userData.password - Plain text password (will be hashed)
   * @param {string} [userData.role='resident'] - User role (resident/staff/advocate)
   * @returns {Promise<{accessToken: string, user: Object}>} AuthPayload with JWT token
   * @throws {Error} If user already exists or validation fails
   * @example
   * const result = await authService.register({
   *   username: 'john_doe',
   *   email: 'john@example.com',
   *   password: 'securepass123',
   *   role: 'resident'
   * });
   */
  async register(userData) {
    const { username, email, password, role = 'resident' } = userData;

    try {
      // Check if user already exists to prevent duplicates
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        throw new Error('User already exists');
      }

      // Hash password using bcrypt (10 salt rounds) before storing
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create and save new user document
      const user = new User({
        username,
        email,
        password: hashedPassword,
        role: role || 'resident'
      });

      await user.save();
      logger.logAuth('register', email, true);

      // Generate JWT token for immediate login
      const token = this.generateToken(user);
      return {
        accessToken: token,
        user: {
          _id: user._id,
          username: user.username,
          email: user.email,
          role: user.role,
          createdAt: user.createdAt
        }
      };

    } catch (error) {
      logger.logAuth('register', email, false, error);
      throw error;
    }
  },

  /**
   * Authenticate user with email and password
   * @async
   * @param {string} email - User email
   * @param {string} password - User password (plain text)
   * @returns {Promise<{accessToken: string, user: Object}>} AuthPayload with JWT token
   * @throws {Error} If user not found or password is invalid
   * @example
   * const result = await authService.login('john@example.com', 'securepass123');
   */
  async login(email, password) {

    try {
      // Look up user by email
      const user = await User.findOne({ email });
      if (!user) {
        throw new Error('Invalid credentials');
      }

      // Compare provided password with hashed password in database
      if (!user.password) {
        throw new Error('Invalid credentials');
      }
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        throw new Error('Invalid credentials');
      }

      logger.logAuth('login', email, true);
      const token = this.generateToken(user);
      return {
        accessToken: token,
        user: {
          _id: user._id,
          username: user.username,
          email: user.email,
          role: user.role,
          createdAt: user.createdAt
        }
      };

    } catch (error) {
      logger.logAuth('login', email, false, error);
      throw error;
    }
  },

  /**
   * Generate a signed JWT token for a user
   * @param {Object} user - User document from MongoDB
   * @param {string} user._id - MongoDB user ID
   * @param {string} user.email - User email
   * @param {string} user.role - User role for authorization
   * @returns {string} Signed JWT token (expires in 7 days)
   * @example
   * const token = authService.generateToken(user);
   * // Token payload: { userId, email, role, exp }
   */
  generateToken(user) {
    // Payload contains minimal info needed for authorization checks
    const payload = {
      userId: user._id,
      email: user.email,
      role: user.role
    };

    // Sign token with 7-day expiration
    return jwt.sign(payload, JWT_SECRET, {
      expiresIn: '7d'
    });
  },

  /**
   * Verify and decode a JWT token
   * @param {string} token - JWT token to verify
   * @returns {Object|null} Decoded token payload if valid, null if invalid/expired
   * @example
   * const payload = authService.verifyToken(token);
   * if (payload) console.log(payload.userId);
   */
  verifyToken(token) {
    try {
      return jwt.verify(token, JWT_SECRET);
    } catch (error) {
      // Invalid or expired token returns null (safe error handling)
      return null;
    }
  },

  /**
   * Authenticate user via Google OAuth
   * Verifies Google ID token and finds/creates user in database
   * @async
   * @param {string} Token - Google ID token from frontend
   * @returns {Promise<{accessToken: string, user: Object}>} AuthPayload with JWT token
   * @throws {Error} If token verification fails
   * @example
   * const result = await authService.googleSignIn(googleCredential.credential);
   */
  async googleSignIn(Token) {
    let payload;
    try {
      // Verify Google token signature and authenticity
      const ticket = await googleAuthClient.verifyIdToken({
        idToken: Token,
        audience: GOOGLE_CLIENT_ID
      });
      // Extract user info from verified token
      payload = ticket.getPayload();
    } catch (error) {
      logger.logAuth('googleSignIn', 'unknown', false, error);
      throw new Error('Google Sign-In failed, error: ' + error.message);
    }
    const { email, name } = payload;
    
    // Find existing user or create new one (upsert pattern)
    let user = await User.findOne({ username: email });
    if (!user) {
      user = new User({
        username: email,
        email,
        password: null,
        role: 'resident'
      });
      await user.save();
    }
    
    logger.logAuth('googleSignIn', payload.email, true);
    const authPayload = {
      accessToken: this.generateToken(user),
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt
      }
    };
    return authPayload;
  },

  /**
   * Authenticate user via GitHub OAuth
   * Exchanges authorization code for access token and fetches user profile
   * @async
   * @param {string} code - Authorization code from GitHub OAuth flow
   * @returns {Promise<{accessToken: string, user: Object}>} AuthPayload with JWT token
   * @throws {Error} If code exchange or user fetch fails
   * @example
   * // After GitHub redirects back with ?code=...
   * const result = await authService.githubSignIn(code);
   */
  async githubSignIn(code) {
    const url = 'https://github.com/login/oauth/access_token';
    let accessToken, userData;

    // Step 1: Exchange authorization code for access token
    const response = await fetch(url, {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code,
        redirect_uri: 'http://localhost:5173/auth/github/callback'
      })
    });

    const tokenData = await response.json();
    console.log('[GitHub] token response:', JSON.stringify(tokenData));

    if (tokenData.error) {
      logger.logAuth('githubSignIn', 'unknown', false, new Error(tokenData.error));
      throw new Error(`GitHub token error: ${tokenData.error} — ${tokenData.error_description || ''}`);
    }

    accessToken = tokenData.access_token;
    if (!accessToken) {
      throw new Error('GitHub did not return an access token');
    }

    // Step 2: Fetch user profile
    const userResponse = await fetch('https://api.github.com/user', {
      headers: {
        Authorization: `token ${accessToken}`,
        Accept: 'application/vnd.github.v3+json',
        'X-GitHub-Api-Version': '2022-11-28'
      }
    });

    if (!userResponse.ok) {
      throw new Error(`GitHub user fetch failed: ${userResponse.status}`);
    }
    userData = await userResponse.json();
    console.log('[GitHub] user login:', userData.login, 'email:', userData.email);

    // Step 3: Find or create user
    const email = userData.email || `${userData.login}@github.local`;
    let user = await User.findOne({ email });
    if (!user) {
      user = new User({ username: userData.login, email, password: null, role: 'resident' });
      await user.save();
    }

    logger.logAuth('githubSignIn', user.email, true);
    return {
      accessToken: this.generateToken(user),
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt
      }
    };
  },
};

export default authService;