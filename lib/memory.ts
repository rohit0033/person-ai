import { Redis } from '@upstash/redis';
import { PineconeClient } from '@pinecone-database/pinecone';
import { OpenAIEmbeddings } from 'langchain/embeddings/openai';
import { v4 as uuidv4 } from 'uuid';

export type CompanionKey = {
  companionName: string;
  userId: string;
};

export class MemoryManager {
  private static instance: MemoryManager;
  private redis: Redis;
  private pinecone: PineconeClient;
  public embeddings: OpenAIEmbeddings;

  private constructor() {
    this.redis = Redis.fromEnv();
    this.pinecone = new PineconeClient();
    this.embeddings = new OpenAIEmbeddings({ openAIApiKey: process.env.OPENAI_API_KEY });
  }

  public static async getInstance(): Promise<MemoryManager> {
    if (!MemoryManager.instance) {
      MemoryManager.instance = new MemoryManager();
      await MemoryManager.instance.init();
    }
    return MemoryManager.instance;
  }

  private async init() {
    await this.pinecone.init({
      environment: process.env.PINECONE_ENVIRONMENT!,
      apiKey: process.env.PINECONE_API_KEY!,
    });
  }

  private generateRedisKey(companionKey: CompanionKey): string {
    return `${companionKey.companionName}-${companionKey.userId}`;
  }
  public async writeToHistoryWithVector(
    text: string, 
    companionKey: CompanionKey,
    vector: number[]
  ): Promise<void> {
    // Use the pre-computed vector instead of computing it again
    const key = this.generateRedisKey(companionKey);
    const timestamp = Date.now();
    
    // Store in Redis for conversation history  
    await this.redis.zadd(key, {
      score: timestamp,
      member: text,
    });
    
    // Store in vector database using pre-computed vector
    const pineconeIndex = this.pinecone.Index(process.env.PINECONE_INDEX!);
    await pineconeIndex.upsert({
      upsertRequest: {
        vectors: [
          {
            id: uuidv4(),
            values: vector,
            metadata: {
              text,
              companionName: companionKey.companionName,
              userId: companionKey.userId,
            },
          },
        ],
      },
    });
  }

  public async writeToHistory(text: string, companionKey: CompanionKey): Promise<void> {
    const key = this.generateRedisKey(companionKey);
    const timestamp = Date.now();
    
    // Store the raw text in Redis
    await this.redis.zadd(key, { score: timestamp, member: text });
    
    // Create and store vector embedding in Pinecone
    const vector = await this.embeddings.embedQuery(text);
    const pineconeIndex = this.pinecone.Index(process.env.PINECONE_INDEX!);
    await pineconeIndex.upsert({
      upsertRequest: {
        vectors: [{
          id: uuidv4(),
          values: vector,
          metadata: {
            text,
            companionName: companionKey.companionName,
            userId: companionKey.userId,
          },
        }],
      },
    });
  }

  public async readLatestHistory(companionKey: CompanionKey): Promise<string> {
    const key = this.generateRedisKey(companionKey);
    const result = await this.redis.zrange(key, 0, -1, { rev: true, byScore: true, offset: 0, count: 30 });
    return result.reverse().join("\n");
  }

  public async vectorSearch(
    searchText: string,
    companionKey: CompanionKey
  ): Promise<string[]> {
    const cacheKey = `vector_embedding:${searchText}`;
    let vector: number[];
    
    const cachedVector = await this.redis.get(cacheKey);
    if (cachedVector) {
      vector = JSON.parse(cachedVector as string);
    } else {
      vector = await this.embeddings.embedQuery(searchText);
      await this.redis.set(cacheKey, JSON.stringify(vector), { ex: 3600 }); // 1hr expiry
    }
    const pineconeIndex = this.pinecone.Index(process.env.PINECONE_INDEX!);
    const results = await pineconeIndex.query({
      queryRequest: {
        vector,
        topK: 5,
        includeMetadata: true,
        filter: {
          companionName: { $eq: companionKey.companionName },
          userId: { $eq: companionKey.userId },
        },
      },
    });

    return results.matches?.map(match => (match.metadata as { text: string }).text) || [];
  }

  public async seedChatHistory(seedContent: string, companionKey: CompanionKey): Promise<void> {
    const key = this.generateRedisKey(companionKey);
    if (await this.redis.exists(key)) {
      console.log("User already has chat history");
      return;
    }

    const content = seedContent.split("\n");
    for (const line of content) {
      await this.writeToHistory(line, companionKey);
    }
  }
}