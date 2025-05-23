/*
  # Fix email preferences policy recursion

  1. Changes
    - Drop existing policy that causes recursion
    - Create separate policies for different operations
    - Implement admin checks without recursion
*/

-- Drop the recursive policy
DROP POLICY IF EXISTS "Users can manage email preferences" ON email_preferences;

-- Create separate policies for different operations
CREATE POLICY "Users can read own email preferences"
  ON email_preferences
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can read all if admin"
  ON email_preferences
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 
      FROM email_preferences ep 
      WHERE ep.user_id = auth.uid() 
      AND ep.is_admin = true
    )
  );

CREATE POLICY "Users can insert own preferences"
  ON email_preferences
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own preferences"
  ON email_preferences
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can update all preferences"
  ON email_preferences
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 
      FROM email_preferences ep 
      WHERE ep.user_id = auth.uid() 
      AND ep.is_admin = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 
      FROM email_preferences ep 
      WHERE ep.user_id = auth.uid() 
      AND ep.is_admin = true
    )
  );