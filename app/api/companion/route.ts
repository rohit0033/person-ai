import prisamdb from "@/lib/prismadb";
import { auth, currentUser } from "@clerk/nextjs";
import { NextResponse } from "next/server";
import { PersonalityAnalyzer } from "@/lib/personality-analyzer";
export async function POST(req: Request) {
  try {

    const body = await req.json();
    const user = await currentUser();
    const{ src,name,description,instructions,seed,categoryId} = body
    if(!user || !user.id ||!user.firstName){
      return new NextResponse("Unauthorized",{status: 400})
    }
    if(!src || !name  || !description || !instructions || !seed || !categoryId){
      return new NextResponse("Missing required fields",{status: 400})
    }

    const companion = await prisamdb.companion.create({
        data:{
           categoryId,
           userId:user.id,
           userName:user.firstName,
           src,
           name,
           description,
           instructions,
           seed
        }
    })
    const analyzer = new PersonalityAnalyzer();
    const companionKey = {
      companionName: companion.id,
      userId: user.id
    };
    
    // Run in background to not delay response
    Promise.resolve().then(async () => {
      await analyzer.extractInitialPersonality(companion, companionKey);
    });
    


    return NextResponse.json(companion);


    
  } catch (error) {
    console.log("[COMPANION_POST]",error)
    return new NextResponse("Internal Error",{status: 400})
    
  }
}

