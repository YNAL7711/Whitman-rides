import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { getRideOffers, getRideRequests } from "@/lib/actions/rides"
import { getMatches } from "@/lib/actions/matches"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Plus, Calendar, MapPin, Users, DollarSign } from "lucide-react"
import { cancelRideOffer, cancelRideRequest } from "@/lib/actions/rides"

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  const offersResult = await getRideOffers()
  const requestsResult = await getRideRequests()
  const matchesResult = await getMatches()

  const offers = offersResult.success ? offersResult.data : []
  const requests = requestsResult.success ? requestsResult.data : []
  const matches = matchesResult.success ? matchesResult.data : []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Manage your ride offers and requests
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/offer-ride">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Offer Ride
            </Button>
          </Link>
          <Link href="/request-ride">
            <Button variant="outline">
              <Plus className="mr-2 h-4 w-4" />
              Request Ride
            </Button>
          </Link>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Offers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{offers.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Requests</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{requests.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Matches</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{matches.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Active Offers */}
      <div>
        <h2 className="text-2xl font-semibold mb-4">My Ride Offers</h2>
        {offers.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <p className="text-center text-muted-foreground">
                No active ride offers.{" "}
                <Link href="/offer-ride" className="text-primary hover:underline">
                  Create one
                </Link>
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {offers.map((offer: any) => (
              <Card key={offer.id}>
                <CardHeader>
                  <CardTitle className="text-lg">
                    {offer.origin} → {offer.destination}
                  </CardTitle>
                  <CardDescription>
                    <div className="flex items-center gap-4 mt-2">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {new Date(offer.departureTime).toLocaleString()}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        {offer.availableSeats} seats
                      </span>
                      {offer.price && (
                        <span className="flex items-center gap-1">
                          <DollarSign className="h-4 w-4" />
                          ${offer.price}
                        </span>
                      )}
                    </div>
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {offer.description && (
                    <p className="text-sm text-muted-foreground mb-4">
                      {offer.description}
                    </p>
                  )}
                  <div className="flex gap-2">
                    <Link href="/matches">
                      <Button variant="outline" size="sm">
                        View Matches
                      </Button>
                    </Link>
                    <form action={cancelRideOffer.bind(null, offer.id)}>
                      <Button type="submit" variant="destructive" size="sm">
                        Cancel
                      </Button>
                    </form>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Active Requests */}
      <div>
        <h2 className="text-2xl font-semibold mb-4">My Ride Requests</h2>
        {requests.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <p className="text-center text-muted-foreground">
                No active ride requests.{" "}
                <Link href="/request-ride" className="text-primary hover:underline">
                  Create one
                </Link>
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {requests.map((request: any) => (
              <Card key={request.id}>
                <CardHeader>
                  <CardTitle className="text-lg">
                    {request.origin} → {request.destination}
                  </CardTitle>
                  <CardDescription>
                    <div className="flex items-center gap-4 mt-2">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {new Date(request.preferredDepartureTime).toLocaleString()}
                      </span>
                      {request.flexibleTime && (
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                          Flexible
                        </span>
                      )}
                      {request.maxPrice && (
                        <span className="flex items-center gap-1">
                          <DollarSign className="h-4 w-4" />
                          Max ${request.maxPrice}
                        </span>
                      )}
                    </div>
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {request.description && (
                    <p className="text-sm text-muted-foreground mb-4">
                      {request.description}
                    </p>
                  )}
                  <div className="flex gap-2">
                    <Link href="/matches">
                      <Button variant="outline" size="sm">
                        View Matches
                      </Button>
                    </Link>
                    <form action={cancelRideRequest.bind(null, request.id)}>
                      <Button type="submit" variant="destructive" size="sm">
                        Cancel
                      </Button>
                    </form>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
