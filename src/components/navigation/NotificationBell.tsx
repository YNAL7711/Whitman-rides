"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Bell } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useNotifications } from "@/hooks/use-notifications"
import { markNotificationAsRead, markAllNotificationsAsRead } from "@/lib/actions/notifications"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"

export function NotificationBell() {
  const [userId, setUserId] = useState<string | null>(null)
  const supabase = createClient()
  const { notifications, unreadCount } = useNotifications(userId)
  const { toast } = useToast()

  useEffect(() => {
    const getUserId = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      setUserId(user?.id || null)
    }
    getUserId()
  }, [supabase])

  async function handleMarkAsRead(notificationId: string) {
    const result = await markNotificationAsRead(notificationId)
    if (result?.error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: result.error,
      })
    }
  }

  async function handleMarkAllAsRead() {
    const result = await markAllNotificationsAsRead()
    if (result?.error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: result.error,
      })
    }
  }

  const getNotificationLink = (notification: any) => {
    if (notification.type === "MATCH" || notification.type === "MESSAGE") {
      return `/messages?match=${notification.relatedId}`
    }
    if (notification.type === "RIDE_UPDATE") {
      return `/matches`
    }
    if (notification.type === "RATING") {
      return `/history`
    }
    return "/dashboard"
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute top-0 right-0 h-5 w-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
          <span className="sr-only">Notifications</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel>
          <div className="flex items-center justify-between">
            <span>Notifications</span>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="text-xs text-primary hover:underline"
              >
                Mark all as read
              </button>
            )}
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {notifications.length === 0 ? (
          <div className="p-4 text-center text-sm text-muted-foreground">
            No notifications
          </div>
        ) : (
          <div className="max-h-96 overflow-y-auto">
            {notifications.slice(0, 10).map((notification: any) => (
              <Link
                key={notification.id}
                href={getNotificationLink(notification)}
                onClick={() => {
                  if (!notification.read) {
                    handleMarkAsRead(notification.id)
                  }
                }}
              >
                <DropdownMenuItem
                  className={`flex flex-col items-start p-3 cursor-pointer ${
                    !notification.read ? "bg-accent" : ""
                  }`}
                >
                  <div className="font-medium text-sm">{notification.title}</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {notification.message}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {new Date(notification.createdAt).toLocaleString()}
                  </div>
                </DropdownMenuItem>
              </Link>
            ))}
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
