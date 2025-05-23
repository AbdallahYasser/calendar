/*
  # Fix email preferences recursion with simplified policies
  
  1. Changes
    - Drop all existing policies
    - Create new simplified policies without recursive checks
    - Use basic RLS for user operations
*/

-- Drop all existing email preferences policies
DROP POLICY IF EXISTS "read_own" ON email_preferences;
DROP POLICY IF EXISTS "insert_own" ON email_preferences;
DROP POLICY IF EXISTS "update_own" ON email_preferences;
DROP POLICY IF EXISTS "admin_read_all" ON email_preferences;
DROP POLICY IF EXISTS "admin_update_all" ON email_preferences;

-- Create simplified policies
CREATE POLICY "Users can read own data"
  ON email_preferences
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own data"
  ON email_preferences
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own data"
  ON email_preferences
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);