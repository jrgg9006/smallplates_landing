# 🚚 MIGRATION: Shipping Addresses Management

## 📋 **OVERVIEW**
This migration creates the shipping addresses table for users to manage their delivery addresses for cookbook orders.

## 🚀 **MANUAL SQL MIGRATION REQUIRED**

**Execute the following SQL commands in your Supabase SQL Editor:**

```sql
-- Create shipping_addresses table
CREATE TABLE shipping_addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recipient_name TEXT NOT NULL,
  street_address TEXT NOT NULL,
  apartment_unit TEXT,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  postal_code TEXT NOT NULL,
  country TEXT NOT NULL DEFAULT 'United States',
  phone_number TEXT,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_shipping_addresses_user_id ON shipping_addresses(user_id);
CREATE INDEX IF NOT EXISTS idx_shipping_addresses_default ON shipping_addresses(user_id, is_default);

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_shipping_addresses_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_shipping_addresses_updated_at
  BEFORE UPDATE ON shipping_addresses
  FOR EACH ROW
  EXECUTE FUNCTION update_shipping_addresses_updated_at();

-- Add constraint to ensure only one default address per user
CREATE UNIQUE INDEX idx_shipping_addresses_user_default 
ON shipping_addresses(user_id) 
WHERE is_default = true;

-- Enable Row Level Security (RLS)
ALTER TABLE shipping_addresses ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only access their own addresses
CREATE POLICY "Users can view their own shipping addresses"
ON shipping_addresses
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own shipping addresses"
ON shipping_addresses
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own shipping addresses"
ON shipping_addresses
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own shipping addresses"
ON shipping_addresses
FOR DELETE
USING (auth.uid() = user_id);

-- Add constraints for data validation
ALTER TABLE shipping_addresses 
ADD CONSTRAINT valid_postal_code 
CHECK (postal_code ~ '^[0-9]{5}(-[0-9]{4})?$' OR postal_code ~ '^[A-Z][0-9][A-Z] [0-9][A-Z][0-9]$'),
ADD CONSTRAINT valid_recipient_name_length 
CHECK (char_length(recipient_name) >= 2 AND char_length(recipient_name) <= 100),
ADD CONSTRAINT valid_street_address_length 
CHECK (char_length(street_address) >= 5 AND char_length(street_address) <= 200);
```

## 🔧 **VERIFICATION COMMANDS**

**After running the migration, verify with:**

```sql
-- Check if table was created successfully
\d shipping_addresses

-- Verify columns exist
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'shipping_addresses' 
ORDER BY ordinal_position;

-- Check indexes
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename = 'shipping_addresses';

-- Verify RLS policies
SELECT policyname, cmd, roles, qual, with_check
FROM pg_policies 
WHERE tablename = 'shipping_addresses';

-- Test the unique constraint for default addresses
SELECT schemaname, tablename, attname, n_distinct, correlation
FROM pg_stats 
WHERE tablename = 'shipping_addresses';
```

## ✅ **EXPECTED RESULTS**

After successful migration, the `shipping_addresses` table should have:

| Column Name | Type | Nullable | Purpose |
|-------------|------|----------|---------|
| `id` | UUID | NO | Primary key |
| `user_id` | UUID | NO | Foreign key to auth.users |
| `recipient_name` | TEXT | NO | Full name for delivery |
| `street_address` | TEXT | NO | Street address |
| `apartment_unit` | TEXT | YES | Apartment/unit number |
| `city` | TEXT | NO | City |
| `state` | TEXT | NO | State/province |
| `postal_code` | TEXT | NO | ZIP/postal code |
| `country` | TEXT | NO | Country (default: United States) |
| `phone_number` | TEXT | YES | Contact phone for delivery |
| `is_default` | BOOLEAN | NO | Primary address flag |
| `created_at` | TIMESTAMP WITH TIME ZONE | NO | Creation timestamp |
| `updated_at` | TIMESTAMP WITH TIME ZONE | NO | Last update timestamp |

## 🔒 **SECURITY FEATURES**

- ✅ **RLS Policies**: Users can only access their own addresses
- ✅ **Unique Default**: Only one default address per user
- ✅ **Data Validation**: Postal code and length constraints
- ✅ **Cascade Delete**: Addresses deleted when user is deleted
- ✅ **Auto Timestamps**: Created/updated timestamps managed automatically

## 🚨 **ROLLBACK (if needed)**

```sql
-- Remove the table and all associated objects (CAUTION: This will delete data)
DROP TABLE IF EXISTS shipping_addresses CASCADE;
DROP FUNCTION IF EXISTS update_shipping_addresses_updated_at() CASCADE;
```

---

**Status:** ⏳ **PENDING MANUAL EXECUTION**  
**Created:** 2025-10-28  
**Required for:** Shipping Address Management Feature