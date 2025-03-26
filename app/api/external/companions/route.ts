// app/api/external/companions/route.ts
import { NextRequest, NextResponse } from "next/server";
import prismadb from "@/lib/prismadb";
import { validateApiKey } from "@/lib/api-auth";
import { CustomExternalApiRateLimit, rateLimit } from "@/lib/rate-limit";

export async function GET(request: NextRequest) {
  try {
    const apiKey =
      request.headers.get("x-api-key") ||
      request.nextUrl.searchParams.get("api_key");

    if (!apiKey) {
      return new NextResponse("API key is required", { status: 401 });
    }


    const keyData = await validateApiKey(apiKey);
    console.log("The key data ", keyData);
    if (!keyData) {
      return new NextResponse("Invalid API key", { status: 401 });
    }

    const userId = keyData.userId;

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }
    const identifier = request.url + "-" + userId;
    const { success } = await CustomExternalApiRateLimit(identifier);
    if (!success)
      return new NextResponse("Rate Limit Exceeded. Too many requests", {
        status: 429,
      });
    // Get all companions for this user
    const companions = await prismadb.companion.findMany({
      where: {
        userId: userId,
      },
      select: {
        id: true,
        name: true,
        description: true,
        categoryId: true,
        createdAt: true,
        updatedAt: true,
        // Don't include sensitive fields like instructions
      },
    });

    return NextResponse.json(companions);
  } catch (error) {
    console.error("[EXTERNAL_GET_COMPANIONS]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
