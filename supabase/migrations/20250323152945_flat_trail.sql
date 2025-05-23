/*
  # Fix email preferences update functionality
  
  1. Changes
    - Drop existing policies
    - Create new simplified policies with proper update permissions
    - Add proper error handling for updates
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Users can read own data" ON email_preferences;
DROP POLICY IF EXISTS "Users can update own data" ON email_preferences;
DROP POLICY IF EXISTS "Users can insert own data" ON email_preferences;

-- Create new simplified policies
CREATE POLICY "Users can read own data"
  ON email_preferences
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can update own data"
  ON email_preferences
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own data"
  ON email_preferences
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Update the email_preferences table to ensure proper timestamps
ALTER TABLE email_preferences
ALTER COLUMN updated_at SET DEFAULT now(),
ALTER COLUMN updated_at SET NOT NULL;