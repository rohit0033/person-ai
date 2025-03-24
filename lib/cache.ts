// lib/cache.ts
import { Redis } from '@upstash/redis';

export class ResponseCache {
  private redis: Redis;
  
  constructor() {
    this.redis = Redis.fromEnv();
  }
  
  // Create a hash of the input for Redis key using Web Crypto API
  private async hashInput(input: string): Promise<string> {
    // Use TextEncoder to convert string to Uint8Array
    const encoder = new TextEncoder();
    const data = encoder.encode(input.toLowerCase().trim());
    
    // Use subtle crypto to hash the data
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    
    // Convert hash buffer to hex string
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }
  
  // Generate a key based on the companion, prompt, and context
  private async generateKey(prompt: string, companionId: string, userId: string): Promise<string> {
    // Normalize the prompt by trimming, lowercasing, and removing extra spaces
    const normalizedPrompt = prompt.toLowerCase().trim().replace(/\s+/g, ' ');
    const hash = await this.hashInput(normalizedPrompt);
    return `response_cache:${companionId}:${userId}:${hash}`;
  }
  
  // Check if we have a cached response for this prompt/companion
  async getCachedResponse(prompt: string, companionId: string, userId: string): Promise<string | null> {
    const key = await this.generateKey(prompt, companionId, userId);
    return this.redis.get(key);
  }
  
  // Store a response in cache for future use
  async cacheResponse(prompt: string, response: string, companionId: string, userId: string): Promise<void> {
    const key = await this.generateKey(prompt, companionId, userId);
    // Store with expiry (e.g., 24 hours) so cache doesn't grow indefinitely
    await this.redis.set(key, response, { ex: 60 * 60 * 24 });
  }
  
  // If you need a simpler non-async hash function for other purposes
  private simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return hash.toString(36);
  }
}