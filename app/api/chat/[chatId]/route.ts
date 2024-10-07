import { StreamingTextResponse, LangChainStream } from "ai";
import {auth, currentUser} from "@clerk/nextjs";
import {CallbackManager} from "langchain/callbacks";
import {Replicate} from "langchain/llms/replicate";
import { NextResponse } from "next/server";
import { MemoryManager } from "@/lib/memory";
import { ChatOpenAI, ChatOpenAICallOptions } from "@langchain/openai";
import { rateLimit } from "@/lib/rate-limit";
import { LLMChain,ConversationChain } from "langchain/chains";
import { PromptTemplate } from "langchain/prompts";
import { BufferMemory, ChatMessageHistory } from "langchain/memory";
import { StringOutputParser } from '@langchain/core/output_parsers'
import { RunnableSequence,RunnablePassthrough } from "@langchain/core/runnables"

import { ChatPromptTemplate } from "@langchain/core/prompts";

import prismadb from "@/lib/prismadb";

export async function POST (
    request: Request,
    {params} : {
        params: {
            chatId: string;
        };
    }
){
    try {
        const {prompt} = await request.json();
        const user = await currentUser();
        if(!user || !user.firstName || !user.id) return new NextResponse("Unauthorized",{status: 401});
        const identifier = request.url+"-"+user.id;
        const {success} = await rateLimit(identifier)
        if(!success) return new NextResponse("Rate Limit Exceeded. Too many requests", {status: 429});
        const companion = await prismadb.companion.update({
            where:{
                id: params.chatId,
            },
            data:{
                messages:{
                    create: {
                        content: prompt,
                        role: "user",
                        userId: user.id,
                        
                    }
                }
            }
        });
        if(!companion) return new NextResponse("Person Not Found", {status: 404});
        const name =  companion.id;
        const  companion_file_name = name+".txt";
        const companionKey = {
            companionName: name,
            userId: user.id,
            modelName:"gpt-3.5-turbo"
        }
        const memoryManager = await MemoryManager.getInstance();
        const recentChatHistory = await memoryManager.readLatestHistory(companionKey);
        // // console.log("recentChat history",recentChatHistory)
        // console.log("companion_file_name",companion_file_name)

        const similarDocs = await memoryManager.vectorSearch(recentChatHistory,companion_file_name);
        // console.log("SimilarDocs",similarDocs)
        let relevantHistorty = "";
        if(!!similarDocs && similarDocs.length !== 0){
            relevantHistorty = similarDocs.map((doc)=> doc.pageContent).join("\n");
            
        }
        // console.log(" First relevantHistorty",relevantHistorty)
        const {handlers} = LangChainStream();
        
        const model = new ChatOpenAI({
          apiKey: process.env.OPENAI_API_KEY,
          temperature: 0.9,
          
          // In Node.js defaults to process.env.OPENAI_API_KEY
        });
        // model.verbose = true;
        // const resp = String(
        //     await model
        //       .call(
        //         `
        //       ONLY generate plain sentences without prefix of who is speaking. DO NOT use ${companion.name}: prefix. 
      
        //       ${companion.instructions}
      
        //       Below are relevant details about ${companion.name}'s past and the conversation you are in.
        //       ${relevantHistorty}
      
      
        //       ${recentChatHistory}\n${companion.name}:`
        //       )
        //       .catch(console.error)
        //   );
        const template= `The following is a friendly conversation between a human and AI . ${companion.instructions}.First try to find answer in current conversation .If the AI does not know the answer to a question, it truthfully says it does not know. The AI answers as ${companion.name}.ONLY generate plain sentences without prefix of who is speaking. DO NOT use ${companion.name}: prefix.Always try find answer in recent chat history which is provided below.
        Current conversation: 
        ${recentChatHistory}
        Humman: ${prompt}
        AI:
        `;
     
        //Instantiate "PromptTemplate" passing the prompt template string initialized above
        const prompte = ChatPromptTemplate.fromTemplate(template);
        // console.log("prompt",prompte);
        // console.log("relevant History",relevantHistorty);
       
        
       

        //Instantiate LLMChain, which consists of a PromptTemplate, an LLM and memory. 
        const answerchain = prompte.pipe(model).pipe( new StringOutputParser())
        const chain = RunnableSequence.from([
    {
        original_input: new RunnablePassthrough()
    },
    {
        
        question: ({ original_input }) => original_input.question,
        conv_history: ({ original_input }) => console.log("Orginial             ",original_input.conv_history)
    },
    answerchain
])
        const response = await chain.invoke({
          question:prompt,
          conv_history: recentChatHistory

        })

          // const cleaned = resp.replaceAll(",","")
          // const chunks = cleaned.split("\n")
          // const response = chunks[0]
          await memoryManager.writeToHistory("" + response.trim(), companionKey);
          var Readable = require("stream").Readable;

          let s = new Readable();
          s.push(response);
          s.push(null);
      
          if (response !== undefined && response.length > 1) {
              memoryManager.writeToHistory("" + response.trim(), companionKey);
        
              await prismadb.companion.update({
                where: {
                  id: params.chatId
                },
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
            }

            return new StreamingTextResponse(s);
      









    } catch (error) {
        console.error("[CHAT_POST]",error);
        return new NextResponse("Internal Server Error",{status: 500})
        
    }
}