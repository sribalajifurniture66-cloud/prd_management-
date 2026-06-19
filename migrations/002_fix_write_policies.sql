-- Repair write access for the browser-based Supabase client.
-- Run this once in the Supabase SQL Editor.

ALTER TABLE public.items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow item reads" ON public.items;
CREATE POLICY "Allow item reads"
  ON public.items
  FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "Allow item inserts" ON public.items;
CREATE POLICY "Allow item inserts"
  ON public.items
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow item updates" ON public.items;
CREATE POLICY "Allow item updates"
  ON public.items
  FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

INSERT INTO storage.buckets (id, name, public)
VALUES ('item-photos', 'item-photos', true)
ON CONFLICT (id) DO UPDATE SET public = true;

DROP POLICY IF EXISTS "Allow item photo uploads" ON storage.objects;
CREATE POLICY "Allow item photo uploads"
  ON storage.objects
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (bucket_id = 'item-photos');
