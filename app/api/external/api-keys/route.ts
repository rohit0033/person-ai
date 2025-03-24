import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs";
import prismadb from "@/lib/prismadb";
import { v4 as uuidv4 } from 'uuid';

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
    const apiKey = `person_ai_${uuidv4()}`;
    
    // Store in database
    const newKey = await prismadb.userApiKey.create({
      data: {
        userId: user.id,
        name,
        key: apiKey
      }
    });

    // Return both the key and record id
    return NextResponse.json({ 
      key: apiKey,
      id: newKey.id
    });
  } catch (error) {
    console.error("[API_KEYS_POST]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}