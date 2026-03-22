import Redis from "ioredis";

const globalForRedis = globalThis as unknown as {
  redis?: Redis;
};

export function getRedisClient() {
  if (globalForRedis.redis) {
    return globalForRedis.redis;
  }

  const connectionUrl = process.env.REDIS_URL;

  if (!connectionUrl) {
    return null;
  }

  const client = new Redis(connectionUrl, {
    lazyConnect: true,
    maxRetriesPerRequest: 1,
  });

  globalForRedis.redis = client;
  return client;
}
