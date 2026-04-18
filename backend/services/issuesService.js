import Issue from '../model/issue.js';
import User from '../model/user.js';
import logger from '../utils/logger.js';

/**
 * Issue Management Service
 * Handles all CRUD operations for civic issues including reporting, filtering, updating status, and assignment
 * All methods interact with MongoDB Issue collection and populate user references
 */
const issueService = {
  /**
   * Create a new civic issue in the database
   * @async
   * @param {Object} issueData - Issue information
   * @param {string} issueData.title - Issue title
   * @param {string} issueData.description - Detailed description
   * @param {string} issueData.category - Category (pothole, streetlight, flooding, safety, other)
   * @param {string} issueData.priority - Priority level (low, medium, high)
   * @param {string} issueData.status - Status (reported, in_progress, resolved, closed)
   * @param {Object} issueData.location - GeoJSON location with coordinates and address
   * @param {string} issueData.reportedBy - MongoDB user ID of reporter
   * @param {string} [issueData.aiCategory] - AI-classified category
   * @returns {Promise<Object>} Created issue with populated reporter info
   * @example
   * const issue = await issueService.createIssue({
   *   title: "Pothole on Main St",
   *   description: "Large pothole causing traffic issues",
   *   category: "pothole",
   *   priority: "high",
   *   status: "reported",
   *   location: { coordinates: [-118.2437, 34.0522], address: "Main St, LA" },
   *   reportedBy: userId
   * });
   */
  async createIssue(issueData) {
    try {
      const issue = new Issue(issueData);
      await issue.save();
      // Populate reporter details immediately after creation
      return await Issue.findById(issue._id).populate('reportedBy', 'username email role');
    } catch (error) {
      logger.logError('issue-service', 'createIssue', error, { issueData });
      throw error;
    }
  },

  /**
   * Retrieve a single issue by ID with all related user data
   * @async
   * @param {string} id - MongoDB issue ID
   * @returns {Promise<Object>} Issue document with populated reporter and assignee info
   * @throws {Error} If issue not found
   * @example
   * const issue = await issueService.getIssueById(issueId);
   */
  async getIssueById(id) {
    try {
      const issue = await Issue.findById(id)
        .populate('reportedBy', 'username email role')
        .populate('assignedTo', 'username email role');
      if (!issue) {
        throw new Error('Issue not found');
      }
      return issue;
    } catch (error) {
      logger.logError('issue-service', 'getIssueById', error, { id });
      throw error;
    }
  },

  /**
   * Get filtered list of issues with optional filters for status, category, reporter, or assignee
   * Results are sorted by creation date (newest first)
   * @async
   * @param {Object} [filters={}] - Optional filter criteria
   * @param {string} [filters.status] - Filter by issue status
   * @param {string} [filters.category] - Filter by category
   * @param {string} [filters.reporterId] - Filter by reporter user ID
   * @param {string} [filters.assignedTo] - Filter by assigned staff member
   * @returns {Promise<Array>} Array of issues matching filters with populated user references
   * @example
   * // Get all high-priority open issues
   * const issues = await issueService.getIssues({ status: 'reported' });
   * // Get issues reported by specific user
   * const userIssues = await issueService.getIssues({ reporterId: userId });
   */
  async getIssues(filters = {}) {
    try {
      const { status, category, reporterId, assignedTo } = filters;
      // Build dynamic query object - only add filters that were provided
      const query = {};
      
      if (status) query.status = status;
      if (category) query.category = category;
      if (reporterId) query.reportedBy = reporterId;
      if (assignedTo) query.assignedTo = assignedTo;

      // Fetch issues and populate user references for frontend display
      return await Issue.find(query)
        .populate('reportedBy', 'username email role')
        .populate('assignedTo', 'username email role')
        .sort({ createdAt: -1 }); // Newest issues first
    } catch (error) {
      logger.logError('issue-service', 'getIssues', error, { filters });
      throw error;
    }
  },

  /**
   * Update issue fields (status, priority, description, etc.)
   * @async
   * @param {string} id - MongoDB issue ID
   * @param {Object} updateData - Fields to update
   * @param {string} [updateData.status] - New status
   * @param {string} [updateData.priority] - New priority
   * @param {string} [updateData.description] - Updated description
   * @returns {Promise<Object>} Updated issue with populated user references
   * @throws {Error} If issue not found
   * @example
   * const updated = await issueService.updateIssue(issueId, {
   *   status: 'in_progress',
   *   priority: 'high'
   * });
   */
  async updateIssue(id, updateData) {
    try {
      // Use findByIdAndUpdate with { new: true } to return updated document
      // Also update timestamp to track when changes were made
      const issue = await Issue.findByIdAndUpdate(
        id,
        { ...updateData, updatedAt: new Date() },
        { new: true }
      )
        .populate('reportedBy', 'username email role')
        .populate('assignedTo', 'username email role');
      
      if (!issue) {
        throw new Error('Issue not found');
      }
      return issue;
    } catch (error) {
      logger.logError('issue-service', 'updateIssue', error, { id, updateData });
      throw error;
    }
  },

  /**
   * Assign an issue to a staff member
   * @async
   * @param {string} id - MongoDB issue ID
   * @param {string} assignedToUserId - MongoDB user ID of staff member
   * @returns {Promise<Object>} Updated issue with new assignee info
   * @throws {Error} If issue not found
   * @example
   * const assigned = await issueService.assignIssue(issueId, staffMemberId);
   */
  async assignIssue(id, assignedToUserId) {
    try {
      const issue = await Issue.findByIdAndUpdate(
        id,
        { assignedTo: assignedToUserId, updatedAt: new Date() },
        { new: true }
      )
        .populate('reportedBy', 'username email role')
        .populate('assignedTo', 'username email role');
      
      if (!issue) {
        throw new Error('Issue not found');
      }
      return issue;
    } catch (error) {
      logger.logError('issue-service', 'assignIssue', error, { id, assignedToUserId });
      throw error;
    }
  },

  /**
   * Mark an issue as resolved (staff operation)
   * Updates status to 'resolved' and timestamp
   * @async
   * @param {string} id - MongoDB issue ID
   * @returns {Promise<Object>} Updated issue with resolved status
   * @throws {Error} If issue not found
   * @example
   * const resolved = await issueService.resolveIssue(issueId);
   */
  async resolveIssue(id) {
    try {
      // Change status to 'resolved' and update the modification timestamp
      const issue = await Issue.findByIdAndUpdate(
        id,
        { status: 'resolved', updatedAt: new Date() },
        { new: true }
      )
        .populate('reportedBy', 'username email role')
        .populate('assignedTo', 'username email role');
      
      if (!issue) {
        throw new Error('Issue not found');
      }
      return issue;
    } catch (error) {
      logger.logError('issue-service', 'resolveIssue', error, { id });
      throw error;
    }
  },

  async deleteIssue(id) {
    try {
      const issue = await Issue.findByIdAndDelete(id);
      if (!issue) {
        throw new Error('Issue not found');
      }
      return { success: true, message: 'Issue deleted successfully' };
    } catch (error) {
      logger.logError('issue-service', 'deleteIssue', error, { id });
      throw error;
    }
  },

  async getDashboardSummary() {
    try {
      const totalOpen = await Issue.countDocuments({ 
        status: { $in: ['reported', 'in_progress'] } 
      });
      const totalResolved = await Issue.countDocuments({ status: 'resolved' });
      const highPriority = await Issue.countDocuments({ priority: 'high' });
      
      const byCategory = await Issue.aggregate([
        { $group: { _id: '$category', count: { $sum: 1 } } },
        { $project: { category: '$_id', count: 1, _id: 0 } }
      ]);

      return {
        totalOpen,
        totalResolved,
        highPriority,
        byCategory
      };
    } catch (error) {
      logger.logError('issue-service', 'getDashboardSummary', error);
      throw error;
    }
  },

  async searchIssues(searchTerm) {
    try {
      if (!searchTerm || searchTerm.trim().length === 0) {
        throw new Error('Search term required');
      }

      const query = {
        $or: [
          { title: { $regex: searchTerm, $options: 'i' } },
          { description: { $regex: searchTerm, $options: 'i' } },
          { 'location.address': { $regex: searchTerm, $options: 'i' } }
        ]
      };

      return await Issue.find(query)
        .populate('reportedBy', 'username email role')
        .populate('assignedTo', 'username email role')
        .sort({ createdAt: -1 });
    } catch (error) {
      logger.logError('issue-service', 'searchIssues', error, { searchTerm });
      throw error;
    }
  },

  async getIssuesByLocation(coordinates, maxDistance = 5000) {
    try {
      const issues = await Issue.find({
        location: {
          type: 'Point',
          coordinates: {
            $near: {
              $geometry: {
                type: 'Point',
                coordinates: coordinates
              },
              $maxDistance: maxDistance
            }
          }
        }
      })
        .populate('reportedBy', 'username email role')
        .populate('assignedTo', 'username email role');

      return issues;
    } catch (error) {
      logger.logError('issue-service', 'getIssuesByLocation', error, { coordinates, maxDistance });
      throw error;
    }
  }
};

export default issueService;