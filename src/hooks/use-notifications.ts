"use client"

import { useEffect, useState, useRef } from "react"
import { createClient } from "@/lib/supabase/client"
import type { Notification } from "@prisma/client"

export function useNotifications(userId: string | null) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const supabaseRef = useRef(createClient())

  useEffect(() => {
    if (!userId) {
      setNotifications([])
      setUnreadCount(0)
      return
    }

    // Fetch initial notifications
    const fetchNotifications = async () => {
      try {
        const response = await fetch("/api/notifications")
        if (response.ok) {
          const data = await response.json()
          setNotifications(data.notifications || [])
          setUnreadCount(data.unreadCount || 0)
        }
      } catch (error) {
        console.error("Error fetching notifications:", error)
      }
    }

    fetchNotifications()

    // Subscribe to new notifications
    const channel = supabaseRef.current
      .channel(`notifications:${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "Notification",
          filter: `userId=eq.${userId}`,
        },
        (payload) => {
          setNotifications((prev) => {
            // Avoid duplicates
            const exists = prev.some((n) => n.id === payload.new.id)
            if (exists) return prev
            return [payload.new as Notification, ...prev]
          })
          setUnreadCount((prev) => prev + 1)
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "Notification",
          filter: `userId=eq.${userId}`,
        },
        (payload) => {
          setNotifications((prev) =>
            prev.map((n) =>
              n.id === payload.new.id ? (payload.new as Notification) : n
            )
          )
          // Recalculate unread count
          const updated = payload.new as Notification
          if (updated.read) {
            setUnreadCount((prev) => Math.max(0, prev - 1))
          }
        }
      )
      .subscribe()

    return () => {
      supabaseRef.current.removeChannel(channel)
    }
  }, [userId])

  return { notifications, unreadCount }
}
