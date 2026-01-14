import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { getUserRatings } from "@/lib/actions/ratings"
import { Star } from "lucide-react"
import { EditProfileDialog } from "@/components/profile/EditProfileDialog"

export default async function ProfilePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  const userProfile = await prisma.user.findUnique({
    where: { id: user.id },
  })

  if (!userProfile) {
    redirect("/login")
  }

  const ratingsResult = await getUserRatings(user.id)
  const ratings = ratingsResult.success ? ratingsResult.data : null

  // Get ride statistics
  const [offersCount, requestsCount, completedCount] = await Promise.all([
    prisma.rideOffer.count({
      where: { driverId: user.id },
    }),
    prisma.rideRequest.count({
      where: { requesterId: user.id },
    }),
    prisma.rideMatch.count({
      where: {
        OR: [
          { offer: { driverId: user.id } },
          { request: { requesterId: user.id } },
        ],
        status: "COMPLETED",
      },
    }),
  ])

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Profile</h1>
          <p className="text-muted-foreground mt-1">
            Manage your profile and view your statistics
          </p>
        </div>
        <EditProfileDialog user={userProfile} />
      </div>

      {/* Profile Info */}
      <Card>
        <CardHeader>
          <CardTitle>Profile Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium text-muted-foreground">Name</label>
            <p className="text-lg">{userProfile.fullName}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground">Email</label>
            <p className="text-lg">{userProfile.email}</p>
          </div>
          {userProfile.phone && (
            <div>
              <label className="text-sm font-medium text-muted-foreground">Phone</label>
              <p className="text-lg">{userProfile.phone}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Statistics */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rides Offered</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{offersCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rides Requested</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{requestsCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed Rides</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedCount}</div>
          </CardContent>
        </Card>
      </div>

      {/* Ratings */}
      {ratings && ratings.totalRatings > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Ratings</CardTitle>
            <CardDescription>
              Average rating: {ratings.averageRating.toFixed(1)} / 5.0 ({ratings.totalRatings}{" "}
              {ratings.totalRatings === 1 ? "rating" : "ratings"})
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {ratings.ratings.map((rating: any) => (
                <div key={rating.id} className="border-b pb-4 last:border-0">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex items-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`h-4 w-4 ${
                            i < rating.rating
                              ? "fill-yellow-400 text-yellow-400"
                              : "text-gray-300"
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-sm font-medium">{rating.rater.fullName}</span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(rating.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  {rating.comment && (
                    <p className="text-sm text-muted-foreground">{rating.comment}</p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
