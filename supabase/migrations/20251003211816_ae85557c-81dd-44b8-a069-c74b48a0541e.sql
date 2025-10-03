-- Drop the existing function
DROP FUNCTION IF EXISTS public.get_event_by_upload_code(text);

-- Recreate function with allow_guest_view field
CREATE OR REPLACE FUNCTION public.get_event_by_upload_code(p_upload_code text)
RETURNS TABLE (
  id uuid,
  name text,
  event_date date,
  location text,
  description text,
  allow_guest_view boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    e.id,
    e.name,
    e.event_date,
    e.location,
    e.description,
    e.allow_guest_view
  FROM public.events e
  WHERE e.upload_code = p_upload_code
  LIMIT 1;
END;
$$;