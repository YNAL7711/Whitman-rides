"use client"

import { useEffect, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { getConversations, getMessages } from "@/lib/actions/messages"
import { sendMessage } from "@/lib/actions/messages"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import { useRealtimeMessages } from "@/hooks/use-realtime-messages"
import { createClient } from "@/lib/supabase/client"
import { Send } from "lucide-react"

export default function MessagesPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const selectedMatchId = searchParams.get("match")
  const [conversations, setConversations] = useState<any[]>([])
  const [selectedMatch, setSelectedMatch] = useState<any>(null)
  const [messageContent, setMessageContent] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const { toast } = useToast()
  const supabase = createClient()

  const messages = useRealtimeMessages(selectedMatchId)

  useEffect(() => {
    const getUserId = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      setCurrentUserId(user?.id || null)
    }
    getUserId()
  }, [supabase])

  useEffect(() => {
    const loadConversations = async () => {
      const result = await getConversations()
      if (result.success) {
        setConversations(result.data || [])
        if (selectedMatchId) {
          const match = result.data?.find((m: any) => m.id === selectedMatchId)
          if (match) {
            setSelectedMatch(match)
            const messagesResult = await getMessages(match.id)
            if (messagesResult.success) {
              // Messages will be updated by realtime hook
            }
          }
        }
      }
    }

    loadConversations()
  }, [selectedMatchId])

  async function handleSendMessage() {
    if (!messageContent.trim() || !selectedMatchId) return

    setIsLoading(true)
    const result = await sendMessage(selectedMatchId, messageContent)

    if (result?.error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: result.error,
      })
    } else {
      setMessageContent("")
    }

    setIsLoading(false)
  }

  async function selectConversation(match: any) {
    setSelectedMatch(match)
    const result = await getMessages(match.id)
    if (result.success) {
      // Messages will be updated by realtime hook
    }
  }

  const getOtherUser = (match: any) => {
    if (!currentUserId) return match.offer.driver
    // Return the user who is not the current user
    if (match.offer.driver.id === currentUserId) {
      return match.request.requester
    }
    return match.offer.driver
  }

  return (
    <div className="flex h-[calc(100vh-8rem)] gap-4">
      {/* Conversations List */}
      <div className="w-64 border-r pr-4 overflow-y-auto">
        <h2 className="text-lg font-semibold mb-4">Conversations</h2>
        {conversations.length === 0 ? (
          <p className="text-sm text-muted-foreground">No conversations yet</p>
        ) : (
          <div className="space-y-2">
            {conversations.map((match: any) => {
              const otherUser = currentUserId ? getOtherUser(match) : match.offer.driver
              const lastMessage = match.messages[0]

              return (
                <Card
                  key={match.id}
                  className={`cursor-pointer hover:bg-accent ${
                    selectedMatch?.id === match.id ? "bg-accent" : ""
                  }`}
                  onClick={() => selectConversation(match)}
                >
                  <CardContent className="p-4">
                    <div className="font-medium">{otherUser.fullName}</div>
                    {lastMessage && (
                      <p className="text-sm text-muted-foreground truncate">
                        {lastMessage.content}
                      </p>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 flex flex-col">
        {selectedMatch ? (
          <>
            <Card className="mb-4">
              <CardContent className="p-4">
                <div className="font-semibold">
                  {selectedMatch.offer.origin} → {selectedMatch.offer.destination}
                </div>
                <div className="text-sm text-muted-foreground">
                  {getOtherUser(selectedMatch).fullName}
                </div>
              </CardContent>
            </Card>

            <div className="flex-1 overflow-y-auto space-y-4 mb-4">
              {messages.length === 0 ? (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  No messages yet. Start the conversation!
                </div>
              ) : (
                messages.map((message: any) => {
                  const isOwn = message.senderId === currentUserId
                  return (
                    <div
                      key={message.id}
                      className={`flex ${isOwn ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[70%] rounded-lg p-3 ${
                          isOwn
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted"
                        }`}
                      >
                        <p className="text-sm">{message.content}</p>
                        <p
                          className={`text-xs mt-1 ${
                            isOwn ? "text-primary-foreground/70" : "text-muted-foreground"
                          }`}
                        >
                          {new Date(message.createdAt).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  )
                })
              )}
            </div>

            <div className="flex gap-2">
              <Input
                value={messageContent}
                onChange={(e) => setMessageContent(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault()
                    handleSendMessage()
                  }
                }}
                placeholder="Type a message..."
                disabled={isLoading}
              />
              <Button onClick={handleSendMessage} disabled={isLoading || !messageContent.trim()}>
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            Select a conversation to start messaging
          </div>
        )}
      </div>
    </div>
  )
}
