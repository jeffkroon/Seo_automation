-- Create invitations table
CREATE TABLE IF NOT EXISTS public.invitations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  invited_by UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'admin')),
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '7 days'),
  used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;

-- Create policies for invitations
CREATE POLICY "Company owners can view their invitations" ON public.invitations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.memberships 
      WHERE memberships.company_id = invitations.company_id 
      AND memberships.user_id = auth.uid()
      AND memberships.role = 'owner'
    )
  );

CREATE POLICY "Company owners can create invitations" ON public.invitations
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.memberships 
      WHERE memberships.company_id = invitations.company_id 
      AND memberships.user_id = auth.uid()
      AND memberships.role = 'owner'
    )
  );

-- Anyone can read invitation by token (for registration)
CREATE POLICY "Anyone can read invitation by token" ON public.invitations
  FOR SELECT USING (true);

-- Anyone can mark invitation as used (for registration)
CREATE POLICY "Anyone can update invitation when used" ON public.invitations
  FOR UPDATE USING (true);
