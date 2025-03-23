// lib/api-auth.ts
import prismadb from "./prismadb";
import { NextResponse } from "next/server";

// Define a specific type for successful validation
export type ApiKeyValidationResult = { userId: string } | null;

export async function validateApiKey(apiKey: string): Promise<ApiKeyValidationResult> {
  try {
    const key = await prismadb.apiKey.findUnique({
      where: {
        key: apiKey
      }
    });
    
    if (!key) {
      return null;
    }
    
    // Update last used timestamp
    await prismadb.apiKey.update({
      where: {
        id: key.id
      },
      data: {
        lastUsed: new Date()
      }
    });
    
    return {
      userId: key.userId
    };
  } catch (error) {
    console.error("API Key validation error:", error);
    return null;
  }
}