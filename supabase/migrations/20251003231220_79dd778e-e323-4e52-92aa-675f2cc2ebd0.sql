-- Drop and recreate get_event_by_upload_code with new fields
DROP FUNCTION IF EXISTS public.get_event_by_upload_code(text);

CREATE FUNCTION public.get_event_by_upload_code(p_upload_code text)
 RETURNS TABLE(
   id uuid, 
   name text, 
   event_date date, 
   location text, 
   description text, 
   allow_guest_view boolean,
   require_approval boolean,
   max_photos integer
 )
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    e.id,
    e.name,
    e.event_date,
    e.location,
    e.description,
    e.allow_guest_view,
    e.require_approval,
    e.max_photos
  FROM public.events e
  WHERE e.upload_code = p_upload_code
  LIMIT 1;
END;
$function$;