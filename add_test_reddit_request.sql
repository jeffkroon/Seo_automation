-- Add a test Reddit request that meets the criteria for claiming
INSERT INTO reddit_search_requests (
  id,
  company_id,
  created_by,
  search_type,
  keyword,
  max_results,
  date_range,
  search_status,
  scheduled_date,
  scheduled_time,
  status,
  title,
  description
) VALUES (
  gen_random_uuid(),
  '4c0cb615-2a43-4393-955b-d9a2b0777a71', -- Your company ID
  '37a6765c-bea0-4ba7-b9d7-f7778b2cca19', -- Your user ID
  'Keyword Search'::reddit_search_type, -- Use the correct enum value
  'test keyword',
  25,
  'week',
  'Pending'::reddit_status, -- Use the correct enum value
  CURRENT_DATE,
  '09:00:00',
  'scheduled',
  'Test Reddit Analysis',
  'This is a test request for API testing'
);

-- Check what we just added
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
ORDER BY created_at DESC
LIMIT 5;
