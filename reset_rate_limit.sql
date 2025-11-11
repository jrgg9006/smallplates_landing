-- Reset rate limit for testing - Delete invitation records for specific email
-- Run this in Supabase SQL Editor to allow more invitations

DELETE FROM public.waitlist_invitations 
WHERE email = 'jrgg9@hotmail.com';

-- Optional: Check remaining invitations
SELECT * FROM public.waitlist_invitations 
WHERE email = 'jrgg9@hotmail.com';