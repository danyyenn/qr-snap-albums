-- Create a secure function for guest photo uploads
CREATE OR REPLACE FUNCTION public.insert_photo(
  p_event_id uuid,
  p_storage_path text,
  p_original_filename text,
  p_file_size integer,
  p_upload_ip text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  v_photo_id uuid;
BEGIN
  -- Insert the photo record
  INSERT INTO public.photos (
    event_id,
    storage_path,
    original_filename,
    file_size,
    upload_ip,
    is_approved
  )
  VALUES (
    p_event_id,
    p_storage_path,
    p_original_filename,
    p_file_size,
    p_upload_ip,
    true
  )
  RETURNING id INTO v_photo_id;
  
  RETURN v_photo_id;
END;
$function$;