-- Migration to add upper funnel columns to meta_ads_performance
-- Run this in your Supabase SQL Editor

ALTER TABLE meta_ads_performance 
ADD COLUMN IF NOT EXISTS ad_thumbnail_url TEXT,
ADD COLUMN IF NOT EXISTS ad_preview_url TEXT,
ADD COLUMN IF NOT EXISTS effective_status TEXT,
ADD COLUMN IF NOT EXISTS objective TEXT,
ADD COLUMN IF NOT EXISTS buying_type TEXT,
ADD COLUMN IF NOT EXISTS action_values JSONB;

-- Index for better performance on status/objective filtering
CREATE INDEX IF NOT EXISTS idx_meta_ads_status ON meta_ads_performance(effective_status);
CREATE INDEX IF NOT EXISTS idx_meta_ads_objective ON meta_ads_performance(objective);
