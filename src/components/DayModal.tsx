import React, { useState } from 'react';
import { format } from 'date-fns';
import { X } from 'lucide-react';
import { useWorkStore } from '../store';
import { DayType } from '../types';

interface DayModalProps {
  date: Date;
  onClose: () => void;
}

export default function DayModal({ date, onClose }: DayModalProps) {
  const { dayData, setDayData, clearDay } = useWorkStore();
  const dateKey = format(date, 'yyyy-MM-dd');
  const currentData = dayData[dateKey];

  const [type, setType] = useState<DayType>(currentData?.type || 'office');
  const [extraHours, setExtraHours] = useState(
    currentData?.extraHours || 0
  );
  const [notes, setNotes] = useState(currentData?.notes || '');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      await setDayData(dateKey, { type, extraHours, notes });
      onClose();
    } catch (error: any) {
      setError(error.message || 'Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  const handleClear = async () => {
    try {
      setSaving(true);
      setError(null);
      await clearDay(dateKey);
      onClose();
    } catch (error: any) {
      setError(error.message || 'Failed to clear day');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">
            {format(date, 'MMMM d, yyyy')}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-md">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Day Type
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as DayType)}
              className="w-full border rounded-md p-2"
              disabled={saving}
            >
              <option value="office">Office</option>
              <option value="home">Home</option>
              <option value="holiday">Holiday</option>
              <option value="sick">Sick Leave</option>
              <option value="casual">Casual Leave</option>
              <option value="vacation">Vacation</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Extra Hours
            </label>
            <input
              type="number"
              value={extraHours}
              onChange={(e) => setExtraHours(Number(e.target.value))}
              min="0"
              step="0.5"
              className="w-full border rounded-md p-2"
              disabled={saving}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full border rounded-md p-2 h-24 resize-none"
              placeholder="Add notes for this day..."
              disabled={saving}
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <button
              onClick={handleClear}
              className="px-4 py-2 text-sm text-red-600 hover:text-red-700 disabled:opacity-50"
              disabled={saving}
            >
              Clear
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              disabled={saving}
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}