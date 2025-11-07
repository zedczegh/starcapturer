-- Add folder_path column to personal_uploads table for research organization
ALTER TABLE personal_uploads 
ADD COLUMN IF NOT EXISTS folder_path TEXT;