/*
  # Clean up unused indexes and constraints
  
  1. Changes
    - Remove unused indexes related to email functionality
*/

-- Drop unused indexes
DROP INDEX IF EXISTS idx_day_logs_date_user;

-- Recreate necessary indexes with better names
CREATE INDEX IF NOT EXISTS idx_day_logs_user_date 
ON day_logs(user_id, date);