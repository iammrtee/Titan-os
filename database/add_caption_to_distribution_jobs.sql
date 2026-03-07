-- Add caption column to distribution_jobs for user-written post text
ALTER TABLE distribution_jobs ADD COLUMN IF NOT EXISTS caption TEXT;
ALTER TABLE distribution_jobs ADD COLUMN IF NOT EXISTS media_urls TEXT[];
