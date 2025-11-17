const rateLimit = require('express-rate-limit');

const rateLimiter = (maxRequests, windowMinutes) => {
    return rateLimit({
        windowMs: windowMinutes * 60 * 1000,
        max: maxRequests,
        message: 'Demasiados intentos, intente más tarde',
        standardHeaders: true,
        legacyHeaders: false,
        // Store en memoria para alta concurrencia
        skip: (req) => process.env.NODE_ENV === 'test'
    });
};

module.exports = rateLimiter;