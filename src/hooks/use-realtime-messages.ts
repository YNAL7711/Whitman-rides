"use client"

import { useEffect, useState, useRef } from "react"
import { createClient } from "@/lib/supabase/client"
import type { Message } from "@prisma/client"

export function useRealtimeMessages(matchId: string | null) {
  const [messages, setMessages] = useState<Message[]>([])
  const supabaseRef = useRef(createClient())

  useEffect(() => {
    if (!matchId) {
      setMessages([])
      return
    }

    // Fetch initial messages
    const fetchMessages = async () => {
      try {
        const response = await fetch(`/api/messages?matchId=${matchId}`)
        if (response.ok) {
          const data = await response.json()
          setMessages(data.messages || [])
        }
      } catch (error) {
        console.error("Error fetching messages:", error)
      }
    }

    fetchMessages()

    // Subscribe to new messages
    const channel = supabaseRef.current
      .channel(`messages:${matchId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "Message",
          filter: `matchId=eq.${matchId}`,
        },
        (payload) => {
          setMessages((prev) => {
            // Avoid duplicates
            const exists = prev.some((msg) => msg.id === payload.new.id)
            if (exists) return prev
            return [...prev, payload.new as Message]
          })
        }
      )
      .subscribe()

    return () => {
      supabaseRef.current.removeChannel(channel)
    }
  }, [matchId])

  return messages
}
