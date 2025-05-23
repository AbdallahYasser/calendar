import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { DayType } from '../types';
import { Loader, Briefcase, Home, PartyPopper, Thermometer, Coffee, Palmtree } from 'lucide-react';
import { useWorkStore } from '../store';

export default function QuickSubmit() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const syncData = useWorkStore((state) => state.syncData);

  const handleSubmit = async (type: DayType) => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(false);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Please sign in to submit day type');
      }

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/day-type`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ type }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || data.details || 'Failed to submit day type');
      }

      // Sync data instead of reloading the page
      await syncData();
      
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (error: any) {
      console.error('Submit error:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
      <h2 className="text-xl font-bold mb-4">Quick Submit Today's Status</h2>
      
      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-md">
          {error}
        </div>
      )}
      
      {success && (
        <div className="mb-4 p-3 bg-green-50 text-green-600 rounded-md">
          Status updated successfully!
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
        <button
          onClick={() => handleSubmit('office')}
          disabled={loading}
          className="p-3 flex items-center justify-center gap-2 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg transition-colors disabled:opacity-50"
        >
          {loading ? (
            <Loader className="w-5 h-5 animate-spin" />
          ) : (
            <>
              <Briefcase className="w-4 h-4" />
              <span>Office</span>
            </>
          )}
        </button>
        <button
          onClick={() => handleSubmit('home')}
          disabled={loading}
          className="p-3 flex items-center justify-center gap-2 bg-green-50 hover:bg-green-100 text-green-600 rounded-lg transition-colors disabled:opacity-50"
        >
          {loading ? (
            <Loader className="w-5 h-5 animate-spin" />
          ) : (
            <>
              <Home className="w-4 h-4" />
              <span>Home</span>
            </>
          )}
        </button>
        <button
          onClick={() => handleSubmit('sick')}
          disabled={loading}
          className="p-3 flex items-center justify-center gap-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-colors disabled:opacity-50"
        >
          {loading ? (
            <Loader className="w-5 h-5 animate-spin" />
          ) : (
            <>
              <Thermometer className="w-4 h-4" />
              <span>Sick</span>
            </>
          )}
        </button>
        <button
          onClick={() => handleSubmit('casual')}
          disabled={loading}
          className="p-3 flex items-center justify-center gap-2 bg-amber-50 hover:bg-amber-100 text-amber-600 rounded-lg transition-colors disabled:opacity-50"
        >
          {loading ? (
            <Loader className="w-5 h-5 animate-spin" />
          ) : (
            <>
              <Coffee className="w-4 h-4" />
              <span>Casual</span>
            </>
          )}
        </button>
        <button
          onClick={() => handleSubmit('vacation')}
          disabled={loading}
          className="p-3 flex items-center justify-center gap-2 bg-orange-50 hover:bg-orange-100 text-orange-600 rounded-lg transition-colors disabled:opacity-50"
        >
          {loading ? (
            <Loader className="w-5 h-5 animate-spin" />
          ) : (
            <>
              <Palmtree className="w-4 h-4" />
              <span>Vacation</span>
            </>
          )}
        </button>
        <button
          onClick={() => handleSubmit('holiday')}
          disabled={loading}
          className="p-3 flex items-center justify-center gap-2 bg-purple-50 hover:bg-purple-100 text-purple-600 rounded-lg transition-colors disabled:opacity-50"
        >
          {loading ? (
            <Loader className="w-5 h-5 animate-spin" />
          ) : (
            <>
              <PartyPopper className="w-4 h-4" />
              <span>Holiday</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}