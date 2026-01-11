// @ts-ignore
import Redis from "ioredis";

let redis: any;

declare global {
    var __redis: any;
}

const redisUrl = process.env.REDIS_URL;

// Helper to create a dummy redis that does nothing
const createDummyRedis = () => ({
    get: async () => null,
    set: async () => "OK",
    del: async () => 0,
    on: () => { },
    off: () => { }
});

if (process.env.NODE_ENV === "production") {
    if (redisUrl) {
        console.log("Redis URL found, connecting...");
        redis = new Redis(redisUrl);
    } else {
        console.warn("No REDIS_URL found in production, disabling Redis cache.");
        redis = createDummyRedis();
    }
} else {
    // Development: use localhost if no URL
    const devUrl = redisUrl || "redis://localhost:6379";
    if (!global.__redis) {
        try {
            global.__redis = new Redis(devUrl, {
                // Don't retry forever in dev if redis isn't running
                maxRetriesPerRequest: 1,
                retryStrategy: (times) => {
                    if (times > 3) return null; // stop retrying
                    return Math.min(times * 50, 2000);
                }
            });
            // Handle error effectively to avoid crash
            global.__redis.on("error", (err: any) => {
                // Silently ignore connection refused in dev
                if (err.code !== 'ECONNREFUSED') console.warn("Redis dev error:", err.message);
            });
        } catch (e) {
            global.__redis = createDummyRedis();
        }
    }
    redis = global.__redis;
}

export { redis };
