-- Content Calendar Migration
-- Extend existing schedules table with calendar functionality

-- Add calendar-specific columns to existing schedules table
ALTER TABLE schedules 
ADD COLUMN IF NOT EXISTS scheduled_date DATE,
ADD COLUMN IF NOT EXISTS scheduled_time TIME DEFAULT '09:00:00',
ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'generating', 'completed', 'failed', 'cancelled')),
ADD COLUMN IF NOT EXISTS generated_article_id UUID REFERENCES generated_articles(id),
ADD COLUMN IF NOT EXISTS generation_error TEXT,
ADD COLUMN IF NOT EXISTS title VARCHAR(255),
ADD COLUMN IF NOT EXISTS description TEXT;

-- Create indexes for efficient calendar queries
CREATE INDEX IF NOT EXISTS idx_schedules_scheduled_date ON schedules(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_schedules_status ON schedules(status);
CREATE INDEX IF NOT EXISTS idx_schedules_client_date ON schedules(client_id, scheduled_date);

-- Update existing schedules to have a scheduled_date if they don't have one
-- Set them to start from tomorrow
UPDATE schedules 
SET scheduled_date = CURRENT_DATE + INTERVAL '1 day'
WHERE scheduled_date IS NULL AND active = true;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_schedules_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for schedules updated_at
DROP TRIGGER IF EXISTS update_schedules_updated_at ON schedules;
CREATE TRIGGER update_schedules_updated_at
    BEFORE UPDATE ON schedules
    FOR EACH ROW
    EXECUTE FUNCTION update_schedules_updated_at();

-- Create schedule_templates table for reusable templates
CREATE TABLE IF NOT EXISTS schedule_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  focus_keyword VARCHAR(255) NOT NULL,
  extra_keywords TEXT[] DEFAULT '{}',
  extra_headings TEXT[] DEFAULT '{}',
  article_type VARCHAR(50) DEFAULT 'informatief',
  language VARCHAR(10) DEFAULT 'nl',
  country VARCHAR(10) DEFAULT 'nl',
  website_url TEXT,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for schedule_templates
CREATE INDEX IF NOT EXISTS idx_schedule_templates_company ON schedule_templates(company_id);
CREATE INDEX IF NOT EXISTS idx_schedule_templates_client ON schedule_templates(client_id);
CREATE INDEX IF NOT EXISTS idx_schedule_templates_created_by ON schedule_templates(created_by);

-- RLS policies for schedule_templates
ALTER TABLE schedule_templates ENABLE ROW LEVEL SECURITY;

-- Drop existing policies first if they exist
DROP POLICY IF EXISTS "Users can view schedule templates for their company" ON schedule_templates;
DROP POLICY IF EXISTS "Users can insert schedule templates for their company" ON schedule_templates;
DROP POLICY IF EXISTS "Users can update schedule templates for their company" ON schedule_templates;
DROP POLICY IF EXISTS "Users can delete schedule templates for their company" ON schedule_templates;

CREATE POLICY "Users can view schedule templates for their company" ON schedule_templates
  FOR SELECT USING (
    company_id IN (
      SELECT company_id FROM memberships 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert schedule templates for their company" ON schedule_templates
  FOR INSERT WITH CHECK (
    company_id IN (
      SELECT company_id FROM memberships 
      WHERE user_id = auth.uid()
    ) AND created_by = auth.uid()
  );

CREATE POLICY "Users can update schedule templates for their company" ON schedule_templates
  FOR UPDATE USING (
    company_id IN (
      SELECT company_id FROM memberships 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete schedule templates for their company" ON schedule_templates
  FOR DELETE USING (
    company_id IN (
      SELECT company_id FROM memberships 
      WHERE user_id = auth.uid()
    )
  );

-- Trigger for schedule_templates updated_at
DROP TRIGGER IF EXISTS update_schedule_templates_updated_at ON schedule_templates;
CREATE TRIGGER update_schedule_templates_updated_at
    BEFORE UPDATE ON schedule_templates
    FOR EACH ROW
    EXECUTE FUNCTION update_schedules_updated_at();

-- Add calendar functionality to reddit_search_requests table
ALTER TABLE reddit_search_requests 
ADD COLUMN IF NOT EXISTS scheduled_date DATE,
ADD COLUMN IF NOT EXISTS scheduled_time TIME DEFAULT '09:00:00',
ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'generating', 'completed', 'failed', 'cancelled')),
ADD COLUMN IF NOT EXISTS title VARCHAR(255),
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS generation_error TEXT;

-- Create indexes for reddit requests calendar queries
CREATE INDEX IF NOT EXISTS idx_reddit_requests_scheduled_date ON reddit_search_requests(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_reddit_requests_status ON reddit_search_requests(status);
CREATE INDEX IF NOT EXISTS idx_reddit_requests_company_date ON reddit_search_requests(company_id, scheduled_date);

-- Update existing reddit requests to have a scheduled_date if they don't have one
UPDATE reddit_search_requests 
SET scheduled_date = CURRENT_DATE + INTERVAL '1 day'
WHERE scheduled_date IS NULL AND active = true;

-- Drop existing reddit function first if it exists
DROP FUNCTION IF EXISTS claim_due_reddit_requests(INTEGER, UUID);

-- Function to claim due reddit requests for n8n processing
CREATE OR REPLACE FUNCTION claim_due_reddit_requests(p_limit INTEGER DEFAULT 25, p_company_id UUID DEFAULT NULL)
RETURNS TABLE (
  id UUID,
  company_id UUID,
  created_by UUID,
  search_type TEXT,
  keyword TEXT,
  max_results INTEGER,
  date_range TEXT,
  search_status TEXT,
  interval_seconds INTEGER,
  days_of_week INTEGER[],
  time_window JSONB,
  active BOOLEAN,
  last_run_at TIMESTAMP WITH TIME ZONE,
  next_run_at TIMESTAMP WITH TIME ZONE,
  title TEXT,
  description TEXT,
  scheduled_date DATE,
  scheduled_time TIME,
  status TEXT
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_time TIMESTAMP WITH TIME ZONE := NOW();
  current_date_only DATE := CURRENT_DATE;
  current_time_only TIME := current_time::TIME WITHOUT TIME ZONE;
BEGIN
  -- Update reddit requests to 'generating' status and return them
  RETURN QUERY
  UPDATE reddit_search_requests 
  SET 
    status = 'generating',
    last_run_at = current_time,
    updated_at = current_time
  WHERE 
    reddit_search_requests.id IN (
      SELECT r.id 
      FROM reddit_search_requests r
      WHERE 
        r.active = true 
        AND r.status = 'scheduled'
        AND r.scheduled_date <= current_date_only
        AND r.scheduled_time <= current_time_only
        AND r.next_run_at <= current_time
        AND (p_company_id IS NULL OR r.company_id = p_company_id)
      ORDER BY r.next_run_at ASC
      LIMIT p_limit
    )
  RETURNING 
    reddit_search_requests.id,
    reddit_search_requests.company_id,
    reddit_search_requests.created_by,
    reddit_search_requests.search_type::TEXT,
    reddit_search_requests.keyword,
    reddit_search_requests.max_results,
    reddit_search_requests.date_range,
    reddit_search_requests.search_status::TEXT,
    reddit_search_requests.interval_seconds,
    reddit_search_requests.days_of_week,
    reddit_search_requests.time_window,
    reddit_search_requests.active,
    reddit_search_requests.last_run_at,
    reddit_search_requests.next_run_at,
    reddit_search_requests.title,
    reddit_search_requests.description,
    reddit_search_requests.scheduled_date,
    reddit_search_requests.scheduled_time,
    reddit_search_requests.status;
END;
$$;

-- Drop existing function first if it exists
DROP FUNCTION IF EXISTS claim_due_schedules(INTEGER, DATE);
DROP FUNCTION IF EXISTS claim_due_schedules(INTEGER);

-- Function to claim due schedules for n8n processing
CREATE OR REPLACE FUNCTION claim_due_schedules(p_limit INTEGER DEFAULT 10, p_date DATE DEFAULT NULL)
RETURNS TABLE (
  id UUID,
  company_id UUID,
  client_id UUID,
  title TEXT,
  description TEXT,
  focus_keyword TEXT,
  extra_keywords TEXT[],
  extra_headings TEXT[],
  article_type TEXT,
  language TEXT,
  country TEXT,
  website_url TEXT,
  company_name TEXT
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_time TIMESTAMP WITH TIME ZONE := NOW();
  current_date_only DATE := COALESCE(p_date, CURRENT_DATE);
  current_time_only TIME := current_time::TIME WITHOUT TIME ZONE;
BEGIN
  -- Update schedules to 'generating' status and return them
  RETURN QUERY
  UPDATE schedules 
  SET 
    status = 'generating',
    last_run_at = current_time,
    updated_at = current_time
  WHERE 
    schedules.id IN (
      SELECT s.id 
      FROM schedules s
      WHERE 
        s.active = true 
        AND s.status = 'scheduled'
        AND s.scheduled_date <= current_date_only
        AND s.scheduled_time <= current_time_only
        AND s.next_run_at <= current_time
      ORDER BY s.next_run_at ASC
      LIMIT p_limit
    )
  RETURNING 
    schedules.id,
    schedules.company_id,
    schedules.client_id,
    schedules.title,
    schedules.description,
    schedules.focus_keyword,
    schedules.extra_keywords,
    schedules.extra_headings,
    schedules.article_type,
    schedules.language,
    schedules.country,
    schedules.website_url,
    schedules.company_name;
END;
$$;

-- Drop existing functions first if they exist
DROP FUNCTION IF EXISTS mark_schedule_completed(UUID, UUID, TEXT);
DROP FUNCTION IF EXISTS mark_reddit_request_completed(UUID, TEXT);
DROP FUNCTION IF EXISTS reschedule_failed_schedules();
DROP FUNCTION IF EXISTS reschedule_failed_reddit_requests();

-- Function to mark schedule as completed
CREATE OR REPLACE FUNCTION mark_schedule_completed(
  p_schedule_id UUID,
  p_generated_article_id UUID DEFAULT NULL,
  p_generation_error TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE schedules 
  SET 
    status = CASE 
      WHEN p_generation_error IS NOT NULL THEN 'failed'
      ELSE 'completed'
    END,
    generated_article_id = p_generated_article_id,
    generation_error = p_generation_error,
    updated_at = NOW()
  WHERE 
    schedules.id = p_schedule_id
    AND schedules.status = 'generating';
    
  RETURN FOUND;
END;
$$;

-- Function to reschedule failed schedules
CREATE OR REPLACE FUNCTION reschedule_failed_schedules()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  rescheduled_count INTEGER := 0;
BEGIN
  -- Reschedule failed schedules for tomorrow
  UPDATE schedules 
  SET 
    status = 'scheduled',
    scheduled_date = CURRENT_DATE + INTERVAL '1 day',
    next_run_at = (CURRENT_DATE + INTERVAL '1 day')::DATE + scheduled_time,
    generation_error = NULL,
    updated_at = NOW()
  WHERE 
    status = 'failed'
    AND scheduled_date < CURRENT_DATE;
    
  GET DIAGNOSTICS rescheduled_count = ROW_COUNT;
  
  RETURN rescheduled_count;
END;
$$;

-- Function to mark reddit request as completed
CREATE OR REPLACE FUNCTION mark_reddit_request_completed(
  p_request_id UUID,
  p_generation_error TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE reddit_search_requests 
  SET 
    status = CASE 
      WHEN p_generation_error IS NOT NULL THEN 'failed'
      ELSE 'completed'
    END,
    generation_error = p_generation_error,
    updated_at = NOW()
  WHERE 
    reddit_search_requests.id = p_request_id
    AND reddit_search_requests.status = 'generating';
    
  RETURN FOUND;
END;
$$;

-- Function to reschedule failed reddit requests
CREATE OR REPLACE FUNCTION reschedule_failed_reddit_requests()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  rescheduled_count INTEGER := 0;
BEGIN
  -- Reschedule failed reddit requests for tomorrow
  UPDATE reddit_search_requests 
  SET 
    status = 'scheduled',
    scheduled_date = CURRENT_DATE + INTERVAL '1 day',
    next_run_at = (CURRENT_DATE + INTERVAL '1 day')::DATE + scheduled_time,
    generation_error = NULL,
    updated_at = NOW()
  WHERE 
    status = 'failed'
    AND scheduled_date < CURRENT_DATE;
    
  GET DIAGNOSTICS rescheduled_count = ROW_COUNT;
  
  RETURN rescheduled_count;
END;
$$;
