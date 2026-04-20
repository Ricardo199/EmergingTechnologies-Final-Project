/**
 * logger.js - Structured JSON Logger
 * Outputs structured log entries to stdout/stderr for auth events,
 * general errors, and token refresh operations.
 *
 * All entries include: timestamp, level, service, action, and context fields.
 * Designed to be consumed by log aggregators (e.g. CloudWatch, Datadog).
 */
const logger = {
    /** Returns current UTC timestamp in ISO 8601 format */
    getTimestamp: () => new Date().toISOString(),

    /**
     * Log an authentication event (register, login, OAuth sign-in)
     * @param {string} action - Auth action name (e.g. 'login', 'googleSignIn')
     * @param {string} email - User email involved in the action
     * @param {boolean} success - Whether the action succeeded
     * @param {Error|null} error - Error object if action failed
     */
    logAuth: (action, email, success, error = null) => {
        console.log(JSON.stringify({
            timestamp: logger.getTimestamp(),
            level: success ? 'INFO' : 'ERROR',
            service: 'auth-service',
            action: `MUTATION_${action.toUpperCase()}`,
            email,
            success,
            error: error ? error.message : null,
        }));
    },

    /**
     * Log a general service error with stack trace and optional context
     * @param {string} service - Service name (e.g. 'issue-service')
     * @param {string} action - Method or operation that failed
     * @param {Error} error - The caught error
     * @param {Object} context - Additional context (e.g. input data)
     */
    logError: (service, action, error, context = {}) => {
        console.error(JSON.stringify({
            timestamp: logger.getTimestamp(),
            level: 'ERROR',
            service,
            action,
            message: error.message,
            stack: error.stack,
            ...context,
        }));
    },

    /**
     * Log a token refresh event
     * @param {string} service - Service name
     * @param {string} action - Action name
     * @param {string} userId - ID of the user whose token was refreshed
     * @param {boolean} success - Whether the refresh succeeded
     * @param {Error|null} error - Error object if refresh failed
     */
    logRefreshToken: (service, action, userId, success, error = null) => {
        console.log(JSON.stringify({
            timestamp: logger.getTimestamp(),
            level: success ? 'INFO' : 'ERROR',
            service,
            action,
            userId,
            success,
            error: error ? error.message : null,
        }));
    }
};

export default logger;