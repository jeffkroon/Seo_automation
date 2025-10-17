-- Test function to isolate the issue
DROP FUNCTION IF EXISTS test_reddit_requests();

CREATE OR REPLACE FUNCTION test_reddit_requests()
RETURNS TABLE (
  id UUID,
  next_run_at TIMESTAMP WITH TIME ZONE,
  status TEXT
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_time TIMESTAMP WITH TIME ZONE := NOW();
BEGIN
  RETURN QUERY
  SELECT 
    r.id,
    r.next_run_at,
    r.status
  FROM reddit_search_requests r
  WHERE 
    r.active = true 
    AND r.status = 'scheduled'
    AND r.next_run_at <= current_time
  ORDER BY r.next_run_at ASC
  LIMIT 10;
END;
$$;

-- Test the function
SELECT * FROM test_reddit_requests();
