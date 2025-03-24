
import prismadb from "@/lib/prismadb";
import { auth } from "@clerk/nextjs";
import { NextRequest, NextResponse } from "next/server";

export async function DELETE(
  request: NextRequest,
  { params }: { params: { keyId: string } }
) {
  try {
    const { userId } = auth();
    
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }
    
    // Delete the API key and ensure it belongs to the current user
    await prismadb.userApiKey.delete({
      where: {
        id: params.keyId,
        userId: userId // This ensures users can only delete their own keys
      }
    });
    
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("[API_KEY_DELETE]", error);
    
    // Check if error is because the key doesn't exist (uncomment when needed)
    // if (error.code === 'P2025') {
    //   return new NextResponse("API key not found", { status: 404 });
    // }
    
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}