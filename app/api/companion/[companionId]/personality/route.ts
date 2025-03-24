import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs";
import prismadb from "@/lib/prismadb";
import { PersonalityAnalyzer } from "@/lib/personality-analyzer";

export async function GET(
  request: NextRequest,
  { params }: { params: { companionId: string } }
) {
  try {
    const { userId } = auth();
    
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }
    
    const companion = await prismadb.companion.findUnique({
      where: {
        id: params.companionId,
        userId
      }
    });
    
    if (!companion) {
      return new NextResponse("Companion not found", { status: 404 });
    }
    
    // Get traits
    const traits = await prismadb.personalityTrait.findMany({
      where: {
        companionId: params.companionId,
        userId
      },
      orderBy: {
        confidence: 'desc'
      }
    });
    
    // Generate profile
    const analyzer = new PersonalityAnalyzer();
    const profile = await analyzer.generatePersonalityProfile(
      params.companionId,
      userId
    );
    
    return NextResponse.json({
      traits,
      profile
    });
  } catch (error) {
    console.error("[PERSONALITY_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}