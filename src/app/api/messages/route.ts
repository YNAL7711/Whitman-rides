import { NextRequest, NextResponse } from "next/server"
import { getMessages } from "@/lib/actions/messages"

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const matchId = searchParams.get("matchId")

  if (!matchId) {
    return NextResponse.json({ error: "matchId is required" }, { status: 400 })
  }

  const result = await getMessages(matchId)

  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: 400 })
  }

  return NextResponse.json({ messages: result.data })
}
