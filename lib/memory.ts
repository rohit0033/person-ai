import { Redis } from '@upstash/redis';
import { QdrantClient } from '@qdrant/js-client-rest';
import { OpenAIEmbeddings } from 'langchain/embeddings/openai';
import { v4 as uuidv4 } from 'uuid';
import prisamdb from './prismadb';

export type CompanionKey = {
  companionName: string;
  userId: string;
};

export class MemoryManager {
  private static instance: MemoryManager;
  private redis: Redis;
  private qdrant: QdrantClient;
  public embeddings: OpenAIEmbeddings;
  private qdrantConnected: boolean = false;
  private readonly collectionName: string;
  private readonly vectorDimension: number = 1536; // OpenAI embeddings dimension

  private constructor() {
    this.redis = Redis.fromEnv();
    
    // Initialize Qdrant client with hosted instance details
    this.qdrant = new QdrantClient({ 
      url: process.env.QDRANT_URL!, // Your hosted Qdrant URL
      apiKey: process.env.QDRANT_API_KEY // Your Qdrant API key
    });
    
    this.embeddings = new OpenAIEmbeddings({ openAIApiKey: process.env.OPENAI_API_KEY });
    this.collectionName = process.env.QDRANT_COLLECTION || 'companion';
  }

  public static async getInstance(): Promise<MemoryManager> {
    if (!MemoryManager.instance) {
      MemoryManager.instance = new MemoryManager();
      await MemoryManager.instance.init();
      
      // Clear corrupted cache entries once on startup
      await MemoryManager.instance.clearCorruptedCache();
    }
    return MemoryManager.instance;
  }

  private async init() {
    try {
      // Check connection to Qdrant and if collection exists
      const collections = await this.qdrant.getCollections();
      console.log("Qdrant connected successfully. Available collections:", 
        collections.collections.map(c => c.name));
      
      // Check if our collection exists
      const collectionExists = collections.collections.some(
        collection => collection.name === this.collectionName
      );
      
      if (!collectionExists) {
        console.log(`Creating Qdrant collection: ${this.collectionName}`);
        
        // Create the collection with proper configuration
        await this.qdrant.createCollection(this.collectionName, {
          vectors: {
            size: this.vectorDimension,
            distance: "Cosine"
          }
        });
        
        // Create payload indices for faster filtering
        await this.qdrant.createPayloadIndex(this.collectionName, {
          field_name: "companionName",
          field_schema: "keyword"
        });
        
        await this.qdrant.createPayloadIndex(this.collectionName, {
          field_name: "userId",
          field_schema: "keyword"
        });
      }
      
      // Get collection info for verification
      const collectionInfo = await this.qdrant.getCollection(this.collectionName);
      // console.log(`Successfully connected to Qdrant collection "${this.collectionName}". Vector count:`, 
      //            collectionInfo.vectors_count);
      
      this.qdrantConnected = true;
    } catch (error) {
      console.error("Failed to initialize Qdrant:", error);
      console.error("Application will continue with Redis only.");
      this.qdrantConnected = false;
    }
  }

  // Helper method to clear corrupted cache entries (unchanged)
  public async clearCorruptedCache(): Promise<void> {
    // Your existing method remains unchanged
    try {
      const keys = await this.redis.keys('vector_embedding:*');
      let cleared = 0;
      
      for (const key of keys) {
        const value = await this.redis.get(key);
        if (value) {
          try {
            JSON.parse(value as string);
          } catch (error) {
            // If parsing fails, delete the key
            await this.redis.del(key);
            cleared++;
          }
        }
      }
      
      if (cleared > 0) {
        console.log(`Cleared ${cleared} corrupted cache entries`);
      }
    } catch (error) {
      console.error("Error clearing corrupted cache:", error);
    }
  }

  private generateRedisKey(companionKey: CompanionKey): string {
    return `${companionKey.companionName}-${companionKey.userId}`;
  }
  
