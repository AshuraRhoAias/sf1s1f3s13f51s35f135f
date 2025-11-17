const mysql = require('mysql2/promise');

let pool;

const initPool = () => {
    pool = mysql.createPool({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        waitForConnections: true,
        connectionLimit: 50, // Para 200 usuarios concurrentes
        queueLimit: 0,
        enableKeepAlive: true,
        keepAliveInitialDelay: 0,
        maxIdle: 10,
        idleTimeout: 60000,
        acquireTimeout: 30000
    });

    return pool;
};

const getPool = () => {
    if (!pool) {
        throw new Error('Pool no inicializado');
    }
    return pool;
};

module.exports = { initPool, getPool };