import React, { useCallback, useState } from "react"
import Head from "next/head"
import Link from "next/link"
import { useCredentialsCookie } from "@/context/credentials-context"
import { useToast } from "@/hooks/use-toast"
import { Bot, Loader2, Send, User } from "lucide-react"

import { siteConfig } from "@/config/site"
import { cn } from "@/lib/utils"
import { Layout } from "@/components/layout"
import { Button } from "@/components/ui/button"

const DEFAULT_QUESTION = "what is this about?"
const INITIAL_MESSAGE = [
  '',
  "You can think me as your knowledge base. I can answer questions about the community you select.",
]

export default function IndexPage() {
  const [question, setQuestion] = useState('')
  const [isAsking, setIsAsking] = useState(false)
  // TODO: Store chat history in local storage and add clear button
  const [chatHistory, setChatHistory] = useState([])
  const { cookieValue } = useCredentialsCookie()

  const baseUrl = 'http://0.0.0.0:8000'
  const { toast } = useToast()

  const handleQueryChange = (e) => {
    setQuestion(e.target.value)
  }

  const handleSubmit = useCallback(async () => {
    setIsAsking(true)
    const qq = question;
    setQuestion("")
    const prevHistory = [...chatHistory];
    const tempHistory = [...chatHistory];
    tempHistory.push({ "query": qq })
    setChatHistory(tempHistory);

    try {
      const response = await fetch(`${baseUrl}/chat`, {
        body: JSON.stringify({
          credentials: cookieValue,
          question,
          // TODO: Limit the amount of history sent to the server
          chatHistory: prevHistory,
        }),
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
      })
      const respJson = await response.json()

      if (respJson.answer) {
        setChatHistory((currentChatHistory) => {
          const history = [...currentChatHistory]
          const lastIdx = currentChatHistory.length - 1;
          history[lastIdx]['answer'] = respJson.answer;
          return history
        })
        setIsAsking(false)
      } else {
        setIsAsking(false)
        toast({
          title: "Something went wrong.",
          description: respJson.error,
        })
      }

    } catch (error) {
      console.log("🚀 ~ file: index.tsx:77 ~ handleSubmit ~ error:", error)
      setIsAsking(false)
      toast({
        title: "Something went wrong.",
        description: error,
      })
    }
  }, [question, chatHistory, cookieValue, toast])

  const handleKeyDown = useCallback(
    async (event) => {
      if (event.key === "Enter") {
        handleSubmit()
      }
    },
    [handleSubmit]
  )
  return (
    <Layout>
      <Head>
        <title>{siteConfig.name}</title>
        <meta name="description" content={siteConfig.description} />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <section className="container flex flex-col justify-items-stretch gap-6 pb-8 pt-6 sm:flex-row md:py-10">
        <div className="flex grow flex-col items-start gap-2">
          <div className="min-w-1/5 flex flex-col items-start gap-2">
            <div>
              This app needs you to{" "}
              <Link
                className="cursor-pointer text-blue-500 hover:text-blue-700 hover:underline"
                href="/settings"
                rel="noreferrer"
              >
                add credentials
              </Link>{" "}
              to work properly.
            </div>
          </div>
          <h2 className="mt-10 scroll-m-20 pb-2 text-2xl font-semibold tracking-tight transition-colors first:mt-0">
            Ask me anything about {cookieValue?.community?.name}
          </h2>

          <div className="w-full">
            <div className="scrollbar-thumb-blue scrollbar-thumb-rounded scrollbar-track-blue-lighter scrollbar-w-2 scrolling-touch flex min-h-[300px] flex-col space-y-4 overflow-y-auto rounded border border-gray-400 p-4">
              {[INITIAL_MESSAGE, ...chatHistory].map((chatInteraction) => {
                return Object.values(chatInteraction).map((chat: string, index: number) => {
                  const isHuman = index === 0;
                  if (chat.length === 0) return <> </>;
                  return (
                    <div className="chat-message" key={index}>
                      <div
                        className={cn(
                          "flex",
                          "items-end",
                          isHuman && "justify-end"
                        )}
                      >
                        <div
                          className={cn(
                            "order-2 mx-2 flex max-w-xs flex-col items-start space-y-2 text-xs",
                            !isHuman && "order-1"
                          )}
                        >
                          <div>
                            <span
                              className={cn(
                                "inline-block rounded-lg bg-gray-300 px-4 py-2 text-gray-600",
                                isHuman &&
                                "rounded-bl-none bg-gray-300 text-gray-600",
                                !isHuman &&
                                "rounded-br-none bg-blue-600 text-white"
                              )}
                            >
                              {chat}
                            </span>
                          </div>
                        </div>
                        {isHuman ? (
                          <User className="order-1 h-4 w-4" />
                        ) : (
                          <Bot className="order-1 h-4 w-4" />
                        )}
                      </div>
                    </div>
                  )
                })
              })}
            </div>

            <div className="mb-2 pt-4 sm:mb-0">
              <div className="relative flex">
                <input
                  type="text"
                  value={question}
                  placeholder={DEFAULT_QUESTION}
                  onChange={handleQueryChange}
                  className="mr-2 w-full rounded-md border border-gray-400 bg-white pl-2 text-gray-700 focus:border-gray-500"
                  onKeyDown={handleKeyDown}
                />
                <div className="items-center sm:flex">
                  <Button
                    disabled={
                      isAsking ||
                      !cookieValue.openaiApiKey ||
                      !cookieValue.pineconeApiKey ||
                      !cookieValue.pineconeEnvironment ||
                      !cookieValue.pineconeIndex
                    }
                    onClick={handleSubmit}
                  >
                    {!isAsking ? (
                      <Send className="h-4 w-4" />
                    ) : (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </Layout >
  )
}
