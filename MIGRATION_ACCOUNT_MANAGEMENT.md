# 🗃️ MIGRATION: Account Management

## 📋 **OVERVIEW**
This migration adds support for account management features including email change verification and enhanced security.

## 🚀 **MANUAL SQL MIGRATION REQUIRED**

**Execute the following SQL commands in your Supabase SQL Editor:**

```sql
-- Add fields for email change verification
ALTER TABLE profiles 
ADD COLUMN pending_email TEXT,
ADD COLUMN email_verification_token TEXT,
ADD COLUMN email_verification_expires_at TIMESTAMP WITH TIME ZONE;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_profiles_pending_email ON profiles(pending_email);
CREATE INDEX IF NOT EXISTS idx_profiles_verification_token ON profiles(email_verification_token);

-- Add RLS policies for the new fields
-- (The existing RLS policies should already cover these fields, but verify if needed)

-- Optional: Add constraint to ensure pending_email is valid email format
ALTER TABLE profiles 
ADD CONSTRAINT valid_pending_email 
CHECK (pending_email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' OR pending_email IS NULL);
```

## 🔧 **VERIFICATION COMMANDS**

**After running the migration, verify with:**

```sql
-- Check if columns were added successfully
\d profiles

-- Verify the new columns exist
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND column_name IN ('pending_email', 'email_verification_token', 'email_verification_expires_at');

-- Check indexes
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename = 'profiles' 
AND indexname LIKE '%pending_email%' OR indexname LIKE '%verification_token%';
```

## ✅ **EXPECTED RESULTS**

After successful migration, the `profiles` table should have these additional columns:

| Column Name | Type | Nullable | Purpose |
|-------------|------|----------|---------|
| `pending_email` | TEXT | YES | Stores new email during verification process |
| `email_verification_token` | TEXT | YES | Token for email verification |
| `email_verification_expires_at` | TIMESTAMP WITH TIME ZONE | YES | Expiration time for verification |

## 🔒 **SECURITY NOTES**

- ✅ RLS policies should automatically cover new fields
- ✅ Email verification tokens are temporary and expire
- ✅ Only authenticated users can access their own verification data
- ✅ Pending emails are validated with regex constraint

## 🚨 **ROLLBACK (if needed)**

```sql
-- Remove the added columns (CAUTION: This will delete data)
ALTER TABLE profiles 
DROP COLUMN IF EXISTS pending_email,
DROP COLUMN IF EXISTS email_verification_token,
DROP COLUMN IF EXISTS email_verification_expires_at;

-- Remove indexes
DROP INDEX IF EXISTS idx_profiles_pending_email;
DROP INDEX IF EXISTS idx_profiles_verification_token;

-- Remove constraint
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS valid_pending_email;
```

---

**Status:** ⏳ **PENDING MANUAL EXECUTION**  
**Created:** 2025-10-28  
**Required for:** Account Management Phase 2