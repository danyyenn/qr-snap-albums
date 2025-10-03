-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  is_host BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- Create claim codes table
CREATE TABLE public.claim_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  is_used BOOLEAN DEFAULT FALSE,
  used_by UUID REFERENCES public.profiles(id),
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ
);

ALTER TABLE public.claim_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can manage claim codes"
  ON public.claim_codes FOR ALL
  USING (auth.uid() IN (SELECT id FROM public.profiles WHERE is_host = TRUE));

-- Create events table
CREATE TABLE public.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  host_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  event_date DATE NOT NULL,
  location TEXT,
  description TEXT,
  cover_image_url TEXT,
  upload_code TEXT UNIQUE NOT NULL,
  qr_code_url TEXT,
  guest_passcode_hash TEXT,
  allow_guest_view BOOLEAN DEFAULT FALSE,
  require_approval BOOLEAN DEFAULT FALSE,
  is_public_gallery BOOLEAN DEFAULT FALSE,
  auto_delete_date TIMESTAMPTZ,
  storage_extended_until TIMESTAMPTZ,
  max_photos INTEGER DEFAULT 1000,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Hosts can view their own events"
  ON public.events FOR SELECT
  USING (auth.uid() = host_id);

CREATE POLICY "Hosts can create events"
  ON public.events FOR INSERT
  WITH CHECK (auth.uid() = host_id);

CREATE POLICY "Hosts can update their own events"
  ON public.events FOR UPDATE
  USING (auth.uid() = host_id);

CREATE POLICY "Hosts can delete their own events"
  ON public.events FOR DELETE
  USING (auth.uid() = host_id);

CREATE POLICY "Public can view events by upload code"
  ON public.events FOR SELECT
  USING (TRUE);

-- Create photos table
CREATE TABLE public.photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  thumbnail_path TEXT,
  original_filename TEXT,
  file_size INTEGER,
  upload_ip TEXT,
  is_approved BOOLEAN DEFAULT TRUE,
  uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.photos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Hosts can view all photos for their events"
  ON public.photos FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.events
      WHERE events.id = photos.event_id
      AND events.host_id = auth.uid()
    )
  );

CREATE POLICY "Anyone can upload photos"
  ON public.photos FOR INSERT
  WITH CHECK (TRUE);

CREATE POLICY "Hosts can update photos for their events"
  ON public.photos FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.events
      WHERE events.id = photos.event_id
      AND events.host_id = auth.uid()
    )
  );

CREATE POLICY "Hosts can delete photos from their events"
  ON public.photos FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.events
      WHERE events.id = photos.event_id
      AND events.host_id = auth.uid()
    )
  );

CREATE POLICY "Guests can view approved photos if allowed"
  ON public.photos FOR SELECT
  USING (
    is_approved = TRUE
    AND EXISTS (
      SELECT 1 FROM public.events
      WHERE events.id = photos.event_id
      AND (events.allow_guest_view = TRUE OR events.is_public_gallery = TRUE)
    )
  );

-- Create function to handle profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', '')
  );
  RETURN new;
END;
$$;

-- Trigger to create profile on user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_events_updated_at
  BEFORE UPDATE ON public.events
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('event-photos', 'event-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
CREATE POLICY "Anyone can upload photos"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'event-photos');

CREATE POLICY "Anyone can view photos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'event-photos');

CREATE POLICY "Hosts can delete their event photos"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'event-photos'
    AND auth.uid() IN (
      SELECT host_id FROM public.events
      WHERE id::text = (storage.foldername(name))[1]
    )
  );