import { PineconeClient } from "@pinecone-database/pinecone";
import { CallbackManager } from "langchain/callbacks";
import { LLMChain } from "langchain/chains";
import { ChatOpenAI } from "langchain/chat_models/openai";
import { OpenAIEmbeddings } from 'langchain/embeddings';
import { OpenAI } from "langchain/llms";
import { PromptTemplate } from "langchain/prompts";
import type { NextApiRequest, NextApiResponse } from 'next';
import { uuid } from 'uuidv4';
import { summarizeLongDocument } from './summarizer';

// import { ConversationLog } from './conversationLog';
import { Metadata, getMatchesFromEmbeddings } from './matches';
import { templates } from './templates';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {

  try {
    const { question, chatHistory, credentials } = req.body
    const openAIApiKey = credentials?.openaiApiKey

    const llm = new OpenAI({
      openAIApiKey,
    });
    let pinecone: PineconeClient | null = null

    const initPineconeClient = async () => {
      pinecone = new PineconeClient();
      await pinecone.init({
        apiKey: process.env.PINECONE_API_KEY,
        environment: process.env.PINECONE_ENVIROMENT,
      });
    }

    if (!pinecone) {
      await initPineconeClient();
    }

    let summarizedCount = 0;

    const interactionId = uuid()

    // Retrieve the conversation log and save the user's prompt
    // const conversationLog = new ConversationLog(userId)
    // const conversationHistory = await conversationLog.getConversation({ limit: 10 })
    // await conversationLog.addEntry({ entry: prompt, speaker: "user" })

    // Build an LLM chain that will improve the user prompt
    const inquiryChain = new LLMChain({
      llm, prompt: new PromptTemplate({
        template: templates.inquiryTemplate,
        inputVariables: ["userPrompt", "conversationHistory"],
      })
    });
    const inquiryChainResult = await inquiryChain.call({ userPrompt: question, conversationHistory: chatHistory })
    const inquiry = inquiryChainResult.text

    // Embed the user's intent and query the Pinecone index
    const embedder = new OpenAIEmbeddings({
      modelName: "text-embedding-ada-002",
      openAIApiKey,
    });

    const embeddings = await embedder.embedQuery(inquiry);

    const matches = await getMatchesFromEmbeddings(embeddings, pinecone!, 3);

    const urls = matches && Array.from(new Set(matches.map(match => {
      const metadata = match.metadata as Metadata
      const { url } = metadata
      return url
    })))

    console.log(urls)

    const fullDocuments = matches && Array.from(
      matches.reduce((map, match) => {
        const metadata = match.metadata as Metadata;
        const { text, url } = metadata;
        if (!map.has(url)) {
          map.set(url, text);
        }
        return map;
      }, new Map())
    ).map(([_, text]) => text);

    const chunkedDocs = matches && Array.from(new Set(matches.map(match => {
      const metadata = match.metadata as Metadata
      const { chunk } = metadata
      return chunk
    })))

    const onSummaryDone = (summary: string) => {
      summarizedCount += 1
    }

    const summary = await summarizeLongDocument(fullDocuments!.join("\n"), inquiry, onSummaryDone, openAIApiKey)
    console.log(summary)

    // Prepare a QA chain and call it with the document summaries and the user's prompt
    const promptTemplate = new PromptTemplate({
      template: templates.qaTemplate,
      inputVariables: ["summaries", "question", "conversationHistory", "urls"],
    });


    const chat = new ChatOpenAI({
      streaming: true,
      verbose: true,
      modelName: "gpt-3.5-turbo",
      openAIApiKey,
      callbackManager: CallbackManager.fromHandlers({
        async handleLLMNewToken(token) {
          console.log(token)
        },
        async handleLLMEnd(result) {
        }
      }),
    });

    const chain = new LLMChain({
      prompt: promptTemplate,
      llm: chat,
    });

    const resp = await chain.call({
      summaries: summary,
      question: question,
      conversationHistory: chatHistory,
      urls
    });

    console.log("🚀 ~ file: chat.ts:201 ~ //handleRequest ~ resp:", resp)
    res.status(200).json(resp)
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: e.message || "Unknown error." })
  }
}