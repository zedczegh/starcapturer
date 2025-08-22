-- Create table for saved astro spots
CREATE TABLE public.saved_astro_spots (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  spot_id UUID NOT NULL,
  name TEXT NOT NULL,
  latitude NUMERIC NOT NULL,
  longitude NUMERIC NOT NULL,
  bortlescale INTEGER,
  siqs NUMERIC,
  verification_status TEXT DEFAULT 'unverified',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, spot_id)
);

-- Enable Row Level Security
ALTER TABLE public.saved_astro_spots ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own saved astro spots" 
ON public.saved_astro_spots 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own saved astro spots" 
ON public.saved_astro_spots 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own saved astro spots" 
ON public.saved_astro_spots 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own saved astro spots" 
ON public.saved_astro_spots 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_saved_astro_spots_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_saved_astro_spots_updated_at
BEFORE UPDATE ON public.saved_astro_spots
FOR EACH ROW
EXECUTE FUNCTION public.update_saved_astro_spots_updated_at();