/**
 * user.js - Mongoose User Schema
 * Defines the data model for platform users.
 *
 * Supports both email/password and OAuth (Google, GitHub) accounts.
 * OAuth users have password: null — no password validation is applied.
 * Roles control access: residents report issues, staff/advocates manage them.
 */
import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    // null for OAuth users (Google/GitHub) who authenticate without a password
    password: {
        type: String,
        required: false,
        default: null,
    },
    role: {
        type: String,
        enum: ['resident', 'staff', 'advocate'],
        default: 'resident',
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

export default mongoose.model('User', userSchema);