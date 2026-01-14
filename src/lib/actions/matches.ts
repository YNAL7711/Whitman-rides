"use server"

import { createClient } from "@/lib/supabase/server"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { isMatch } from "@/lib/utils/matching"

/**
 * Find and create matches for a new ride offer
 */
export async function findMatchesForOffer(offerId: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: "Unauthorized" }
  }

  try {
    const offer = await prisma.rideOffer.findUnique({
      where: { id: offerId },
      include: { driver: true },
    })

    if (!offer || offer.driverId !== user.id) {
      return { error: "Unauthorized or offer not found" }
    }

    // Find matching pending requests
    const pendingRequests = await prisma.rideRequest.findMany({
      where: {
        status: "PENDING",
        requesterId: { not: user.id }, // Don't match with own requests
      },
      include: {
        requester: true,
      },
    })

    const matches = []
    for (const request of pendingRequests) {
      if (
        isMatch(
          {
            origin: offer.origin,
            destination: offer.destination,
            departureTime: offer.departureTime,
            availableSeats: offer.availableSeats,
            price: offer.price ? Number(offer.price) : null,
          },
          {
            origin: request.origin,
            destination: request.destination,
            preferredDepartureTime: request.preferredDepartureTime,
            flexibleTime: request.flexibleTime,
            maxPrice: request.maxPrice ? Number(request.maxPrice) : null,
          }
        )
      ) {
        // Create match
        const match = await prisma.rideMatch.create({
          data: {
            offerId: offer.id,
            requestId: request.id,
            status: "PENDING",
            driverAccepted: false,
            requesterAccepted: false,
          },
        })

        // Create notifications
        await createMatchNotifications(match.id, offer.driverId, request.requesterId)

        matches.push(match)
      }
    }

    return { success: true, data: matches }
  } catch (error) {
    console.error("Error finding matches for offer:", error)
    return { error: "Failed to find matches" }
  }
}

/**
 * Find and create matches for a new ride request
 */
export async function findMatchesForRequest(requestId: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: "Unauthorized" }
  }

  try {
    const request = await prisma.rideRequest.findUnique({
      where: { id: requestId },
      include: { requester: true },
    })

    if (!request || request.requesterId !== user.id) {
      return { error: "Unauthorized or request not found" }
    }

    // Find matching active offers
    const activeOffers = await prisma.rideOffer.findMany({
      where: {
        status: "ACTIVE",
        driverId: { not: user.id }, // Don't match with own offers
      },
      include: {
        driver: true,
      },
    })

    const matches = []
    for (const offer of activeOffers) {
      if (
        isMatch(
          {
            origin: offer.origin,
            destination: offer.destination,
            departureTime: offer.departureTime,
            availableSeats: offer.availableSeats,
            price: offer.price ? Number(offer.price) : null,
          },
          {
            origin: request.origin,
            destination: request.destination,
            preferredDepartureTime: request.preferredDepartureTime,
            flexibleTime: request.flexibleTime,
            maxPrice: request.maxPrice ? Number(request.maxPrice) : null,
          }
        )
      ) {
        // Check if match already exists
        const existingMatch = await prisma.rideMatch.findUnique({
          where: {
            offerId_requestId: {
              offerId: offer.id,
              requestId: request.id,
            },
          },
        })

        if (!existingMatch) {
          // Create match
          const match = await prisma.rideMatch.create({
            data: {
              offerId: offer.id,
              requestId: request.id,
              status: "PENDING",
              driverAccepted: false,
              requesterAccepted: false,
            },
          })

          // Create notifications
          await createMatchNotifications(match.id, offer.driverId, request.requesterId)

          matches.push(match)
        }
      }
    }

    return { success: true, data: matches }
  } catch (error) {
    console.error("Error finding matches for request:", error)
    return { error: "Failed to find matches" }
  }
}

/**
 * Accept a match (driver or requester)
 */
export async function acceptMatch(matchId: string, userType: "driver" | "requester") {
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
        offer: { include: { driver: true } },
        request: { include: { requester: true } },
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

    // Update acceptance status
    const updateData: any = {}
    if (userType === "driver" && isDriver) {
      updateData.driverAccepted = true
    } else if (userType === "requester" && isRequester) {
      updateData.requesterAccepted = true
    } else {
      return { error: "Invalid user type for this match" }
    }

    const updatedMatch = await prisma.rideMatch.update({
      where: { id: matchId },
      data: updateData,
    })

    // If both accepted, update status to ACCEPTED
    if (updatedMatch.driverAccepted && updatedMatch.requesterAccepted) {
      await prisma.rideMatch.update({
        where: { id: matchId },
        data: { status: "ACCEPTED" },
      })

      // Update ride offer and request statuses
      await prisma.rideOffer.update({
        where: { id: match.offerId },
        data: { status: "FULFILLED" },
      })

      await prisma.rideRequest.update({
        where: { id: match.requestId },
        data: { status: "MATCHED" },
      })

      // Create notifications
      await createRideUpdateNotifications(matchId, match.offer.driverId, match.request.requesterId)
    }

    revalidatePath("/matches")
    revalidatePath("/dashboard")
    return { success: true }
  } catch (error) {
    console.error("Error accepting match:", error)
    return { error: "Failed to accept match" }
  }
}

/**
 * Reject a match
 */
export async function rejectMatch(matchId: string) {
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

    await prisma.rideMatch.update({
      where: { id: matchId },
      data: { status: "REJECTED" },
    })

    revalidatePath("/matches")
    return { success: true }
  } catch (error) {
    console.error("Error rejecting match:", error)
    return { error: "Failed to reject match" }
  }
}

/**
 * Get matches for the current user
 */
export async function getMatches() {
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
          in: ["PENDING", "ACCEPTED"],
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
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    return { success: true, data: matches }
  } catch (error) {
    console.error("Error fetching matches:", error)
    return { error: "Failed to fetch matches" }
  }
}

/**
 * Helper function to create match notifications
 */
async function createMatchNotifications(
  matchId: string,
  driverId: string,
  requesterId: string
) {
  const match = await prisma.rideMatch.findUnique({
    where: { id: matchId },
    include: {
      offer: true,
      request: true,
    },
  })

  if (!match) return

  // Notify driver
  await prisma.notification.create({
    data: {
      userId: driverId,
      type: "MATCH",
      title: "New Ride Match",
      message: `Your ride offer matches a request from ${match.request.origin} to ${match.request.destination}`,
      relatedId: matchId,
    },
  })

  // Notify requester
  await prisma.notification.create({
    data: {
      userId: requesterId,
      type: "MATCH",
      title: "New Ride Match",
      message: `A ride offer matches your request from ${match.offer.origin} to ${match.offer.destination}`,
      relatedId: matchId,
    },
  })
}

/**
 * Helper function to create ride update notifications
 */
async function createRideUpdateNotifications(
  matchId: string,
  driverId: string,
  requesterId: string
) {
  // Notify driver
  await prisma.notification.create({
    data: {
      userId: driverId,
      type: "RIDE_UPDATE",
      title: "Ride Match Accepted",
      message: "Your ride match has been accepted by both parties",
      relatedId: matchId,
    },
  })

  // Notify requester
  await prisma.notification.create({
    data: {
      userId: requesterId,
      type: "RIDE_UPDATE",
      title: "Ride Match Accepted",
      message: "Your ride match has been accepted by both parties",
      relatedId: matchId,
    },
  })
}