  public async writeToHistoryWithVector(
    text: string, 
    companionKey: CompanionKey,
    vector: number[]
  ): Promise<void> {
    try {
      // Store in Redis for conversation history (unchanged)
      // console.log("Writing to history with vector:", vector.length, text);
      const key = this.generateRedisKey(companionKey);
      // console.log("Key:", key);
      const timestamp = Date.now();
      const result = await this.redis.zadd(key, { score: timestamp, member: text });
      // console.log("Redis zadd result:", result);
      
      // Verify the data was written
      const count = await this.redis.zcard(key);
      // console.log(`Total entries in key ${key}: ${count}`);
      
      // Only attempt to use Qdrant if it's connected
      if (this.qdrantConnected) {
        try {
          // Generate a unique point ID
          const pointId = uuidv4();
          
          // Store the vector in Qdrant
          await this.qdrant.upsert(this.collectionName, {
            wait: true,
            points: [
              {
                id: pointId,
                vector: vector,
                payload: {
                  text,
                  companionName: companionKey.companionName,
                  userId: companionKey.userId,
                  timestamp
                }
              }
            ]
          });
        } catch (error) {
          console.error("Failed to store in Qdrant, continuing with Redis only:", error);
          this.qdrantConnected = false;
        }
      }
    } catch (error) {
      console.error("Error in writeToHistoryWithVector:", error);
      // Don't throw the error, let the application continue
    }
  }

  public async writeToHistory(text: string, companionKey: CompanionKey): Promise<void> {
    try {
      // Always store in Redis (unchanged)
      // console.log("Writing to history:", text);
      const key = this.generateRedisKey(companionKey);
      const timestamp = Date.now();
      await this.redis.zadd(key, { score: timestamp, member: text });
      
      // Only attempt to use Qdrant if it's connected
      if (this.qdrantConnected) {
        try {
          // Create and store vector embedding in Qdrant
          const vector = await this.embeddings.embedQuery(text);
          
          // Generate a unique point ID
          const pointId = uuidv4();
          
          // Store the vector in Qdrant
          await this.qdrant.upsert(this.collectionName, {
            wait: true,
            points: [
              {
                id: pointId,
                vector: vector,
                payload: {
                  text,
                  companionName: companionKey.companionName,
                  userId: companionKey.userId,
                  timestamp
                }
              }
            ]
          });
        } catch (error) {
          console.error("Failed to store in Qdrant, continuing with Redis only:", error);
          this.qdrantConnected = false;
        }
      }
    } catch (error) {
      console.error("Error in writeToHistory:", error);
      // Don't throw the error, let the application continue
    }
  }

  public async readLatestHistory(companionKey: CompanionKey): Promise<string> {
    // Redis history reading (unchanged)
    try {
      const key = this.generateRedisKey(companionKey);
      // console.log("Reading history from key:", key);
      
      // First check if the key exists
      const exists = await this.redis.exists(key);
      
      if (!exists) {
        console.log("No history found for this companion");
        return "";
      }
      
      // Get number of entries
      const count = await this.redis.zcard(key);
      // console.log(`Total entries for ${key}: ${count}`);
      
      // Get entries from highest to lowest (newest first)
      const result = await this.redis.zrange(key, 0, 10, { 
        rev: true  // Get in reverse order (newest first)
      });
      
      // Reverse again to get chronological order (oldest first)
      return result.reverse().join("\n");
    } catch (error) {
      console.error("Error reading history:", error);
      return ""; // Return empty string on error
    }
  }

