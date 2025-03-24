import { auth } from "@clerk/nextjs"
import { NextRequest, NextResponse } from "next/server"
import OpenAI from "openai";

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
})

export async function POST(request: NextRequest){
    try {
        const {userId}= auth();
        if (!userId) {
            return new NextResponse("Unauthorized", { status: 401 });
        }
        const data = await request.json();
        const {name,description,category} = data;
        if (!name || !description || !category) {

            return new NextResponse("Missing required fields", { status: 400 });
        }
        const response = await openai.chat.completions.create({
            model: "gpt-4",
            messages: [
            {
            role: "system",
            content: "You are an expert AI character developer. Generate detailed instructions and example conversations for an AI companion."
            },
            {
            role: "user",
            content: `Create an AI companion with the following details:
          
             Name: ${name}
            Description: ${description}
            Category: ${category || "General"}
          
             Please generate:
          
            1. INSTRUCTIONS: Detailed personality traits, backstory, knowledge areas, speech patterns, and behavior guidelines for this character (minimum 300 words,maximum 400 words).
          
            2. EXAMPLE_CONVERSATION: A sample dialogue between a human and this AI character showing their personality and knowledge (minimum 5 exchanges).
          
            Format your response exactly as follows (keep the exact labels):
          
            INSTRUCTIONS:
            [detailed character instructions here]
            EXAMPLE_CONVERSATION:
            Human: [message]
            ${name}: [response]
            Human: [message]
            ${name}: [response]
            (continue for at least 5 exchanges)
          `
        }
      ],
      temperature: 0.7,
      max_tokens: 2000,

    });
    const content = response.choices[0]?.message?.content || "";
    console.log(content);
    
    // Parse the response to separate instructions and example conversation
    const instructionsMatch = content.match(/INSTRUCTIONS:([\s\S]*?)(?=EXAMPLE_CONVERSATION:|$)/);
    const conversationMatch = content.match(/EXAMPLE_CONVERSATION:([\s\S]*?)$/);
    
    const instructions = instructionsMatch ? instructionsMatch[1].trim() : "";
    const exampleConversation = conversationMatch ? conversationMatch[1].trim() : "";
    
    return NextResponse.json({ instructions, exampleConversation });


        
    } catch (error:any) {
        console.error("[CREATE_COMPANION]", error);
        return new NextResponse("Internal Server Error", { status: 500 });
        
    }

}