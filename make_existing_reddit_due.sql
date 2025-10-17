-- Simple test: Update existing Reddit request to be due
UPDATE reddit_search_requests 
SET 
  status = 'scheduled',
  next_run_at = NOW() - INTERVAL '2 hours', -- Definitely due
  active = true
WHERE company_id = '4c0cb615-2a43-4393-955b-d9a2b0777a71'
AND id = (
  SELECT id FROM reddit_search_requests 
  WHERE company_id = '4c0cb615-2a43-4393-955b-d9a2b0777a71'
  LIMIT 1
);

-- Check what we have now
SELECT 
  id,
  keyword,
  status,
  next_run_at,
  active,
  company_id,
  search_type
FROM reddit_search_requests 
WHERE company_id = '4c0cb615-2a43-4393-955b-d9a2b0777a71'
ORDER BY updated_at DESC
LIMIT 3;
