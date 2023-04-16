import type { NextApiRequest, NextApiResponse } from "next"
import { Document } from "langchain/document"
import { OpenAIEmbeddings } from "langchain/embeddings"
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter"
import { PineconeStore } from "langchain/vectorstores"

import mainAction from "@/lib/discourse"
import { createPineconeIndex } from "@/lib/pinecone"
import { chunk } from "@/lib/utils"

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { credentials } = req.body

  const discourseUrl = credentials?.community?.discourseUrl
  console.log("🚀 ~ file: discourse.ts:18 ~ credentials:", credentials)
  if (!discourseUrl) {
    res.status(500).json({ error: "No community URL provided." })
  }

  try {
    const contents = await mainAction(discourseUrl);

    // TODO: Move this to run locally. 
    const contentChunks = async () => {
      const rawDocs = new Document({ pageContent: contents })
      const textSplitter = new RecursiveCharacterTextSplitter({
        chunkSize: 1000,
        chunkOverlap: 200,
      })
      return await textSplitter.splitDocuments([rawDocs])
    }

    // Await the contentChunks promise
    const resolvedContentChunks = await contentChunks();

    // Use the flat() method to flatten the array
    const flatDocs = resolvedContentChunks?.flat();

    const index = await createPineconeIndex({
      pineconeApiKey: credentials.pineconeApiKey,
      pineconeEnvironment: credentials.pineconeEnvironment,
      pineconeIndexName: credentials.pineconeIndex,
    })
    const chunkSize = 100
    const chunks = chunk(flatDocs, chunkSize)

    await Promise.all(
      chunks.map((chunk) => {
        return PineconeStore.fromDocuments(
          index,
          chunk,
          new OpenAIEmbeddings({
            modelName: "text-embedding-ada-002",
            openAIApiKey: credentials.openaiApiKey,
          })
        )
      })
    )

    res.status(200).json({})
  } catch (e) {
    res.status(500).json({ error: e.message || "Unknown error." })
  }
}
