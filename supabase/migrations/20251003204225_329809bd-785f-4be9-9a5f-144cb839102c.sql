-- Drop the overly permissive public SELECT policy
DROP POLICY IF EXISTS "Public can view events by upload code" ON public.events;

-- Create a secure function to get event details by upload code
-- This function only returns specific, non-sensitive fields
CREATE OR REPLACE FUNCTION public.get_event_by_upload_code(p_upload_code text)
RETURNS TABLE (
  id uuid,
  name text,
  event_date date,
  location text,
  description text
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
    e.description
  FROM public.events e
  WHERE e.upload_code = p_upload_code
  LIMIT 1;
END;
$$;

-- Grant execute permission to anonymous users
GRANT EXECUTE ON FUNCTION public.get_event_by_upload_code(text) TO anon;
GRANT EXECUTE ON FUNCTION public.get_event_by_upload_code(text) TO authenticated;