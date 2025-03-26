import {Ratelimit} from "@upstash/ratelimit"
import {Redis} from "@upstash/redis"

export async function rateLimit(identifier: string){
    const rateLimit = new Ratelimit({
        redis: Redis.fromEnv(),
        limiter: Ratelimit.slidingWindow(10,"10 s"),
        analytics:true,
        prefix:"@upstash/ratelimit"

    })
    return await rateLimit.limit(identifier);
}

export async function externalApiRateLimit(identifier: string) {
    const rateLimit = new Ratelimit({
        redis: Redis.fromEnv(),
        limiter: Ratelimit.slidingWindow(1, "60 s"),
        analytics: true,
        prefix: "@upstash/ratelimit:external"
    })
    return await rateLimit.limit(identifier);
}
export async function CustomExternalApiRateLimit(identifier: string): Promise<{ success: boolean }> {
    try {
      const redis = Redis.fromEnv();
      const key = `ratelimit:${identifier}`;
      const LIMIT = 5; // Allow 5 requests per minute
      
      // Get the current count
      const count = await redis.get(key) as number | null;
      
      // If no count exists or it's 0, set it to 1 with 60 second expiry
      if (!count) {
        await redis.set(key, 1, { ex: 60 });
        return { success: true };
      }
      
      // If count exists but less than limit, increment
      if (count < LIMIT) {
        await redis.incr(key);
        return { success: true };
      }
      
      // Otherwise rate limit exceeded
      return { success: false };
    } catch (error) {
      console.error("[RATE_LIMIT_ERROR]", error);
      // If Redis fails, allow the request
      return { success: true };
    }
  }
  export async function CustomApiRateLimit(identifier: string): Promise<{ success: boolean }> {
    try {
      const redis = Redis.fromEnv();
      const key = `ratelimit:${identifier}`;
      const LIMIT = 1; // Allow 5 requests per minute
      
      // Get the current count
      const count = await redis.get(key) as number | null;
      
      // If no count exists or it's 0, set it to 1 with 60 second expiry
      if (!count) {
        await redis.set(key, 1, { ex: 300 });
        return { success: true };
      }
      
      // If count exists but less than limit, increment
      if (count < LIMIT) {
        await redis.incr(key);
        return { success: true };
      }
      
      // Otherwise rate limit exceeded
      return { success: false };
    } catch (error) {
      console.error("[RATE_LIMIT_ERROR]", error);
      // If Redis fails, allow the request
      return { success: true };
    }
  }