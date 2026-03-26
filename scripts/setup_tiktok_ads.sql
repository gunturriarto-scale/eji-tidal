-- SQL to create the tiktok_ads_performance table in Supabase
-- Run this in your Supabase SQL Editor

CREATE TABLE IF NOT EXISTS tiktok_ads_performance (
    id BIGSERIAL PRIMARY KEY,
    day DATE NOT NULL,
    ad_id TEXT NOT NULL,
    ad_name TEXT,
    campaign_id TEXT,
    campaign_name TEXT,
    account_name TEXT,
    advertising_objective TEXT,
    spend NUMERIC DEFAULT 0,
    impressions BIGINT DEFAULT 0,
    reach BIGINT DEFAULT 0,
    clicks BIGINT DEFAULT 0,
    video_views BIGINT DEFAULT 0,
    video_2s_views BIGINT DEFAULT 0,
    video_6s_views BIGINT DEFAULT 0,
    product TEXT,
    category TEXT,
    brand TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure uniqueness for upserts (daily breakdown per ad)
    CONSTRAINT tiktok_ads_perf_unique UNIQUE (day, ad_id)
);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_tiktok_ads_day ON tiktok_ads_performance(day);
CREATE INDEX IF NOT EXISTS idx_tiktok_ads_ad ON tiktok_ads_performance(ad_id);
