"use server"

import { cancelRideOffer, cancelRideRequest } from "./rides"
import { completeRide } from "./ratings"
import { acceptMatch, rejectMatch } from "./matches"
import { revalidatePath } from "next/cache"

export async function handleCancelOffer(formData: FormData) {
  const offerId = formData.get("offerId") as string
  if (offerId) {
    await cancelRideOffer(offerId)
    revalidatePath("/dashboard")
  }
}

export async function handleCancelRequest(formData: FormData) {
  const requestId = formData.get("requestId") as string
  if (requestId) {
    await cancelRideRequest(requestId)
    revalidatePath("/dashboard")
  }
}

export async function handleCompleteRide(formData: FormData) {
  const matchId = formData.get("matchId") as string
  if (matchId) {
    await completeRide(matchId)
    revalidatePath("/history")
  }
}

export async function handleAcceptMatch(formData: FormData) {
  const matchId = formData.get("matchId") as string
  const userType = formData.get("userType") as "driver" | "requester"
  if (matchId && userType) {
    await acceptMatch(matchId, userType)
    revalidatePath("/matches")
  }
}

export async function handleRejectMatch(formData: FormData) {
  const matchId = formData.get("matchId") as string
  if (matchId) {
    await rejectMatch(matchId)
    revalidatePath("/matches")
  }
}
