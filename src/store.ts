import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { WorkState } from './types';
import { supabase } from './lib/supabase';

export const useWorkStore = create<WorkState>()(
  persist(
    (set, get) => ({
      selectedDate: new Date(),
      vacationDays: {},
      dayData: {},
      previousDayData: null,
      setSelectedDate: (date) => set({ selectedDate: date }),
      setVacationDays: async (year, days) => {
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) throw new Error('No user logged in');

          // First try to update existing record
          const { data: updateData, error: updateError } = await supabase
            .from('vacation_allowance')
            .update({ days_allowed: days })
            .eq('user_id', user.id)
            .eq('year', year)
            .select();

          // If no rows were updated, insert new record
          if ((!updateData || updateData.length === 0) && !updateError) {
            const { error: insertError } = await supabase
              .from('vacation_allowance')
              .insert({
                user_id: user.id,
                year,
                days_allowed: days
              });

            if (insertError) throw insertError;
          } else if (updateError) {
            throw updateError;
          }

          set((state) => ({
            vacationDays: { ...state.vacationDays, [year]: days }
          }));
        } catch (error) {
          console.error('Error saving vacation days:', error);
          throw error;
        }
      },
      setDayData: async (date, data) => {
        const previousState = get().dayData;
        const dateObj = new Date(date);
        const year = dateObj.getFullYear();
        const currentData = previousState[date];
        
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) throw new Error('No user logged in');

          // Check if we're adding or removing a vacation/casual day
          const isAddingVacationDay = (data.type === 'vacation' || data.type === 'casual') && 
            (!currentData || (currentData.type !== 'vacation' && currentData.type !== 'casual'));
          const isRemovingVacationDay = (currentData?.type === 'vacation' || currentData?.type === 'casual') && 
            (data.type !== 'vacation' && data.type !== 'casual');

          // Get current vacation days for the year
          const currentVacationDays = get().vacationDays[year] || 21;

          // Validate vacation days remaining
          if (isAddingVacationDay) {
            // Calculate total used vacation days for the year
            const totalUsedDays = Object.entries(previousState).reduce((acc, [dateKey, dayInfo]) => {
              const entryDate = new Date(dateKey);
              if (entryDate.getFullYear() === year && 
                  (dayInfo.type === 'vacation' || dayInfo.type === 'casual') && 
                  dateKey !== date) {
                return acc + 1;
              }
              return acc;
            }, 0);

            if (totalUsedDays >= currentVacationDays) {
              throw new Error('No vacation days remaining for this year');
            }
          }

          // Optimistically update UI
          set((state) => ({
            dayData: { ...state.dayData, [date]: data },
          }));

          // Check if record exists
          const { data: existingRecord, error: checkError } = await supabase
            .from('day_logs')
            .select()
            .eq('user_id', user.id)
            .eq('date', date)
            .maybeSingle();

          if (checkError) {
            set({ dayData: previousState });
            throw checkError;
          }

          let error;

          if (existingRecord) {
            // Update existing record
            const { error: updateError } = await supabase
              .from('day_logs')
              .update({
                type: data.type,
                extra_hours: data.extraHours,
                notes: data.notes
              })
              .eq('user_id', user.id)
              .eq('date', date);
            
            error = updateError;
          } else {
            // Insert new record
            const { error: insertError } = await supabase
              .from('day_logs')
              .insert({
                user_id: user.id,
                date,
                type: data.type,
                extra_hours: data.extraHours,
                notes: data.notes
              });
            
            error = insertError;
          }

          if (error) {
            set({ dayData: previousState });
            throw error;
          }
        } catch (error) {
          set({ dayData: previousState });
          console.error('Error saving data:', error);
          throw error;
        }
      },
      resetMonth: async () => {
        const currentState = get().dayData;
        const selectedDate = get().selectedDate;
        
        // Create date objects for the first and last day of the month
        // Use UTC to avoid timezone issues
        const year = selectedDate.getFullYear();
        const month = selectedDate.getMonth();
        const monthStart = new Date(Date.UTC(year, month, 1));
        const monthEnd = new Date(Date.UTC(year, month + 1, 0, 23, 59, 59, 999));
        
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) throw new Error('No user logged in');

          const { error } = await supabase
            .from('day_logs')
            .delete()
            .eq('user_id', user.id)
            .gte('date', monthStart.toISOString().split('T')[0])
            .lte('date', monthEnd.toISOString().split('T')[0]);

          if (error) throw error;

          const filteredData = Object.entries(currentState).reduce((acc, [date, data]) => {
            const currentDate = new Date(date);
            if (currentDate < monthStart || currentDate > monthEnd) {
              acc[date] = data;
            }
            return acc;
          }, {} as Record<string, any>);

          set({ previousDayData: currentState, dayData: filteredData });
        } catch (error) {
          console.error('Error resetting month:', error);
          throw error;
        }
      },
      resetAll: async () => {
        const currentState = get().dayData;
        
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) throw new Error('No user logged in');

          const { error } = await supabase
            .from('day_logs')
            .delete()
            .eq('user_id', user.id);

          if (error) throw error;

          set({ previousDayData: currentState, dayData: {} });
        } catch (error) {
          console.error('Error resetting all data:', error);
          throw error;
        }
      },
      clearDay: async (date) => {
        const previousState = get().dayData;
        
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) throw new Error('No user logged in');

          // Optimistically update UI
          set((state) => {
            const newDayData = { ...state.dayData };
            delete newDayData[date];
            return { dayData: newDayData };
          });

          const { error } = await supabase
            .from('day_logs')
            .delete()
            .eq('user_id', user.id)
            .eq('date', date);

          if (error) {
            set({ dayData: previousState });
            throw error;
          }
        } catch (error) {
          set({ dayData: previousState });
          console.error('Error clearing day:', error);
          throw error;
        }
      },
      restoreData: async () => {
        const previousData = get().previousDayData;
        if (!previousData) return;

        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) throw new Error('No user logged in');

          // Start a batch insert of all previous data
          const insertPromises = Object.entries(previousData).map(([date, data]) => 
            supabase
              .from('day_logs')
              .insert({
                user_id: user.id,
                date,
                type: data.type,
                extra_hours: data.extraHours,
                notes: data.notes
              })
          );

          await Promise.all(insertPromises);

          set({ 
            dayData: previousData,
            previousDayData: null // Clear the previous data after successful restore
          });
        } catch (error) {
          console.error('Error restoring data:', error);
          throw error;
        }
      },
      syncData: async () => {
        const retryDelay = 1000; // 1 second
        const maxRetries = 3;
        let retries = 0;

        const attemptSync = async () => {
          try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('No user logged in');

            // Sync day logs with timeout
            const dayLogsPromise = Promise.race([
              supabase
                .from('day_logs')
                .select('*')
                .eq('user_id', user.id),
              new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Request timeout')), 5000)
              )
            ]);

            const { data: dayLogs, error: dayLogsError } = await dayLogsPromise;
            if (dayLogsError) throw dayLogsError;

            if (dayLogs) {
              const formattedData = dayLogs.reduce((acc, log) => {
                acc[log.date] = {
                  type: log.type,
                  extraHours: log.extra_hours,
                  notes: log.notes
                };
                return acc;
              }, {});

              // Only update previousDayData if it exists and we have new data
              set((state) => ({
                dayData: formattedData,
                previousDayData: state.previousDayData && Object.keys(formattedData).length === 0 
                  ? state.previousDayData 
                  : null
              }));
            }

            // Sync vacation allowance with timeout
            const vacationPromise = Promise.race([
              supabase
                .from('vacation_allowance')
                .select('*')
                .eq('user_id', user.id),
              new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Request timeout')), 5000)
              )
            ]);

            const { data: vacationData, error: vacationError } = await vacationPromise;
            if (vacationError) throw vacationError;

            if (vacationData) {
              const formattedVacationData = vacationData.reduce((acc, allowance) => {
                acc[allowance.year] = allowance.days_allowed;
                return acc;
              }, {});

              set({ vacationDays: formattedVacationData });
            }
          } catch (error) {
            if (retries < maxRetries) {
              retries++;
              console.log(`Retry attempt ${retries} of ${maxRetries}`);
              await new Promise(resolve => setTimeout(resolve, retryDelay));
              return attemptSync();
            }
            throw error;
          }
        };

        try {
          await attemptSync();
        } catch (error) {
          console.error('Error syncing data:', error);
          throw new Error('Failed to sync data. Please check your internet connection and try again.');
        }
      }
    }),
    {
      name: 'work-days-storage',
      partialize: (state) => ({
        dayData: state.dayData,
        vacationDays: state.vacationDays,
      }),
    }
  )
);