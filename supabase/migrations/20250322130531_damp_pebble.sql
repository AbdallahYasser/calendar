/*
  # Add vacation days tracking

  1. New Tables
    - `vacation_allowance`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `year` (integer, not null)
      - `days_allowed` (integer, not null, default 21)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `vacation_allowance` table
    - Add policies for authenticated users to manage their own data
*/

CREATE TABLE IF NOT EXISTS vacation_allowance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  year integer NOT NULL,
  days_allowed integer NOT NULL DEFAULT 21,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, year)
);

ALTER TABLE vacation_allowance ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read their own vacation allowance"
  ON vacation_allowance
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can update their own vacation allowance"
  ON vacation_allowance
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can insert their own vacation allowance"
  ON vacation_allowance
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());