-- SQL to create the google_ads_performance table in Supabase
-- Run this in your Supabase SQL Editor

CREATE TABLE IF NOT EXISTS google_ads_performance (
    id BIGSERIAL PRIMARY KEY,
    day DATE NOT NULL,
    campaign_id TEXT NOT NULL,
    campaign_name TEXT,
    customer_id TEXT,
    spend NUMERIC DEFAULT 0,
    impressions BIGINT DEFAULT 0,
    clicks BIGINT DEFAULT 0,
    video_views BIGINT DEFAULT 0,
    conversions NUMERIC DEFAULT 0,
    conversion_value NUMERIC DEFAULT 0,
    video_p25 BIGINT DEFAULT 0,
    video_p50 BIGINT DEFAULT 0,
    video_p75 BIGINT DEFAULT 0,
    video_p95 BIGINT DEFAULT 0,
    video_p100 BIGINT DEFAULT 0,
    product TEXT,
    category TEXT,
    category_group TEXT,
    brand TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure uniqueness for upserts
    CONSTRAINT google_ads_perf_unique UNIQUE (day, campaign_id)
);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_google_ads_day ON google_ads_performance(day);
CREATE INDEX IF NOT EXISTS idx_google_ads_campaign ON google_ads_performance(campaign_id);
