/**
 * server.js - Application Entry Point
 * Initializes Express + Apollo GraphQL server, connects to MongoDB,
 * and wires up JWT-based authentication context for every request.
 *
 * Stack: Express, Apollo Server 4, Mongoose, JWT
 * Port: process.env.PORT || 4002
 * GraphQL endpoint: /graphql
 */
import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import cors from 'cors';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import { typeDefs } from './graphQL/typeDefs.js';
import { resolvers } from './graphQL/resolvers.js';
import User from './model/user.js';
import Issue from './model/issue.js';
import aiService from './services/aiService.js';

const app = express();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

/**
 * Decode and verify a JWT from the Authorization header.
 * Returns the decoded payload (userId, email, role) or null if invalid/missing.
 * @param {string|undefined} token - Raw token string (without 'Bearer ' prefix)
 * @returns {Object|null}
 */
const getUser = (token) => {
    if (!token) return null;
    try {
        return jwt.verify(token, JWT_SECRET);
    } catch (error) {
        return null;
    }
};

/**
 * Connect to MongoDB using MONGO_URI env variable.
 * Exits process on failure to prevent server running without a database.
 */
const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/civic-issues');
        console.log('MongoDB connected to civic-issues database');
    } catch (error) {
        console.error('MongoDB connection failed:', error);
        process.exit(1);
    }
};

/**
 * Bootstrap the Apollo + Express server.
 * Order: connect DB → start Apollo → register middleware → listen.
 */
const startServer = async () => {
    await connectDB();

    const server = new ApolloServer({
        typeDefs,
        resolvers,
    });

    await server.start();

    app.use(cors());
    app.use(express.json());
    app.use(
        '/graphql',
        expressMiddleware(server, {
            context: async ({ req }) => {
                const token = req.headers.authorization?.replace('Bearer ', '');
                const user = getUser(token);
                return {
                    User,
                    Issue,
                    user,
                    JWT_SECRET,
                    aiService,
                };
            },
        })
    );

    const PORT = process.env.PORT || 4002;
    app.listen(PORT, () => {
        console.log(`Civic Issue Tracker Service running on port ${PORT}`);
        console.log(`GraphQL endpoint: http://localhost:${PORT}/graphql`);
    });
};

startServer().catch(error => {
    console.error('Server startup failed:', error);
    process.exit(1);
});
