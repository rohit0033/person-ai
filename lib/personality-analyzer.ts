import { OpenAI } from "openai";
import prismadb from "./prismadb";
import { CompanionKey } from "./memory";
import { Redis } from "@upstash/redis";

export class PersonalityAnalyzer {
  private openai: OpenAI;
  private redis: Redis;
  
  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    this.redis = Redis.fromEnv();
  }
  
  // Extract initial personality from companion profile
  async extractInitialPersonality(companion: any, companionKey: CompanionKey): Promise<void> {
    try {
      // Use both the instructions and seed data to extract initial personality
      const combinedData = `
        Name: ${companion.name}
        Description: ${companion.description}
        Instructions (Personality): ${companion.instructions}
        Example Conversations: ${companion.seed}
      `;
      
      const response = await this.openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: `You are an expert personality analyzer. Extract personality traits from this AI companion profile.
                     Identify key traits, interests, opinions, and behaviors.
                     Format as JSON: {"traits":[{"type": "interest", "content": "trait description", "confidence": 0.9}]}`
          },
          {
            role: "user",
            content: combinedData
          }
        ],
        temperature: 0.7,
        response_format: { type: "json_object" },
        max_tokens: 1000,
      });
      
      const content = response.choices[0].message.content;
      if (!content) return;
      
      try {
        const data = JSON.parse(content);
        const traits = data.traits || [];
        
        // Store traits with higher confidence since they come from profile
        for (const trait of traits) {
          await prismadb.personalityTrait.create({
            data: {
              companionId: companionKey.companionName,
              userId: companionKey.userId,
              type: trait.type,
              content: trait.content,
              confidence: Math.min(trait.confidence + 0.1, 1.0), // Slightly higher confidence for profile-derived traits
              source: "Profile data"
            }
          });
        }
        
        console.log(`Extracted ${traits.length} initial personality traits from profile`);
      } catch (error) {
        console.error("Failed to parse initial personality traits:", error);
      }
    } catch (error) {
      console.error("Failed to extract initial personality:", error);
    }
  }
  
  // Analyze conversation for personality traits
  async analyzeConversation(
    conversation: string, 
    companionName: string, 
    companionKey: CompanionKey,
    priorityAnalysis: boolean = false
  ): Promise<void> {
    // Skip very short conversations
    if (conversation.length < 50) {
      return;
    }
    
    // Check for analysis cooldown unless this is a priority analysis
    if (!priorityAnalysis) {
      const cacheKey = `personality_analysis_cooldown:${companionKey.companionName}:${companionKey.userId}`;
      const lastAnalyzed = await this.redis.get(cacheKey);
      
      if (lastAnalyzed) {
        // Skip if we've analyzed recently (last 5 minutes) and this isn't priority
        return;
      }
      
      // Set cooldown for 5 minutes
      await this.redis.set(cacheKey, Date.now().toString(), { ex: 300 });
    }
    
    try {
      const response = await this.openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: `You are an expert personality analyzer. Extract only clear personality traits from this conversation with ${companionName}.
                     Categorize them as "interest", "opinion", "behavior", "communication", or "emotional".
                     Focus on specific, unique traits that reveal core personality, not trivial details.
                     Only return traits you have high confidence in.
                     Format as JSON: {"traits":[{"type": "interest", "content": "trait description", "confidence": 0.9}]}`
          },
          {
            role: "user",
            content: conversation
          }
        ],
        temperature: 0.7,
        response_format: { type: "json_object" },
        max_tokens: 500,
      });
      
      const content = response.choices[0].message.content;
      if (!content) return;
      
      try {
        const data = JSON.parse(content);
        const traits = data.traits || [];
        
        // Store each trait
        for (const trait of traits) {
          if (!trait.type || !trait.content || !trait.confidence) continue;
          
          // Check if similar trait already exists
          const existingTrait = await prismadb.personalityTrait.findFirst({
            where: {
              companionId: companionKey.companionName,
              userId: companionKey.userId,
              type: trait.type,
              content: {
                contains: trait.content.substring(0, 40)
              }
            }
          });
          
          if (existingTrait) {
            // Update if new trait has higher confidence
            if (trait.confidence > existingTrait.confidence) {
              await prismadb.personalityTrait.update({
                where: { id: existingTrait.id },
                data: {
                  confidence: trait.confidence,
                  source: conversation.substring(0, 200) // Store a snippet of the source
                }
              });
            }
          } else {
            // Create new trait
            await prismadb.personalityTrait.create({
              data: {
                companionId: companionKey.companionName,
                userId: companionKey.userId,
                type: trait.type,
                content: trait.content,
                confidence: trait.confidence,
                source: conversation.substring(0, 200) // Store a snippet of the source
              }
            });
          }
        }
      } catch (error) {
        console.error("Failed to parse personality traits:", error);
      }
    } catch (error) {
      console.error("Failed to analyze personality:", error);
    }
  }
  
  // Generate a comprehensive personality profile from traits
  async generatePersonalityProfile(
    companionId: string,
    userId: string
  ): Promise<any> {
    try {
      // Get companion base information
      const companion = await prismadb.companion.findUnique({
        where: { id: companionId }
      });
      
      if (!companion) {
        throw new Error("Companion not found");
      }
      
      // Get stored traits
      const traits = await prismadb.personalityTrait.findMany({
        where: {
          companionId,
          userId
        },
        orderBy: {
          confidence: 'desc'
        },
        take: 50
      });
      
      // If we have enough data for analysis
      if (traits.length > 0) {
        // Generate comprehensive profile
        const response = await this.openai.chat.completions.create({
          model: "gpt-3.5-turbo",
          messages: [
            {
              role: "system",
              content: `You're analyzing an AI companion named ${companion.name}.
              
              Based on their base personality and extracted traits, create a detailed personality profile including:
              
              1. Core personality traits (5-7 traits)
              2. Communication style 
              3. Interests and preferences
              4. Opinions and beliefs
              5. Behavioral patterns
              6. Emotional tendencies
              
              Format your analysis as JSON with this structure:
              {
                "coreTraits": ["trait1", "trait2", ...],
                "communicationStyle": "Detailed description",
                "interests": ["interest1", "interest2", ...],
                "opinions": {
                  "topic1": "opinion on topic1",
                  "topic2": "opinion on topic2"
                },
                "behavioralPatterns": ["pattern1", "pattern2", ...],
                "emotionalTendencies": ["tendency1", "tendency2", ...]
              }`
            },
            {
              role: "user",
              content: `Base personality:\n${companion.instructions}\n\nExtracted traits:\n${JSON.stringify(traits.map(t => ({
                type: t.type,
                content: t.content,
                confidence: t.confidence
              })))}`
            }
          ],
          response_format: { type: "json_object" }
        });
        
        try {
          return JSON.parse(response.choices[0].message.content || "{}");
        } catch (error) {
          console.error("Failed to parse personality profile:", error);
          return { 
            coreTraits: ["Still analyzing..."],
            communicationStyle: "Analyzing communication patterns",
            interests: [],
            opinions: {},
            behavioralPatterns: [],
            emotionalTendencies: []
          };
        }
      } else {
        // Return basic information if not enough data
        return {
          coreTraits: ["Still learning..."],
          communicationStyle: "Keep chatting to discover more",
          interests: [],
          opinions: {},
          behavioralPatterns: [],
          emotionalTendencies: []
        };
      }
    } catch (error) {
      console.error("Failed to generate personality profile:", error);
      return { 
        coreTraits: ["Analysis unavailable"],
        communicationStyle: "Information not available at this time",
        interests: [],
        opinions: {},
        behavioralPatterns: [],
        emotionalTendencies: []
      };
    }
  }
}