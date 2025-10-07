-- Create videos table to track video generation
CREATE TABLE public.event_videos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  stripe_session_id text NOT NULL,
  status text NOT NULL DEFAULT 'processing', -- processing, completed, failed
  video_url text,
  metadata jsonb,
  created_at timestamp with time zone DEFAULT now(),
  completed_at timestamp with time zone
);

-- Enable RLS
ALTER TABLE public.event_videos ENABLE ROW LEVEL SECURITY;

-- Hosts can view videos for their events
CREATE POLICY "Hosts can view their event videos"
ON public.event_videos
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.events
    WHERE events.id = event_videos.event_id
    AND events.host_id = auth.uid()
  )
);

-- Create index for faster lookups
CREATE INDEX idx_event_videos_event_id ON public.event_videos(event_id);
CREATE INDEX idx_event_videos_status ON public.event_videos(status);