import React from 'react';
import {
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  format,
  startOfQuarter,
  endOfQuarter,
  isMonday,
  isTuesday,
  isWednesday,
  isThursday,
  isSunday,
  getYear,
} from 'date-fns';
import { ChevronDown, ChevronUp, Trash2, Plus, BarChart3, Clock, Calendar, Users, Briefcase, Home as HomeIcon, PartyPopper, Thermometer, Coffee, Palmtree as PalmTree, Moon } from 'lucide-react';
import { useWorkStore } from '../store';

export default function Stats() {
  const { selectedDate, dayData, vacationDays, resetAll, previousDayData, restoreData, setVacationDays } = useWorkStore();
  const [monthlyExpanded, setMonthlyExpanded] = React.useState(false);
  const [quarterlyExpanded, setQuarterlyExpanded] = React.useState(false);
  const [showConfirmation, setShowConfirmation] = React.useState(false);
  const [showVacationModal, setShowVacationModal] = React.useState(false);
  const [selectedYear, setSelectedYear] = React.useState(getYear(new Date()));
  const [extraDays, setExtraDays] = React.useState(0);
  const [isClearing, setIsClearing] = React.useState(false);
  const [isClearingMonth, setIsClearingMonth] = React.useState(false);

  const calculateStats = (start: Date, end: Date) => {
    const days = eachDayOfInterval({ start, end });
    const workingDays = days.filter(
      (date) =>
        isMonday(date) ||
        isTuesday(date) ||
        isWednesday(date) ||
        isThursday(date) ||
        isSunday(date)
    ).length;

    let totalExtraHours = 0;
    let officeDaysCount = 0;
    let homeDaysCount = 0;
    let holidayCount = 0;
    let sickLeaveCount = 0;
    let casualLeaveCount = 0;
    let vacationCount = 0;
    let nightCount = 0;
    let totalLoggedDays = 0;

    Object.entries(dayData).forEach(([dateKey, dayInfo]) => {
      const date = new Date(dateKey);
      if (date >= start && date <= end) {
        if (dayInfo.extraHours) totalExtraHours += dayInfo.extraHours;
        
        switch (dayInfo.type) {
          case 'office':
            officeDaysCount++;
            totalLoggedDays++;
            break;
          case 'home':
            homeDaysCount++;
            break;
          case 'holiday':
            holidayCount++;
            break;
          case 'sick':
            sickLeaveCount++;
            totalLoggedDays++;
            break;
          case 'casual':
            casualLeaveCount++;
            totalLoggedDays++;
            break;
          case 'vacation':
            vacationCount++;
            totalLoggedDays++;
            break;
          case 'night':
            nightCount++;
            totalLoggedDays++;
            break;
        }
      }
    });

    const officeDaysRequired = (workingDays - holidayCount) * 0.6;
    const completionPercentage = (totalLoggedDays / officeDaysRequired) * 100;
    const remainingDays = officeDaysRequired - totalLoggedDays;

    return {
      workingDays,
      officeDaysRequired,
      totalExtraHours,
      officeDaysCount,
      homeDaysCount,
      holidayCount,
      sickLeaveCount,
      casualLeaveCount,
      vacationCount,
      nightCount,
      totalLoggedDays,
      completionPercentage: Math.min(completionPercentage, 100),
      remainingDays,
    };
  };

  const monthStats = calculateStats(
    startOfMonth(selectedDate),
    endOfMonth(selectedDate)
  );

  const quarterStats = calculateStats(
    startOfQuarter(selectedDate),
    endOfQuarter(selectedDate)
  );

  const currentYear = getYear(selectedDate);
  const totalVacationUsed = Object.entries(dayData).reduce((acc, [date, day]) => {
    if ((day.type === 'vacation' || day.type === 'casual') && getYear(new Date(date)) === currentYear) {
      return acc + 1;
    }
    return acc;
  }, 0);

  const currentYearVacationDays = vacationDays[currentYear] || 21;
  const baseVacationDays = 21;
  const extraVacationDays = (vacationDays[currentYear] || 21) - baseVacationDays;

  const handleResetAll = async () => {
    try {
      setIsClearing(true);
      await resetAll();
      setVacationDays(currentYear, baseVacationDays);
      setShowConfirmation(false);
    } catch (error) {
      console.error('Error clearing all data:', error);
    } finally {
      setIsClearing(false);
    }
  };

  const handleResetMonth = async () => {
    try {
      setIsClearingMonth(true);
      await resetMonth();
    } catch (error) {
      console.error('Error clearing month:', error);
    } finally {
      setIsClearingMonth(false);
    }
  };

  const ProgressBar = ({ percentage, remainingDays, className = "" }: { percentage: number, remainingDays: number, className?: string }) => {
    const roundedPercentage = Math.round(percentage);
    return (
      <div className={`bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-xl shadow-xl ${className}`}>
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

  const StatBlock = ({ title, icon: Icon, expanded, onToggle, children }: any) => (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full p-6 flex items-center justify-between bg-gradient-to-r from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-150 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white rounded-lg shadow-sm">
            <Icon className="w-5 h-5 text-blue-600" />
          </div>
          <h3 className="text-xl font-bold text-gray-900">{title}</h3>
        </div>
        {expanded ? (
          <ChevronUp className="w-5 h-5 text-gray-600" />
        ) : (
          <ChevronDown className="w-5 h-5 text-gray-600" />
        )}
      </button>
      {expanded && <div className="p-6">{children}</div>}
    </div>
  );

  const StatCard = ({ icon: Icon, title, value, color, unit = "" }: any) => (
    <div className={`bg-${color}-50 p-4 rounded-xl flex items-center gap-4`}>
      <div className={`p-3 bg-${color}-100 rounded-lg`}>
        <Icon className={`w-5 h-5 text-${color}-600`} />
      </div>
      <div>
        <h4 className="text-sm font-medium text-gray-600">{title}</h4>
        <p className={`text-xl font-bold text-${color}-700`}>{value}{unit}</p>
      </div>
    </div>
  );

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex justify-end">
        <button
          onClick={() => setShowVacationModal(true)}
          className="px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 flex items-center gap-2 transition-colors shadow-lg shadow-blue-100"
        >
          <Plus className="w-4 h-4" />
          Manage Vacation Days
        </button>
      </div>

      <StatBlock
        title="Monthly Statistics"
        icon={Calendar}
        expanded={monthlyExpanded}
        onToggle={() => setMonthlyExpanded(!monthlyExpanded)}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <StatCard
            icon={Briefcase}
            title="Office Days"
            value={monthStats.officeDaysCount}
            color="blue"
          />
          <StatCard
            icon={HomeIcon}
            title="Home Days"
            value={monthStats.homeDaysCount}
            color="green"
          />
          <StatCard
            icon={PartyPopper}
            title="Holidays"
            value={monthStats.holidayCount}
            color="purple"
          />
          <StatCard
            icon={Thermometer}
            title="Sick Leave"
            value={monthStats.sickLeaveCount}
            color="red"
          />
          <StatCard
            icon={Coffee}
            title="Casual Leave"
            value={monthStats.casualLeaveCount}
            color="amber"
          />
          <StatCard
            icon={PalmTree}
            title="Vacation Days"
            value={monthStats.vacationCount}
            color="orange"
          />
          <StatCard
            icon={Moon}
            title="Night Days"
            value={monthStats.nightCount}
            color="indigo"
          />
          {monthStats.totalExtraHours > 0 && (
            <StatCard
              icon={Clock}
              title="Extra Hours"
              value={monthStats.totalExtraHours}
              unit="h"
              color="blue"
            />
          )}
        </div>

        <div className="mt-6 p-4 bg-gradient-to-r from-purple-50 to-purple-100 rounded-xl">
          <div className="flex items-center gap-3">
            <PalmTree className="w-5 h-5 text-purple-600" />
            <span className="font-medium text-purple-900">Vacation Days Remaining:</span>
            <span className="text-purple-700">{currentYearVacationDays - totalVacationUsed}</span>
          </div>
        </div>

        <div className="mt-6">
          <ProgressBar 
            percentage={monthStats.completionPercentage} 
            remainingDays={monthStats.remainingDays}
          />
        </div>
      </StatBlock>

      <StatBlock
        title="Quarterly Statistics"
        icon={BarChart3}
        expanded={quarterlyExpanded}
        onToggle={() => setQuarterlyExpanded(!quarterlyExpanded)}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <StatCard
            icon={Briefcase}
            title="Office Days"
            value={quarterStats.officeDaysCount}
            color="blue"
          />
          <StatCard
            icon={HomeIcon}
            title="Home Days"
            value={quarterStats.homeDaysCount}
            color="green"
          />
          <StatCard
            icon={PartyPopper}
            title="Holidays"
            value={quarterStats.holidayCount}
            color="purple"
          />
          <StatCard
            icon={Thermometer}
            title="Sick Leave"
            value={quarterStats.sickLeaveCount}
            color="red"
          />
          <StatCard
            icon={Coffee}
            title="Casual Leave"
            value={quarterStats.casualLeaveCount}
            color="amber"
          />
          <StatCard
            icon={PalmTree}
            title="Vacation Days"
            value={quarterStats.vacationCount}
            color="orange"
          />
          <StatCard
            icon={Moon}
            title="Night Days"
            value={quarterStats.nightCount}
            color="indigo"
          />
          {quarterStats.totalExtraHours > 0 && (
            <StatCard
              icon={Clock}
              title="Extra Hours"
              value={quarterStats.totalExtraHours}
              unit="h"
              color="blue"
            />
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-xl">
            <h3 className="text-sm font-semibold text-blue-900 mb-1">Required Office Days</h3>
            <p className="text-lg font-bold text-blue-700">{quarterStats.officeDaysRequired.toFixed(1)}</p>
          </div>
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-xl">
            <h3 className="text-sm font-semibold text-purple-900 mb-1">Total Logged Days</h3>
            <p className="text-lg font-bold text-purple-700">{quarterStats.totalLoggedDays}</p>
          </div>
        </div>

        <div className="mt-8 p-6 bg-gradient-to-r from-purple-50 to-purple-100 rounded-xl">
          <div className="flex items-center gap-3">
            <PalmTree className="w-5 h-5 text-purple-600" />
            <span className="font-medium text-purple-900">Vacation Days Remaining:</span>
            <span className="text-purple-700">{currentYearVacationDays - totalVacationUsed}</span>
          </div>
        </div>

        <div className="mt-8">
          <ProgressBar 
            percentage={quarterStats.completionPercentage} 
            remainingDays={quarterStats.remainingDays}
            className="bg-gradient-to-br from-blue-50 to-blue-100 shadow-xl"
          />
        </div>
      </StatBlock>

      <button
        onClick={() => setShowConfirmation(true)}
        disabled={isClearing || isClearingMonth}
        className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg py-3 px-4 hover:from-red-700 hover:to-red-800 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors shadow-lg shadow-red-100 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <Trash2 className="w-5 h-5" />
        {isClearing ? 'Clearing All Data...' : 'Clear All Data'}
      </button>

      {showConfirmation && <ConfirmationModal />}
      {showVacationModal && <VacationModal />}
    </div>
  );
}