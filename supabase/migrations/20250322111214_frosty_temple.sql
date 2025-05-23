/*
  # Add user authentication and user_id to day_logs

  1. Changes
    - Add user_id column to day_logs table
    - Update RLS policies to properly scope data to authenticated users
    
  2. Security
    - Modify RLS policies to use auth.uid()
*/

ALTER TABLE day_logs ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id);

-- Drop existing policies
DROP POLICY IF EXISTS "Users can read their own logs" ON day_logs;
DROP POLICY IF EXISTS "Users can insert their own logs" ON day_logs;
DROP POLICY IF EXISTS "Users can update their own logs" ON day_logs;
DROP POLICY IF EXISTS "Users can delete their own logs" ON day_logs;

-- Create new policies that properly check user_id
CREATE POLICY "Users can read their own logs"
  ON day_logs
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own logs"
  ON day_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own logs"
  ON day_logs
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own logs"
  ON day_logs
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());