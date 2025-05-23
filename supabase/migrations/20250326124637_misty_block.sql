/*
  # Remove email preferences functionality

  1. Changes
    - Drop email_preferences table
    - Drop status_tokens table
    - Drop related functions and policies
*/

-- Drop tables
DROP TABLE IF EXISTS email_preferences CASCADE;
DROP TABLE IF EXISTS status_tokens CASCADE;

-- Drop functions
DROP FUNCTION IF EXISTS check_daily_status(uuid, date);
DROP FUNCTION IF EXISTS create_status_token(uuid, interval);
DROP FUNCTION IF EXISTS process_status_selection(text, text, date);
DROP FUNCTION IF EXISTS cleanup_expired_tokens();