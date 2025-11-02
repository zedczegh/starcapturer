-- Add camera stream URL field to astro spots
ALTER TABLE user_astro_spots 
ADD COLUMN IF NOT EXISTS camera_stream_url TEXT;

COMMENT ON COLUMN user_astro_spots.camera_stream_url IS 'URL for live camera stream (supports YouTube, Twitch embeds, or direct stream URLs)';