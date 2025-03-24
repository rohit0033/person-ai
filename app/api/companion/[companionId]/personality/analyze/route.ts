import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs";
import prismadb from "@/lib/prismadb";
import { MemoryManager } from "@/lib/memory";
import { PersonalityAnalyzer } from "@/lib/personality-analyzer";

export async function POST(
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
    
    const memoryManager = await MemoryManager.getInstance();
    
    // Get conversation history
    const conversationHistory = await memoryManager.readLatestHistory({
      companionName: params.companionId,
      userId
    });
    
    if (!conversationHistory || conversationHistory.length < 50) {
      return new NextResponse("Not enough conversation history to analyze", { status: 400 });
    }
    
    // Use the analyzer
    const analyzer = new PersonalityAnalyzer();
    await analyzer.analyzeConversation(
      conversationHistory,
      companion.name,
      { companionName: params.companionId, userId },
      true // priority analysis
    );
    
    return NextResponse.json({ 
      success: true,
      message: "Personality analysis completed"
    });
  } catch (error) {
    console.error("[PERSONALITY_ANALYZE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

// Add a new endpoint for quick analysis of a single message
export async function PUT(
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
    
    // Get the message from request
    const body = await request.json();
    const { message } = body;
    
    if (!message || message.length < 10) {
      return new NextResponse("Message too short to analyze", { status: 400 });
    }
    
    // Quickly analyze this single message
    const analyzer = new PersonalityAnalyzer();
    await analyzer.analyzeConversation(
      message,
      companion.name,
      { companionName: params.companionId, userId },
      true // priority analysis
    );
    
    return NextResponse.json({ 
      success: true,
      message: "Quick personality analysis completed"
    });
  } catch (error) {
    console.error("[QUICK_PERSONALITY_ANALYZE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}