-- Create a function to check if an event allows guest viewing (bypasses RLS)
CREATE OR REPLACE FUNCTION public.event_allows_guest_view(p_event_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_allows_guest_view boolean;
BEGIN
  SELECT allow_guest_view OR is_public_gallery
  INTO v_allows_guest_view
  FROM public.events
  WHERE id = p_event_id;
  
  RETURN COALESCE(v_allows_guest_view, false);
END;
$$;

-- Drop existing guest view policy for photos
DROP POLICY IF EXISTS "Guests can view approved photos if allowed" ON public.photos;

-- Create new policy using the security definer function
CREATE POLICY "Guests can view approved photos if allowed"
ON public.photos
FOR SELECT
USING (
  is_approved = true 
  AND public.event_allows_guest_view(event_id)
);