/**
 * langGraphGPT.js - LangGraph Agent
 * Implements a multi-node graph-based AI agent for handling civic issue queries.
 * Uses LangGraph to route questions through intent analysis, data fetching,
 * stats computation, and response composition.
 *
 * Graph flow:
 *   receiveQuestion → analyzeIntent → fetchIssues → computeStats → composeResponse
 */
import { Graph, Tool } from 'langraph';
import aiService from './aiService.js';
import logger from '../utils/logger.js';

// In-memory conversation history for multi-turn context (per session)
const conversationMemory = [];

/**
 * Fetch issues from the database filtered by status and/or category.
 * @param {Object} params
 * @param {string} [params.status] - Filter by issue status
 * @param {string} [params.category] - Filter by issue category
 * @returns {Promise<Array>} Matching issues
 */
async function queryIssues({ status, category }) {
  const issues = await aiService.getIssues({ status, category }); 
  return issues;
}

// 5. Tool: get dashboard stats from current issue set
function getStats(issues) {
  const trend = aiService.detectTrends(issues);
  return {
    total: issues.length,
    open: issues.filter(i => ['reported', 'in_progress'].includes(i.status)).length,
    resolved: issues.filter(i => i.status === 'resolved').length,
    byCategory: trend.byCategory,
  };
}

// generate recommendations based on issue 
function recommendActions(issues) {
  const trend = aiService.detectTrends(issues);
  return aiService.generateRecommendations(issues, trend);
}

// build the langGraph agent with nodes and edges
const langGraph = new Graph({
  nodes: {
    receiveQuestion: {
      type: 'input',
      handler: async ({ question }) => question,
    },
    analyzeIntent: {
      type: 'processor',
      handler: async ({ question }) => {
        const lower = question.toLowerCase();
        if (lower.includes('trend') || lower.includes('pattern')) return 'trend';
        if (lower.includes('recommend') || lower.includes('suggest')) return 'recommendation';
        if (lower.includes('predict') || lower.includes('forecast')) return 'prediction';
        return 'answer';
      },
    },
    fetchIssues: {
      type: 'tool',
      tool: new Tool({
        name: 'queryIssues',
        description: 'Fetch issues from the database',
        func: queryIssues,
      }),
    },
    computeStats: {
      type: 'tool',
      tool: new Tool({
        name: 'getStats',
        description: 'Return summarized issue statistics',
        func: getStats,
      }),
    },
    composeResponse: {
      type: 'output',
      handler: async ({ intent, issues, stats, question }) => {
        if (intent === 'trend') {
          return `Trend data: ${JSON.stringify(stats.byCategory)}. Open ${stats.open}, resolved ${stats.resolved}.`;
        }
        if (intent === 'recommendation') {
          return recommendActions(issues);
        }
        if (intent === 'prediction') {
          return aiService.generatePredictions(issues, stats);
        }
        return aiService.answerQuestion(question, issues);
      },
    },
  },
  edges: [
    { from: 'receiveQuestion', to: 'analyzeIntent' },
    { from: 'analyzeIntent', to: 'fetchIssues' },
    { from: 'fetchIssues', to: 'computeStats' },
    { from: 'computeStats', to: 'composeResponse' },
  ],
});

// entry point fot the agent to handle user queries
export async function handleAgentQuery(question, userId) {
  if (!question || !question.trim()) {
    return 'Please ask a clear question about civic issues.';
  }
  conversationMemory.push({ userId, question, timestamp: new Date().toISOString() });

  try {
    const response = await langGraph.run({
      receiveQuestion: { question },
      composeResponse: { question },
    });

    conversationMemory.push({ userId, response, timestamp: new Date().toISOString(), role: 'bot' });

    return response;
  } catch (error) {
    logger.error(`LangGraph agent failed: ${error.message}`);
    return 'I had trouble processing that request. Please try again.';
  }
}
