-- Make all Reddit requests due for testing
UPDATE reddit_search_requests 
SET 
  status = 'scheduled',
  next_run_at = NOW() - INTERVAL '1 hour', -- Due 1 hour ago
  active = true
WHERE company_id = '4c0cb615-2a43-4393-955b-d9a2b0777a71'
AND status IN ('generating', 'completed', 'failed');

-- Check what we have now
SELECT 
  id,
  keyword,
  status,
  next_run_at,
  active,
  company_id
FROM reddit_search_requests 
WHERE company_id = '4c0cb615-2a43-4393-955b-d9a2b0777a71'
ORDER BY updated_at DESC
LIMIT 5;
