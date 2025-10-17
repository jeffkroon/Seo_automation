-- Reset ALL Reddit requests to be due for testing
UPDATE reddit_search_requests 
SET 
  status = 'scheduled',
  next_run_at = NOW() - INTERVAL '2 hours', -- Definitely due
  active = true,
  updated_at = NOW()
WHERE company_id = '4c0cb615-2a43-4393-955b-d9a2b0777a71';

-- Check what we have now
SELECT 
  id,
  keyword,
  status,
  next_run_at,
  active,
  company_id,
  updated_at
FROM reddit_search_requests 
WHERE company_id = '4c0cb615-2a43-4393-955b-d9a2b0777a71'
ORDER BY updated_at DESC
LIMIT 5;
