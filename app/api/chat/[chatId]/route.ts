import { StreamingTextResponse } from "ai";
import { auth, currentUser } from "@clerk/nextjs";
import { ChatOpenAI } from "@langchain/openai";
import { NextResponse } from "next/server";
import { MemoryManager, CompanionKey } from "@/lib/memory"; // Updated import
import { rateLimit } from "@/lib/rate-limit";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from '@langchain/core/output_parsers'
import prismadb from "@/lib/prismadb";

export async function POST(
    request: Request,
    { params }: { params: { chatId: string } }
) {
    try {
        const { prompt } = await request.json();
        const user = await currentUser();
        if (!user || !user.firstName || !user.id) return new NextResponse("Unauthorized", { status: 401 });

        const identifier = request.url + "-" + user.id;
        const { success } = await rateLimit(identifier)
        if (!success) return new NextResponse("Rate Limit Exceeded. Too many requests", { status: 429 });

        const companion = await prismadb.companion.update({
            where: { id: params.chatId },
            data: {
                messages: {
                    create: {
                        content: prompt,
                        role: "user",
                        userId: user.id,
                    }
                }
            },
            include: { messages: true }
        });

        if (!companion) return new NextResponse("Companion Not Found", { status: 404 });

        const companionKey: CompanionKey = {
            companionId: companion.id,
            userId: user.id,
        };

        const memoryManager = await MemoryManager.getInstance();

        const recentMessages = await prismadb.message.findMany({
            where: { companionId: companion.id, userId: user.id },
            orderBy: { createdAt: 'desc' },
            take: 10,
        });
        
        const recentChatHistory = recentMessages
            .reverse()
            .map(msg => `${msg.role}: ${msg.content}`)
            .join("\n");

        const model = new ChatOpenAI({
            modelName: "gpt-3.5-turbo",
            apiKey: process.env.OPENAI_API_KEY,
            temperature: 0.9,
        });

        const template = `
        The following is a friendly conversation between a human and AI. ${companion.instructions}
        If the AI does not know the answer to a question, it truthfully says it does not know.
        The AI answers as ${companion.name}. ONLY generate plain sentences without prefix of who is speaking.
        DO NOT use ${companion.name}: prefix. Always try to find the answer in the recent chat history provided below.

        Current conversation:
        ${recentChatHistory}

        Human: ${prompt}
        AI:
        `;

        const promptTemplate = ChatPromptTemplate.fromTemplate(template);
        const chain = promptTemplate.pipe(model).pipe(new StringOutputParser());

        const response = await chain.invoke({});

        await memoryManager.writeToHistory(response.trim(), companionKey);

        await prismadb.companion.update({
            where: { id: params.chatId },
            data: {
                messages: {
                    create: {
                        content: response.trim(),
                        role: "system",
                        userId: user.id,
                    },
                },
            }
        });

        const { Readable } = require('stream');
        const s = new Readable();
        s.push(response);
        s.push(null);

        return new StreamingTextResponse(s);

    } catch (error) {
        console.error("[CHAT_POST]", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}