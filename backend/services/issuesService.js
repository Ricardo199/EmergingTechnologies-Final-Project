import Issue from '../model/issue.js';
import User from '../model/user.js';
import logger from '../utils/logger.js';

const issueService = {
  async createIssue(issueData) {
    try {
      const issue = new Issue(issueData);
      await issue.save();
      return await Issue.findById(issue._id).populate('reportedBy', 'username email role');
    } catch (error) {
      logger.logError('issue-service', 'createIssue', error, { issueData });
      throw error;
    }
  },

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

  async getIssues(filters = {}) {
    try {
      const { status, category, reporterId, assignedTo } = filters;
      const query = {};
      
      if (status) query.status = status;
      if (category) query.category = category;
      if (reporterId) query.reportedBy = reporterId;
      if (assignedTo) query.assignedTo = assignedTo;

      return await Issue.find(query)
        .populate('reportedBy', 'username email role')
        .populate('assignedTo', 'username email role')
        .sort({ createdAt: -1 });
    } catch (error) {
      logger.logError('issue-service', 'getIssues', error, { filters });
      throw error;
    }
  },

  async updateIssue(id, updateData) {
    try {
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

  async resolveIssue(id) {
    try {
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