  public async vectorSearch(
    searchText: string,
    companionKey: CompanionKey
  ): Promise<string[]> {
    // If Qdrant is not connected, return empty results
    if (!this.qdrantConnected) {
      return [];
    }
    
    try {
      const cacheKey = `vector_embedding:${searchText}`;
      let vector: number[];
      
      try {
        const cachedVector = await this.redis.get(cacheKey);
        
        if (cachedVector) {
          try {
            // Safely parse the JSON with error handling
            vector = JSON.parse(cachedVector as string);
          } catch (parseError) {
            console.error("Error parsing cached vector, will recompute:", parseError);
            // If parsing fails, just compute a new vector
            vector = await this.embeddings.embedQuery(searchText);
            // Update the cache with the correct format
            await this.redis.set(cacheKey, JSON.stringify(vector), { ex: 3600 });
          }
        } else {
          // No cached vector, compute a new one
          vector = await this.embeddings.embedQuery(searchText);
          await this.redis.set(cacheKey, JSON.stringify(vector), { ex: 3600 }); // 1hr expiry
        }
        
        // Search in Qdrant with filters for this companion and user
        const searchResults = await this.qdrant.search(this.collectionName, {
          vector: vector,
          limit: 5,
          filter: {
            must: [
              {
                key: "companionName",
                match: {
                  value: companionKey.companionName
                }
              },
              {
                key: "userId",
                match: {
                  value: companionKey.userId
                }
              }
            ]
          },
          with_payload: true
        });
    
        if (!searchResults || searchResults.length === 0) {
          return [];
        }
    
        return searchResults
        .map(match => match?.payload?.text as string || "")
          .filter(Boolean);
      } catch (error) {
        console.error("Error in vector search:", error);
        // Mark Qdrant as disconnected if we get an auth error
        if (error instanceof Error) {
          if (error.message.includes("Unauthorized") || error.message.includes("Connection refused")) {
            this.qdrantConnected = false;
          }

          
        } else if (typeof error === 'string') {
          if (error.includes("Unauthorized") || error.includes("Connection refused")) {
            this.qdrantConnected = false;
          }
        } else if (error && typeof error === 'object') {
          const errorString = String(error);
          if (errorString.includes("Unauthorized") || errorString.includes("Connection refused")) {
            this.qdrantConnected = false;
          }
        }
        // Return empty results on error so the chat can still function
        return [];
      }
    } catch (error) {
      console.error("Outer error in vector search:", error);
      return [];
    }
  }

  // Your other methods remain unchanged
  // public async storePersonalityTrait(trait: any, companionKey: CompanionKey): Promise<void> {
    
  //   try {
  //     const key = `personality:${companionKey.companionName}:${companionKey.userId}`;
      
  //     // Store trait in Redis sorted by confidence
  //     await this.redis.zadd(key, {
  //       score: trait.confidence,
  //       member: JSON.stringify({
  //         type: trait.type,
  //         content: trait.content,
  //         source: trait.source,
  //         timestamp: Date.now()
  //       })
  //     });
  //   } catch (error) {
  //     console.error("Error storing personality trait:", error);
  //   }
  // }
  
  public async getPersonalityTraits(
    companionKey: CompanionKey,
    type?: string,
    minConfidence: number = 0.7
  ): Promise<any[]> {
   
    try {
      const whereClause: any = {
        companionId: companionKey.companionName,
        userId: companionKey.userId,
        confidence: {
          gte: minConfidence
        }
      };
      
      if (type) {
        whereClause.type = type;
      }
      
      return prisamdb.personalityTrait.findMany({
        where: whereClause,
        orderBy: {
          confidence: 'desc'
        },
        take: 30 // Limit to most confident traits
      });
    } catch (error) {
      console.error("Error getting personality traits:", error);
      return [];
    }
  }

  public async seedChatHistory(seedContent: string, companionKey: CompanionKey): Promise<void> {
  
    try {
      const key = this.generateRedisKey(companionKey);
      if (await this.redis.exists(key)) {
        console.log("User already has chat history");
        return;
      }
  
      const content = seedContent.split("\n");
      for (const line of content) {
        await this.writeToHistory(line, companionKey);
      }
    } catch (error) {
      console.error("Error seeding chat history:", error);
    }
  }
}