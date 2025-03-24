// app/api/external/personality/[companionId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prismadb from "@/lib/prismadb";
import { MemoryManager } from "@/lib/memory";
import { validateApiKey } from "@/lib/api-auth";
import { PersonalityAnalyzer } from "@/lib/personality-analyzer";

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
    if (!keyData) {
      return new NextResponse("Invalid API key", { status: 401 });
    }
    
    const userId = keyData.userId;
    
    // Find the companion
    const companion = await prismadb.companion.findUnique({
      where: {
        id: params.companionId,
        userId
      }
    });
    
    if (!companion) {
      return new NextResponse("Companion not found", { status: 404 });
    }
    
    // Get memory manager
    const memoryManager = await MemoryManager.getInstance();
    
    // Get stored personality traits
    const companionKey = {
      companionName: params.companionId,
      userId
    };
    
    const traits = await memoryManager.getPersonalityTraits(companionKey);
    
    // Generate a comprehensive profile
    const analyzer = new PersonalityAnalyzer();
    const profile = await analyzer.generatePersonalityProfile(params.companionId, userId);
    
    // Get database stored traits as backup
    const dbTraits = await prismadb.personalityTrait.findMany({
      where: {
        companionId: params.companionId,
        userId
      },
      orderBy: {
        confidence: 'desc'
      },
      take: 50
    });
    
    return NextResponse.json({
      companion: {
        id: companion.id,
        name: companion.name,
        description: companion.description
      },
      traits: traits.length > 0 ? traits : dbTraits.map(t => ({
        type: t.type,
        content: t.content,
        confidence: t.confidence
      })),
      basePersonality: companion.instructions,
      generatedProfile: profile
    });
  } catch (error) {
    console.error("[EXTERNAL_API_PERSONALITY]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}