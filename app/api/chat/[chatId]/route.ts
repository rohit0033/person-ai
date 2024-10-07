import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from "@clerk/nextjs";
import { OpenAIStream, StreamingTextResponse } from 'ai';
import { Configuration, OpenAIApi } from 'openai-edge';
import { MemoryManager, CompanionKey } from "@/lib/memory";
import { rateLimit } from "@/lib/rate-limit";
import prismadb from "@/lib/prismadb";

const config = new Configuration({
  apiKey: process.env.OPENAI_API_KEY
});
const openai = new OpenAIApi(config);

export async function POST(
    request: NextRequest,
    { params }: { params: { chatId: string } }
) {
    try {
        const { prompt } = await request.json();
        const user = await currentUser();
        if (!user || !user.id) return new NextResponse("Unauthorized", { status: 401 });

        const identifier = request.url + "-" + user.id;
        const { success } = await rateLimit(identifier)
        if (!success) return new NextResponse("Rate Limit Exceeded. Too many requests", { status: 429 });

        const companion = await prismadb.companion.findUnique({
            where: { id: params.chatId }
        });

        if (!companion) {
            return new NextResponse("Companion not found", { status: 404 });
        }

        const companionKey: CompanionKey = {
            companionName: companion.id,
            userId: user.id,
        };

        const memoryManager = await MemoryManager.getInstance();

        const relevantHistory = await memoryManager.vectorSearch(prompt, companionKey);
        const recentChatHistory = await memoryManager.readLatestHistory(companionKey);

        const similarContext = relevantHistory.join('\n');
        const chatHistory = recentChatHistory;

        const systemMessage = `You are ${companion.name}. ${companion.description}
        
        Your personality: ${companion.instructions}

        You must strictly follow these rules:
        1. Stay in character as ${companion.name} at all times.
        2. Use the personality traits and speaking style as described above.
        3. Use the provided chat history and relevant past information for context, but don't reference them explicitly.
        4. Respond directly to the human's prompt without repeating or rephrasing it.
        5. Do not use any prefix before your response (like "${companion.name}:").

        Recent conversation context:
        ${chatHistory}

        Relevant past information:
        ${similarContext}

        Human: ${prompt}
        ${companion.name}:`;

        const response = await openai.createChatCompletion({
            model: 'gpt-3.5-turbo',
            stream: true,
            messages: [
                { role: "system", content: systemMessage },
            ]
        });

        const stream = OpenAIStream(response, {
            onCompletion: async (completion: string) => {
                await memoryManager.writeToHistory(`Human: ${prompt}\n${companion.name}: ${completion}`, companionKey);
            },
        });

        return new StreamingTextResponse(stream);

    } catch (error) {
        console.error("[CHAT_POST]", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}