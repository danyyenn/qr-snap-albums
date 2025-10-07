-- Drop the existing restrictive INSERT policy
DROP POLICY IF EXISTS "Anyone can upload photos" ON public.photos;

-- Recreate as a permissive policy
CREATE POLICY "Anyone can upload photos" 
ON public.photos 
FOR INSERT 
WITH CHECK (true);