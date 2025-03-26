// app/api/twitter-analysis/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs";
import { TwitterService } from "@/lib/twitter-service";
import { OpenAI } from "openai";
import { CustomApiRateLimit, externalApiRateLimit } from "@/lib/rate-limit";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const { userId } = auth();
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }
    
    // Parse request body
        const identifier = request.url + "-" + userId;
        const { success } = await CustomApiRateLimit(identifier);
          if (!success)
            return new NextResponse("Rate Limit Exceeded. Too many requests", {
              status: 429,
        });
    const body = await request.json();
    const { username,name } = body;
    
    if (!username) {
      return new NextResponse("Username is required", { status: 400 });
    }
    
    // Fetch tweets
    const twitterService = new TwitterService();
    const tweets = await twitterService.getUserTweets(username, 30);
    
    if (!tweets || tweets.length === 0) {
      return new NextResponse("No tweets found for this user", { status: 404 });
    }
    
    // Combine tweets into one text
    const tweetText = tweets.map(tweet => tweet.text).join('\n\n');
    
    // Analyze with OpenAI
    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: `You are an expert personality analyzer. Your task is to analyze Twitter posts and generate:
          
          1. A detailed personality profile  for an AI companion that mimics the Twitter user's style and interests
          2. An example conversation showing how this AI companion would interact
          
          Format your response exactly like this:
          
          INSTRUCTIONS:
          [300-400 word detailed personality description including traits, interests, communication style, knowledge areas, and opinions]
          
          EXAMPLE_CONVERSATION:
          Human: [message]
          AI: [response that shows personality]
          Human: [message]
          AI: [response]
          [include at least 5 exchanges]`
        },
        {
          role: "user",
          content: `Here are tweets from @${username}:\n\n${tweetText}\n\nBased on these tweets, generate a personality profile and example conversation.`
        }
      ],
      temperature: 0.7,
      max_tokens: 2000,
    });
    
    const content = response.choices[0]?.message?.content || "";
    
    // Parse the response
    const instructionsMatch = content.match(/INSTRUCTIONS:([\s\S]*?)(?=EXAMPLE_CONVERSATION:|$)/);
    const exampleConversationMatch = content.match(/EXAMPLE_CONVERSATION:([\s\S]*?)$/);
    
    const instructions = instructionsMatch ? instructionsMatch[1].trim() : "";
    const conversation = exampleConversationMatch ? exampleConversationMatch[1].trim() : "";
    
    if (!instructions || !conversation) {
      return new NextResponse("Failed to generate personality from tweets", { status: 500 });
    }
    
    return NextResponse.json({ instructions, conversation });
  } catch (error: any) {
    console.error("[TWITTER_ANALYSIS]", error);
    return new NextResponse(error.message || "Internal Server Error", { status: 500 });
  }
}