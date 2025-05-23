import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Send, Loader } from 'lucide-react';

interface EmailPreference {
  id: string;
  email_time: string;
  enabled: boolean;
  is_admin: boolean;
}

export default function EmailPreferences() {
  const [preferences, setPreferences] = useState<EmailPreference | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    loadPreferences();
  }, []);

  async function loadPreferences() {
    try {
      setLoading(true);
      setError(null);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('No user logged in');
      }

      const { data: existingPrefs, error: fetchError } = await supabase
        .from('email_preferences')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (fetchError) {
        throw fetchError;
      }

      if (!existingPrefs) {
        const { data: newPrefs, error: createError } = await supabase
          .from('email_preferences')
          .insert({
            user_id: user.id,
            email_time: '13:00',
            enabled: true,
            is_admin: false
          })
          .select()
          .single();

        if (createError) throw createError;
        setPreferences(newPrefs);
      } else {
        setPreferences(existingPrefs);
      }
    } catch (error: any) {
      console.error('Error loading preferences:', error);
      setError(error.message || 'Failed to load preferences');
    } finally {
      setLoading(false);
    }
  }

  async function savePreferences(updates: Partial<EmailPreference>) {
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user logged in');

      const { error } = await supabase
        .from('email_preferences')
        .update(updates)
        .eq('user_id', user.id);

      if (error) throw error;
      
      setSuccess('Preferences saved successfully');
      setPreferences(prev => prev ? { ...prev, ...updates } : null);
    } catch (error: any) {
      console.error('Error saving preferences:', error);
      setError(error.message || 'Failed to save preferences');
    } finally {
      setSaving(false);
    }
  }

  async function sendManualEmail() {
    try {
      setSending(true);
      setError(null);
      setSuccess(null);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user logged in');

      console.log('Fetching all users with enabled email preferences...');
      const { data: enabledPrefs, error: prefsError } = await supabase
        .from('email_preferences')
        .select('user_id')
        .eq('enabled', true);

      if (prefsError) throw prefsError;
      
      if (!enabledPrefs || enabledPrefs.length === 0) {
        console.log('No users found with enabled email preferences');
        setError('No users found with enabled email preferences');
        return;
      }

      console.log(`Found ${enabledPrefs.length} users with enabled email preferences`);

      let successCount = 0;
      let errorCount = 0;
      
      for (const pref of enabledPrefs) {
        try {
          console.log(`Sending email for user: ${pref.user_id}`);
          const response = await fetch('/api/send-email', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ userId: pref.user_id }),
          });

          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }

          let responseData;
          const responseText = await response.text();
          try {
            responseData = responseText ? JSON.parse(responseText) : {};
          } catch (e) {
            console.error('Error parsing response:', e);
            throw new Error('Invalid response from server');
          }

          if (responseData.error) {
            throw new Error(responseData.error);
          }

          successCount++;
        } catch (error: any) {
          console.error(`Error sending email to user ${pref.user_id}:`, error);
          errorCount++;
        }
      }

      if (successCount === 0 && errorCount === 0) {
        setError('No emails were sent - no eligible recipients found');
      } else if (errorCount > 0) {
        setError(`Sent ${successCount} emails, failed to send ${errorCount} emails`);
      } else {
        setSuccess(`Successfully sent ${successCount} status update emails`);
      }
    } catch (error: any) {
      console.error('Error sending status:', error);
      setError(error.message || 'Failed to send status updates');
    } finally {
      setSending(false);
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-center space-x-2">
          <Loader className="w-5 h-5 animate-spin text-blue-600" />
          <span>Loading preferences...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-bold mb-6">Email Preferences</h2>
      
      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-md">
          {error}
        </div>
      )}
      
      {success && (
        <div className="mb-4 p-3 bg-green-50 text-green-600 rounded-md">
          {success}
        </div>
      )}

      <div className="space-y-6">
        <div>
          <label className="flex items-center space-x-3">
            <input
              type="checkbox"
              checked={preferences?.enabled ?? true}
              onChange={(e) => savePreferences({ enabled: e.target.checked })}
              disabled={saving}
              className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
            />
            <span>Enable daily status emails</span>
          </label>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Preferred Email Time
          </label>
          <input
            type="time"
            value={preferences?.email_time ?? '13:00'}
            onChange={(e) => savePreferences({ email_time: e.target.value })}
            disabled={saving}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
          />
        </div>

        {preferences?.is_admin && (
          <div className="pt-4 border-t">
            <h3 className="text-lg font-semibold mb-4">Admin Controls</h3>
            <div className="space-y-4">
              <button
                onClick={sendManualEmail}
                disabled={sending}
                className="flex items-center gap-2 bg-blue-600 text-white rounded-md py-2 px-4 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 w-full justify-center"
              >
                {sending ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Send Manual Status Update
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}