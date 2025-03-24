// app/api/chat/[chatId]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs";
import { OpenAIStream, StreamingTextResponse } from "ai";
import { Configuration, OpenAIApi } from "openai-edge";
import { MemoryManager, CompanionKey } from "@/lib/memory";
import { ResponseCache } from "@/lib/cache";
import { rateLimit } from "@/lib/rate-limit";
import prismadb from "@/lib/prismadb";

// // Set edge runtime for better performance
// export const runtime = 'edge';

const config = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(config);

export async function POST(
  request: NextRequest,
  { params }: { params: { chatId: string } }
) {
  console.time('total-request-time');
  try {
    const { prompt } = await request.json();
    const user = await currentUser();
    if (!user || !user.id)
      return new NextResponse("Unauthorized", { status: 401 });

    // Initialize response cache
    const responseCache = new ResponseCache();
    
    // Check for cached response
    console.time('cache-check');
    const cachedResponse = await responseCache.getCachedResponse(
      prompt, 
      params.chatId,
      user.id
    );
    console.timeEnd('cache-check');
    
    // If we have a cached response, use it and skip AI generation
    if (cachedResponse) {
      console.log('🚀 Cache hit for prompt:', prompt.substring(0, 30) + '...');
      
      // Still need to store the interaction in the database
      const timestamp = new Date().toISOString();
      const nextTimestamp = new Date(Date.parse(timestamp) + 1000);
      
      // Create messages in database for history (in background)
      Promise.all([
        // Store messages in database
        prismadb.message.createMany({
          data: [
            {
              content: prompt,
              role: "user",
              companionId: params.chatId,
              userId: user.id,
              createdAt: timestamp,
            },
            {
              content: cachedResponse,
              role: "system",
              companionId: params.chatId,
              userId: user.id,
              createdAt: nextTimestamp,
            },
          ],
        }),
        
        // Make sure to get the companion for the name
        prismadb.companion.findUnique({ where: { id: params.chatId } })
          .then(companion => {
            if (companion) {
              const memoryManager = MemoryManager.getInstance();
              // Add to memory in background
              memoryManager.then(mm => 
                mm.writeToHistory(
                  `Human: ${prompt}\n${companion.name}: ${cachedResponse}`,
                  { companionName: params.chatId, userId: user.id }
                )
              );
            }
          })
      ]).catch(err => console.error("Background operation failed:", err));
      
      console.timeEnd('total-request-time');
      return new Response(cachedResponse);
    }

    // If no cache hit, continue with regular flow
    // Apply rate limiting
    const identifier = request.url + "-" + user.id;
    const { success } = await rateLimit(identifier);
    if (!success)
      return new NextResponse("Rate Limit Exceeded. Too many requests", {
        status: 429,
      });

    console.time('db-operations');
    // Use Promise.all for parallel database operations
    const [companion, memoryManager] = await Promise.all([
      prismadb.companion.findUnique({ where: { id: params.chatId } }),
      MemoryManager.getInstance(),
    ]);
    console.timeEnd('db-operations');

    if (!companion) {
      return new NextResponse("Companion not found", { status: 404 });
    }

    const companionKey: CompanionKey = {
      companionName: companion.id,
      userId: user.id,
    };

    console.time('memory-operations');
    // Parallelize memory operations
    const [relevantHistory, recentChatHistory] = await Promise.all([
      memoryManager.vectorSearch(prompt, companionKey),
      memoryManager.readLatestHistory(companionKey),
    ]);
    console.timeEnd('memory-operations');

    const similarContext = relevantHistory.join("\n");
    const chatHistory = recentChatHistory;

    // Pre-compute embedding for vectorization (happens in parallel with OpenAI request)
    const vectorizationPromise = (async () => {
      console.time('vector-embedding');
      try {
        // Prepare placeholder text for vectorization
        const textToVectorize = `Human: ${prompt}\n${companion.name}: PLACEHOLDER_FOR_COMPLETION`;
        
        // Generate embedding early
        const vector = await memoryManager.embeddings.embedQuery(textToVectorize);
        
        console.timeEnd('vector-embedding');
        return vector;
      } catch (error) {
        console.error("Failed to pre-compute vector embedding:", error);
        console.timeEnd('vector-embedding');
        return null;
      }
    })();

    // Prepare system message
    const systemMessage = `You are ${companion.name}. ${companion.description}
        
        Your personality: ${companion.instructions}

        You must strictly follow these rules:
        1. Stay in character as ${companion.name} at all times.
        2. Use the personality traits and speaking style as described above.
        3. Use the provided chat history and relevant past information for context, but don't reference them explicitly.
        4. Respond directly to the human's prompt without repeating or rephrasing it.
        5. Do not use any prefix before your response (like "${companion.name}:").
        6. Keep responses concise but helpful - under 150 words when possible.

        Recent conversation context:
        ${chatHistory}

        Relevant past information:
        ${similarContext}

        Human: ${prompt}
        ${companion.name}:`;

    console.time('openai-request');
    // Use a faster model with lower temperature and shorter outputs
    const response = await openai.createChatCompletion({
      model: "gpt-3.5-turbo", // Consider using gpt-3.5-turbo-instruct for even faster responses
      stream: true,
      temperature: 0.6, // Lower temperature = faster + more deterministic
      max_tokens: 150, // Limit token length for faster responses
      messages: [{ role: "system", content: systemMessage }],
    });
    console.timeEnd('openai-request');

    const timestamp = new Date().toISOString();

    // Process OpenAI stream with optimized operations
    const stream = OpenAIStream(response, {
      onCompletion: async (completion: string) => {
        console.time('post-completion-operations');
        // Create timestamps for both messages
        const timestamp = new Date().toISOString();
        const nextTimestamp = new Date(Date.parse(timestamp) + 1000);

        // Get pre-computed vector if available
        const preComputedVector = await vectorizationPromise;
        
        // Format the exchange text
        const exchangeText = `Human: ${prompt}\n${companion.name}: ${completion}`;

        // Run operations in parallel for better performance
        const promises = [
          // 1. Batch create messages in database
          prismadb.message.createMany({
            data: [
              {
                content: prompt,
                role: "user",
                companionId: params.chatId,
                userId: user.id,
                createdAt: timestamp,
              },
              {
                content: completion,
                role: "system",
                companionId: params.chatId,
                userId: user.id,
                createdAt: nextTimestamp,
              },
            ],
          }),
          
          // 2. Memory operations with vector optimization
          preComputedVector
            ? memoryManager.writeToHistoryWithVector(exchangeText, companionKey, preComputedVector)
            : memoryManager.writeToHistory(exchangeText, companionKey),
          
          // 3. Cache the response for future use
          responseCache.cacheResponse(prompt, completion, params.chatId, user.id)
        ];
        
        // Wait for all operations to complete
        await Promise.all(promises);
        console.timeEnd('post-completion-operations');
      },
    });

    console.timeEnd('total-request-time');
    return new StreamingTextResponse(stream);
  } catch (error) {
    console.error("[CHAT_POST]", error);
    console.timeEnd('total-request-time');
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}