import { NextRequest, NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs";
import prismadb from "@/lib/prismadb";
import { PersonalityAnalyzer } from "@/lib/personality-analyzer";

export async function GET(
  request: NextRequest,
  { params }: { params: { companionId: string } }
) {
  try {
    const { userId } = auth();
    const user = await currentUser();

    if (!userId || !user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Find the companion
    const companion = await prismadb.companion.findUnique({
      where: {
        id: params.companionId,
        userId,
      },
    });

    if (!companion) {
      return new NextResponse("Companion not found", { status: 404 });
    }

    // Get personality traits
    const traits = await prismadb.personalityTrait.findMany({
      where: {
        companionId: params.companionId,
        userId,
      },
      orderBy: {
        confidence: "desc",
      },
      take: 50,
    });

    // Generate personality profile
    const analyzer = new PersonalityAnalyzer();
    const profile = await analyzer.generatePersonalityProfile(
      params.companionId,
      userId
    );

    return NextResponse.json({
      companion: {
        id: companion.id,
        name: companion.name,
        description: companion.description,
      },
      traits,
      profile,
    });
  } catch (error) {
    console.error("[PERSONALITY_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}