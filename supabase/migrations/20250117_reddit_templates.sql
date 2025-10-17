-- Create reddit_templates table for reusable Reddit analysis templates
CREATE TABLE IF NOT EXISTS reddit_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  search_type VARCHAR(50) NOT NULL DEFAULT 'posts',
  keyword VARCHAR(255),
  max_results INTEGER DEFAULT 25,
  date_range VARCHAR(50) DEFAULT 'week',
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for reddit_templates
CREATE INDEX IF NOT EXISTS idx_reddit_templates_company ON reddit_templates(company_id);
CREATE INDEX IF NOT EXISTS idx_reddit_templates_client ON reddit_templates(client_id);
CREATE INDEX IF NOT EXISTS idx_reddit_templates_created_by ON reddit_templates(created_by);

-- RLS policies for reddit_templates
ALTER TABLE reddit_templates ENABLE ROW LEVEL SECURITY;

-- Drop existing policies first if they exist
DROP POLICY IF EXISTS "Users can view reddit templates for their company" ON reddit_templates;
DROP POLICY IF EXISTS "Users can insert reddit templates for their company" ON reddit_templates;
DROP POLICY IF EXISTS "Users can update reddit templates for their company" ON reddit_templates;
DROP POLICY IF EXISTS "Users can delete reddit templates for their company" ON reddit_templates;

CREATE POLICY "Users can view reddit templates for their company" ON reddit_templates
  FOR SELECT USING (
    company_id IN (
      SELECT company_id FROM memberships 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert reddit templates for their company" ON reddit_templates
  FOR INSERT WITH CHECK (
    company_id IN (
      SELECT company_id FROM memberships 
      WHERE user_id = auth.uid()
    ) AND created_by = auth.uid()
  );

CREATE POLICY "Users can update reddit templates for their company" ON reddit_templates
  FOR UPDATE USING (
    company_id IN (
      SELECT company_id FROM memberships 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete reddit templates for their company" ON reddit_templates
  FOR DELETE USING (
    company_id IN (
      SELECT company_id FROM memberships 
      WHERE user_id = auth.uid()
    )
  );

-- Trigger for reddit_templates updated_at
DROP TRIGGER IF EXISTS update_reddit_templates_updated_at ON reddit_templates;
CREATE TRIGGER update_reddit_templates_updated_at
    BEFORE UPDATE ON reddit_templates
    FOR EACH ROW
    EXECUTE FUNCTION update_schedules_updated_at();

-- Insert some default Reddit templates for each company
INSERT INTO reddit_templates (company_id, client_id, title, description, search_type, keyword, max_results, date_range, created_by)
SELECT 
  c.id as company_id,
  cl.id as client_id,
  'Reddit Posts Analyse' as title,
  'Analyseer Reddit posts voor een specifiek keyword' as description,
  'posts' as search_type,
  NULL as keyword,
  25 as max_results,
  'week' as date_range,
  c.created_by
FROM companies c
CROSS JOIN clients cl
WHERE cl.company_id = c.id
ON CONFLICT DO NOTHING;

INSERT INTO reddit_templates (company_id, client_id, title, description, search_type, keyword, max_results, date_range, created_by)
SELECT 
  c.id as company_id,
  cl.id as client_id,
  'Reddit Comments Analyse' as title,
  'Analyseer Reddit comments voor sentiment en insights' as description,
  'comments' as search_type,
  NULL as keyword,
  50 as max_results,
  'month' as date_range,
  c.created_by
FROM companies c
CROSS JOIN clients cl
WHERE cl.company_id = c.id
ON CONFLICT DO NOTHING;

INSERT INTO reddit_templates (company_id, client_id, title, description, search_type, keyword, max_results, date_range, created_by)
SELECT 
  c.id as company_id,
  cl.id as client_id,
  'Subreddit Analyse' as title,
  'Analyseer een hele subreddit voor trending topics' as description,
  'subreddit' as search_type,
  NULL as keyword,
  100 as max_results,
  'week' as date_range,
  c.created_by
FROM companies c
CROSS JOIN clients cl
WHERE cl.company_id = c.id
ON CONFLICT DO NOTHING;
