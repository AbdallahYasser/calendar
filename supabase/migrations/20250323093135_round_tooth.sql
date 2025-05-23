/*
  # Add email status system tables and functions

  1. Changes to existing tables
    - Add `is_admin` column to email_preferences
    - Add indexes for performance

  2. New Functions
    - check_daily_status: Checks if a user has set their status for the day
    - send_status_email: Sends status selection email to a user
    - process_status_selection: Processes a user's status selection

  3. Security
    - Update RLS policies for admin access
*/

-- Add is_admin column to email_preferences
ALTER TABLE email_preferences 
ADD COLUMN IF NOT EXISTS is_admin boolean DEFAULT false;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_day_logs_date_user 
ON day_logs(date, user_id);

-- Function to check if user has set status for a specific date
CREATE OR REPLACE FUNCTION check_daily_status(
  p_user_id uuid,
  p_date date DEFAULT CURRENT_DATE
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM day_logs 
    WHERE user_id = p_user_id 
    AND date = p_date
  );
END;
$$;

-- Function to create a new status token
CREATE OR REPLACE FUNCTION create_status_token(
  p_user_id uuid,
  p_expires_in interval DEFAULT interval '24 hours'
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_token text;
BEGIN
  -- Generate a random token
  v_token := encode(gen_random_bytes(32), 'hex');
  
  -- Insert the token
  INSERT INTO status_tokens (
    user_id,
    token,
    expires_at
  ) VALUES (
    p_user_id,
    v_token,
    now() + p_expires_in
  );
  
  RETURN v_token;
END;
$$;

-- Function to validate and process status selection
CREATE OR REPLACE FUNCTION process_status_selection(
  p_token text,
  p_status text,
  p_date date DEFAULT CURRENT_DATE
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id uuid;
  v_token_record status_tokens%ROWTYPE;
BEGIN
  -- Get and validate token
  SELECT * INTO v_token_record
  FROM status_tokens
  WHERE token = p_token
  AND used = false
  AND expires_at > now();
  
  IF v_token_record IS NULL THEN
    RETURN false;
  END IF;
  
  -- Mark token as used
  UPDATE status_tokens
  SET used = true
  WHERE token = p_token;
  
  -- Insert or update status
  INSERT INTO day_logs (
    user_id,
    date,
    type
  ) VALUES (
    v_token_record.user_id,
    p_date,
    p_status
  )
  ON CONFLICT (user_id, date) 
  DO UPDATE SET type = EXCLUDED.type;
  
  RETURN true;
END;
$$;

-- Update email_preferences policies for admin access
DROP POLICY IF EXISTS "Users can manage their own email preferences" ON email_preferences;

CREATE POLICY "Users can manage email preferences"
  ON email_preferences
  FOR ALL
  TO authenticated
  USING (
    user_id = auth.uid() OR 
    EXISTS (
      SELECT 1 FROM email_preferences 
      WHERE user_id = auth.uid() AND is_admin = true
    )
  )
  WITH CHECK (
    user_id = auth.uid() OR 
    EXISTS (
      SELECT 1 FROM email_preferences 
      WHERE user_id = auth.uid() AND is_admin = true
    )
  );

-- Add unique constraint to prevent duplicate status entries
ALTER TABLE day_logs
ADD CONSTRAINT unique_user_date UNIQUE (user_id, date);