const NodeCache = require('node-cache');

const mainCache = new NodeCache({ stdTTL: 300, checkperiod: 60, useClones: false, maxKeys: 10000 });
const statsCache = new NodeCache({ stdTTL: 600, checkperiod: 120, useClones: false, maxKeys: 1000 });
const sessionCache = new NodeCache({ stdTTL: 3600, checkperiod: 300, useClones: false, maxKeys: 5000 });
const searchCache = new NodeCache({ stdTTL: 180, checkperiod: 60, useClones: false, maxKeys: 2000 });

class CacheManager {
    get(key) { return mainCache.get(key); }
    set(key, value, ttl) { return ttl ? mainCache.set(key, value, ttl) : mainCache.set(key, value); }
    getStats(key) { return statsCache.get(key); }
    setStats(key, value, ttl) { return ttl ? statsCache.set(key, value, ttl) : statsCache.set(key, value); }
    getSession(key) { return sessionCache.get(key); }
    setSession(key, value) { return sessionCache.set(key, value); }
    getSearch(key) { return searchCache.get(key); }
    setSearch(key, value) { return searchCache.set(key, value); }

    invalidatePattern(pattern) {
        const keys = mainCache.keys();
        keys.forEach(key => { if (key.includes(pattern)) mainCache.del(key); });
    }

    flush() {
        mainCache.flushAll();
        statsCache.flushAll();
        sessionCache.flushAll();
        searchCache.flushAll();
    }

    getStatistics() {
        return {
            main: mainCache.getStats(),
            stats: statsCache.getStats(),
            session: sessionCache.getStats(),
            search: searchCache.getStats()
        };
    }

    async remember(key, ttl, callback) {
        const cached = this.get(key);
        if (cached !== undefined) return cached;
        const value = await callback();
        this.set(key, value, ttl);
        return value;
    }

    async rememberStats(key, ttl, callback) {
        const cached = this.getStats(key);
        if (cached !== undefined) return cached;
        const value = await callback();
        this.setStats(key, value, ttl);
        return value;
    }
}

module.exports = new CacheManager();
