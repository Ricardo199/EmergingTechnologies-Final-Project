/**
 * issue.js - Mongoose Issue Schema
 * Defines the data model for civic issue reports stored in MongoDB.
 *
 * Location uses GeoJSON Point format for geospatial queries.
 * The pre-save hook keeps updatedAt current on every save.
 */
import mongoose from 'mongoose';

const issueSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        required: true,
    },
    category: {
        type: String,
        enum: ['pothole', 'streetlight', 'flooding', 'safety', 'other'],
        required: true,
    },
    // GeoJSON Point: coordinates stored as [longitude, latitude]
    location: {
        type: {
            type: String,
            enum: ['Point'],
            required: true,
        },
        coordinates: {
            type: [Number],
            required: true,
        },
        address: {
            type: String,
            required: true,
        },
    },
    status: {
        type: String,
        enum: ['reported', 'in_progress', 'resolved', 'closed'],
        default: 'reported',   // New issues start as reported
    },
    priority: {
        type: String,
        enum: ['low', 'medium', 'high'],
        default: 'medium',
    },
    // Reference to the user who submitted the issue
    reportedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    // Optional: staff member assigned to handle the issue
    assignedTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    updatedAt: {
        type: Date,
        default: Date.now,
    },
});

// Automatically update updatedAt timestamp before every save
issueSchema.pre('save', function (next) {
    this.updatedAt = Date.now();
    next();
});

export default mongoose.model('Issue', issueSchema);