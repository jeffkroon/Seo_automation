-- Drop existing reddit function first if it exists
DROP FUNCTION IF EXISTS claim_due_reddit_requests(INTEGER, UUID);

-- Simplified function for calendar-based reddit requests only
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
  scheduled_date DATE,
  scheduled_time TIME WITHOUT TIME ZONE,
  status TEXT,
  title TEXT,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_time TIMESTAMP WITH TIME ZONE := NOW();
  current_date_only DATE := current_time::DATE;
  current_time_only TIME := current_time::TIME;
BEGIN
  -- Update reddit requests to 'generating' status and return them
  RETURN QUERY
  UPDATE reddit_search_requests 
  SET 
    status = 'generating',
    updated_at = current_time
  WHERE 
    reddit_search_requests.id IN (
      SELECT r.id 
      FROM reddit_search_requests r
      WHERE 
        r.status IN ('scheduled', 'generating')
        AND r.scheduled_date <= current_date_only
        AND r.scheduled_time <= current_time_only
        AND (p_company_id IS NULL OR r.company_id = p_company_id)
      ORDER BY r.scheduled_date ASC, r.scheduled_time ASC
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
    reddit_search_requests.scheduled_date,
    reddit_search_requests.scheduled_time::TIME WITHOUT TIME ZONE,
    reddit_search_requests.status::TEXT,
    reddit_search_requests.title::TEXT,
    reddit_search_requests.description::TEXT,
    reddit_search_requests.created_at,
    reddit_search_requests.updated_at;
END;
$$;