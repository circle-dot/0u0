import { ChatVectorDBQAChain } from "langchain/chains"
import { OpenAIEmbeddings } from "langchain/embeddings/openai";
import { OpenAI } from "langchain/llms/openai"
import { PineconeStore } from "langchain/vectorstores/pinecone";
import { NextResponse } from 'next/server';
import type { NextFetchEvent, NextRequest } from 'next/server';

export const config = {
  runtime: 'edge',
};

// import { createPineconeIndex } from "@/lib/pinecone"

async function handler(req) {
  console.log("🚀 ~ file: chat.ts:15 ~ handler ~ req:", req.cookies.credentials)
  const { question, chatHistory, credentials } = req.cookies

  try {
    const pineconeIndex = {}

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

    return response;
  } catch (e) {
    console.log("🚀 ~ file: chat.ts:52 ~ handler ~ e:", e)
    // res.status(500).json({ error: e.message || "Unknown error." })
  }
}

export default function MyEdgeFunction(
  request: NextRequest,
  context: NextFetchEvent,
) {
  console.log("🚀 ~ file: chat.ts:61 ~ context:", context)
  context.waitUntil(handler(request).then((json) => console.log({ json })));

  return NextResponse.json({
    name: `Hello, from ${request.url} I'm an Edge Function!`,
  });
}