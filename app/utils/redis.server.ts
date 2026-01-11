
// @ts-ignore
import Redis from "ioredis";

let redis: any;

declare global {
    var __redis: any;
}

// Use REDIS_URL from env or default to localhost
const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";

if (process.env.NODE_ENV === "production") {
    redis = new Redis(redisUrl);
} else {
    if (!global.__redis) {
        global.__redis = new Redis(redisUrl);
    }
    redis = global.__redis;
}

export { redis };
