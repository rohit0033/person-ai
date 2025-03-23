import prisamdb from "@/lib/prismadb";
import { auth, currentUser } from "@clerk/nextjs";
import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from 'uuid';



export async function POST(request: Request){
    try {
        const user = await currentUser();
        if (!user || !user.id) return new NextResponse("Unauthorized", { status: 401 });

        const apiKey  = `person_ai_${uuidv4()}`;

        const newApiKey = await prisamdb.apiKey.create({
            data:{
                key: apiKey,
                userId: user.id,
                name: new URL(request.url).searchParams.get('name') || 'Default API Key'

            }
        })
        return NextResponse.json({
            apiKey:apiKey,
            id: newApiKey.id,
        })
        
    } catch (error) {
        console.error("API Key validation error:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
        
    }
}


export async function GET(request: Request){
    const {userId} = await auth();
    if (!userId) return new NextResponse("Unauthorized", { status: 401 });

    const keys = await prisamdb.apiKey.findMany({
        where:{
            userId
        },
        select:{
            id: true,
            name: true,
            createdAt: true,
        }
    });
    return NextResponse.json(keys);

}

export async function DELETE(
    request: NextRequest,
    { params }: { params: { keyId: string } }
  ) {
    try {
      const { userId } = auth();
      
      if (!userId) {
        return new NextResponse("Unauthorized", { status: 401 });
      }
      
      if (!params.keyId) {
        return new NextResponse("API key ID is required", { status: 400 });
      }
      
      // Delete the API key and ensure it belongs to the current user
      await prisamdb.apiKey.delete({
        where: {
          id: params.keyId,
          userId: userId // This ensures users can only delete their own keys
        }
      });
      
      return new NextResponse(null, { status: 204 });
    } catch (error) {
      console.error("[API_KEY_DELETE]", error);
      
    //   // Check if error is because the key doesn't exist
    //   if (error.code === 'P2025') {
    //     return new NextResponse("API key not found", { status: 404 });
    //   }
      
      return new NextResponse("Internal Server Error", { status: 500 });
    }
  }