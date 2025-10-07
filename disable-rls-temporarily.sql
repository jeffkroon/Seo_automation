-- Temporarily disable RLS for companies and memberships to test registration
-- This is ONLY for testing - we'll re-enable it later

-- Disable RLS on companies
ALTER TABLE public.companies DISABLE ROW LEVEL SECURITY;

-- Disable RLS on memberships  
ALTER TABLE public.memberships DISABLE ROW LEVEL SECURITY;

-- This will allow anyone to read/write these tables temporarily
-- After testing, we'll re-enable RLS with proper policies
