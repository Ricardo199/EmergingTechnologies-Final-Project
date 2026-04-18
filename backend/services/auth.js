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
const authService = {
  async register(userData) {
    const { username, email, password, role = 'resident' } = userData;

    try {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        throw new Error('User already exists');
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const user = new User({
        username,
        email,
        password: hashedPassword,
        role: role || 'resident'
      });

      await user.save();
      logger.logAuth('register', email, true);

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

  async login(email, password) {

    try {
      const user = await User.findOne({ email });
      if (!user) {
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

  generateToken(user) {
    const payload = {
      userId: user._id,
      email: user.email,
      role: user.role
    };

    return jwt.sign(payload, JWT_SECRET, {
      expiresIn: '7d'
    });
  },

  verifyToken(token) {
    try {
      return jwt.verify(token, JWT_SECRET);
    } catch (error) {
      return null;
    }
  },

  async googleSignIn(Token) {
    let payload;
    try {
      const ticket = await googleAuthClient.verifyIdToken({
        idToken: Token,
        audience: GOOGLE_CLIENT_ID
      });
      payload = ticket.getPayload();
    } catch (error) {
      logger.logAuth('googleSignIn', 'unknown', false, error);
      throw new Error('Google Sign-In failed, error: ' + error.message);
    }
    const { email, name } = payload;
    let user = await User.findOne({ username: email });
    if (!user) {
      user = new User({
        username: email,
        email,
        password: '',
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

  async githubSignIn(code) {

    const url = 'https://github.com/login/oauth/access_token';
    let accessToken, userData, authPayload;
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { Accept: "application/json", "Accept-encoding": "application/json" },
        body: JSON.stringify({
          client_id: process.env.GITHUB_CLIENT_ID,
          client_secret: process.env.GITHUB_CLIENT_SECRET,
          code
        })
      });
      if (!response.ok) {
        throw new Error('GitHub authentication failed');
      }
      const tokenData = await response.json();

      const userResponse = await fetch('https://api.github.com/user', {
        method: "GET",
        headers: {
          Authorization: `token ${tokenData.access_token}`,
          Accept: "application/vnd.github.v3+json",
          'X-GitHub-Api-Version': '2022-11-28'
        }
      });
      if (!userResponse.ok) {
        throw new Error('Failed to fetch GitHub user data');
      }
      userData = await userResponse.json();
      accessToken = tokenData.access_token;
    } catch (error) {
      logger.logAuth('githubSignIn', 'unknown', false, error);
      throw new Error('GitHub authentication failed, error: ' + error.message);
    }
    if (!accessToken) {
      throw new Error('GitHub authentication failed');
    }

    let user = await User.findOne({ email: userData.email });
    if (!user) {
      user = new User({
        username: userData.login,
        email: userData.email,
        password: '',
        role: 'resident'
      });
      await user.save();
    };
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
    logger.logAuth('githubSignIn', user.email, true);
    return authPayload;
  },
};

export default authService;