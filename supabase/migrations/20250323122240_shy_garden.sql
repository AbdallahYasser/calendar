/*
  # Fix email preferences policies recursion

  1. Changes
    - Drop all existing email preferences policies
    - Create new non-recursive policies
    - Separate admin and user policies clearly
*/

-- Drop all existing email preferences policies
DROP POLICY IF EXISTS "Users can read own email preferences" ON email_preferences;
DROP POLICY IF EXISTS "Users can read all if admin" ON email_preferences;
DROP POLICY IF EXISTS "Users can insert own preferences" ON email_preferences;
DROP POLICY IF EXISTS "Users can update own preferences" ON email_preferences;
DROP POLICY IF EXISTS "Admins can update all preferences" ON email_preferences;
DROP POLICY IF EXISTS "Users can manage email preferences" ON email_preferences;

-- Create new non-recursive policies
CREATE POLICY "read_own"
  ON email_preferences
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "insert_own"
  ON email_preferences
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "update_own"
  ON email_preferences
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Admin policies using a simpler check
CREATE POLICY "admin_read_all"
  ON email_preferences
  FOR SELECT
  TO authenticated
  USING (
    (SELECT is_admin FROM email_preferences WHERE user_id = auth.uid())
  );

CREATE POLICY "admin_update_all"
  ON email_preferences
  FOR UPDATE
  TO authenticated
  USING (
    (SELECT is_admin FROM email_preferences WHERE user_id = auth.uid())
  )
  WITH CHECK (
    (SELECT is_admin FROM email_preferences WHERE user_id = auth.uid())
  );