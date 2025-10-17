-- Drop de oude functie
DROP FUNCTION IF EXISTS claim_due_schedules(INTEGER, DATE);
DROP FUNCTION IF EXISTS claim_due_schedules(INTEGER);

-- Hybrid functie: ondersteunt zowel calendar-based als recurring schedules
CREATE OR REPLACE FUNCTION claim_due_schedules(p_limit INTEGER DEFAULT 10, p_date DATE DEFAULT NULL)
RETURNS TABLE (
  id UUID,
  company_id UUID,
  client_id UUID,
  title VARCHAR(255),
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
BEGIN
  RETURN QUERY
  UPDATE schedules 
  SET 
    status = 'generating',
    last_run_at = NOW(),
    updated_at = NOW()
  WHERE 
    schedules.id IN (
      SELECT s.id 
      FROM schedules s
      WHERE 
        s.active = true 
        AND s.status = 'scheduled'
        AND (
          -- Calendar-based schedules (eenmalig) - interval_seconds is NULL of 0
          (s.scheduled_date IS NOT NULL 
           AND (s.interval_seconds IS NULL OR s.interval_seconds = 0)
           AND s.scheduled_date <= COALESCE(p_date, CURRENT_DATE)
           AND s.scheduled_time <= CURRENT_TIME)
          OR
          -- Recurring schedules (interval-based) - heeft interval_seconds > 0
          (s.interval_seconds IS NOT NULL 
           AND s.interval_seconds > 0
           AND s.next_run_at <= NOW())
        )
      ORDER BY 
        CASE 
          WHEN s.scheduled_date IS NOT NULL THEN s.scheduled_date
          ELSE s.next_run_at::DATE
        END ASC,
        CASE 
          WHEN s.scheduled_date IS NOT NULL THEN s.scheduled_time
          ELSE s.next_run_at::TIME
        END ASC
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
