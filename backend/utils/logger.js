const logger = {
    getTimestamp: () => new Date().toISOString(),

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