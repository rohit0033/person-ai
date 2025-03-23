// lib/api-auth.ts
import { NextResponse } from "next/server";
import prismadb from "./prismadb";

export async function validateApiKey(apiKey: string) {
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
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}