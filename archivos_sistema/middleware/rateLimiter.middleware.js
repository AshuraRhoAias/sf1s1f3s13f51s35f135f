const rateLimit = require('express-rate-limit');

const createLimiter = (max, windowMinutes) => rateLimit({
    windowMs: windowMinutes * 60 * 1000,
    max,
    message: { success: false, error: 'Demasiadas peticiones' },
    standardHeaders: true,
    legacyHeaders: false
});

module.exports = {
    authLimiter: createLimiter(10, 15),
    readLimiter: createLimiter(100, 1),
    writeLimiter: createLimiter(20, 1)
};
