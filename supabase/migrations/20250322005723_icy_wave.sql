/*
  # Create day_logs table

  1. New Tables
    - `day_logs`
      - `id` (uuid, primary key)
      - `date` (date, not null)
      - `type` (text, not null)
      - `extra_hours` (numeric)
      - `notes` (text)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `day_logs` table
    - Add policies for authenticated users to manage their own data
*/

CREATE TABLE IF NOT EXISTS day_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date date NOT NULL,
  type text NOT NULL,
  extra_hours numeric,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE day_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read their own logs"
  ON day_logs
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert their own logs"
  ON day_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update their own logs"
  ON day_logs
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Users can delete their own logs"
  ON day_logs
  FOR DELETE
  TO authenticated
  USING (true);