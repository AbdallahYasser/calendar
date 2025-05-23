/*
  # Fix email preferences RLS policies
  
  1. Changes
    - Drop existing policies with incorrect column references
    - Create new policies using correct user_id column
*/

-- Drop existing policies with incorrect column references
DROP POLICY IF EXISTS "Users can read own data" ON email_preferences;
DROP POLICY IF EXISTS "Users can update own data" ON email_preferences;
DROP POLICY IF EXISTS "Users can insert own data" ON email_preferences;

-- Create new policies with correct column references
CREATE POLICY "Users can read own data"
  ON email_preferences
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can update own data"
  ON email_preferences
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can insert own data"
  ON email_preferences
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());