-- Furniture Stock Tracker Database Schema
-- Run this in Supabase SQL Editor to set up the database

-- Create items table
CREATE TABLE IF NOT EXISTS items (
  serial_number TEXT PRIMARY KEY UNIQUE NOT NULL,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  image_url TEXT,
  listed_price NUMERIC NOT NULL CHECK (listed_price >= 0),
  status TEXT NOT NULL DEFAULT 'in_stock' CHECK (status IN ('in_stock', 'sold')),
  price_sold NUMERIC CHECK (price_sold >= 0),
  date_sold TIMESTAMP,
  date_added TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_items_status ON items(status);
CREATE INDEX IF NOT EXISTS idx_items_date_sold ON items(date_sold);
CREATE INDEX IF NOT EXISTS idx_items_category ON items(category);

-- Enable Row Level Security (optional but recommended)
ALTER TABLE items ENABLE ROW LEVEL SECURITY;

-- Create a public policy to allow all operations (since we're using simple password auth)
DROP POLICY IF EXISTS "Allow all public operations" ON items;
CREATE POLICY "Allow all public operations" 
  ON items 
  FOR ALL 
  USING (true) 
  WITH CHECK (true);

-- A public bucket allows downloads, but uploads still require an RLS policy.
INSERT INTO storage.buckets (id, name, public)
VALUES ('item-photos', 'item-photos', true)
ON CONFLICT (id) DO UPDATE SET public = true;

DROP POLICY IF EXISTS "Allow public item photo uploads" ON storage.objects;
CREATE POLICY "Allow public item photo uploads"
  ON storage.objects
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (bucket_id = 'item-photos');

-- Notes:
-- 1. Get your Project URL and anon key from Project Settings → API
-- 2. Add them to .env.local as:
--    NEXT_PUBLIC_SUPABASE_URL=your_url
--    NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key
