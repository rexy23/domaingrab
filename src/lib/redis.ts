import { Redis } from '@upstash/redis';

let redis: Redis;

if (process.env.REDIS_URL) {
  redis = new Redis({
    url: process.env.REDIS_URL,
    token: process.env.REDIS_TOKEN,
  });
} else {
  // Fallback for development without Redis
  redis = {
    get: async () => null,
    set: async () => 'OK',
    del: async () => 1,
    exists: async () => 0,
    incr: async () => 1,
    expire: async () => 1,
  } as unknown as Redis;
}

export { redis };