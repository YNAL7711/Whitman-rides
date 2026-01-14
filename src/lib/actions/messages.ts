"use server"

import { createClient } from "@/lib/supabase/server"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

/**
 * Send a message in a match
 */
export async function sendMessage(matchId: string, content: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: "Unauthorized" }
  }

  if (!content || content.trim().length === 0) {
    return { error: "Message content is required" }
  }

  try {
    // Verify user is part of the match
    const match = await prisma.rideMatch.findUnique({
      where: { id: matchId },
      include: {
        offer: true,
        request: true,
      },
    })

    if (!match) {
      return { error: "Match not found" }
    }

    const isDriver = match.offer.driverId === user.id
    const isRequester = match.request.requesterId === user.id

    if (!isDriver && !isRequester) {
      return { error: "Unauthorized" }
    }

    const message = await prisma.message.create({
      data: {
        matchId,
        senderId: user.id,
        content: content.trim(),
        read: false,
      },
      include: {
        sender: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
    })

    // Create notification for the other party
    const recipientId = isDriver ? match.request.requesterId : match.offer.driverId
    await prisma.notification.create({
      data: {
        userId: recipientId,
        type: "MESSAGE",
        title: "New Message",
        message: `You have a new message from ${user.email}`,
        relatedId: matchId,
      },
    })

    revalidatePath("/messages")
    return { success: true, data: message }
  } catch (error) {
    console.error("Error sending message:", error)
    return { error: "Failed to send message" }
  }
}

/**
 * Get messages for a match
 */
export async function getMessages(matchId: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: "Unauthorized" }
  }

  try {
    // Verify user is part of the match
    const match = await prisma.rideMatch.findUnique({
      where: { id: matchId },
      include: {
        offer: true,
        request: true,
      },
    })

    if (!match) {
      return { error: "Match not found" }
    }

    const isDriver = match.offer.driverId === user.id
    const isRequester = match.request.requesterId === user.id

    if (!isDriver && !isRequester) {
      return { error: "Unauthorized" }
    }

    const messages = await prisma.message.findMany({
      where: { matchId },
      include: {
        sender: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: "asc",
      },
    })

    // Mark messages as read
    await prisma.message.updateMany({
      where: {
        matchId,
        senderId: { not: user.id },
        read: false,
      },
      data: {
        read: true,
      },
    })

    return { success: true, data: messages }
  } catch (error) {
    console.error("Error fetching messages:", error)
    return { error: "Failed to fetch messages" }
  }
}

/**
 * Get all conversations for the current user
 */
export async function getConversations() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: "Unauthorized" }
  }

  try {
    const matches = await prisma.rideMatch.findMany({
      where: {
        OR: [
          { offer: { driverId: user.id } },
          { request: { requesterId: user.id } },
        ],
        status: {
          in: ["ACCEPTED", "PENDING"],
        },
      },
      include: {
        offer: {
          include: {
            driver: {
              select: {
                id: true,
                fullName: true,
                email: true,
              },
            },
          },
        },
        request: {
          include: {
            requester: {
              select: {
                id: true,
                fullName: true,
                email: true,
              },
            },
          },
        },
        messages: {
          orderBy: {
            createdAt: "desc",
          },
          take: 1,
        },
      },
      orderBy: {
        updatedAt: "desc",
      },
    })

    return { success: true, data: matches }
  } catch (error) {
    console.error("Error fetching conversations:", error)
    return { error: "Failed to fetch conversations" }
  }
}
