/*
  # Add email preferences and status tokens

  1. New Tables
    - `email_preferences`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `email_time` (time, default 13:00)
      - `enabled` (boolean, default true)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `status_tokens`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `token` (text, unique)
      - `expires_at` (timestamptz)
      - `created_at` (timestamptz)
      - `used` (boolean, default false)

  2. Security
    - Enable RLS on both tables
    - Add policies for authenticated users
*/

-- Email preferences table
CREATE TABLE IF NOT EXISTS email_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  email_time time DEFAULT '13:00:00',
  enabled boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE email_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own email preferences"
  ON email_preferences
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Status tokens table
CREATE TABLE IF NOT EXISTS status_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  token text UNIQUE NOT NULL,
  expires_at timestamptz NOT NULL,
  created_at timestamptz DEFAULT now(),
  used boolean DEFAULT false
);

ALTER TABLE status_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own tokens"
  ON status_tokens
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Function to clean up expired tokens
CREATE OR REPLACE FUNCTION cleanup_expired_tokens()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  DELETE FROM status_tokens
  WHERE expires_at < now() OR used = true;
END;
$$;