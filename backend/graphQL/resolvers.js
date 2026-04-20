import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import User from '../model/user.js';
import Issue from '../model/issue.js';
import logger from '../utils/logger.js';
import authService from '../services/auth.js';
import issueService from '../services/issuesService.js';

const requireAuth = (user) => {
    if (!user || !user.userId) {
        throw new Error('Not authenticated');
    }
    return user;
};

const requireStaff = (user) => {
    requireAuth(user);
    if (user.role !== 'staff') {
        throw new Error('Unauthorized: staff only');
    }
    return user;
};

const populateIssue = (query) => query.populate('reportedBy', 'username email role').populate('assignedTo', 'username email role');

export const resolvers = {
    Query: {
        me: async (_, __, { user }) => {
            requireAuth(user);
            return await User.findById(user.userId);
        },

        issue: async (_, { id }) => {
            try {
                if (!id) throw new Error('Issue ID required');
                return await populateIssue(Issue.findById(id));
            } catch (error) {
                throw new Error(`Failed to fetch issue: ${error.message}`);
            }
        },

        issues: async (_, { status, category, reporterId }) => {
            try {
                const filter = {};
                if (status) filter.status = status;
                if (category) filter.category = category;
                if (reporterId) filter.reportedBy = reporterId;
                return await populateIssue(Issue.find(filter).sort({ createdAt: -1 }));
            } catch (error) {
                throw new Error(`Failed to fetch issues: ${error.message}`);
            }
        },

        dashboardSummary: async () => {
            try {
                const totalOpen = await Issue.countDocuments({ status: { $in: ['reported', 'in_progress'] } });
                const totalResolved = await Issue.countDocuments({ status: 'resolved' });
                const highPriority = await Issue.countDocuments({ priority: 'high' });
                const byCategory = await Issue.aggregate([
                    { $group: { _id: '$category', count: { $sum: 1 } } },
                    { $project: { category: '$_id', count: 1, _id: 0 } },
                ]);
                return { totalOpen, totalResolved, highPriority, byCategory };
            } catch (error) {
                throw new Error(`Failed to fetch dashboard summary: ${error.message}`);
            }
        },

        searchIssues: async (_, { text }) => {
            try {
                if (!text || text.trim().length === 0) throw new Error('Search text required');
                const query = {
                    $or: [
                        { title: { $regex: text, $options: 'i' } },
                        { description: { $regex: text, $options: 'i' } },
                        { 'location.address': { $regex: text, $options: 'i' } },
                    ],
                };
                return await populateIssue(Issue.find(query));
            } catch (error) {
                throw new Error(`Search failed: ${error.message}`);
            }
        },

        aiSummary: async (_, { issueId }, { aiService }) => {
            const issue = await Issue.findById(issueId);
            if (!issue) {
                throw new Error('Issue not found');
            }
            return aiService.summarizeIssue(issue);
        },

        trendInsights: async (_, __, { aiService }) => {
            const issues = await Issue.find({});
            const trends = aiService.detectTrends(issues);
            return Object.entries(trends.byCategory).map(([category, count]) => ({
                category,
                count,
            }));
        },

        agentAnswer: async (_, { question }, { aiService }) => {
            console.log('agentAnswer query received with question:', question);
            const issues = await Issue.find({});
            console.log('Found', issues.length, 'issues in database');
            const answer = await aiService.answerQuestion(question, issues);
            console.log('AI service returned:', answer);
            return answer;
        },
    },

    Mutation: {
        signUp: async (_, { username, email, password, role }, { JWT_SECRET }) => {
            try {
                if (!username || !email || !password) throw new Error('Missing required fields');
                const result = await authService.register({ username, email, password, role });
                return result;
            } catch (error) {
                throw new Error(`Sign up failed: ${error.message}`);
            }
        },
        login: async (_, { email, password }, { JWT_SECRET }) => {
            try {
                if (!email || !password) throw new Error('Email and password required');
                const result = await authService.login(email, password);
                return result;
            } catch (error) {
                throw new Error(`Login failed: ${error.message}`);
            }
        },

        reportIssue: async (_, { input }, { user }) => {
            try {
                requireAuth(user);
                if (!input.title || !input.description || !input.category || !input.location) {
                    throw new Error('Missing required issue fields');
                }
                const issue = await Issue.create({
                    title: input.title,
                    description: input.description,
                    category: input.category,
                    priority: input.priority || 'medium',
                    status: 'reported',
                    location: {
                        type: input.location.type,
                        coordinates: input.location.coordinates,
                        address: input.location.address,
                    },
                    reportedBy: user.userId,
                });
                return await populateIssue(Issue.findById(issue._id));
            } catch (error) {
                throw new Error(`Failed to report issue: ${error.message}`);
            }
        },

        updateIssue: async (_, { id, status, priority, category, assignedTo, title, description }, { user }) => {
            try {
                requireStaff(user);
                const update = {};
                if (status) update.status = status;
                if (priority) update.priority = priority;
                if (category) update.category = category;
                if (assignedTo) update.assignedTo = assignedTo;
                if (title) update.title = title;
                if (description) update.description = description;
                update.updatedAt = new Date();
                const issue = await populateIssue(Issue.findByIdAndUpdate(id, update, { new: true }));
                if (!issue) throw new Error('Issue not found');
                return issue;
            } catch (error) {
                throw new Error(`Failed to update issue: ${error.message}`);
            }
        },

        assignIssue: async (_, { id, assignedTo }, { user }) => {
            requireStaff(user);
            const issue = await populateIssue(Issue.findByIdAndUpdate(id, { assignedTo, updatedAt: new Date() }, { new: true }));
            if (!issue) throw new Error('Issue not found');
            return issue;
        },

        resolveIssue: async (_, { id }, { user }) => {
            requireStaff(user);
            const issue = await populateIssue(Issue.findByIdAndUpdate(id, { status: 'resolved', updatedAt: new Date() }, { new: true }));
            if (!issue) throw new Error('Issue not found');
            return issue;
        },

        googleSignIn: async (_, { token }, { JWT_SECRET }) => {
            try {
                const result = await authService.googleSignIn(token);
                return result;
            } catch (error) {
                throw new Error(`Google Sign-In failed: ${error.message}`);
            }
        },

        githubSignIn: async (_, { code }, { JWT_SECRET }) => {
            try{
                const result = await authService.githubSignIn(code);
                return result;
            } catch (error) {
                throw new Error(`GitHub Sign-In failed: ${error.message}`);
            }
        }
    },
};