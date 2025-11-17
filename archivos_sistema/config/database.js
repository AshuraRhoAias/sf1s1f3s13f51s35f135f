const mysql = require('mysql2/promise');

let pool;
let readPool;

const initPool = () => {
    pool = mysql.createPool({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        waitForConnections: true,
        connectionLimit: 100,
        queueLimit: 0,
        enableKeepAlive: true,
        maxIdle: 50,
        idleTimeout: 60000,
        compress: true,
        connectTimeout: 20000
    });

    readPool = mysql.createPool({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        waitForConnections: true,
        connectionLimit: 150,
        queueLimit: 0,
        enableKeepAlive: true,
        maxIdle: 75,
        idleTimeout: 60000
    });

    console.log('✅ Pools de conexión inicializados');
    return { pool, readPool };
};

const getPool = (readonly = false) => {
    if (!pool || !readPool) throw new Error('Pools no inicializados');
    return readonly ? readPool : pool;
};

const closePool = async () => {
    if (pool) await pool.end();
    if (readPool) await readPool.end();
};

const executeTransaction = async (callback) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        const result = await callback(connection);
        await connection.commit();
        return result;
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
};

module.exports = { initPool, getPool, closePool, executeTransaction };
