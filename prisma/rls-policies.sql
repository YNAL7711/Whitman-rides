-- =========================================
-- Whitman Rides — Row Level Security (RLS)
-- Safe, idempotent, Prisma-compatible
-- =========================================

-- Enable RLS on all tables
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "RideOffer" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "RideRequest" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "RideMatch" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Message" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Rating" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Notification" ENABLE ROW LEVEL SECURITY;

-- =========================================
-- DROP EXISTING POLICIES (SAFE)
-- =========================================

DO $$ 
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN
    SELECT schemaname, tablename, policyname
    FROM pg_policies
    WHERE schemaname = 'public'
  LOOP
    EXECUTE format(
      'DROP POLICY IF EXISTS "%s" ON "%s"."%s";',
      pol.policyname,
      pol.schemaname,
      pol.tablename
    );
  END LOOP;
END $$;

-- =========================================
-- USER
-- =========================================

CREATE POLICY "Users can read own profile"
ON "User"
FOR SELECT
USING (auth.uid()::text = id);

CREATE POLICY "Users can update own profile"
ON "User"
FOR UPDATE
USING (auth.uid()::text = id);

CREATE POLICY "Users can insert own profile"
ON "User"
FOR INSERT
WITH CHECK (auth.uid()::text = id);

CREATE POLICY "Users can read other profiles"
ON "User"
FOR SELECT
USING (true);

-- =========================================
-- RIDE OFFER
-- =========================================

CREATE POLICY "Drivers can create offers"
ON "RideOffer"
FOR INSERT
WITH CHECK (auth.uid()::text = "driverId");

CREATE POLICY "Drivers can read own offers"
ON "RideOffer"
FOR SELECT
USING (auth.uid()::text = "driverId");

CREATE POLICY "Anyone can read active offers"
ON "RideOffer"
FOR SELECT
USING ("status" = 'ACTIVE');

CREATE POLICY "Drivers can update own offers"
ON "RideOffer"
FOR UPDATE
USING (auth.uid()::text = "driverId");

CREATE POLICY "Drivers can delete own offers"
ON "RideOffer"
FOR DELETE
USING (auth.uid()::text = "driverId");

-- =========================================
-- RIDE REQUEST
-- =========================================

CREATE POLICY "Requesters can create requests"
ON "RideRequest"
FOR INSERT
WITH CHECK (auth.uid()::text = "requesterId");

CREATE POLICY "Requesters can read own requests"
ON "RideRequest"
FOR SELECT
USING (auth.uid()::text = "requesterId");

CREATE POLICY "Anyone can read pending requests"
ON "RideRequest"
FOR SELECT
USING ("status" = 'PENDING');

CREATE POLICY "Requesters can update own requests"
ON "RideRequest"
FOR UPDATE
USING (auth.uid()::text = "requesterId");

CREATE POLICY "Requesters can delete own requests"
ON "RideRequest"
FOR DELETE
USING (auth.uid()::text = "requesterId");

-- =========================================
-- RIDE MATCH
-- =========================================

CREATE POLICY "Users can read own matches"
ON "RideMatch"
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM "RideOffer"
    WHERE "RideOffer".id = "RideMatch"."offerId"
      AND "RideOffer"."driverId" = auth.uid()::text
  )
  OR EXISTS (
    SELECT 1 FROM "RideRequest"
    WHERE "RideRequest".id = "RideMatch"."requestId"
      AND "RideRequest"."requesterId" = auth.uid()::text
  )
);

CREATE POLICY "Users can create matches for their rides"
ON "RideMatch"
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM "RideOffer"
    WHERE "RideOffer".id = "offerId"
      AND "RideOffer"."driverId" = auth.uid()::text
  )
  OR EXISTS (
    SELECT 1 FROM "RideRequest"
    WHERE "RideRequest".id = "requestId"
      AND "RideRequest"."requesterId" = auth.uid()::text
  )
);

CREATE POLICY "Drivers can update matches for their offers"
ON "RideMatch"
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM "RideOffer"
    WHERE "RideOffer".id = "offerId"
      AND "RideOffer"."driverId" = auth.uid()::text
  )
);

CREATE POLICY "Requesters can update matches for their requests"
ON "RideMatch"
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM "RideRequest"
    WHERE "RideRequest".id = "requestId"
      AND "RideRequest"."requesterId" = auth.uid()::text
  )
);

-- =========================================
-- MESSAGE
-- =========================================

CREATE POLICY "Users can read messages in their matches"
ON "Message"
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM "RideMatch"
    JOIN "RideOffer" ON "RideOffer".id = "RideMatch"."offerId"
    WHERE "RideMatch".id = "Message"."matchId"
      AND "RideOffer"."driverId" = auth.uid()::text
  )
  OR EXISTS (
    SELECT 1 FROM "RideMatch"
    JOIN "RideRequest" ON "RideRequest".id = "RideMatch"."requestId"
    WHERE "RideMatch".id = "Message"."matchId"
      AND "RideRequest"."requesterId" = auth.uid()::text
  )
);

CREATE POLICY "Users can create messages in their matches"
ON "Message"
FOR INSERT
WITH CHECK (auth.uid()::text = "senderId");

CREATE POLICY "Users can update own messages"
ON "Message"
FOR UPDATE
USING (auth.uid()::text = "senderId");

-- =========================================
-- RATING
-- =========================================

CREATE POLICY "Anyone can read ratings"
ON "Rating"
FOR SELECT
USING (true);

CREATE POLICY "Users can create ratings for their completed matches"
ON "Rating"
FOR INSERT
WITH CHECK (auth.uid()::text = "raterId");

-- =========================================
-- NOTIFICATION
-- =========================================

CREATE POLICY "Users can read own notifications"
ON "Notification"
FOR SELECT
USING (auth.uid()::text = "userId");

CREATE POLICY "Users can create own notifications"
ON "Notification"
FOR INSERT
WITH CHECK (auth.uid()::text = "userId");

CREATE POLICY "Users can update own notifications"
ON "Notification"
FOR UPDATE
USING (auth.uid()::text = "userId");
