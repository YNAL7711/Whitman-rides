"use server"

import { createClient } from "@/lib/supabase/server"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

export async function createRideOffer(formData: FormData) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: "Unauthorized" }
  }

  const origin = formData.get("origin") as string
  const destination = formData.get("destination") as string
  const departureTime = formData.get("departureTime") as string
  const availableSeats = parseInt(formData.get("availableSeats") as string)
  const price = formData.get("price") as string
  const description = formData.get("description") as string

  // Validation
  if (!origin || !destination || !departureTime || !availableSeats) {
    return { error: "Origin, destination, departure time, and seats are required" }
  }

  if (availableSeats < 1) {
    return { error: "Available seats must be at least 1" }
  }

  try {
    const rideOffer = await prisma.rideOffer.create({
      data: {
        driverId: user.id,
        origin,
        destination,
        departureTime: new Date(departureTime),
        availableSeats,
        price: price ? parseFloat(price) : null,
        description: description || null,
        status: "ACTIVE",
      },
    })

    // Trigger matching
    const { findMatchesForOffer } = await import("./matches")
    await findMatchesForOffer(rideOffer.id)

    revalidatePath("/dashboard")
    revalidatePath("/offer-ride")
    return { success: true, data: rideOffer }
  } catch (error) {
    console.error("Error creating ride offer:", error)
    return { error: "Failed to create ride offer" }
  }
}

export async function createRideRequest(formData: FormData) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: "Unauthorized" }
  }

  const origin = formData.get("origin") as string
  const destination = formData.get("destination") as string
  const preferredDepartureTime = formData.get("preferredDepartureTime") as string
  const flexibleTime = formData.get("flexibleTime") === "on"
  const maxPrice = formData.get("maxPrice") as string
  const description = formData.get("description") as string

  // Validation
  if (!origin || !destination || !preferredDepartureTime) {
    return { error: "Origin, destination, and preferred departure time are required" }
  }

  try {
    const rideRequest = await prisma.rideRequest.create({
      data: {
        requesterId: user.id,
        origin,
        destination,
        preferredDepartureTime: new Date(preferredDepartureTime),
        flexibleTime,
        maxPrice: maxPrice ? parseFloat(maxPrice) : null,
        description: description || null,
        status: "PENDING",
      },
    })

    // Trigger matching
    const { findMatchesForRequest } = await import("./matches")
    await findMatchesForRequest(rideRequest.id)

    revalidatePath("/dashboard")
    revalidatePath("/request-ride")
    return { success: true, data: rideRequest }
  } catch (error) {
    console.error("Error creating ride request:", error)
    return { error: "Failed to create ride request" }
  }
}

export async function cancelRideOffer(offerId: string | FormData) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: "Unauthorized" }
  }

  // Handle both direct call and form action call
  const id = offerId instanceof FormData ? offerId.get("offerId") as string : offerId

  if (!id) {
    return { error: "Offer ID is required" }
  }

  try {
    const offer = await prisma.rideOffer.findUnique({
      where: { id },
    })

    if (!offer || offer.driverId !== user.id) {
      return { error: "Unauthorized or offer not found" }
    }

    await prisma.rideOffer.update({
      where: { id },
      data: { status: "CANCELLED" },
    })

    revalidatePath("/dashboard")
    return { success: true }
  } catch (error) {
    console.error("Error cancelling ride offer:", error)
    return { error: "Failed to cancel ride offer" }
  }
}

export async function cancelRideRequest(requestId: string | FormData) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: "Unauthorized" }
  }

  // Handle both direct call and form action call
  const id = requestId instanceof FormData ? requestId.get("requestId") as string : requestId

  if (!id) {
    return { error: "Request ID is required" }
  }

  try {
    const request = await prisma.rideRequest.findUnique({
      where: { id },
    })

    if (!request || request.requesterId !== user.id) {
      return { error: "Unauthorized or request not found" }
    }

    await prisma.rideRequest.update({
      where: { id },
      data: { status: "CANCELLED" },
    })

    revalidatePath("/dashboard")
    return { success: true }
  } catch (error) {
    console.error("Error cancelling ride request:", error)
    return { error: "Failed to cancel ride request" }
  }
}

export async function getRideOffers() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: "Unauthorized" }
  }

  try {
    const offers = await prisma.rideOffer.findMany({
      where: {
        driverId: user.id,
        status: {
          in: ["ACTIVE", "FULFILLED"],
        },
      },
      orderBy: {
        departureTime: "asc",
      },
      include: {
        driver: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
    })

    return { success: true, data: offers }
  } catch (error) {
    console.error("Error fetching ride offers:", error)
    return { error: "Failed to fetch ride offers" }
  }
}

export async function getRideRequests() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: "Unauthorized" }
  }

  try {
    const requests = await prisma.rideRequest.findMany({
      where: {
        requesterId: user.id,
        status: {
          in: ["PENDING", "MATCHED"],
        },
      },
      orderBy: {
        preferredDepartureTime: "asc",
      },
      include: {
        requester: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
    })

    return { success: true, data: requests }
  } catch (error) {
    console.error("Error fetching ride requests:", error)
    return { error: "Failed to fetch ride requests" }
  }
}
