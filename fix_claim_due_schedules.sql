-- Drop de oude functie
DROP FUNCTION IF EXISTS claim_due_schedules(INTEGER, DATE);
DROP FUNCTION IF EXISTS claim_due_schedules(INTEGER);

-- Simplified function for calendar-based schedules only
CREATE OR REPLACE FUNCTION claim_due_schedules(p_limit INTEGER DEFAULT 10)
RETURNS TABLE (
  id UUID,
  company_id UUID,
  focus_keyword TEXT,
  extra_keywords TEXT[],
  extra_headings TEXT[],
  language TEXT,
  country TEXT,
  company_name TEXT,
  website_url TEXT,
  article_type TEXT,
  client_id UUID,
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
BEGIN
  -- Update schedules to 'generating' status and return them
  RETURN QUERY
  UPDATE schedules 
  SET 
    status = 'generating',
    updated_at = current_time
  WHERE 
    schedules.id IN (
      SELECT s.id 
      FROM schedules s
      WHERE 
        s.status IN ('scheduled', 'generating')
        AND s.scheduled_date <= current_time::DATE
        AND s.scheduled_time <= current_time::TIME
      ORDER BY s.scheduled_date ASC, s.scheduled_time ASC
      LIMIT p_limit
    )
  RETURNING 
    schedules.id,
    schedules.company_id,
    schedules.focus_keyword,
    schedules.extra_keywords,
    schedules.extra_headings,
    schedules.language,
    schedules.country,
    schedules.company_name,
    schedules.website_url,
    schedules.article_type,
    schedules.client_id,
    schedules.scheduled_date,
    schedules.scheduled_time,
    schedules.status,
    schedules.title,
    schedules.description,
    schedules.created_at,
    schedules.updated_at;
END;
$$;
