// app/api/external/conversations/[companionId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prismadb from "@/lib/prismadb";
import { MemoryManager } from "@/lib/memory";
import { validateApiKey } from "@/lib/api-auth";

export async function GET(
  request: NextRequest,
  { params }: { params: { companionId: string } }
) {
  try {
    const apiKey = request.headers.get('x-api-key') || request.nextUrl.searchParams.get('api_key');
    
    if (!apiKey) {
      return new NextResponse("API key is required", { status: 401 });
    }
    
    const keyData = await validateApiKey(apiKey);
    if (!keyData ) {
        return new NextResponse("Invalid API key", { status: 401 });
      }
    
    const userId = keyData.userId;
    
    const companion = await prismadb.companion.findUnique({
      where: {
        id: params.companionId,
        userId: userId
      }
    });
    
    if (!companion) {
      return new NextResponse("Companion not found", { status: 404 });
    }
    
    const memoryManager = await MemoryManager.getInstance();
    const history = await memoryManager.readLatestHistory({
      companionName: companion.id,
      userId: userId
    });
    
    return NextResponse.json({
      history
    });
  } catch (error) {
    console.error("[EXTERNAL_API_GET_HISTORY]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}