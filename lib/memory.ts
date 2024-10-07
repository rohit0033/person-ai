import { PrismaClient } from '@prisma/client';

export type CompanionKey = {
  companionId: string;
  userId: string;
};

export class MemoryManager {
  private static instance: MemoryManager;
  private prisma: PrismaClient;

  private constructor() {
    this.prisma = new PrismaClient();
  }

  public static async getInstance(): Promise<MemoryManager> {
    if (!MemoryManager.instance) {
      MemoryManager.instance = new MemoryManager();
    }
    return MemoryManager.instance;
  }

  public async writeToHistory(text: string, companionKey: CompanionKey) {
    if (!companionKey || !companionKey.companionId || !companionKey.userId) {
      console.log("Companion key set incorrectly");
      return null;
    }

    const message = await this.prisma.message.create({
      data: {
        content: text,
        role: 'system', // Assuming this is for AI responses. Adjust as needed.
        companionId: companionKey.companionId,
        userId: companionKey.userId,
      },
    });

    return message;
  }

  public async readLatestHistory(companionKey: CompanionKey): Promise<string> {
    if (!companionKey || !companionKey.companionId || !companionKey.userId) {
      console.log("Companion key set incorrectly");
      return "";
    }

    const messages = await this.prisma.message.findMany({
      where: {
        companionId: companionKey.companionId,
        userId: companionKey.userId,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 30, // Adjust this number as needed
    });

    const recentChats = messages.reverse().map(msg => `${msg.role}: ${msg.content}`).join("\n");
    return recentChats;
  }

  public async seedChatHistory(
    seedContent: string,
    delimiter: string = "\n",
    companionKey: CompanionKey
  ) {
    const existingMessages = await this.prisma.message.findFirst({
      where: {
        companionId: companionKey.companionId,
        userId: companionKey.userId,
      },
    });

    if (existingMessages) {
      console.log("User already has chat history");
      return;
    }

    const content = seedContent.split(delimiter);
    for (const line of content) {
      await this.prisma.message.create({
        data: {
          content: line,
          role: 'system', // Adjust as needed
          companionId: companionKey.companionId,
          userId: companionKey.userId,
        },
      });
    }
  }

  // If you still need vector search functionality, you can keep a modified version of this method
  public async vectorSearch(
    recentChatHistory: string,
    companionId: string
  ) {
    // Implement your vector search logic here
    // This could involve using a separate vector database or implementing
    // similarity search within your relational database
    
    // For now, we'll return an empty array
    return [];
  }
}