-- Row Level Security Policies for Whitman Rides
-- Run this SQL in your Supabase SQL Editor after running Prisma migrations

-- Enable RLS on all tables
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "RideOffer" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "RideRequest" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "RideMatch" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Message" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Rating" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Notification" ENABLE ROW LEVEL SECURITY;

-- User table policies
-- Users can read their own profile
CREATE POLICY "Users can read own profile"
  ON "User"
  FOR SELECT
  USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON "User"
  FOR UPDATE
  USING (auth.uid() = id);

-- Users can insert their own profile (on signup)
CREATE POLICY "Users can insert own profile"
  ON "User"
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Users can read other users' profiles (for matching/ratings)
CREATE POLICY "Users can read other profiles"
  ON "User"
  FOR SELECT
  USING (true);

-- RideOffer policies
-- Drivers can create their own offers
CREATE POLICY "Drivers can create offers"
  ON "RideOffer"
  FOR INSERT
  WITH CHECK (auth.uid() = "driverId");

-- Drivers can read their own offers
CREATE POLICY "Drivers can read own offers"
  ON "RideOffer"
  FOR SELECT
  USING (auth.uid() = "driverId");

-- Anyone can read active offers (for matching)
CREATE POLICY "Anyone can read active offers"
  ON "RideOffer"
  FOR SELECT
  USING ("status" = 'ACTIVE');

-- Drivers can update their own offers
CREATE POLICY "Drivers can update own offers"
  ON "RideOffer"
  FOR UPDATE
  USING (auth.uid() = "driverId");

-- Drivers can delete their own offers
CREATE POLICY "Drivers can delete own offers"
  ON "RideOffer"
  FOR DELETE
  USING (auth.uid() = "driverId");

-- RideRequest policies
-- Requesters can create their own requests
CREATE POLICY "Requesters can create requests"
  ON "RideRequest"
  FOR INSERT
  WITH CHECK (auth.uid() = "requesterId");

-- Requesters can read their own requests
CREATE POLICY "Requesters can read own requests"
  ON "RideRequest"
  FOR SELECT
  USING (auth.uid() = "requesterId");

-- Anyone can read pending requests (for matching)
CREATE POLICY "Anyone can read pending requests"
  ON "RideRequest"
  FOR SELECT
  USING ("status" = 'PENDING');

-- Requesters can update their own requests
CREATE POLICY "Requesters can update own requests"
  ON "RideRequest"
  FOR UPDATE
  USING (auth.uid() = "requesterId");

-- Requesters can delete their own requests
CREATE POLICY "Requesters can delete own requests"
  ON "RideRequest"
  FOR DELETE
  USING (auth.uid() = "requesterId");

-- RideMatch policies
-- Users can read matches they're involved in (as driver or requester)
CREATE POLICY "Users can read own matches"
  ON "RideMatch"
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM "RideOffer"
      WHERE "RideOffer".id = "RideMatch"."offerId"
      AND "RideOffer"."driverId" = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM "RideRequest"
      WHERE "RideRequest".id = "RideMatch"."requestId"
      AND "RideRequest"."requesterId" = auth.uid()
    )
  );

-- System can create matches (via service role or function)
-- Note: This should be handled via Server Actions with service role, not RLS
-- For now, we'll allow creation if user is involved in the offer or request
CREATE POLICY "Users can create matches for their rides"
  ON "RideMatch"
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM "RideOffer"
      WHERE "RideOffer".id = "offerId"
      AND "RideOffer"."driverId" = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM "RideRequest"
      WHERE "RideRequest".id = "requestId"
      AND "RideRequest"."requesterId" = auth.uid()
    )
  );

-- Drivers can update matches for their offers
CREATE POLICY "Drivers can update matches for their offers"
  ON "RideMatch"
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM "RideOffer"
      WHERE "RideOffer".id = "offerId"
      AND "RideOffer"."driverId" = auth.uid()
    )
  );

-- Requesters can update matches for their requests
CREATE POLICY "Requesters can update matches for their requests"
  ON "RideMatch"
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM "RideRequest"
      WHERE "RideRequest".id = "requestId"
      AND "RideRequest"."requesterId" = auth.uid()
    )
  );

-- Message policies
-- Users can read messages in matches they're involved in
CREATE POLICY "Users can read messages in their matches"
  ON "Message"
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM "RideMatch"
      JOIN "RideOffer" ON "RideOffer".id = "RideMatch"."offerId"
      WHERE "RideMatch".id = "Message"."matchId"
      AND "RideOffer"."driverId" = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM "RideMatch"
      JOIN "RideRequest" ON "RideRequest".id = "RideMatch"."requestId"
      WHERE "RideMatch".id = "Message"."matchId"
      AND "RideRequest"."requesterId" = auth.uid()
    )
  );

-- Users can create messages in matches they're involved in
CREATE POLICY "Users can create messages in their matches"
  ON "Message"
  FOR INSERT
  WITH CHECK (
    auth.uid() = "senderId"
    AND (
      EXISTS (
        SELECT 1 FROM "RideMatch"
        JOIN "RideOffer" ON "RideOffer".id = "RideMatch"."offerId"
        WHERE "RideMatch".id = "matchId"
        AND "RideOffer"."driverId" = auth.uid()
      )
      OR EXISTS (
        SELECT 1 FROM "RideMatch"
        JOIN "RideRequest" ON "RideRequest".id = "RideMatch"."requestId"
        WHERE "RideMatch".id = "matchId"
        AND "RideRequest"."requesterId" = auth.uid()
      )
    )
  );

-- Users can update their own messages (mark as read, etc.)
CREATE POLICY "Users can update own messages"
  ON "Message"
  FOR UPDATE
  USING (auth.uid() = "senderId");

-- Rating policies
-- Anyone can read ratings (public)
CREATE POLICY "Anyone can read ratings"
  ON "Rating"
  FOR SELECT
  USING (true);

-- Users can create ratings for completed matches they were involved in
CREATE POLICY "Users can create ratings for their completed matches"
  ON "Rating"
  FOR INSERT
  WITH CHECK (
    auth.uid() = "raterId"
    AND EXISTS (
      SELECT 1 FROM "RideMatch"
      WHERE "RideMatch".id = "rideMatchId"
      AND "RideMatch"."status" = 'COMPLETED'
      AND (
        EXISTS (
          SELECT 1 FROM "RideOffer"
          WHERE "RideOffer".id = "RideMatch"."offerId"
          AND "RideOffer"."driverId" = auth.uid()
        )
        OR EXISTS (
          SELECT 1 FROM "RideRequest"
          WHERE "RideRequest".id = "RideMatch"."requestId"
          AND "RideRequest"."requesterId" = auth.uid()
        )
      )
    )
  );

-- Notification policies
-- Users can read their own notifications
CREATE POLICY "Users can read own notifications"
  ON "Notification"
  FOR SELECT
  USING (auth.uid() = "userId");

-- System can create notifications (via service role or function)
-- For now, allow if user matches
CREATE POLICY "Users can create own notifications"
  ON "Notification"
  FOR INSERT
  WITH CHECK (auth.uid() = "userId");

-- Users can update their own notifications (mark as read)
CREATE POLICY "Users can update own notifications"
  ON "Notification"
  FOR UPDATE
  USING (auth.uid() = "userId");
