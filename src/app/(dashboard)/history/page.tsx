import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar, MapPin, Star } from "lucide-react"
import { completeRide } from "@/lib/actions/ratings"
import Link from "next/link"
import { RatingDialog } from "@/components/ride/RatingDialog"

export default async function HistoryPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  // Get completed matches
  const completedMatches = await prisma.rideMatch.findMany({
    where: {
      OR: [
        { offer: { driverId: user.id } },
        { request: { requesterId: user.id } },
      ],
      status: {
        in: ["COMPLETED", "ACCEPTED"],
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
      ratings: true,
    },
    orderBy: {
      updatedAt: "desc",
    },
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Ride History</h1>
        <p className="text-muted-foreground mt-1">
          View your completed rides and submit ratings
        </p>
      </div>

      {completedMatches.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">
              No completed rides yet.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {completedMatches.map((match: any) => {
            const isDriver = match.offer.driverId === user.id
            const otherUser = isDriver ? match.request.requester : match.offer.driver
            const userRating = match.ratings.find(
              (r: any) => r.raterId === user.id
            )
            const canRate = match.status === "COMPLETED" && !userRating

            return (
              <Card key={match.id}>
                <CardHeader>
                  <CardTitle className="text-lg">
                    {match.offer.origin} → {match.offer.destination}
                  </CardTitle>
                  <CardDescription>
                    <div className="space-y-2 mt-2">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">
                          {isDriver ? "Passenger" : "Driver"}:
                        </span>
                        <span>{otherUser.fullName}</span>
                      </div>
                      <div className="flex items-center gap-4 flex-wrap">
                        <span className="flex items-center gap-1 text-sm">
                          <Calendar className="h-4 w-4" />
                          {new Date(match.offer.departureTime).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {userRating && (
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">Your rating:</span>
                        <div className="flex items-center gap-1">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`h-4 w-4 ${
                                i < userRating.rating
                                  ? "fill-yellow-400 text-yellow-400"
                                  : "text-gray-300"
                              }`}
                            />
                          ))}
                        </div>
                        {userRating.comment && (
                          <p className="text-sm text-muted-foreground">
                            {userRating.comment}
                          </p>
                        )}
                      </div>
                    )}

                    {canRate && (
                      <RatingDialog
                        matchId={match.id}
                        ratedUserId={otherUser.id}
                        ratedUserName={otherUser.fullName}
                      />
                    )}

                    {match.status === "ACCEPTED" && (
                      <form action={completeRide.bind(null, match.id)}>
                        <Button type="submit" variant="outline" size="sm">
                          Mark as Completed
                        </Button>
                      </form>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
