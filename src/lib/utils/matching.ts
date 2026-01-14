/**
 * Matching utility functions for ride offers and requests
 */

export interface MatchCriteria {
  origin: string
  destination: string
  departureTime: Date
  flexibleTime?: boolean
  maxPrice?: number | null
  availableSeats: number
  price?: number | null
}

/**
 * Check if two locations match (fuzzy matching)
 * For now, using simple case-insensitive comparison
 * In production, you might want to use geocoding/geolocation
 */
export function locationsMatch(loc1: string, loc2: string): boolean {
  return loc1.toLowerCase().trim() === loc2.toLowerCase().trim()
}

/**
 * Check if departure times are within acceptable window
 * For flexible requests, allow ±2 hours
 * For non-flexible, allow ±30 minutes
 */
export function timesMatch(
  offerTime: Date,
  requestTime: Date,
  flexible: boolean = false
): boolean {
  const offer = new Date(offerTime).getTime()
  const request = new Date(requestTime).getTime()
  const diff = Math.abs(offer - request)

  // Flexible: ±2 hours (7200000 ms)
  // Non-flexible: ±30 minutes (1800000 ms)
  const window = flexible ? 7200000 : 1800000

  return diff <= window
}

/**
 * Check if price matches requester's budget
 */
export function priceMatches(
  offerPrice: number | null,
  maxPrice: number | null
): boolean {
  if (!offerPrice) return true // Free ride always matches
  if (!maxPrice) return true // No budget limit
  return offerPrice <= maxPrice
}

/**
 * Check if a ride offer matches a ride request
 */
export function isMatch(
  offer: {
    origin: string
    destination: string
    departureTime: Date
    availableSeats: number
    price: number | null
  },
  request: {
    origin: string
    destination: string
    preferredDepartureTime: Date
    flexibleTime: boolean
    maxPrice: number | null
  }
): boolean {
  return (
    locationsMatch(offer.origin, request.origin) &&
    locationsMatch(offer.destination, request.destination) &&
    timesMatch(offer.departureTime, request.preferredDepartureTime, request.flexibleTime) &&
    offer.availableSeats >= 1 &&
    priceMatches(offer.price, request.maxPrice)
  )
}
