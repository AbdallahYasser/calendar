import React from 'react';
import { format, isToday, isFriday, isSaturday } from 'date-fns';
import { useWorkStore } from '../store';
import { Briefcase, Home, PartyPopper, Thermometer, Coffee, Palmtree as PalmTree, Clock, Moon } from 'lucide-react';

interface DayCellProps {
  date: Date;
  isWorkingDay: boolean;
  onClick: () => void;
}

export default function DayCell({ date, isWorkingDay, onClick }: DayCellProps) {
  const { dayData } = useWorkStore();
  const dateKey = format(date, 'yyyy-MM-dd');
  const dayInfo = dayData[dateKey];

  const getTypeIcon = () => {
    switch (dayInfo?.type) {
      case 'office':
        return <Briefcase className="w-3 h-3 text-blue-600" />;
      case 'home':
        return <Home className="w-3 h-3 text-green-600" />;
      case 'holiday':
        return <PartyPopper className="w-3 h-3 text-purple-600" />;
      case 'sick':
        return <Thermometer className="w-3 h-3 text-red-600" />;
      case 'casual':
        return <Coffee className="w-3 h-3 text-amber-600" />;
      case 'vacation':
        return <PalmTree className="w-3 h-3 text-orange-600" />;
      case 'night':
        return <Moon className="w-3 h-3 text-indigo-600" />;
      default:
        return null;
    }
  };

  const getBorderColor = () => {
    if (!dayInfo?.notes) return '';
    
    switch (dayInfo.type) {
      case 'office':
        return 'ring-2 ring-blue-300';
      case 'home':
        return 'ring-2 ring-green-300';
      case 'holiday':
        return 'ring-2 ring-purple-300';
      case 'sick':
        return 'ring-2 ring-red-300';
      case 'casual':
        return 'ring-2 ring-amber-300';
      case 'vacation':
        return 'ring-2 ring-orange-300';
      case 'night':
        return 'ring-2 ring-indigo-300';
      default:
        return '';
    }
  };

  const getBackgroundColor = () => {
    if (isFriday(date) || isSaturday(date)) {
      return 'bg-gray-100 hover:bg-gray-200';
    }
    
    if (!isWorkingDay) return 'bg-gray-50 hover:bg-gray-100';
    if (!dayInfo) return 'bg-white hover:bg-gray-50';
    
    switch (dayInfo.type) {
      case 'office':
        return 'bg-blue-50 hover:bg-blue-100';
      case 'home':
        return 'bg-green-50 hover:bg-green-100';
      case 'holiday':
        return 'bg-purple-50 hover:bg-purple-100';
      case 'sick':
        return 'bg-red-50 hover:bg-red-100';
      case 'casual':
        return 'bg-amber-50 hover:bg-amber-100';
      case 'vacation':
        return 'bg-orange-50 hover:bg-orange-100';
      case 'night':
        return 'bg-indigo-50 hover:bg-indigo-100';
      default:
        return 'bg-white hover:bg-gray-50';
    }
  };

  return (
    <div
      onClick={onClick}
      className={`h-16 md:h-20 px-0.5 md:px-1.5 pt-2 md:pt-2.5 pb-1.5 rounded-lg border transition-all duration-200 cursor-pointer ${getBackgroundColor()} ${getBorderColor()}`}
    >
      <div className="flex items-start justify-between mb-1.5 px-1">
        <span
          className={`text-xs font-medium ${
            isToday(date) ? 'text-blue-600 bg-blue-100 px-1.5 py-0.5 rounded-full' : 'text-gray-700'
          }`}
        >
          {format(date, 'd')}
        </span>
        {getTypeIcon()}
      </div>
      {dayInfo && (
        <div className="space-y-0.5 px-1">
          <div className="text-[9px] md:text-[11px] font-medium capitalize leading-tight break-words hyphens-auto">
            {dayInfo.type}
          </div>
          {dayInfo.extraHours > 0 && (
            <div className="flex items-center gap-0.5 text-[10px] text-gray-600">
              <Clock className="w-2.5 h-2.5" />
              +{dayInfo.extraHours}h
            </div>
          )}
          {dayInfo.notes && (
            <div className="hidden md:block text-[10px] text-gray-600 text-right line-clamp-1 mt-0.5" title={dayInfo.notes}>
              {dayInfo.notes}
            </div>
          )}
        </div>
      )}
    </div>
  );
}