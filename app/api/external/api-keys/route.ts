import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs";
import prismadb from "@/lib/prismadb";
import { v4 as uuidv4 } from 'uuid';
import { generateApiKey } from "@/lib/api-auth";

export async function GET(request: NextRequest) {
  try {
    const user = await currentUser();
    if (!user || !user.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const apiKeys = await prismadb.userApiKey.findMany({
      where: {
        userId: user.id,
      },
      select: {
        id: true,
        name: true,
        createdAt: true,
        expiresAt: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(apiKeys);
  } catch (error) {
    console.error("[API_KEYS_GET]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await currentUser();
    if (!user || !user.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Parse the request body properly
    const body = await request.json();
    const { name } = body;
    
    if (!name) {
      return new NextResponse("Name is required", { status: 400 });
    }

    // Generate API key
    const { key, keyData } = await generateApiKey(user.id, name);

    // Return the key details directly from generateApiKey response
    return NextResponse.json({ 
      id: keyData.id,
      name: keyData.name,
      key: key,
      createdAt: keyData.createdAt,
      expiresAt: keyData.expiresAt
    });
  } catch (error) {
    console.error("[API_KEYS_POST]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}