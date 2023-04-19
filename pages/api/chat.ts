import type { NextApiRequest, NextApiResponse } from "next"
import { ChatVectorDBQAChain } from "langchain/chains"
import { OpenAIEmbeddings } from "langchain/embeddings/openai";
import { OpenAI } from "langchain/llms/openai"
import { PineconeStore } from "langchain/vectorstores/pinecone";


import { createPineconeIndex } from "@/lib/pinecone"

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { question, chatHistory, credentials } = req.body

  try {
    const pineconeIndex = await createPineconeIndex({
      pineconeApiKey: process.env.PINECONE_API_KEY,
      pineconeEnvironment: process.env.PINECONE_ENVIROMENT,
      pineconeIndexName: process.env.PINECONE_INDEX,
    })

    const vectorStore = await PineconeStore.fromExistingIndex(
      new OpenAIEmbeddings({
        openAIApiKey: credentials.openaiApiKey,
      }),
      {
        pineconeIndex,
      }
    )
    console.log("🚀 ~ file: chat.ts:29 ~ vectorStore:", vectorStore)

    const model = new OpenAI({
      modelName: "gpt-3.5-turbo",
      streaming: true,
      // modelName: "gpt-4", // "gpt-3.5-turbo",
      openAIApiKey: credentials.openaiApiKey,
    })

    const chain = ChatVectorDBQAChain.fromLLM(model, vectorStore)
    console.log("🚀 ~ file: chat.ts:37 ~ chain:", chain)
    const response = await chain.call({
      question,
      max_tokens: 500, // todo: pick up a sensible value
      chat_history: chatHistory || [],
    })

    res.status(200).json(response)
  } catch (e) {
    res.status(500).json({ error: e.message || "Unknown error." })
  }
}