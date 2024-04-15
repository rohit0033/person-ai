import { OpenAIEmbeddings } from "langchain/embeddings/openai";
import { PineconeClient } from "@pinecone-database/pinecone";
import { PineconeStore } from "langchain/vectorstores/pinecone";

async function testSimilaritySearch() {
    const pineconeClient = new PineconeClient();
    await pineconeClient.init({
      apiKey: process.env.PINECONE_API_KEY!,
      environment: process.env.PINECONE_ENVIRONMENT!,
    });
  
    const pineconeIndex = pineconeClient.Index(process.env.PINECONE_INDEX! || "");
  
    const vectorStore = await PineconeStore.fromExistingIndex(
      new OpenAIEmbeddings({ openAIApiKey: process.env.OPENAI_API_KEY }),
      { pineconeIndex }
    );
  
    const similarDocs = await vectorStore
      .similaritySearch("test recent chat history", 3, { fileName: "test file name" })
      .catch((err) => {
        console.log("WARNING: failed to get vector search results.", err);
      });
  
    console.log(similarDocs);
  }
  
  testSimilaritySearch();