import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import User from '../model/user.js';
import logger from '../utils/logger.js';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

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
  }
};

export default authService;