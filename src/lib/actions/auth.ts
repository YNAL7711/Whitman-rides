"use server"

import { createClient } from "@/lib/supabase/server"
import { validateEmailDomain } from "@/lib/utils/email-validation"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

export async function signUp(formData: FormData) {
  const email = formData.get("email") as string
  const password = formData.get("password") as string
  const fullName = formData.get("fullName") as string

  // Validate email domain
  const emailValidation = validateEmailDomain(email)
  if (!emailValidation.valid) {
    return { error: emailValidation.error }
  }

  // Validate inputs
  if (!email || !password || !fullName) {
    return { error: "All fields are required" }
  }

  if (password.length < 8) {
    return { error: "Password must be at least 8 characters" }
  }

  const supabase = await createClient()

  // Sign up with Supabase Auth
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/dashboard`,
    },
  })

  if (authError) {
    return { error: authError.message }
  }

  if (!authData.user) {
    return { error: "Failed to create user" }
  }

  // Create user profile in database
  try {
    await prisma.user.create({
      data: {
        id: authData.user.id,
        email: authData.user.email!,
        fullName,
      },
    })
  } catch (error) {
    // If profile creation fails, we should ideally clean up the auth user
    // For now, just return an error
    console.error("Failed to create user profile:", error)
    return { error: "Failed to create user profile. Please try again." }
  }

  revalidatePath("/")
  return { success: true }
}

export async function signIn(formData: FormData) {
  const email = formData.get("email") as string
  const password = formData.get("password") as string

  // Validate email domain
  const emailValidation = validateEmailDomain(email)
  if (!emailValidation.valid) {
    return { error: emailValidation.error }
  }

  if (!email || !password) {
    return { error: "Email and password are required" }
  }

  const supabase = await createClient()

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    return { error: error.message }
  }

  revalidatePath("/")
  redirect("/dashboard")
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  revalidatePath("/")
  redirect("/login")
}
