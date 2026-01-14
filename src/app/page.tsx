import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default async function Home() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Redirect authenticated users to dashboard
  if (user) {
    redirect("/dashboard")
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-gray-50 to-white px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-2xl text-center">
        <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">
          Whitman Rides
        </h1>
        <p className="mt-6 text-lg leading-8 text-gray-600">
          Connect with fellow Whitman students and faculty for rides. Share your journey or find a ride that matches your route.
        </p>
        <div className="mt-10 flex items-center justify-center gap-x-6">
          <Link href="/signup">
            <Button size="lg">Get started</Button>
          </Link>
          <Link href="/login">
            <Button variant="outline" size="lg">
              Sign in
            </Button>
          </Link>
        </div>
        <p className="mt-4 text-sm text-gray-500">
          Only @whitman.edu email addresses are allowed
        </p>
      </div>
    </main>
  )
}