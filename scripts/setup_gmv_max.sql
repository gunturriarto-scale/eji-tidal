CREATE TABLE hanasui_gmv_max (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_name text,
  campaign_id text,
  product_id text,
  creative_type text,
  video_title text,
  video_id text,
  tiktok_account text,
  time_posted text,
  status text,
  authorization text,
  cost numeric,
  sku_orders numeric,
  gross_revenue numeric,
  source_date date,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Index for querying by date faster
CREATE INDEX idx_hanasui_gmv_max_source_date ON hanasui_gmv_max (source_date);
