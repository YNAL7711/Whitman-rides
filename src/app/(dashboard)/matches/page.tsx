import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { getMatches } from "@/lib/actions/matches"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { acceptMatch, rejectMatch } from "@/lib/actions/matches"
import { Calendar, MapPin, Users, DollarSign, Check, X } from "lucide-react"
import Link from "next/link"

export default async function MatchesPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  const matchesResult = await getMatches()
  const matches = matchesResult.success ? matchesResult.data : []

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Ride Matches</h1>
        <p className="text-muted-foreground mt-1">
          Review and accept matches for your rides
        </p>
      </div>

      {matches.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">
              No matches found. Create a ride offer or request to find matches.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {matches.map((match: any) => {
            const isDriver = match.offer.driver.id === user.id
            const otherUser = isDriver ? match.request.requester : match.offer.driver
            const userAccepted = isDriver
              ? match.driverAccepted
              : match.requesterAccepted
            const otherAccepted = isDriver
              ? match.requesterAccepted
              : match.driverAccepted

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
                          {isDriver ? "Requester" : "Driver"}:
                        </span>
                        <span>{otherUser.fullName}</span>
                      </div>
                      <div className="flex items-center gap-4 flex-wrap">
                        <span className="flex items-center gap-1 text-sm">
                          <Calendar className="h-4 w-4" />
                          {new Date(match.offer.departureTime).toLocaleString()}
                        </span>
                        <span className="flex items-center gap-1 text-sm">
                          <Users className="h-4 w-4" />
                          {match.offer.availableSeats} seats
                        </span>
                        {match.offer.price && (
                          <span className="flex items-center gap-1 text-sm">
                            <DollarSign className="h-4 w-4" />
                            ${match.offer.price}
                          </span>
                        )}
                      </div>
                    </div>
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">Status:</span>
                      <span
                        className={`text-sm px-2 py-1 rounded ${
                          match.status === "ACCEPTED"
                            ? "bg-green-100 text-green-800"
                            : match.status === "PENDING"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {match.status}
                      </span>
                    </div>

                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        {userAccepted ? (
                          <Check className="h-4 w-4 text-green-600" />
                        ) : (
                          <X className="h-4 w-4 text-gray-400" />
                        )}
                        <span>You {userAccepted ? "accepted" : "pending"}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {otherAccepted ? (
                          <Check className="h-4 w-4 text-green-600" />
                        ) : (
                          <X className="h-4 w-4 text-gray-400" />
                        )}
                        <span>
                          {otherUser.fullName} {otherAccepted ? "accepted" : "pending"}
                        </span>
                      </div>
                    </div>

                    {match.status === "ACCEPTED" && (
                      <div className="pt-2 border-t">
                        <Link href={`/messages?match=${match.id}`}>
                          <Button className="w-full">Open Messages</Button>
                        </Link>
                      </div>
                    )}

                    {match.status === "PENDING" && !userAccepted && (
                      <div className="flex gap-2 pt-2 border-t">
                        <form
                          action={acceptMatch.bind(
                            null,
                            match.id,
                            isDriver ? "driver" : "requester"
                          )}
                        >
                          <Button type="submit" className="flex-1">
                            <Check className="mr-2 h-4 w-4" />
                            Accept
                          </Button>
                        </form>
                        <form action={rejectMatch.bind(null, match.id)}>
                          <Button type="submit" variant="destructive" className="flex-1">
                            <X className="mr-2 h-4 w-4" />
                            Reject
                          </Button>
                        </form>
                      </div>
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
