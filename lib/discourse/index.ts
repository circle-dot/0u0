import { Document } from "langchain/document"
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter"
import { PineconeStore } from "langchain/vectorstores/pinecone";
import { OpenAIEmbeddings } from "langchain/embeddings/openai";
import { createPineconeIndex } from "@/lib/pinecone"
import { chunk, sleep } from "@/lib/utils"
import axios from "@/lib/axiosInstance"

import getTopicContent from './getTopicContent';
import topicRow from './topicRow';

// Make sure Vercel's serverless fc doesn't timeout
const contentChunks = async (contents) => {
    const rawDocs = new Document({ pageContent: contents })
    const textSplitter = new RecursiveCharacterTextSplitter({
        chunkSize: 1000,
        chunkOverlap: 200,
    })
    return await textSplitter.splitDocuments([rawDocs])
}

// Throttled function to fetch topic content
async function getThrottledTopicContent(discourseUrl, topic) {
    await sleep(200); // Wait for 200ms before making a request
    return getTopicContent(discourseUrl, topic);
}

const mainAction = async (topicList, discourseUrl, credentials) => {
    try {
        const contentPromises = [];

        for (const topic of topicList) {
            contentPromises.push(getThrottledTopicContent(discourseUrl, topic));
        }
        const content = await Promise.all(contentPromises);
        console.log("🚀 ~ file: index.ts:15 ~ mainAction ~ content =========")

        const categoryUrl = `${discourseUrl}/categories.json`;
        const response = await axios.get(categoryUrl);
        const categories = response.data.category_list.categories;
        const categoryIdToName = Object.fromEntries(categories.map((cat: any) => [cat.id, cat.name]));

        const rowPromises = topicList.map((topic) => topicRow(discourseUrl, topic, categoryIdToName));
        const topicRows = await Promise.all(rowPromises);
        const contentSum = content.join("");
        const topicSUm = topicRows.join("");

        const contents = contentSum + " - " + topicSUm;

        // Await the contentChunks promise
        const resolvedContentChunks = await contentChunks(contents);

        // Use the flat() method to flatten the array
        const flatDocs = resolvedContentChunks?.flat();

        const pineconeIndex = await createPineconeIndex({
            pineconeApiKey: process.env.PINECONE_API_KEY,
            pineconeEnvironment: process.env.PINECONE_ENVIROMENT,
            pineconeIndexName: process.env.PINECONE_INDEX,
        })

        const chunkSize = 100
        const chunks = chunk(flatDocs, chunkSize)

        await Promise.all(
            chunks.map((chunk) => {
                try {
                    return PineconeStore.fromDocuments(
                        chunk,
                        new OpenAIEmbeddings({
                            openAIApiKey: credentials.openaiApiKey,
                        }),
                        {
                            pineconeIndex,
                        }
                    )
                } catch (error) {
                    console.log("🚀 ~ file: index.ts:73 ~ chunks.map ~ error:", error)
                    return new Error(error)
                }
            })
        )
        console.log("🚀🚀🚀🚀🚀🚀")
        await sleep(1000);
        return;
    } catch (error) {
        return new Error(error)
    }
}

export default mainAction;