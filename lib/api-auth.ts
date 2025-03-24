// lib/api-auth.ts
import { randomBytes, createHash } from 'crypto';
import prismadb from './prismadb';

export async function generateApiKey(userId: string, name: string): Promise<string> {
  // Generate a secure random key
  const keyBuffer = randomBytes(32);
  const key = `pnkey_${keyBuffer.toString('hex')}`;
  
  // Hash the key for storage (never store raw keys)
  const hashedKey = createHash('sha256').update(key).digest('hex');
  
  // Store in the database
  await prismadb.userApiKey.create({
    data: {
      userId,
      name,
      key: hashedKey,
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 365) // 1 year expiry
    }
  });
  
  // Return the raw key (only time it's available)
  return key;
}

export async function validateApiKey(providedKey: string): Promise<{ userId: string } | null> {
  // Hash the provided key
  const hashedKey = createHash('sha256').update(providedKey).digest('hex');
  
  // Look up in database
  const apiKey = await prismadb.userApiKey.findUnique({
    where: { key: hashedKey }
  });
  
  if (!apiKey) return null;
  
  // Check if expired
  if (apiKey.expiresAt && apiKey.expiresAt < new Date()) {
    return null;
  }
  
  return { userId: apiKey.userId };
}