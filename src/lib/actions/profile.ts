"use server"

import { createClient } from "@/lib/supabase/server"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

export async function updateProfile(formData: FormData) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: "Unauthorized" }
  }

  const fullName = formData.get("fullName") as string
  const phone = formData.get("phone") as string

  if (!fullName || fullName.trim().length === 0) {
    return { error: "Full name is required" }
  }

  try {
    await prisma.user.update({
      where: { id: user.id },
      data: {
        fullName: fullName.trim(),
        phone: phone?.trim() || null,
      },
    })

    revalidatePath("/profile")
    return { success: true }
  } catch (error) {
    console.error("Error updating profile:", error)
    return { error: "Failed to update profile" }
  }
}
