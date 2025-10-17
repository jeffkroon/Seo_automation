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
        AND r.next_run_at <= current_time  -- Simplified: only check next_run_at
        AND (p_company_id IS NULL OR r.company_id = p_company_id)
      ORDER BY r.next_run_at ASC
      LIMIT p_limit
    )
  RETURNING 
    reddit_search_requests.id,
    reddit_search_requests.company_id,
    reddit_search_requests.created_by,
    reddit_search_requests.search_type::TEXT,
    reddit_search_requests.keyword::TEXT,
    reddit_search_requests.max_results,
    reddit_search_requests.date_range::TEXT,
    reddit_search_requests.search_status::TEXT,
    reddit_search_requests.interval_seconds,
    reddit_search_requests.days_of_week,
    reddit_search_requests.time_window,
    reddit_search_requests.active,
    reddit_search_requests.last_run_at,
    reddit_search_requests.next_run_at,
    reddit_search_requests.title::TEXT,
    reddit_search_requests.description::TEXT,
    reddit_search_requests.scheduled_date,
    reddit_search_requests.scheduled_time::TIME WITHOUT TIME ZONE,
    reddit_search_requests.status::TEXT;
END;
$$;
