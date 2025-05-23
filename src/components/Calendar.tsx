import React from 'react';
import {
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  format,
  isToday,
  isSameMonth,
  addMonths,
  subMonths,
  isSunday,
  isMonday,
  isTuesday,
  isWednesday,
  isThursday,
  getYear,
  setMonth,
  setYear,
} from 'date-fns';
import { ChevronLeft, ChevronRight, Trash2, RotateCcw, Calendar as CalendarIcon } from 'lucide-react';
import { useWorkStore } from '../store';
import DayCell from './DayCell';
import DayModal from './DayModal';

export default function Calendar() {
  const { selectedDate, setSelectedDate, resetMonth, restoreData, dayData, previousDayData } = useWorkStore();
  const [showModal, setShowModal] = React.useState(false);
  const [selectedDay, setSelectedDay] = React.useState<Date | null>(null);

  const monthStart = startOfMonth(selectedDate);
  const monthEnd = endOfMonth(selectedDate);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const isWorkingDay = (date: Date) =>
    isMonday(date) ||
    isTuesday(date) ||
    isWednesday(date) ||
    isThursday(date) ||
    isSunday(date);

  const workingDays = days.filter(isWorkingDay).length;
  const officeDays = workingDays * 0.6;

  // Calculate total logged days for current month
  const loggedDays = Object.entries(dayData).reduce((acc, [dateKey, data]) => {
    const date = new Date(dateKey);
    if (format(date, 'yyyy-MM') === format(selectedDate, 'yyyy-MM')) {
      if (['office', 'holiday', 'sick', 'casual', 'vacation'].includes(data.type)) {
        return acc + 1;
      }
    }
    return acc;
  }, 0);

  const completionPercentage = (loggedDays / officeDays) * 100;
  const remainingDays = officeDays - loggedDays;

  const handleMonthChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newDate = setMonth(selectedDate, parseInt(e.target.value));
    setSelectedDate(newDate);
  };

  const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newDate = setYear(selectedDate, parseInt(e.target.value));
    setSelectedDate(newDate);
  };

  const handleDayClick = (day: Date) => {
    setSelectedDay(day);
    setShowModal(true);
  };

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const years = Array.from({ length: 10 }, (_, i) => getYear(new Date()) - 2 + i);

  const ProgressBar = ({ percentage, remainingDays }: { percentage: number, remainingDays: number }) => {
    const roundedPercentage = Math.round(percentage);
    return (
      <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-xl shadow-xl">
        <div className="space-y-4">
          <div className="flex items-center justify-between text-blue-600 font-medium">
            <span>Progress ({roundedPercentage}%)</span>
            <span>{remainingDays.toFixed(1)} days remaining</span>
          </div>
          <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-1000 ease-in-out"
              style={{ width: `${Math.min(roundedPercentage, 100)}%` }}
            />
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden w-full max-w-[calc(100vw-1rem)] md:max-w-none mx-auto">
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-4 text-white">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <CalendarIcon className="w-5 h-5" />
            <h2 className="text-xl font-bold">Calendar</h2>
          </div>
          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            <select
              value={selectedDate.getMonth()}
              onChange={handleMonthChange}
              className="px-3 py-1.5 rounded-lg bg-white/10 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-white/50 text-sm"
            >
              {months.map((month, index) => (
                <option key={month} value={index} className="text-gray-900">{month}</option>
              ))}
            </select>
            <select
              value={selectedDate.getFullYear()}
              onChange={handleYearChange}
              className="px-3 py-1.5 rounded-lg bg-white/10 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-white/50 text-sm"
            >
              {years.map((year) => (
                <option key={year} value={year} className="text-gray-900">{year}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2 w-full md:w-auto justify-between md:justify-end">
            {previousDayData && (
              <button
                onClick={restoreData}
                className="px-3 py-1.5 text-sm bg-white/10 hover:bg-white/20 rounded-lg flex items-center gap-2 transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
                Restore
              </button>
            )}
            <button
              onClick={resetMonth}
              className="px-3 py-1.5 text-sm bg-white/10 hover:bg-white/20 rounded-lg flex items-center gap-2 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Clear Month
            </button>
          </div>
        </div>
      </div>

      <div className="px-1 md:px-4 py-4">
        <div className="grid grid-cols-7 gap-1 mb-2">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
            <div
              key={day}
              className="text-center font-medium text-gray-600 py-1 text-xs"
            >
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: monthStart.getDay() }).map((_, index) => (
            <div key={`empty-${index}`} className="h-16" />
          ))}
          {days.map((day) => (
            <DayCell
              key={format(day, 'yyyy-MM-dd')}
              date={day}
              isWorkingDay={isWorkingDay(day)}
              onClick={() => handleDayClick(day)}
            />
          ))}
        </div>

        <div className="mt-4 grid grid-cols-2 gap-4">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-3 rounded-lg">
            <h3 className="text-sm font-medium text-blue-900 mb-1">Required Office Days (60%)</h3>
            <p className="text-xl font-bold text-blue-700">{officeDays.toFixed(1)} days</p>
          </div>
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-3 rounded-lg">
            <h3 className="text-sm font-medium text-purple-900 mb-1">Total Logged Days</h3>
            <p className="text-xl font-bold text-purple-700">{loggedDays} days</p>
          </div>
        </div>

        <div className="mt-4">
          <ProgressBar 
            percentage={completionPercentage} 
            remainingDays={remainingDays}
          />
        </div>
      </div>

      {showModal && selectedDay && (
        <DayModal
          date={selectedDay}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
}