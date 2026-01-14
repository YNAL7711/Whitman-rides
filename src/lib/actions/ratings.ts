"use server"

import { createClient } from "@/lib/supabase/server"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

/**
 * Submit a rating for a completed ride
 */
export async function submitRating(
  rideMatchId: string,
  ratedUserId: string,
  rating: number,
  comment?: string
) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: "Unauthorized" }
  }

  // Validation
  if (rating < 1 || rating > 5) {
    return { error: "Rating must be between 1 and 5" }
  }

  if (ratedUserId === user.id) {
    return { error: "Cannot rate yourself" }
  }

  try {
    // Verify match exists and is completed
    const match = await prisma.rideMatch.findUnique({
      where: { id: rideMatchId },
      include: {
        offer: true,
        request: true,
      },
    })

    if (!match) {
      return { error: "Match not found" }
    }

    if (match.status !== "COMPLETED") {
      return { error: "Can only rate completed rides" }
    }

    // Verify user is part of the match
    const isDriver = match.offer.driverId === user.id
    const isRequester = match.request.requesterId === user.id

    if (!isDriver && !isRequester) {
      return { error: "Unauthorized" }
    }

    // Verify rated user is the other party
    const otherUserId = isDriver ? match.request.requesterId : match.offer.driverId
    if (ratedUserId !== otherUserId) {
      return { error: "Invalid user to rate" }
    }

    // Check if rating already exists
    const existingRating = await prisma.rating.findFirst({
      where: {
        rideMatchId,
        raterId: user.id,
        ratedUserId,
      },
    })

    if (existingRating) {
      return { error: "You have already rated this ride" }
    }

    // Create rating
    const newRating = await prisma.rating.create({
      data: {
        rideMatchId,
        raterId: user.id,
        ratedUserId,
        rating,
        comment: comment?.trim() || null,
      },
    })

    // Create notification
    await prisma.notification.create({
      data: {
        userId: ratedUserId,
        type: "RATING",
        title: "New Rating",
        message: `You received a ${rating}-star rating`,
        relatedId: rideMatchId,
      },
    })

    revalidatePath("/history")
    revalidatePath("/profile")
    return { success: true, data: newRating }
  } catch (error) {
    console.error("Error submitting rating:", error)
    return { error: "Failed to submit rating" }
  }
}

/**
 * Get ratings for a user
 */
export async function getUserRatings(userId: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: "Unauthorized" }
  }

  try {
    const ratings = await prisma.rating.findMany({
      where: {
        ratedUserId: userId,
      },
      include: {
        rater: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
        rideMatch: {
          include: {
            offer: true,
            request: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    // Calculate average rating
    const averageRating =
      ratings.length > 0
        ? ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length
        : 0

    return {
      success: true,
      data: {
        ratings,
        averageRating: Math.round(averageRating * 10) / 10,
        totalRatings: ratings.length,
      },
    }
  } catch (error) {
    console.error("Error fetching user ratings:", error)
    return { error: "Failed to fetch ratings" }
  }
}

/**
 * Mark a ride match as completed
 */
export async function completeRide(matchId: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: "Unauthorized" }
  }

  try {
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

    // Verify user is part of the match
    const isDriver = match.offer.driverId === user.id
    const isRequester = match.request.requesterId === user.id

    if (!isDriver && !isRequester) {
      return { error: "Unauthorized" }
    }

    if (match.status !== "ACCEPTED") {
      return { error: "Can only complete accepted rides" }
    }

    // Update match status
    await prisma.rideMatch.update({
      where: { id: matchId },
      data: { status: "COMPLETED" },
    })

    // Update ride offer and request statuses
    await prisma.rideOffer.update({
      where: { id: match.offerId },
      data: { status: "COMPLETED" },
    })

    await prisma.rideRequest.update({
      where: { id: match.requestId },
      data: { status: "COMPLETED" },
    })

    revalidatePath("/history")
    revalidatePath("/matches")
    return { success: true }
  } catch (error) {
    console.error("Error completing ride:", error)
    return { error: "Failed to complete ride" }
  }
}
