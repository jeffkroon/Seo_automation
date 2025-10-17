-- Fix extra_headings column in schedules table to be consistent with other tables
-- Convert from TEXT to TEXT[] array type

-- Fix extra_headings column in schedules table to be consistent with other tables
-- Convert from TEXT to TEXT[] array type

-- Step 1: Remove the default value first (to avoid casting issues)
ALTER TABLE public.schedules 
ALTER COLUMN extra_headings DROP DEFAULT;

-- Step 2: Convert existing string data to array format
ALTER TABLE public.schedules 
ALTER COLUMN extra_headings TYPE text[] 
USING CASE 
  WHEN extra_headings IS NULL THEN '{}'::text[]
  WHEN extra_headings = '[]' THEN '{}'::text[]
  WHEN extra_headings = '' THEN '{}'::text[]
  WHEN extra_headings LIKE '[%]' THEN 
    -- Parse JSON-like array string: ["item1", "item2"] -> {'item1', 'item2'}
    string_to_array(
      replace(
        replace(
          replace(extra_headings, '[', ''),
          ']', ''
        ),
        '"', ''
      ),
      ','
    )::text[]
  ELSE 
    -- Single string value -> array with one element
    ARRAY[extra_headings]
END;

-- Step 3: Set default to empty array (consistent with other tables)
ALTER TABLE public.schedules 
ALTER COLUMN extra_headings SET DEFAULT '{}'::text[];

-- Step 4: Add comment for clarity
COMMENT ON COLUMN public.schedules.extra_headings IS 'Additional headings as text array, consistent with schedule_templates and generated_articles tables';
