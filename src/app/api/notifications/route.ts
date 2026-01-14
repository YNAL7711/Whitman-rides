import { NextResponse } from "next/server"
import { getNotifications } from "@/lib/actions/notifications"

export async function GET() {
  const result = await getNotifications()

  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: 400 })
  }

  return NextResponse.json({
    notifications: result.data?.notifications || [],
    unreadCount: result.data?.unreadCount || 0,
  })
}
