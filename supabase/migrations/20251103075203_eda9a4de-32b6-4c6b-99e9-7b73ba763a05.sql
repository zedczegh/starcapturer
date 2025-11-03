-- Add spot_type column to user_astro_spots table
ALTER TABLE user_astro_spots 
ADD COLUMN spot_type TEXT DEFAULT 'nightscape' CHECK (spot_type IN ('nightscape', 'natural', 'obscura'));

-- Update all existing spots to be nightscape type
UPDATE user_astro_spots SET spot_type = 'nightscape' WHERE spot_type IS NULL;

-- Add index for better filtering performance
CREATE INDEX idx_user_astro_spots_spot_type ON user_astro_spots(spot_type);